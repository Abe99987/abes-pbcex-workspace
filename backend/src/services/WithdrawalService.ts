import { db } from '@/db';
import { logInfo, logError } from '@/utils/logger';
import { createError } from '@/middlewares/errorMiddleware';
import { ValidationService } from './ValidationService';
import { BalanceService } from './BalanceService';
import { OutboxService } from './OutboxService';
import { AuditService } from './AuditService';
import { getAssetConfig, getNetworkConfig } from '@/config/money-movement';
import { MoneyMovementUtils } from '@/models/MoneyMovement';
import { v4 as uuidv4 } from 'uuid';

export interface CryptoWithdrawalRequest {
  asset: string;
  network: string;
  address: string;
  amount: string;
}

export interface CryptoWithdrawalResponse {
  withdrawalId: string;
  status: 'pending' | 'queued' | 'broadcast' | 'failed' | 'cancelled';
  feeEstimate: string;
  networkFee: string;
  totalAmount: string;
  estimatedConfirmations: number;
  createdAt: string;
}

export interface FeeEstimate {
  networkFee: string;
  platformFee: string;
  totalFee: string;
  estimatedConfirmations: number;
}

export class WithdrawalService {
  /**
   * Estimate crypto withdrawal fee
   */
  static estimateCryptoFee(
    asset: string,
    network: string,
    amount?: string
  ): FeeEstimate {
    try {
      const assetConfig = getAssetConfig(asset);
      if (!assetConfig) {
        throw new Error('Asset not supported');
      }

      const networkConfig = getNetworkConfig(asset, network);
      if (!networkConfig) {
        throw new Error(`Network "${network}" not supported for ${asset}`);
      }

      if (!networkConfig.enabled) {
        throw new Error(`Network "${network}" is currently disabled`);
      }

      // Get base fee from config
      const baseNetworkFee = networkConfig.feeEstimate;

      // Calculate platform fee (placeholder - implement actual fee logic)
      const platformFee = this.calculatePlatformFee(asset, network, amount);

      const totalFee = baseNetworkFee + platformFee;

      return {
        networkFee: baseNetworkFee.toString(),
        platformFee: platformFee.toString(),
        totalFee: totalFee.toString(),
        estimatedConfirmations: networkConfig.confirmations,
      };
    } catch (error) {
      logError('Error estimating crypto fee', {
        error: error as Error,
        asset,
        network,
        amount,
      });
      throw error;
    }
  }

