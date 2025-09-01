import { db } from '@/db';
import { logInfo, logError } from '@/utils/logger';
import { createError } from '@/middlewares/errorMiddleware';
import { ValidationService } from './ValidationService';
import { RecipientLookupService } from './RecipientLookupService';
import { BalanceService } from './BalanceService';
import { OutboxService } from './OutboxService';
import { AuditService } from './AuditService';
import { getBankRailsConfig } from '@/config/money-movement';
import { MoneyMovementUtils } from '@/models/MoneyMovement';
import { v4 as uuidv4 } from 'uuid';

export interface InternalTransferRequest {
  toAccountNumber: string;
  optionalIdentifier?: string;
  asset: string;
  amount: string;
  memo?: string;
}

export interface InternalTransferResponse {
  transferId: string;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: string;
  recipientName: string;
  maskedAccountNumber: string;
}

export interface BankTransferRequest {
  beneficiaryId: string;
  amount: string;
  currency: string;
  purposeCode?: string;
  rails: 'swift' | 'wise';
}

export interface BankTransferResponse {
  bankTransferId: string;
  status: 'draft' | 'pending' | 'submitted' | 'failed' | 'cancelled';
  rails: 'swift' | 'wise';
  estimatedFee: string;
  processingTime: string;
  createdAt: string;
}

export interface BankFeeEstimate {
  fixed: string;
  percentage: string;
  total: string;
  currency: string;
}

export class TransferService {
  /**
   * Create internal transfer
   */
  static async createInternalTransfer(
    fromUserId: string,
    request: InternalTransferRequest
  ): Promise<InternalTransferResponse> {
    try {
      // Validate request
      const validation = ValidationService.validateInternalTransfer(
        request.toAccountNumber,
        request.asset,
        request.amount,
        request.memo
      );
      ValidationService.throwIfInvalid(
        validation,
        'Internal transfer validation failed'
      );

      // Look up recipient
      const recipientLookup = await RecipientLookupService.findByAccountNumber(
        request.toAccountNumber
      );
      if (!recipientLookup.found || !recipientLookup.recipient) {
        throw createError.validation('Recipient not found');
      }

      const recipient = recipientLookup.recipient;

      // Validate sender != recipient
      if (
        !RecipientLookupService.validateSenderRecipient(
          fromUserId,
          recipient.userId
        )
      ) {
        throw createError.validation('Cannot transfer to yourself');
      }

      // Check balance
      const balanceCheck = await BalanceService.checkBalance(
        fromUserId,
        request.asset,
        request.amount
      );
      if (!balanceCheck.sufficient) {
        throw createError.validation(
          `Insufficient balance. Available: ${balanceCheck.available} ${request.asset}`
        );
      }

      // Generate transfer ID
      const transferId = uuidv4();

      // Lock balance
      const balanceLocked = await BalanceService.lockBalance(
        fromUserId,
        request.asset,
        request.amount,
        transferId
      );
      if (!balanceLocked) {
        throw createError.validation('Failed to lock balance');
      }

      // Create transfer record
      const query = `
        INSERT INTO transfers_internal (
          id, from_user_id, to_internal_account_number, asset, amount, memo, status, audit
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, status, created_at
      `;

      const audit = {
        recipientUserId: recipient.userId,
        recipientDisplayName: recipient.displayName,
        recipientKycTier: recipient.kycTier,
        riskFlags: recipient.riskFlags,
        balanceCheck: {
          available: balanceCheck.available,
          required: balanceCheck.required,
        },
      };

      const result = await db.query(query, [
        transferId,
        fromUserId,
        request.toAccountNumber,
        request.asset.toUpperCase(),
        request.amount,
        request.memo || null,
        'pending',
        audit,
      ]);

      const transfer = result.rows[0];

      // Emit domain event
      await OutboxService.emitEvent('transfer.internal.created', {
        transferId: transfer.id,
        fromUserId,
        toUserId: recipient.userId,
        asset: request.asset.toUpperCase(),
        amount: request.amount,
        memo: request.memo,
        status: transfer.status,
      });

      // Audit log
      await AuditService.logOperation({
        userId: fromUserId,
        operation: 'internal_transfer_created',
        resourceType: 'transfer_internal',
        resourceId: transfer.id,
        changes: {
          toAccountNumber: MoneyMovementUtils.maskAccountNumber(
            request.toAccountNumber
          ),
          asset: request.asset.toUpperCase(),
          amount: request.amount,
          memo: request.memo,
        },
      });

      logInfo('Internal transfer created', {
        transferId: transfer.id,
        fromUserId,
        toAccountNumber: MoneyMovementUtils.maskAccountNumber(
          request.toAccountNumber
        ),
        asset: request.asset.toUpperCase(),
        amount: request.amount,
      });

      return {
        transferId: transfer.id,
        status: transfer.status,
        createdAt: transfer.created_at.toISOString(),
        recipientName: recipient.displayName,
        maskedAccountNumber: MoneyMovementUtils.maskAccountNumber(
          request.toAccountNumber
        ),
      };
    } catch (error) {
      logError('Error creating internal transfer', {
        error: error as Error,
        fromUserId,
        toAccountNumber: MoneyMovementUtils.maskAccountNumber(
          request.toAccountNumber
        ),
        asset: request.asset,
        amount: request.amount,
      });
      throw error;
    }
  }

