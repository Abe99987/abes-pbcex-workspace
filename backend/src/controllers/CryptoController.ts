import { Request, Response } from 'express';
import { asyncHandlerAuth } from '@/utils/asyncHandler';
import { createError } from '@/middlewares/errorMiddleware';
import { logError, logInfo } from '@/utils/logger';
import { AuthenticatedRequest } from '@/middlewares/auth';
import { idempotencyMiddleware } from '@/middlewares/idempotency';
import { rateLimitMiddleware } from '@/middlewares/rateLimit';
import {
  requireAuth,
  requireMoneyMovement,
  requireFeature,
} from '@/middlewares/auth';
import { WithdrawalService } from '@/services/WithdrawalService';
import { ValidationService } from '@/services/ValidationService';
import { AuditService } from '@/services/AuditService';
import {
  getMoneyMovementConfig,
  getAssetConfig,
} from '@/config/money-movement';
import { cryptoWithdrawalSchema } from '@/models/MoneyMovement';

export class CryptoController {
  /**
   * Get supported networks for an asset
   * GET /api/crypto/networks?asset=...
   */
  static getSupportedNetworks = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const asset = req.query.asset as string;

        if (!asset) {
          throw createError.validation('Asset parameter is required');
        }

        const assetConfig = getAssetConfig(asset);

        if (!assetConfig) {
          throw createError.notFound(`Asset ${asset} not supported`);
        }

        const networks = assetConfig.networks.map(network => ({
          network: network.network,
          name: network.name,
          enabled: network.enabled,
          minWithdrawal: network.minWithdrawal,
          maxWithdrawal: network.maxWithdrawal,
          feeEstimate: network.feeEstimate,
          confirmations: network.confirmations,
          addressFormat: network.addressFormat,
        }));

