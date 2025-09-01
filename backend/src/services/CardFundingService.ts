import { db } from '@/db';
import { logInfo, logError } from '@/utils/logger';
import { createError } from '@/middlewares/errorMiddleware';
import { OutboxService } from './OutboxService';
import { AuditService } from './AuditService';
import { v4 as uuidv4 } from 'uuid';

export interface CardFundingPreference {
  cardRef: string;
  eligibleAssets: string[];
  selectedAsset?: string;
}

export interface CardFundingResponse {
  cardRef: string;
  eligibleAssets: string[];
  selectedAsset?: string;
  updatedAt: string;
}

export class CardFundingService {
  /**
   * Get card funding preferences
   */
  static async getCardFundingPreferences(
    userId: string,
    cardRef: string
  ): Promise<CardFundingResponse> {
    try {
      const query = `
        SELECT card_ref, eligible_assets, selected_asset, updated_at
        FROM card_funding_preferences
        WHERE user_id = $1 AND card_ref = $2
      `;

      const result = await db.query(query, [userId, cardRef]);

      if (result.rows.length === 0) {
        // Return default preferences if none exist
        return {
          cardRef,
          eligibleAssets: [],
          selectedAsset: undefined,
          updatedAt: new Date().toISOString(),
        };
      }

      const preference = result.rows[0];

      return {
        cardRef: preference.card_ref,
        eligibleAssets: preference.eligible_assets || [],
        selectedAsset: preference.selected_asset,
        updatedAt: preference.updated_at.toISOString(),
      };
    } catch (error) {
      logError('Error getting card funding preferences', {
        error: error as Error,
        userId,
        cardRef,
      });
      throw error;
    }
  }

  /**
   * Set eligible assets for card funding
   */
  static async setEligibleAssets(
    userId: string,
    cardRef: string,
    eligibleAssets: string[]
  ): Promise<CardFundingResponse> {
    try {
      // Validate assets
      if (!Array.isArray(eligibleAssets)) {
        throw createError.validation('Eligible assets must be an array');
      }

      // Check if preference exists
      const existingQuery = `
        SELECT id, selected_asset
        FROM card_funding_preferences
        WHERE user_id = $1 AND card_ref = $2
      `;

      const existingResult = await db.query(existingQuery, [userId, cardRef]);
      const existing = existingResult.rows[0];

      let selectedAsset = existing?.selected_asset;

      // If there's a currently selected asset that's no longer eligible, clear it
      if (selectedAsset && !eligibleAssets.includes(selectedAsset)) {
        selectedAsset = undefined;
      }

      if (existing) {
        // Update existing preference
        const updateQuery = `
          UPDATE card_funding_preferences
          SET eligible_assets = $3, selected_asset = $4, updated_at = NOW()
          WHERE user_id = $1 AND card_ref = $2
          RETURNING card_ref, eligible_assets, selected_asset, updated_at
        `;

        const result = await db.query(updateQuery, [
          userId,
          cardRef,
          eligibleAssets,
          selectedAsset,
        ]);
        const preference = result.rows[0];

        // Emit domain event
        await OutboxService.emitEvent('card_funding.eligibility_updated', {
          userId,
          cardRef,
          eligibleAssets,
          selectedAsset,
        });

        // Audit log
        await AuditService.logOperation({
          userId,
          operation: 'card_funding_eligibility_updated',
          resourceType: 'card_funding_preference',
          resourceId: existing.id,
          changes: {
            eligibleAssets,
            selectedAsset,
          },
        });

        logInfo('Card funding eligibility updated', {
          userId,
          cardRef,
          eligibleAssets,
          selectedAsset,
        });

        return {
          cardRef: preference.card_ref,
          eligibleAssets: preference.eligible_assets,
          selectedAsset: preference.selected_asset,
          updatedAt: preference.updated_at.toISOString(),
        };
      } else {
        // Create new preference
        const insertQuery = `
          INSERT INTO card_funding_preferences (
            id, user_id, card_ref, eligible_assets, selected_asset
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING card_ref, eligible_assets, selected_asset, updated_at
        `;

        const preferenceId = uuidv4();
        const result = await db.query(insertQuery, [
          preferenceId,
          userId,
          cardRef,
          eligibleAssets,
          selectedAsset,
        ]);

        const preference = result.rows[0];

        // Emit domain event
        await OutboxService.emitEvent('card_funding.preference_created', {
          userId,
          cardRef,
          eligibleAssets,
          selectedAsset,
        });

        // Audit log
        await AuditService.logOperation({
          userId,
          operation: 'card_funding_preference_created',
          resourceType: 'card_funding_preference',
          resourceId: preferenceId,
          changes: {
            cardRef,
            eligibleAssets,
            selectedAsset,
          },
        });

        logInfo('Card funding preference created', {
          userId,
          cardRef,
          eligibleAssets,
          selectedAsset,
        });

        return {
          cardRef: preference.card_ref,
          eligibleAssets: preference.eligible_assets,
          selectedAsset: preference.selected_asset,
          updatedAt: preference.updated_at.toISOString(),
        };
      }
    } catch (error) {
      logError('Error setting eligible assets', {
        error: error as Error,
        userId,
        cardRef,
        eligibleAssets,
      });
      throw error;
    }
  }