  /**
   * Create bank transfer
   */
  static async createBankTransfer(
    userId: string,
    request: BankTransferRequest
  ): Promise<BankTransferResponse> {
    try {
      // Validate request
      const validation = ValidationService.validateBankTransfer(
        request.beneficiaryId,
        request.amount,
        request.currency,
        request.rails
      );
      ValidationService.throwIfInvalid(
        validation,
        'Bank transfer validation failed'
      );

      // Get rails configuration
      const railsConfig = getBankRailsConfig(request.rails);
      if (!railsConfig) {
        throw createError.validation(
          `Bank rails "${request.rails}" not supported`
        );
      }

      // Check if beneficiary exists and belongs to user
      const beneficiaryQuery = `
        SELECT id, display_name, details
        FROM beneficiaries
        WHERE id = $1 AND user_id = $2 AND is_active = true
      `;
      const beneficiaryResult = await db.query(beneficiaryQuery, [
        request.beneficiaryId,
        userId,
      ]);

      if (beneficiaryResult.rows.length === 0) {
        throw createError.validation('Beneficiary not found');
      }

      const beneficiary = beneficiaryResult.rows[0];

      // Calculate fee estimate
      const feeEstimate = TransferService.calculateBankFee(
        request.amount,
        request.rails,
        request.currency
      );

      // Generate transfer ID
      const transferId = uuidv4();

      // Create transfer record
      const query = `
        INSERT INTO transfers_bank (
          id, user_id, beneficiary_id, amount, currency, purpose_code, status, rails, audit
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, status, created_at
      `;

      const audit = {
        beneficiaryName: beneficiary.display_name,
        beneficiaryDetails: beneficiary.details,
        feeEstimate,
        railsConfig: {
          kycTierRequired: railsConfig.kycTierRequired,
          processingTime: railsConfig.processingTime,
        },
      };

      const result = await db.query(query, [
        transferId,
        userId,
        request.beneficiaryId,
        request.amount,
        request.currency.toUpperCase(),
        request.purposeCode || null,
        'draft',
        request.rails,
        audit,
      ]);

      const transfer = result.rows[0];

      // Emit domain event
      await OutboxService.emitEvent('transfer.bank.created', {
        transferId: transfer.id,
        userId,
        beneficiaryId: request.beneficiaryId,
        amount: request.amount,
        currency: request.currency.toUpperCase(),
        rails: request.rails,
        status: transfer.status,
      });

      // Audit log
      await AuditService.logOperation({
        userId,
        operation: 'bank_transfer_created',
        resourceType: 'transfer_bank',
        resourceId: transfer.id,
        changes: {
          beneficiaryId: request.beneficiaryId,
          amount: request.amount,
          currency: request.currency.toUpperCase(),
          rails: request.rails,
          purposeCode: request.purposeCode,
        },
      });

      logInfo('Bank transfer created', {
        transferId: transfer.id,
        userId,
        beneficiaryId: request.beneficiaryId,
        amount: request.amount,
        currency: request.currency.toUpperCase(),
        rails: request.rails,
      });

      return {
        bankTransferId: transfer.id,
        status: transfer.status,
        rails: request.rails,
        estimatedFee: feeEstimate,
        processingTime: railsConfig.processingTime,
        createdAt: transfer.created_at.toISOString(),
      };
    } catch (error) {
      logError('Error creating bank transfer', {
        error: error as Error,
        userId,
        beneficiaryId: request.beneficiaryId,
        amount: request.amount,
        currency: request.currency,
        rails: request.rails,
      });
      throw error;
    }
  }