        res.json({
          success: true,
          data: {
            asset,
            networks,
          },
        });
      } catch (error) {
        logError('Failed to get supported networks', {
          error: error as Error,
          userId: req.user?.id,
          asset: req.query.asset,
        });
        throw error;
      }
    }
  );

  /**
   * Create crypto withdrawal
   * POST /api/crypto/withdrawals
   */
  static createCryptoWithdrawal = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const validation = cryptoWithdrawalSchema.safeParse(req.body);

        if (!validation.success) {
          throw createError.validation(
            'Invalid request body',
            validation.error.errors
          );
        }

        const withdrawalData = validation.data;

        // Validate the withdrawal
        const validationResult = ValidationService.validateCryptoWithdrawal(
          withdrawalData.asset,
          withdrawalData.network,
          withdrawalData.address,
          withdrawalData.amount
        );

        if (!validationResult.valid) {
          throw createError.validation(
            (validationResult as any).message ||
              'Crypto withdrawal validation failed'
          );
        }

        // Create the withdrawal
        const withdrawal = await WithdrawalService.createCryptoWithdrawal(
          userId,
          withdrawalData
        );

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'crypto_withdrawal_created',
          resourceType: 'withdrawal_crypto',
          resourceId: withdrawal.withdrawalId,
          changes: {
            asset: withdrawalData.asset,
            network: withdrawalData.network,
            address: withdrawalData.address, // This will be hashed in the audit service
            amount: withdrawalData.amount,
            feeEstimate: withdrawal.feeEstimate,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('Crypto withdrawal created', {
          userId,
          withdrawalId: withdrawal.withdrawalId,
          asset: withdrawalData.asset,
          network: withdrawalData.network,
          amount: withdrawalData.amount,
        });

        res.status(201).json({
          success: true,
          data: withdrawal,
        });
      } catch (error) {
        logError('Failed to create crypto withdrawal', {
          error: error as Error,
          userId: req.user?.id,
          body: req.body,
        });
        throw error;
      }
    }
  );

  /**
   * Get crypto withdrawal status
   * GET /api/crypto/withdrawals/:id
   */
  static getCryptoWithdrawalStatus = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const withdrawalId = req.params.id;

        if (!withdrawalId) {
          throw createError.validation('Withdrawal ID is required');
        }

        const withdrawal = await WithdrawalService.getWithdrawalStatus(
          withdrawalId,
          userId
        );

        if (!withdrawal) {
          throw createError.notFound('Crypto withdrawal not found');
        }

        res.json({
          success: true,
          data: withdrawal,
        });
      } catch (error) {
        logError('Failed to get crypto withdrawal status', {
          error: error as Error,
          userId: req.user?.id,
          withdrawalId: req.params.id,
        });
        throw error;
      }
    }
  );

  /**
   * Cancel crypto withdrawal
   * POST /api/crypto/withdrawals/:id/cancel
   */
  static cancelCryptoWithdrawal = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const withdrawalId = req.params.id;

        if (!withdrawalId) {
          throw createError.validation('Withdrawal ID is required');
        }

        const cancelled = await WithdrawalService.cancelWithdrawal(
          withdrawalId,
          userId
        );

        if (!cancelled) {
          throw createError.validation(
            'Withdrawal cannot be cancelled or not found'
          );
        }

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'crypto_withdrawal_cancelled',
          resourceType: 'withdrawal_crypto',
          resourceId: withdrawalId,
          changes: {
            status: 'cancelled',
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('Crypto withdrawal cancelled', {
          userId,
          withdrawalId,
        });

        res.json({
          success: true,
          data: {
            withdrawalId,
            status: 'cancelled',
          },
        });
      } catch (error) {
        logError('Failed to cancel crypto withdrawal', {
          error: error as Error,
          userId: req.user?.id,
          withdrawalId: req.params.id,
        });
        throw error;
      }
    }
  );

  /**
   * Get crypto withdrawal history
   * GET /api/crypto/withdrawals
   */
  static getCryptoWithdrawalHistory = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const asset = req.query.asset as string;
        const status = req.query.status as string;

        const withdrawals = await WithdrawalService.getWithdrawalHistory(
          userId,
          limit,
          offset
        );

        // Filter by asset and status if provided
        let filteredWithdrawals = withdrawals;

        if (asset) {
          filteredWithdrawals = filteredWithdrawals.filter(
            w => w.asset === asset
          );
        }

        if (status) {
          filteredWithdrawals = filteredWithdrawals.filter(
            w => w.status === status
          );
        }

        res.json({
          success: true,
          data: {
            withdrawals: filteredWithdrawals,
            total: filteredWithdrawals.length,
            limit,
            offset,
          },
        });
      } catch (error) {
        logError('Failed to get crypto withdrawal history', {
          error: error as Error,
          userId: req.user?.id,
          query: req.query,
        });
        throw error;
      }
    }
  );

  /**
   * Estimate crypto withdrawal fee
   * POST /api/crypto/withdrawals/estimate-fee
   */
  static estimateCryptoFee = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { asset, network, amount } = req.body;

        if (!asset || !network) {
          throw createError.validation('Asset and network are required');
        }

        const feeEstimate = WithdrawalService.estimateCryptoFee(
          asset,
          network,
          amount
        );

        res.json({
          success: true,
          data: feeEstimate,
        });
      } catch (error) {
        logError('Failed to estimate crypto fee', {
          error: error as Error,
          userId: req.user?.id,
          body: req.body,
        });
        throw error;
      }
    }
  );

  /**
   * Get supported crypto assets
   * GET /api/crypto/assets
   */
  static getSupportedAssets = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const config = getMoneyMovementConfig();

        const assets = config.assets
          .filter(asset => asset.networks.length > 0) // Filter for assets with networks (crypto)
          .map(asset => ({
            symbol: asset.symbol,
            name: asset.name,
            enabled: asset.enabled,
            minTransfer: asset.minTransfer,
            stepSize: asset.stepSize,
            decimals: asset.decimals,
            networks: asset.networks.map(network => ({
              network: network.network,
              name: network.name,
              enabled: network.enabled,
            })),
          }));

        res.json({
          success: true,
          data: {
            assets,
          },
        });
      } catch (error) {
        logError('Failed to get supported crypto assets', {
          error: error as Error,
          userId: req.user?.id,
        });
        throw error;
      }
    }
  );
}

// Export middleware chains for routes
export const cryptoMiddleware = {
  // Write operations (withdrawals)
  write: [
    requireAuth,
    requireMoneyMovement,
    requireFeature('moneyMovement.cryptoWithdrawals'),
    rateLimitMiddleware.moneyMovement,
    idempotencyMiddleware,
  ],

  // Read operations (networks, history, status)
  read: [
    requireAuth,
    requireMoneyMovement,
    requireFeature('moneyMovement.cryptoWithdrawals'),
    rateLimitMiddleware.moderate,
  ],

  // Public read operations (networks, assets)
  publicRead: [
    requireAuth,
    requireMoneyMovement,
    requireFeature('moneyMovement.cryptoWithdrawals'),
    rateLimitMiddleware.generous,
  ],
};
