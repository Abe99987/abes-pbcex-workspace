import { DCARepository } from './repo/dca.repository';
import { PriceHistoryService } from './services/price-history.service';
import { BacktestService } from './services/backtest.service';
import {
  CreateDCARuleRequest,
  UpdateDCARuleRequest,
  BacktestRequest,
  DCARuleResponse,
  DCARuleListResponse,
  BacktestResponse,
} from './dto/dca.dto';
import {
  DCARule,
  CreateDCARuleInput,
  UpdateDCARuleInput,
} from './entities/dca-rule.entity';
import { createError } from '@/middlewares/errorMiddleware';
import { logError, logInfo } from '@/utils/logger';
import { cache } from '@/cache/redis';

/**
 * DCA Service
 * Business logic for DCA rules and backtest operations
 */
export class DCAService {
  private static priceHistoryService = new PriceHistoryService();
  private static backtestService = new BacktestService();

  /**
   * Get user's DCA rules with pagination and filtering
   */
  static async getRules(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: 'active' | 'paused' | 'ended';
    } = {}
  ): Promise<DCARuleListResponse> {
    try {
      const { limit = 50, offset = 0, status } = options;

      const { rules, total } = await DCARepository.findByUserId(
        userId,
        limit,
        offset,
        status
      );

      const ruleResponses = rules.map(rule =>
        DCAService.mapRuleToResponse(rule)
      );

      return {
        rules: ruleResponses,
        total,
        limit,
        offset,
      };
    } catch (error) {
      logError('Failed to get DCA rules', error as Error);
      throw error;
    }
  }

  /**
   * Create a new DCA rule with idempotency support
   */
  static async createRule(
    userId: string,
    ruleData: CreateDCARuleRequest,
    idempotencyKey?: string
  ): Promise<DCARuleResponse> {
    try {
      // Check idempotency
      if (idempotencyKey) {
        const cached = await DCAService.getIdempotentResponse(idempotencyKey);
        if (cached) {
          logInfo('Returning idempotent DCA rule creation', {
            userId,
            idempotencyKey,
          });
          return cached;
        }
      }

      // Validate business rules
      await DCAService.validateCreateRule(userId, ruleData);

      // Convert DTO to entity input
      const ruleInput: CreateDCARuleInput & { userId: string } = {
        userId,
        baseSymbol: ruleData.baseSymbol.toUpperCase(),
        quoteSymbol: ruleData.quoteSymbol.toUpperCase(),
        cadence: ruleData.cadence,
        amountMinor: BigInt(Math.round(ruleData.amount * 100)), // Convert to cents
        currencySymbol: ruleData.currencySymbol.toUpperCase(),
        executionTimeUtc: ruleData.executionTimeUtc,
        startDate: ruleData.startDate,
        endDate: ruleData.endDate,
        monthlyDay: ruleData.monthlyDay,
        fromAccount: ruleData.fromAccount,
      };

      const rule = await DCARepository.create(ruleInput);
      const response = DCAService.mapRuleToResponse(rule);

      // Cache idempotent response
      if (idempotencyKey) {
        await DCAService.cacheIdempotentResponse(idempotencyKey, response);
      }

      // Increment metrics
      await DCAService.incrementMetric('dca_rules_created');

      logInfo('DCA rule created', {
        userId,
        ruleId: rule.id,
        baseSymbol: rule.baseSymbol,
        quoteSymbol: rule.quoteSymbol,
        cadence: rule.cadence,
      });

      return response;
    } catch (error) {
      logError('Failed to create DCA rule', error as Error);
      throw error;
    }
  }

  /**
   * Update an existing DCA rule
   */
  static async updateRule(
    userId: string,
    ruleId: string,
    updates: UpdateDCARuleRequest,
    idempotencyKey?: string
  ): Promise<DCARuleResponse> {
    try {
      // Check idempotency
      if (idempotencyKey) {
        const cached = await DCAService.getIdempotentResponse(idempotencyKey);
        if (cached) {
          logInfo('Returning idempotent DCA rule update', {
            userId,
            ruleId,
            idempotencyKey,
          });
          return cached;
        }
      }

      // Validate business rules
      await DCAService.validateUpdateRule(userId, ruleId, updates);

      // Convert DTO to entity input
      const updateInput: UpdateDCARuleInput = {};

      if (updates.baseSymbol !== undefined) {
        updateInput.baseSymbol = updates.baseSymbol.toUpperCase();
      }
      if (updates.quoteSymbol !== undefined) {
        updateInput.quoteSymbol = updates.quoteSymbol.toUpperCase();
      }
      if (updates.cadence !== undefined) {
        updateInput.cadence = updates.cadence;
      }
      if (updates.amount !== undefined) {
        updateInput.amountMinor = BigInt(Math.round(updates.amount * 100));
      }
      if (updates.currencySymbol !== undefined) {
        updateInput.currencySymbol = updates.currencySymbol.toUpperCase();
      }
      if (updates.executionTimeUtc !== undefined) {
        updateInput.executionTimeUtc = updates.executionTimeUtc;
      }
      if (updates.startDate !== undefined) {
        updateInput.startDate = updates.startDate;
      }
      if (updates.endDate !== undefined) {
        updateInput.endDate = updates.endDate;
      }
      if (updates.fromAccount !== undefined) {
        updateInput.fromAccount = updates.fromAccount;
      }
      if (updates.monthlyDay !== undefined) {
        updateInput.monthlyDay = updates.monthlyDay;
      }
      if (updates.active !== undefined) {
        updateInput.active = updates.active;
      }

      const rule = await DCARepository.update(ruleId, userId, updateInput);

      if (!rule) {
        throw createError.notFound('DCA rule not found');
      }

      const response = DCAService.mapRuleToResponse(rule);

      // Cache idempotent response
      if (idempotencyKey) {
        await DCAService.cacheIdempotentResponse(idempotencyKey, response);
      }

      // Increment metrics
      await DCAService.incrementMetric('dca_rules_updated');

      return response;
    } catch (error) {
      logError('Failed to update DCA rule', error as Error);
      throw error;
    }
  }

  /**
   * Soft delete a DCA rule
   */
  static async deleteRule(userId: string, ruleId: string): Promise<boolean> {
    try {
      const success = await DCARepository.delete(ruleId, userId);

      if (success) {
        await DCAService.incrementMetric('dca_rules_deleted');
        logInfo('DCA rule deleted', { userId, ruleId });
      }

      return success;
    } catch (error) {
      logError('Failed to delete DCA rule', error as Error);
      throw error;
    }
  }

  /**
   * Run a DCA backtest simulation
   */
  static async runBacktest(
    userId: string,
    backtestData: BacktestRequest
  ): Promise<BacktestResponse> {
    const startTime = Date.now();

    try {
      // Get price history
      const symbolPair = `${backtestData.baseSymbol}-${backtestData.quoteSymbol}`;
      const candles = await DCAService.priceHistoryService.getCandles(
        symbolPair,
        backtestData.startDate,
        backtestData.endDate,
        '1d'
      );

      if (candles.length === 0) {
        throw createError.validation(
          `No price data available for ${symbolPair}`
        );
      }

      // Run backtest calculation
      const result = await DCAService.backtestService.runBacktest({
        baseSymbol: backtestData.baseSymbol,
        quoteSymbol: backtestData.quoteSymbol,
        amount: backtestData.amount,
        cadence: backtestData.cadence,
        startDate: backtestData.startDate,
        endDate: backtestData.endDate,
        executionTimeUtc: backtestData.executionTimeUtc,
        candles,
      });

      const duration = Date.now() - startTime;

      // Record metrics
      await DCAService.recordBacktestMetric(duration);

      logInfo('DCA backtest completed', {
        userId,
        symbolPair,
        periods: result.periods,
        duration,
      });

      return result;
    } catch (error) {
      logError('Failed to run DCA backtest', error as Error);
      throw error;
    }
  }

  /**
   * Get health status of DCA service
   */
  static async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: {
      repository: string;
      priceHistory: string;
      backtest: string;
    };
    timestamp: string;
  }> {
    try {
      // Basic health checks
      const components = {
        repository: 'healthy',
        priceHistory: 'healthy',
        backtest: 'healthy',
      };

      // Could add more sophisticated health checks here
      const status = 'healthy';

      return {
        status,
        components,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        components: {
          repository: 'unknown',
          priceHistory: 'unknown',
          backtest: 'unknown',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Map DCA rule entity to response DTO
   */
  private static mapRuleToResponse(rule: DCARule): DCARuleResponse {
    return {
      id: rule.id,
      baseSymbol: rule.baseSymbol,
      quoteSymbol: rule.quoteSymbol,
      cadence: rule.cadence,
      amount: (Number(rule.amountMinor) / 100).toFixed(2), // Convert from cents
      currencySymbol: rule.currencySymbol,
      executionTimeUtc: rule.executionTimeUtc,
      startDate: rule.startDate.toISOString(),
      endDate: rule.endDate?.toISOString(),
      monthlyDay: rule.monthlyDay,
      fromAccount: rule.fromAccount,
      active: rule.active,
      nextRunAt: rule.nextRunAt.toISOString(),
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
    };
  }

  /**
   * Validate create rule business logic
   */
  private static async validateCreateRule(
    userId: string,
    ruleData: CreateDCARuleRequest
  ): Promise<void> {
    // Validate symbol pair
    const supportedPairs = ['BTC-USDC', 'ETH-USDC', 'GOLD-USD'];
    const symbolPair = `${ruleData.baseSymbol}-${ruleData.quoteSymbol}`;

    if (!supportedPairs.includes(symbolPair)) {
      throw createError.validation(`Unsupported symbol pair: ${symbolPair}`);
    }

    // Validate amount
    if (ruleData.amount < 1 || ruleData.amount > 10000) {
      throw createError.validation('Amount must be between $1 and $10,000');
    }

    // Validate date range
    const now = new Date();
    if (ruleData.startDate < now) {
      throw createError.validation('Start date cannot be in the past');
    }

    if (ruleData.endDate && ruleData.endDate <= ruleData.startDate) {
      throw createError.validation('End date must be after start date');
    }
  }

  /**
   * Validate update rule business logic
   */
  private static async validateUpdateRule(
    userId: string,
    ruleId: string,
    updates: UpdateDCARuleRequest
  ): Promise<void> {
    // Check if rule exists and belongs to user
    const existingRule = await DCARepository.findById(ruleId, userId);
    if (!existingRule) {
      throw createError.notFound('DCA rule not found');
    }

    // Validate updates similar to create validation
    if (updates.amount !== undefined) {
      if (updates.amount < 1 || updates.amount > 10000) {
        throw createError.validation('Amount must be between $1 and $10,000');
      }
    }

    if (updates.endDate !== undefined && updates.startDate !== undefined) {
      if (updates.endDate <= updates.startDate) {
        throw createError.validation('End date must be after start date');
      }
    }
  }

  /**
   * Get cached idempotent response
   */
  private static async getIdempotentResponse(
    idempotencyKey: string
  ): Promise<DCARuleResponse | null> {
    try {
      const cached = await cache.get(`dca:idempotency:${idempotencyKey}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logError('Failed to get idempotent response', error as Error);
      return null;
    }
  }

  /**
   * Cache idempotent response
   */
  private static async cacheIdempotentResponse(
    idempotencyKey: string,
    response: DCARuleResponse
  ): Promise<void> {
    try {
      await cache.set(
        `dca:idempotency:${idempotencyKey}`,
        JSON.stringify(response),
        24 * 60 * 60 // 24 hours TTL
      );
    } catch (error) {
      logError('Failed to cache idempotent response', error as Error);
    }
  }

  /**
   * Increment a metric counter
   */
  private static async incrementMetric(metric: string): Promise<void> {
    try {
      await cache.increment(`dca:metrics:${metric}`);
    } catch (error) {
      logError('Failed to increment metric', error as Error);
    }
  }

  /**
   * Record backtest performance metric
   */
  private static async recordBacktestMetric(duration: number): Promise<void> {
    try {
      // Simple histogram using Redis sorted sets
      const bucket = Math.floor(duration / 100) * 100; // 100ms buckets
      await cache.increment(`dca:metrics:backtest_duration:${bucket}`);
      await cache.increment('dca:metrics:backtests_completed');
    } catch (error) {
      logError('Failed to record backtest metric', error as Error);
    }
  }
}