  /**
   * Estimate bank transfer fees
   */
  static estimateBankFees(
    amount: string,
    rails: 'swift' | 'wise',
    currency: string
  ): BankFeeEstimate {
    try {
      const railsConfig = getBankRailsConfig(rails);
      if (!railsConfig) {
        throw new Error(`Bank rails "${rails}" not supported`);
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Invalid amount');
      }

      const feeTemplate = railsConfig.feeTemplate;
      const percentageFee = amountNum * feeTemplate.percentage;
      const totalFee = Math.max(feeTemplate.fixed, percentageFee);
      const finalFee = Math.min(
        Math.max(totalFee, feeTemplate.minFee),
        feeTemplate.maxFee
      );

      return {
        fixed: feeTemplate.fixed.toString(),
        percentage: percentageFee.toFixed(2),
        total: finalFee.toFixed(2),
        currency: currency.toUpperCase(),
      };
    } catch (error) {
      logError('Error estimating bank fees', {
        error: error as Error,
        amount,
        rails,
        currency,
      });
      throw error;
    }
  }

  /**
   * Calculate bank fee (internal method)
   */
  private static calculateBankFee(
    amount: string,
    rails: 'swift' | 'wise',
    currency: string
  ): string {
    try {
      const feeEstimate = TransferService.estimateBankFees(
        amount,
        rails,
        currency
      );
      return feeEstimate.total;
    } catch (error) {
      logError('Error calculating bank fee', {
        error: error as Error,
        amount,
        rails,
        currency,
      });
      return '0';
    }
  }

  /**
   * Get transfer status
   */
  static async getTransferStatus(
    transferId: string,
    userId: string
  ): Promise<any> {
    try {
      // Check internal transfers
      const internalQuery = `
        SELECT id, status, created_at, updated_at, asset, amount, memo
        FROM transfers_internal
        WHERE id = $1 AND from_user_id = $2
      `;
      const internalResult = await db.query(internalQuery, [
        transferId,
        userId,
      ]);

      if (internalResult.rows.length > 0) {
        const transfer = internalResult.rows[0];
        return {
          type: 'internal',
          id: transfer.id,
          status: transfer.status,
          createdAt: transfer.created_at.toISOString(),
          updatedAt: transfer.updated_at.toISOString(),
          asset: transfer.asset,
          amount: transfer.amount,
          memo: transfer.memo,
        };
      }

      // Check bank transfers
      const bankQuery = `
        SELECT id, status, created_at, updated_at, amount, currency, rails
        FROM transfers_bank
        WHERE id = $1 AND user_id = $2
      `;
      const bankResult = await db.query(bankQuery, [transferId, userId]);

      if (bankResult.rows.length > 0) {
        const transfer = bankResult.rows[0];
        return {
          type: 'bank',
          id: transfer.id,
          status: transfer.status,
          createdAt: transfer.created_at.toISOString(),
          updatedAt: transfer.updated_at.toISOString(),
          amount: transfer.amount,
          currency: transfer.currency,
          rails: transfer.rails,
        };
      }

      throw createError.notFound('Transfer not found');
    } catch (error) {
      logError('Error getting transfer status', {
        error: error as Error,
        transferId,
        userId,
      });
      throw error;
    }
  }
}
