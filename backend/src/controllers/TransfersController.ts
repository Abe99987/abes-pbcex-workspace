import { Request, Response } from 'express';
import { asyncHandler, asyncHandlerAuth } from '@/utils/asyncHandler';
import { createError } from '@/middlewares/errorMiddleware';
import { logError, logInfo } from '@/utils/logger';
import { AuthenticatedRequest } from '@/middlewares/auth';
import { idempotencyMiddleware } from '@/middlewares/idempotency';
import { rateLimitMiddleware } from '@/middlewares/rateLimit';
import {
  requireAuth,
  requireKycTier,
  requireMoneyMovement,
  requireFeature,
} from '@/middlewares/auth';
import { TransferService } from '@/services/TransferService';
import { ValidationService } from '@/services/ValidationService';
import { AuditService } from '@/services/AuditService';
import {
  internalTransferSchema,
  bankTransferSchema,
} from '@/models/MoneyMovement';

export class TransfersController {
  /**
   * Create internal transfer
   * POST /api/transfers/internal
   */
  static createInternalTransfer = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const validation = internalTransferSchema.safeParse(req.body);

        if (!validation.success) {
          throw createError.validation(
            'Invalid request body',
            validation.error.errors
          );
        }

        const transferData = validation.data;

        // Validate the transfer
        const validationResult = ValidationService.validateInternalTransfer(
          transferData.toAccountNumber,
          transferData.asset,
          transferData.amount,
          transferData.memo
        );

        if (!validationResult.valid) {
          throw createError.validation(
            (validationResult as any).message || 'Transfer validation failed'
          );
        }

        // Create the transfer
        const transfer = await TransferService.createInternalTransfer(
          userId,
          transferData
        );

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'internal_transfer_created',
          resourceType: 'transfer_internal',
          resourceId: transfer.transferId,
          changes: {
            fromUserId: userId,
            toAccountNumber: transferData.toAccountNumber,
            asset: transferData.asset,
            amount: transferData.amount,
            memo: transferData.memo,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('Internal transfer created', {
          userId,
          transferId: transfer.transferId,
          amount: transferData.amount,
          asset: transferData.asset,
        });

        res.status(201).json({
          success: true,
          data: transfer,
        });
      } catch (error) {
        logError('Failed to create internal transfer', {
          error: error as Error,
          userId: req.user?.id,
          body: req.body,
        });
        throw error;
      }
    }
  );

  /**
   * Get internal transfer status
   * GET /api/transfers/internal/:id
   */
  static getInternalTransferStatus = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const transferId = req.params.id;

        if (!transferId) {
          throw createError.validation('Transfer ID is required');
        }

        const transfer = await TransferService.getTransferStatus(
          transferId,
          userId
        );

        if (!transfer) {
          throw createError.notFound('Transfer not found');
        }

        res.json({
          success: true,
          data: transfer,
        });
      } catch (error) {
        logError('Failed to get internal transfer status', {
          error: error as Error,
          userId: req.user?.id,
          transferId: req.params.id,
        });
        throw error;
      }
    }
  );

  /**
   * Create bank transfer
   * POST /api/transfers/bank
   */
  static createBankTransfer = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const validation = bankTransferSchema.safeParse(req.body);

        if (!validation.success) {
          throw createError.validation(
            'Invalid request body',
            validation.error.errors
          );
        }

        const transferData = validation.data;

        // Validate the transfer
        const validationResult = ValidationService.validateBankTransfer(
          transferData.beneficiaryId,
          transferData.amount,
          transferData.currency,
          transferData.rails
        );

        if (!validationResult.valid) {
          throw createError.validation(
            (validationResult as any).message ||
              'Bank transfer validation failed'
          );
        }

        // Create the transfer
        const transfer = await TransferService.createBankTransfer(
          userId,
          transferData
        );

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'bank_transfer_created',
          resourceType: 'transfer_bank',
          resourceId: transfer.bankTransferId,
          changes: {
            beneficiaryId: transferData.beneficiaryId,
            amount: transferData.amount,
            currency: transferData.currency,
            purposeCode: transferData.purposeCode,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('Bank transfer created', {
          userId,
          transferId: transfer.bankTransferId,
          amount: transferData.amount,
          currency: transferData.currency,
        });

        res.status(201).json({
          success: true,
          data: transfer,
        });
      } catch (error) {
        logError('Failed to create bank transfer', {
          error: error as Error,
          userId: req.user?.id,
          body: req.body,
        });
        throw error;
      }
    }
  );

  /**
   * Get bank transfer status
   * GET /api/transfers/bank/:id
   */
  static getBankTransferStatus = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const transferId = req.params.id;

        if (!transferId) {
          throw createError.validation('Transfer ID is required');
        }

        const transfer = await TransferService.getTransferStatus(
          transferId,
          userId
        );

        if (!transfer) {
          throw createError.notFound('Bank transfer not found');
        }

        res.json({
          success: true,
          data: transfer,
        });
      } catch (error) {
        logError('Failed to get bank transfer status', {
          error: error as Error,
          userId: req.user?.id,
          transferId: req.params.id,
        });
        throw error;
      }
    }
  );

  /**
   * Estimate bank transfer fees
   * POST /api/transfers/bank/estimate-fees
   */
  static estimateBankFees = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { amount, rails, currency } = req.body;

        if (!amount || !rails || !currency) {
          throw createError.validation(
            'Amount, rails, and currency are required'
          );
        }

        const feeEstimate = TransferService.estimateBankFees(
          amount,
          rails,
          currency
        );

        res.json({
          success: true,
          data: feeEstimate,
        });
      } catch (error) {
        logError('Failed to estimate bank fees', {
          error: error as Error,
          userId: req.user?.id,
          body: req.body,
        });
        throw error;
      }
    }
  );

  /**
   * Get transfer history
   * GET /api/transfers/history
   */
  static getTransferHistory = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const type = req.query.type as string; // 'internal' | 'bank' | 'all'

        // TODO: Implement transfer history retrieval
        // This would combine internal and bank transfers
        const history = {
          transfers: [],
          total: 0,
          limit,
          offset,
        };

        res.json({
          success: true,
          data: history,
        });
      } catch (error) {
        logError('Failed to get transfer history', {
          error: error as Error,
          userId: req.user?.id,
          query: req.query,
        });
        throw error;
      }
    }
  );
}

// Export middleware chains for routes
export const transfersMiddleware = {
  // Internal transfer routes
  internalTransfer: [
    requireAuth,
    requireMoneyMovement,
    requireFeature('moneyMovement.internalTransfers'),
    rateLimitMiddleware.moneyMovement,
    idempotencyMiddleware,
  ],

  // Bank transfer routes
  bankTransfer: [
    requireAuth,
    requireMoneyMovement,
    requireFeature('moneyMovement.bankTransfers'),
    requireKycTier('tier1'),
    rateLimitMiddleware.moneyMovement,
    idempotencyMiddleware,
  ],

  // Read-only routes
  readOnly: [requireAuth, requireMoneyMovement, rateLimitMiddleware.moderate],
};