  /**
   * Set selected asset for card funding
   */
  static async setSelectedAsset(
    userId: string,
    cardRef: string,
    asset: string
  ): Promise<CardFundingResponse> {
    try {
      // Get current preferences
      const currentPreferences =
        await CardFundingService.getCardFundingPreferences(userId, cardRef);

      // Validate that the asset is eligible
      if (!currentPreferences.eligibleAssets.includes(asset)) {
        throw createError.validation(
          `Asset "${asset}" is not eligible for card funding`
        );
      }

      // Update selected asset
      const query = `
        UPDATE card_funding_preferences
        SET selected_asset = $3, updated_at = NOW()
        WHERE user_id = $1 AND card_ref = $2
        RETURNING card_ref, eligible_assets, selected_asset, updated_at
      `;

      const result = await db.query(query, [userId, cardRef, asset]);

      if (result.rows.length === 0) {
        throw createError.notFound('Card funding preference not found');
      }

      const preference = result.rows[0];

      // Emit domain event
      await OutboxService.emitEvent('card_funding.asset_selected', {
        userId,
        cardRef,
        selectedAsset: asset,
      });

      // Audit log
      await AuditService.logOperation({
        userId,
        operation: 'card_funding_asset_selected',
        resourceType: 'card_funding_preference',
        resourceId: preference.id,
        changes: {
          previousSelectedAsset: currentPreferences.selectedAsset,
          newSelectedAsset: asset,
        },
      });

      logInfo('Card funding asset selected', {
        userId,
        cardRef,
        selectedAsset: asset,
      });

      return {
        cardRef: preference.card_ref,
        eligibleAssets: preference.eligible_assets,
        selectedAsset: preference.selected_asset,
        updatedAt: preference.updated_at.toISOString(),
      };
    } catch (error) {
      logError('Error setting selected asset', {
        error: error as Error,
        userId,
        cardRef,
        asset,
      });
      throw error;
    }
  }

  /**
   * Clear selected asset for card funding
   */
  static async clearSelectedAsset(
    userId: string,
    cardRef: string
  ): Promise<CardFundingResponse> {
    try {
      const query = `
        UPDATE card_funding_preferences
        SET selected_asset = NULL, updated_at = NOW()
        WHERE user_id = $1 AND card_ref = $2
        RETURNING card_ref, eligible_assets, selected_asset, updated_at
      `;

      const result = await db.query(query, [userId, cardRef]);

      if (result.rows.length === 0) {
        throw createError.notFound('Card funding preference not found');
      }

      const preference = result.rows[0];

      // Emit domain event
      await OutboxService.emitEvent('card_funding.asset_cleared', {
        userId,
        cardRef,
      });

      // Audit log
      await AuditService.logOperation({
        userId,
        operation: 'card_funding_asset_cleared',
        resourceType: 'card_funding_preference',
        resourceId: preference.id,
        changes: {
          selectedAsset: null,
        },
      });

      logInfo('Card funding asset cleared', {
        userId,
        cardRef,
      });

      return {
        cardRef: preference.card_ref,
        eligibleAssets: preference.eligible_assets,
        selectedAsset: preference.selected_asset,
        updatedAt: preference.updated_at.toISOString(),
      };
    } catch (error) {
      logError('Error clearing selected asset', {
        error: error as Error,
        userId,
        cardRef,
      });
      throw error;
    }
  }

  /**
   * Get all card funding preferences for a user
   */
  static async getUserCardFundingPreferences(
    userId: string
  ): Promise<CardFundingResponse[]> {
    try {
      const query = `
        SELECT card_ref, eligible_assets, selected_asset, updated_at
        FROM card_funding_preferences
        WHERE user_id = $1
        ORDER BY updated_at DESC
      `;

      const result = await db.query(query, [userId]);

      return result.rows.map(row => ({
        cardRef: row.card_ref,
        eligibleAssets: row.eligible_assets || [],
        selectedAsset: row.selected_asset,
        updatedAt: row.updated_at.toISOString(),
      }));
    } catch (error) {
      logError('Error getting user card funding preferences', {
        error: error as Error,
        userId,
      });
      return [];
    }
  }

  /**
   * Delete card funding preference
   */
  static async deleteCardFundingPreference(
    userId: string,
    cardRef: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM card_funding_preferences
        WHERE user_id = $1 AND card_ref = $2
      `;

      const result = await db.query(query, [userId, cardRef]);

      if (result.rowCount === 0) {
        throw createError.notFound('Card funding preference not found');
      }

      // Emit domain event
      await OutboxService.emitEvent('card_funding.preference_deleted', {
        userId,
        cardRef,
      });

      // Audit log
      await AuditService.logOperation({
        userId,
        operation: 'card_funding_preference_deleted',
        resourceType: 'card_funding_preference',
        resourceId: cardRef,
        changes: {
          deleted: true,
        },
      });

      logInfo('Card funding preference deleted', {
        userId,
        cardRef,
      });

      return true;
    } catch (error) {
      logError('Error deleting card funding preference', {
        error: error as Error,
        userId,
        cardRef,
      });
      throw error;
    }
  }

  /**
   * Get default eligible assets for a card
   */
  static getDefaultEligibleAssets(cardRef: string): string[] {
    // In production, this could be based on:
    // - Card type (Visa, Mastercard, etc.)
    // - Card tier (Standard, Gold, Platinum, etc.)
    // - Geographic restrictions
    // - Regulatory requirements

    // Default to common stable assets
    return ['USD', 'USDC', 'USDT'];
  }

  /**
   * Validate asset for card funding
   */
  static validateAssetForCardFunding(asset: string, cardRef: string): boolean {
    const defaultAssets = CardFundingService.getDefaultEligibleAssets(cardRef);
    return defaultAssets.includes(asset.toUpperCase());
  }
}
