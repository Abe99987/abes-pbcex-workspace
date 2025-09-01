import { db } from '@/db';
import { logInfo, logError } from '@/utils/logger';
import { cache } from '@/cache/redis';
import { MoneyMovementUtils } from '@/models/MoneyMovement';

export interface RecipientInfo {
  userId: string;
  accountNumber: string;
  displayName: string;
  email?: string;
  riskFlags: string[];
  kycTier: 'none' | 'tier1' | 'tier2';
  isActive: boolean;
}

export interface RecipientLookupResult {
  found: boolean;
  recipient?: RecipientInfo;
  error?: string;
}

export class RecipientLookupService {
  private static readonly CACHE_TTL = 300; // 5 minutes
  private static readonly CACHE_PREFIX = 'recipient_lookup:';

  /**
   * Find internal user by account number
   */
  static async findByAccountNumber(
    accountNumber: string
  ): Promise<RecipientLookupResult> {
    try {
      // Check cache first
      const cacheKey = `${RecipientLookupService.CACHE_PREFIX}${accountNumber}`;
      const cached = await cache.getJson<RecipientInfo>(cacheKey);

      if (cached) {
        logInfo('Recipient found in cache', {
          accountNumber: MoneyMovementUtils.maskAccountNumber(accountNumber),
        });
        return { found: true, recipient: cached };
      }

      // Query database
      const query = `
        SELECT 
          u.id as user_id,
          u.email,
          u.kyc_tier,
          u.is_active,
          COALESCE(u.display_name, u.email) as display_name,
          u.account_number
        FROM users u
        WHERE u.account_number = $1
        AND u.is_active = true
      `;

      const result = await db.query(query, [accountNumber]);

      if (result.rows.length === 0) {
        logInfo('Recipient not found', {
          accountNumber: MoneyMovementUtils.maskAccountNumber(accountNumber),
        });
        return { found: false, error: 'Recipient not found' };
      }

      const user = result.rows[0];

      // Get risk flags (placeholder - in production, implement proper risk scoring)
      const riskFlags = await RecipientLookupService.getRiskFlags(user.user_id);

      const recipient: RecipientInfo = {
        userId: user.user_id,
        accountNumber: user.account_number,
        displayName: user.display_name,
        email: user.email,
        riskFlags,
        kycTier: user.kyc_tier || 'none',
        isActive: user.is_active,
      };

      // Cache the result
      await cache.setJson(
        cacheKey,
        recipient,
        RecipientLookupService.CACHE_TTL
      );

      logInfo('Recipient found', {
        accountNumber: MoneyMovementUtils.maskAccountNumber(accountNumber),
        displayName: recipient.displayName,
        kycTier: recipient.kycTier,
      });

      return { found: true, recipient };
    } catch (error) {
      logError('Error looking up recipient', {
        error: error as Error,
        accountNumber: MoneyMovementUtils.maskAccountNumber(accountNumber),
      });
      return { found: false, error: 'Internal server error' };
    }
  }

  /**
   * Find internal user by optional identifier (email, phone, etc.)
   */
  static async findByIdentifier(
    identifier: string
  ): Promise<RecipientLookupResult> {
    try {
      // Check cache first
      const cacheKey = `${RecipientLookupService.CACHE_PREFIX}id:${identifier}`;
      const cached = await cache.getJson<RecipientInfo>(cacheKey);

      if (cached) {
        logInfo('Recipient found in cache by identifier', {
          identifier: MoneyMovementUtils.maskAddress(identifier),
        });
        return { found: true, recipient: cached };
      }

      // Query database
      const query = `
        SELECT 
          u.id as user_id,
          u.email,
          u.kyc_tier,
          u.is_active,
          COALESCE(u.display_name, u.email) as display_name,
          u.account_number
        FROM users u
        WHERE (u.email = $1 OR u.phone = $1 OR u.account_number = $1)
        AND u.is_active = true
      `;

      const result = await db.query(query, [identifier]);

      if (result.rows.length === 0) {
        logInfo('Recipient not found by identifier', {
          identifier: MoneyMovementUtils.maskAddress(identifier),
        });
        return { found: false, error: 'Recipient not found' };
      }

      const user = result.rows[0];

      // Get risk flags
      const riskFlags = await RecipientLookupService.getRiskFlags(user.user_id);

      const recipient: RecipientInfo = {
        userId: user.user_id,
        accountNumber: user.account_number,
        displayName: user.display_name,
        email: user.email,
        riskFlags,
        kycTier: user.kyc_tier || 'none',
        isActive: user.is_active,
      };

      // Cache the result
      await cache.setJson(
        cacheKey,
        recipient,
        RecipientLookupService.CACHE_TTL
      );

      logInfo('Recipient found by identifier', {
        identifier: MoneyMovementUtils.maskAddress(identifier),
        displayName: recipient.displayName,
        kycTier: recipient.kycTier,
      });

      return { found: true, recipient };
    } catch (error) {
      logError('Error looking up recipient by identifier', {
        error: error as Error,
        identifier: MoneyMovementUtils.maskAddress(identifier),
      });
      return { found: false, error: 'Internal server error' };
    }
  }

