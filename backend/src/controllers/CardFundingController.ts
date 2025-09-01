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
import { CardFundingService } from '@/services/CardFundingService';
import { AuditService } from '@/services/AuditService';

export class CardFundingController {
  /**
   * Get card funding preferences
   * GET /api/cards/:cardRef/funding
   */
  static getCardFundingPreferences = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const cardRef = req.params.cardRef;

        if (!cardRef) {
          throw createError.validation('Card reference is required');
        }

        const preferences = await CardFundingService.getCardFundingPreferences(
          userId,
          cardRef
        );

        res.json({
          success: true,
          data: preferences,
        });
      } catch (error) {
        logError('Failed to get card funding preferences', {
          error: error as Error,
          userId: req.user?.id,
          cardRef: req.params.cardRef,
        });
        throw error;
      }
    }
  );

  /**
   * Set eligible assets for card funding
   * PUT /api/cards/:cardRef/funding/eligibility
   */
  static setEligibleAssets = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const cardRef = req.params.cardRef;
        const { eligibleAssets } = req.body;

        if (!cardRef) {
          throw createError.validation('Card reference is required');
        }

        if (!Array.isArray(eligibleAssets)) {
          throw createError.validation('Eligible assets must be an array');
        }

        if (eligibleAssets.length === 0) {
          throw createError.validation(
            'At least one eligible asset must be specified'
          );
        }

        // Validate that all assets are valid
        const validAssets = ['USD', 'USDC', 'USDT', 'BTC', 'ETH'];
        const invalidAssets = eligibleAssets.filter(
          asset => !validAssets.includes(asset)
        );

        if (invalidAssets.length > 0) {
          throw createError.validation(
            `Invalid assets: ${invalidAssets.join(', ')}`
          );
        }

        const preferences = await CardFundingService.setEligibleAssets(
          userId,
          cardRef,
          eligibleAssets
        );

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'card_funding_eligibility_updated',
          resourceType: 'card_funding_preferences',
          resourceId: `${userId}:${cardRef}`,
          changes: {
            eligibleAssets,
            cardRef,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('Card funding eligibility updated', {
          userId,
          cardRef,
          eligibleAssets,
        });

        res.json({
          success: true,
          data: preferences,
        });
      } catch (error) {
        logError('Failed to set card funding eligibility', {
          error: error as Error,
          userId: req.user?.id,
          cardRef: req.params.cardRef,
          body: req.body,
        });
        throw error;
      }
    }
  );

  /**
   * Set selected asset for card funding
   * PUT /api/cards/:cardRef/funding/selected
   */
  static setSelectedAsset = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const cardRef = req.params.cardRef;
        const { asset } = req.body;

        if (!cardRef) {
          throw createError.validation('Card reference is required');
        }

        if (!asset) {
          throw createError.validation('Asset is required');
        }

        // Validate that the asset is valid
        const validAssets = ['USD', 'USDC', 'USDT', 'BTC', 'ETH'];
        if (!validAssets.includes(asset)) {
          throw createError.validation(`Invalid asset: ${asset}`);
        }

        // Check if the asset is eligible for this card
        const currentPreferences =
          await CardFundingService.getCardFundingPreferences(userId, cardRef);
        if (!currentPreferences.eligibleAssets.includes(asset)) {
          throw createError.validation(
            `Asset ${asset} is not eligible for this card`
          );
        }

        const preferences = await CardFundingService.setSelectedAsset(
          userId,
          cardRef,
          asset
        );

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'card_funding_selected_asset_updated',
          resourceType: 'card_funding_preferences',
          resourceId: `${userId}:${cardRef}`,
          changes: {
            selectedAsset: asset,
            cardRef,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('Card funding selected asset updated', {
          userId,
          cardRef,
          selectedAsset: asset,
        });

        res.json({
          success: true,
          data: preferences,
        });
      } catch (error) {
        logError('Failed to set card funding selected asset', {
          error: error as Error,
          userId: req.user?.id,
          cardRef: req.params.cardRef,
          body: req.body,
        });
        throw error;
      }
    }
  );

  /**
   * Clear selected asset for card funding
   * DELETE /api/cards/:cardRef/funding/selected
   */
  static clearSelectedAsset = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const cardRef = req.params.cardRef;

        if (!cardRef) {
          throw createError.validation('Card reference is required');
        }

        const preferences = await CardFundingService.clearSelectedAsset(
          userId,
          cardRef
        );

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'card_funding_selected_asset_cleared',
          resourceType: 'card_funding_preferences',
          resourceId: `${userId}:${cardRef}`,
          changes: {
            selectedAsset: null,
            cardRef,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('Card funding selected asset cleared', {
          userId,
          cardRef,
        });

        res.json({
          success: true,
          data: preferences,
        });
      } catch (error) {
        logError('Failed to clear card funding selected asset', {
          error: error as Error,
          userId: req.user?.id,
          cardRef: req.params.cardRef,
        });
        throw error;
      }
    }
  );

  /**
   * Get all card funding preferences for user
   * GET /api/cards/funding
   */
  static getAllCardFundingPreferences = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;

        // TODO: Implement getting all card funding preferences for a user
        // This would query all cards the user has and their funding preferences
        const allPreferences = {
          cards: [],
          total: 0,
        };

        res.json({
          success: true,
          data: allPreferences,
        });
      } catch (error) {
        logError('Failed to get all card funding preferences', {
          error: error as Error,
          userId: req.user?.id,
        });
        throw error;
      }
    }
  );

  /**
   * Get card funding statistics
   * GET /api/cards/:cardRef/funding/stats
   */
  static getCardFundingStats = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const cardRef = req.params.cardRef;

        if (!cardRef) {
          throw createError.validation('Card reference is required');
        }

        // TODO: Implement card funding statistics
        // This would provide usage statistics for the card
        const stats = {
          cardRef,
          totalTransactions: 0,
          totalAmount: '0',
          mostUsedAsset: null,
          lastUsed: null,
          averageTransactionAmount: '0',
        };

        res.json({
          success: true,
          data: stats,
        });
      } catch (error) {
        logError('Failed to get card funding stats', {
          error: error as Error,
          userId: req.user?.id,
          cardRef: req.params.cardRef,
        });
        throw error;
      }
    }
  );

  /**
   * Get available assets for card funding
   * GET /api/cards/funding/assets
   */
  static getAvailableAssets = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;

        // Get all available assets for card funding
        const availableAssets = [
          {
            symbol: 'USD',
            name: 'US Dollar',
            type: 'fiat',
            isActive: true,
            minAmount: '1.00',
            maxAmount: '10000.00',
          },
          {
            symbol: 'USDC',
            name: 'USD Coin',
            type: 'stablecoin',
            isActive: true,
            minAmount: '1.00',
            maxAmount: '10000.00',
          },
          {
            symbol: 'USDT',
            name: 'Tether',
            type: 'stablecoin',
            isActive: true,
            minAmount: '1.00',
            maxAmount: '10000.00',
          },
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            type: 'crypto',
            isActive: true,
            minAmount: '0.001',
            maxAmount: '1.000',
          },
          {
            symbol: 'ETH',
            name: 'Ethereum',
            type: 'crypto',
            isActive: true,
            minAmount: '0.01',
            maxAmount: '10.000',
          },
        ];

        res.json({
          success: true,
          data: {
            assets: availableAssets,
          },
        });
      } catch (error) {
        logError('Failed to get available assets for card funding', {
          error: error as Error,
          userId: req.user?.id,
        });
        throw error;
      }
    }
  );
}

// Export middleware chains for routes
export const cardFundingMiddleware = {
  // Write operations (set eligibility, set selected asset, clear selected asset)
  write: [
    requireAuth,
    requireMoneyMovement,
    requireFeature('moneyMovement.cardFunding'),
    rateLimitMiddleware.moderate,
    idempotencyMiddleware,
  ],

  // Read operations (get preferences, get stats, get available assets)
  read: [
    requireAuth,
    requireMoneyMovement,
    requireFeature('moneyMovement.cardFunding'),
    rateLimitMiddleware.moderate,
  ],
};