  /**
   * Create crypto withdrawal
   */
  static async createCryptoWithdrawal(
    userId: string,
    request: CryptoWithdrawalRequest
  ): Promise<CryptoWithdrawalResponse> {
    try {
      // Validate request
      const validation = ValidationService.validateCryptoWithdrawal(
        request.asset,
        request.network,
        request.address,
        request.amount
      );
      ValidationService.throwIfInvalid(
        validation,
        'Crypto withdrawal validation failed'
      );

      // Get configurations
      const assetConfig = getAssetConfig(request.asset);
      const networkConfig = getNetworkConfig(request.asset, request.network);

      if (!assetConfig || !networkConfig) {
        throw createError.validation('Invalid asset or network configuration');
      }

      // Check balance
      const balanceCheck = await BalanceService.checkBalance(
        userId,
        request.asset,
        request.amount
      );
      if (!balanceCheck.sufficient) {
        throw createError.validation(
          `Insufficient balance. Available: ${balanceCheck.available} ${request.asset}`
        );
      }

      // Estimate fees
      const feeEstimate = WithdrawalService.estimateCryptoFee(
        request.asset,
        request.network,
        request.amount
      );
      const totalAmount =
        parseFloat(request.amount) + parseFloat(feeEstimate.totalFee);

      // Check if user has enough balance for amount + fees
      const totalBalanceCheck = await BalanceService.checkBalance(
        userId,
        request.asset,
        totalAmount.toString()
      );
      if (!totalBalanceCheck.sufficient) {
        throw createError.validation(
          `Insufficient balance for withdrawal + fees. Required: ${totalAmount} ${request.asset}, Available: ${totalBalanceCheck.available} ${request.asset}`
        );
      }

      // Generate withdrawal ID
      const withdrawalId = uuidv4();

      // Lock balance
      const balanceLocked = await BalanceService.lockBalance(
        userId,
        request.asset,
        totalAmount.toString(),
        withdrawalId
      );
      if (!balanceLocked) {
        throw createError.validation('Failed to lock balance');
      }

      // Create withdrawal record
      const query = `
        INSERT INTO withdrawals_crypto (
          id, user_id, asset, network, address, amount, fee_estimate, status, audit
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, status, created_at
      `;

      const audit = {
        networkFee: feeEstimate.networkFee,
        platformFee: feeEstimate.platformFee,
        totalFee: feeEstimate.totalFee,
        totalAmount: totalAmount.toString(),
        estimatedConfirmations: feeEstimate.estimatedConfirmations,
        balanceCheck: {
          available: balanceCheck.available,
          required: request.amount,
          totalRequired: totalAmount.toString(),
        },
        addressHash: MoneyMovementUtils.hashForCorrelation(request.address),
      };

      const result = await db.query(query, [
        withdrawalId,
        userId,
        request.asset.toUpperCase(),
        request.network.toLowerCase(),
        request.address,
        request.amount,
        feeEstimate.totalFee,
        'pending',
        audit,
      ]);

      const withdrawal = result.rows[0];

      // Emit domain event
      await OutboxService.emitEvent('withdrawal.crypto.created', {
        withdrawalId: withdrawal.id,
        userId,
        asset: request.asset.toUpperCase(),
        network: request.network.toLowerCase(),
        address: MoneyMovementUtils.maskAddress(request.address),
        amount: request.amount,
        feeEstimate: feeEstimate.totalFee,
        status: withdrawal.status,
      });

      // Audit log
      await AuditService.logOperation({
        userId,
        operation: 'crypto_withdrawal_created',
        resourceType: 'withdrawal_crypto',
        resourceId: withdrawal.id,
        changes: {
          asset: request.asset.toUpperCase(),
          network: request.network.toLowerCase(),
          address: MoneyMovementUtils.maskAddress(request.address),
          amount: request.amount,
          feeEstimate: feeEstimate.totalFee,
        },
      });

      logInfo('Crypto withdrawal created', {
        withdrawalId: withdrawal.id,
        userId,
        asset: request.asset.toUpperCase(),
        network: request.network.toLowerCase(),
        address: MoneyMovementUtils.maskAddress(request.address),
        amount: request.amount,
        feeEstimate: feeEstimate.totalFee,
      });

      return {
        withdrawalId: withdrawal.id,
        status: withdrawal.status,
        feeEstimate: feeEstimate.totalFee,
        networkFee: feeEstimate.networkFee,
        totalAmount: totalAmount.toString(),
        estimatedConfirmations: feeEstimate.estimatedConfirmations,
        createdAt: withdrawal.created_at.toISOString(),
      };
    } catch (error) {
      logError('Error creating crypto withdrawal', {
        error: error as Error,
        userId,
        asset: request.asset,
        network: request.network,
        address: MoneyMovementUtils.maskAddress(request.address),
        amount: request.amount,
      });
      throw error;
    }
  }