  /**
   * Validate that sender and recipient are different
   */
  static validateSenderRecipient(
    senderUserId: string,
    recipientUserId: string
  ): boolean {
    return senderUserId !== recipientUserId;
  }

  /**
   * Get risk flags for a user (placeholder implementation)
   */
  private static async getRiskFlags(userId: string): Promise<string[]> {
    try {
      // In production, implement proper risk scoring based on:
      // - Account age
      // - Transaction history
      // - KYC status
      // - Suspicious activity reports
      // - Geographic risk factors

      const query = `
        SELECT 
          CASE 
            WHEN u.created_at > NOW() - INTERVAL '7 days' THEN 'new_account'
            WHEN u.kyc_tier IS NULL THEN 'no_kyc'
            ELSE NULL
          END as risk_flag
        FROM users u
        WHERE u.id = $1
      `;

      const result = await db.query(query, [userId]);
      const riskFlags: string[] = [];

      if (result.rows.length > 0) {
        const riskFlag = result.rows[0].risk_flag;
        if (riskFlag) {
          riskFlags.push(riskFlag);
        }
      }

      return riskFlags;
    } catch (error) {
      logError('Error getting risk flags', {
        error: error as Error,
        userId,
      });
      return [];
    }
  }

  /**
   * Clear cache for a specific account number
   */
  static async clearCache(accountNumber: string): Promise<void> {
    try {
      const cacheKey = `${RecipientLookupService.CACHE_PREFIX}${accountNumber}`;
      await cache.del(cacheKey);
      logInfo('Recipient cache cleared', {
        accountNumber: MoneyMovementUtils.maskAccountNumber(accountNumber),
      });
    } catch (error) {
      logError('Error clearing recipient cache', {
        error: error as Error,
        accountNumber: MoneyMovementUtils.maskAccountNumber(accountNumber),
      });
    }
  }

  /**
   * Clear cache for a specific identifier
   */
  static async clearIdentifierCache(identifier: string): Promise<void> {
    try {
      const cacheKey = `${RecipientLookupService.CACHE_PREFIX}id:${identifier}`;
      await cache.del(cacheKey);
      logInfo('Recipient identifier cache cleared', {
        identifier: MoneyMovementUtils.maskAddress(identifier),
      });
    } catch (error) {
      logError('Error clearing recipient identifier cache', {
        error: error as Error,
        identifier: MoneyMovementUtils.maskAddress(identifier),
      });
    }
  }

  /**
   * Warm up cache for frequently looked up recipients
   */
  static async warmUpCache(): Promise<void> {
    try {
      const query = `
        SELECT account_number, email
        FROM users
        WHERE is_active = true
        AND created_at > NOW() - INTERVAL '30 days'
        ORDER BY created_at DESC
        LIMIT 100
      `;

      const result = await db.query(query);
      const warmUpPromises = result.rows.map(row =>
        RecipientLookupService.findByAccountNumber(row.account_number)
      );

      await Promise.allSettled(warmUpPromises);
      logInfo('Recipient lookup cache warmed up', {
        count: result.rows.length,
      });
    } catch (error) {
      logError('Error warming up recipient cache', error as Error);
    }
  }
}
