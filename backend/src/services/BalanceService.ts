import { db } from '@/db';
import { logInfo, logError } from '@/utils/logger';
import { cache } from '@/cache/redis';
import { getAssetConfig, getLimit } from '@/config/money-movement';
import { MoneyMovementUtils } from '@/models/MoneyMovement';

export interface BalanceInfo {
  asset: string;
  available: string;
  locked: string;
  total: string;
  decimals: number;
}

export interface BalanceCheckResult {
  sufficient: boolean;
  available: string;
  required: string;
  shortfall?: string;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class BalanceService {
  private static readonly CACHE_TTL = 60; // 1 minute
  private static readonly CACHE_PREFIX = 'balance:';

  /**
   * Get user balance for a specific asset
   */
  static async getBalance(
    userId: string,
    asset: string
  ): Promise<BalanceInfo | null> {
    try {
      // Check cache first
      const cacheKey = `${BalanceService.CACHE_PREFIX}${userId}:${asset}`;
      const cached = await cache.getJson<BalanceInfo>(cacheKey);

      if (cached) {
        return cached;
      }

      // Query database (placeholder - implement actual balance logic)
      const query = `
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'available' THEN amount ELSE 0 END), 0) as available,
          COALESCE(SUM(CASE WHEN type = 'locked' THEN amount ELSE 0 END), 0) as locked,
          COALESCE(SUM(amount), 0) as total
        FROM balances
        WHERE user_id = $1 AND asset = $2
      `;

      const result = await db.query(query, [userId, asset.toUpperCase()]);

      if (result.rows.length === 0) {
        // Return zero balance if no record exists
        const assetConfig = getAssetConfig(asset);
        const balance: BalanceInfo = {
          asset: asset.toUpperCase(),
          available: '0',
          locked: '0',
          total: '0',
          decimals: assetConfig?.decimals || 8,
        };

        await cache.setJson(cacheKey, balance, BalanceService.CACHE_TTL);
        return balance;
      }

      const row = result.rows[0];
      const assetConfig = getAssetConfig(asset);

      const balance: BalanceInfo = {
        asset: asset.toUpperCase(),
        available: row.available.toString(),
        locked: row.locked.toString(),
        total: row.total.toString(),
        decimals: assetConfig?.decimals || 8,
      };

      // Cache the result
      await cache.setJson(cacheKey, balance, BalanceService.CACHE_TTL);

      logInfo('Balance retrieved', {
        userId,
        asset: balance.asset,
        available: balance.available,
        total: balance.total,
      });

      return balance;
    } catch (error) {
      logError('Error getting balance', {
        error: error as Error,
        userId,
        asset,
      });
      return null;
    }
  }

  /**
   * Get all balances for a user
   */
  static async getAllBalances(userId: string): Promise<BalanceInfo[]> {
    try {
      // Check cache first
      const cacheKey = `${BalanceService.CACHE_PREFIX}${userId}:all`;
      const cached = await cache.getJson<BalanceInfo[]>(cacheKey);

      if (cached) {
        return cached;
      }

      // Query database
      const query = `
        SELECT 
          asset,
          COALESCE(SUM(CASE WHEN type = 'available' THEN amount ELSE 0 END), 0) as available,
          COALESCE(SUM(CASE WHEN type = 'locked' THEN amount ELSE 0 END), 0) as locked,
          COALESCE(SUM(amount), 0) as total
        FROM balances
        WHERE user_id = $1
        GROUP BY asset
        HAVING COALESCE(SUM(amount), 0) > 0
        ORDER BY asset
      `;

      const result = await db.query(query, [userId]);
      const balances: BalanceInfo[] = [];

      for (const row of result.rows) {
        const assetConfig = getAssetConfig(row.asset);
        balances.push({
          asset: row.asset,
          available: row.available.toString(),
          locked: row.locked.toString(),
          total: row.total.toString(),
          decimals: assetConfig?.decimals || 8,
        });
      }

      // Cache the result
      await cache.setJson(cacheKey, balances, BalanceService.CACHE_TTL);

      logInfo('All balances retrieved', { userId, count: balances.length });
      return balances;
    } catch (error) {
      logError('Error getting all balances', {
        error: error as Error,
        userId,
      });
      return [];
    }
  }

  /**
   * Check if user has sufficient balance for a transfer
   */
  static async checkBalance(
    userId: string,
    asset: string,
    amount: string
  ): Promise<BalanceCheckResult> {
    try {
      const balance = await BalanceService.getBalance(userId, asset);

      if (!balance) {
        return {
          sufficient: false,
          available: '0',
          required: amount,
          shortfall: amount,
          error: 'Balance not found',
        };
      }

      const availableNum = parseFloat(balance.available);
      const requiredNum = parseFloat(amount);

      if (isNaN(availableNum) || isNaN(requiredNum)) {
        return {
          sufficient: false,
          available: balance.available,
          required: amount,
          shortfall: amount,
          error: 'Invalid amount format',
        };
      }

      const sufficient = availableNum >= requiredNum;
      const shortfall = sufficient
        ? undefined
        : (requiredNum - availableNum).toString();

      return {
        sufficient,
        available: balance.available,
        required: amount,
        shortfall,
      };
    } catch (error) {
      logError('Error checking balance', {
        error: error as Error,
        userId,
        asset,
        amount,
      });
      return {
        sufficient: false,
        available: '0',
        required: amount,
        shortfall: amount,
        error: 'Internal server error',
      };
    }
  }

  /**
   * Validate transfer amount against asset rules
   */
  static validateTransferAmount(
    asset: string,
    amount: string,
    operation:
      | 'internal_transfer'
      | 'crypto_withdrawal'
      | 'bank_transfer'
      | 'payment_request'
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const assetConfig = getAssetConfig(asset);
      if (!assetConfig) {
        errors.push('Asset not supported');
        return { valid: false, errors, warnings };
      }

      if (!assetConfig.enabled) {
        errors.push('Asset is currently disabled');
        return { valid: false, errors, warnings };
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        errors.push('Amount must be a positive number');
        return { valid: false, errors, warnings };
      }

      // Check minimum transfer amount
      if (amountNum < assetConfig.minTransfer) {
        errors.push(
          `Minimum transfer amount is ${assetConfig.minTransfer} ${asset}`
        );
        return { valid: false, errors, warnings };
      }

      // Check step size
      const stepSize = assetConfig.stepSize;
      if (stepSize > 0) {
        const remainder = amountNum % stepSize;
        if (remainder > 0.00000001) {
          // Allow for floating point precision
          errors.push(`Amount must be a multiple of ${stepSize} ${asset}`);
          return { valid: false, errors, warnings };
        }
      }

      // Check operation-specific limits
      const limit = getLimit(`${operation.replace('_', '')}Limit` as any);
      if (limit && amountNum > limit) {
        errors.push(
          `Maximum ${operation.replace('_', ' ')} amount is ${limit} ${asset}`
        );
        return { valid: false, errors, warnings };
      }

      // Check KYC requirements
      if (assetConfig.requiresKyc) {
        warnings.push(`${asset} transfers require KYC verification`);
      }

      return { valid: true, errors, warnings };
    } catch (error) {
      logError('Error validating transfer amount', {
        error: error as Error,
        asset,
        amount,
        operation,
      });
      errors.push('Validation error occurred');
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Lock balance for a pending transaction
   */
  static async lockBalance(
    userId: string,
    asset: string,
    amount: string,
    transactionId: string
  ): Promise<boolean> {
    try {
      // Check if sufficient balance exists
      const balanceCheck = await BalanceService.checkBalance(
        userId,
        asset,
        amount
      );
      if (!balanceCheck.sufficient) {
        logError('Insufficient balance for lock', {
          error: new Error('Insufficient balance'),
          userId,
          asset,
          amount,
          available: balanceCheck.available,
        });
        return false;
      }

      // Lock the balance (placeholder implementation)
      const query = `
        INSERT INTO balance_locks (user_id, asset, amount, transaction_id, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (user_id, asset, transaction_id) DO NOTHING
      `;

      await db.query(query, [
        userId,
        asset.toUpperCase(),
        amount,
        transactionId,
      ]);

      // Clear balance cache
      await BalanceService.clearCache(userId, asset);

      logInfo('Balance locked', { userId, asset, amount, transactionId });
      return true;
    } catch (error) {
      logError('Error locking balance', {
        error: error as Error,
        userId,
        asset,
        amount,
        transactionId,
      });
      return false;
    }
  }

  /**
   * Release locked balance
   */
  static async releaseBalance(
    userId: string,
    asset: string,
    transactionId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM balance_locks
        WHERE user_id = $1 AND asset = $2 AND transaction_id = $3
      `;

      const result = await db.query(query, [
        userId,
        asset.toUpperCase(),
        transactionId,
      ]);

      if (result.rowCount && result.rowCount > 0) {
        // Clear balance cache
        await BalanceService.clearCache(userId, asset);

        logInfo('Balance lock released', { userId, asset, transactionId });
        return true;
      }

      return false;
    } catch (error) {
      logError('Error releasing balance lock', {
        error: error as Error,
        userId,
        asset,
        transactionId,
      });
      return false;
    }
  }

  /**
   * Clear balance cache for a user and asset
   */
  static async clearCache(userId: string, asset: string): Promise<void> {
    try {
      const cacheKey = `${BalanceService.CACHE_PREFIX}${userId}:${asset}`;
      const allCacheKey = `${BalanceService.CACHE_PREFIX}${userId}:all`;

      await Promise.all([cache.del(cacheKey), cache.del(allCacheKey)]);

      logInfo('Balance cache cleared', { userId, asset });
    } catch (error) {
      logError('Error clearing balance cache', {
        error: error as Error,
        userId,
        asset,
      });
    }
  }

  /**
   * Warm up cache for active users
   */
  static async warmUpCache(): Promise<void> {
    try {
      const query = `
        SELECT DISTINCT user_id, asset
        FROM balances
        WHERE updated_at > NOW() - INTERVAL '1 hour'
        ORDER BY updated_at DESC
        LIMIT 1000
      `;

      const result = await db.query(query);
      const warmUpPromises = result.rows.map(row =>
        BalanceService.getBalance(row.user_id, row.asset)
      );

      await Promise.allSettled(warmUpPromises);
      logInfo('Balance cache warmed up', { count: result.rows.length });
    } catch (error) {
      logError('Error warming up balance cache', error as Error);
    }
  }
}