  /**
   * Get withdrawal status
   */
  static async getWithdrawalStatus(
    withdrawalId: string,
    userId: string
  ): Promise<any> {
    try {
      const query = `
        SELECT 
          id, asset, network, address, amount, fee_estimate, status, created_at, updated_at, audit
        FROM withdrawals_crypto
        WHERE id = $1 AND user_id = $2
      `;

      const result = await db.query(query, [withdrawalId, userId]);

      if (result.rows.length === 0) {
        throw createError.notFound('Withdrawal not found');
      }

      const withdrawal = result.rows[0];

      return {
        id: withdrawal.id,
        asset: withdrawal.asset,
        network: withdrawal.network,
        address: MoneyMovementUtils.maskAddress(withdrawal.address),
        amount: withdrawal.amount,
        feeEstimate: withdrawal.fee_estimate,
        status: withdrawal.status,
        createdAt: withdrawal.created_at.toISOString(),
        updatedAt: withdrawal.updated_at.toISOString(),
        audit: withdrawal.audit,
      };
    } catch (error) {
      logError('Error getting withdrawal status', {
        error: error as Error,
        withdrawalId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Cancel withdrawal (if still pending)
   */
  static async cancelWithdrawal(
    withdrawalId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Check if withdrawal exists and belongs to user
      const checkQuery = `
        SELECT id, status, amount, asset
        FROM withdrawals_crypto
        WHERE id = $1 AND user_id = $2
      `;

      const checkResult = await db.query(checkQuery, [withdrawalId, userId]);

      if (checkResult.rows.length === 0) {
        throw createError.notFound('Withdrawal not found');
      }

      const withdrawal = checkResult.rows[0];

      // Only allow cancellation if still pending
      if (withdrawal.status !== 'pending') {
        throw createError.validation(
          `Cannot cancel withdrawal in status: ${withdrawal.status}`
        );
      }

      // Update status to cancelled
      const updateQuery = `
        UPDATE withdrawals_crypto
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = $1 AND user_id = $2
      `;

      const updateResult = await db.query(updateQuery, [withdrawalId, userId]);

      if (updateResult.rowCount === 0) {
        return false;
      }

      // Release locked balance
      await BalanceService.releaseBalance(
        userId,
        withdrawal.asset,
        withdrawalId
      );

      // Emit domain event
      await OutboxService.emitEvent('withdrawal.crypto.cancelled', {
        withdrawalId: withdrawal.id,
        userId,
        asset: withdrawal.asset,
        amount: withdrawal.amount,
      });

      // Audit log
      await AuditService.logOperation({
        userId,
        operation: 'crypto_withdrawal_cancelled',
        resourceType: 'withdrawal_crypto',
        resourceId: withdrawal.id,
        changes: {
          previousStatus: 'pending',
          newStatus: 'cancelled',
        },
      });

      logInfo('Crypto withdrawal cancelled', {
        withdrawalId: withdrawal.id,
        userId,
        asset: withdrawal.asset,
        amount: withdrawal.amount,
      });

      return true;
    } catch (error) {
      logError('Error cancelling withdrawal', {
        error: error as Error,
        withdrawalId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get user's withdrawal history
   */
  static async getWithdrawalHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const query = `
        SELECT 
          id, asset, network, address, amount, fee_estimate, status, created_at, updated_at
        FROM withdrawals_crypto
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await db.query(query, [userId, limit, offset]);

      return result.rows.map(row => ({
        ...row,
        address: MoneyMovementUtils.maskAddress(row.address),
      }));
    } catch (error) {
      logError('Error getting withdrawal history', {
        error: error as Error,
        userId,
      });
      return [];
    }
  }

  /**
   * Calculate platform fee (placeholder implementation)
   */
  private static calculatePlatformFee(
    asset: string,
    network: string,
    amount?: string
  ): number {
    // In production, implement actual fee calculation logic
    // This could be based on:
    // - Asset type
    // - Network congestion
    // - User tier
    // - Amount size
    // - Market conditions

    const baseFee = 0.001; // 0.1% base fee

    if (amount) {
      const amountNum = parseFloat(amount);
      // Higher fees for larger amounts
      if (amountNum > 1000) {
        return baseFee * 2;
      } else if (amountNum > 100) {
        return baseFee * 1.5;
      }
    }

    return baseFee;
  }
}
