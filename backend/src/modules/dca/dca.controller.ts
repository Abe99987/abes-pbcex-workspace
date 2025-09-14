import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/middlewares/auth';
import { createError } from '@/middlewares/errorMiddleware';
import { logError, logInfo } from '@/utils/logger';
import { DCAService } from './dca.service';
import {
  createDCARuleDto,
  updateDCARuleDto,
  backtestDto,
  CreateDCARuleRequest,
  UpdateDCARuleRequest,
  BacktestRequest,
} from './dto/dca.dto';

/**
 * DCA Controller
 * Handles HTTP requests for DCA rules and backtest operations
 */
export class DCAController {
  /**
   * GET /api/dca/rules
   * Get user's DCA rules with pagination and filtering
   */
  static async getRules(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
      const status = req.query.status as
        | 'active'
        | 'paused'
        | 'ended'
        | undefined;

      const result = await DCAService.getRules(userId, {
        limit,
        offset,
        status,
      });

      logInfo('DCA rules retrieved', {
        userId,
        count: result.rules.length,
        total: result.total,
        status,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logError('Failed to get DCA rules', {
        error: error as Error,
        userId: req.user?.id,
        query: req.query,
      });
      throw error;
    }
  }

  /**
   * POST /api/dca/rules
   * Create a new DCA rule with idempotency support
   */
  static async createRule(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const idempotencyKey = req.headers['x-idempotency-key'] as string;

      // Validate request body
      const validation = createDCARuleDto.safeParse(req.body);
      if (!validation.success) {
        throw createError.validation(
          'Invalid request body',
          validation.error.errors
        );
      }

      const ruleData: CreateDCARuleRequest = validation.data;

      const rule = await DCAService.createRule(
        userId,
        ruleData,
        idempotencyKey
      );

      logInfo('DCA rule created', {
        userId,
        ruleId: rule.id,
        baseSymbol: ruleData.baseSymbol,
        quoteSymbol: ruleData.quoteSymbol,
        cadence: ruleData.cadence,
        amount: ruleData.amount,
      });

      res.status(201).json({
        success: true,
        data: rule,
      });
    } catch (error) {
      logError('Failed to create DCA rule', {
        error: error as Error,
        userId: req.user?.id,
        body: req.body,
      });
      throw error;
    }
  }

  /**
   * PATCH /api/dca/rules/:id
   * Update an existing DCA rule
   */
  static async updateRule(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const ruleId = req.params.id;
      const idempotencyKey = req.headers['x-idempotency-key'] as string;

      if (!ruleId) {
        throw createError.validation('Rule ID is required');
      }

      // Validate request body
      const validation = updateDCARuleDto.safeParse(req.body);
      if (!validation.success) {
        throw createError.validation(
          'Invalid request body',
          validation.error.errors
        );
      }

      const updates: UpdateDCARuleRequest = validation.data;

      const rule = await DCAService.updateRule(
        userId,
        ruleId,
        updates,
        idempotencyKey
      );

      logInfo('DCA rule updated', {
        userId,
        ruleId,
        updates: Object.keys(updates),
      });

      res.json({
        success: true,
        data: rule,
      });
    } catch (error) {
      logError('Failed to update DCA rule', {
        error: error as Error,
        userId: req.user?.id,
        ruleId: req.params.id,
        body: req.body,
      });
      throw error;
    }
  }

  /**
   * DELETE /api/dca/rules/:id
   * Soft delete a DCA rule
   */
  static async deleteRule(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const ruleId = req.params.id;

      if (!ruleId) {
        throw createError.validation('Rule ID is required');
      }

      const success = await DCAService.deleteRule(userId, ruleId);

      if (!success) {
        throw createError.notFound('DCA rule not found');
      }

      logInfo('DCA rule deleted', {
        userId,
        ruleId,
      });

      res.status(204).send();
    } catch (error) {
      logError('Failed to delete DCA rule', {
        error: error as Error,
        userId: req.user?.id,
        ruleId: req.params.id,
      });
      throw error;
    }
  }

  /**
   * GET /api/dca/backtest
   * Run a DCA backtest simulation
   */
  static async runBacktest(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const startTime = Date.now();

      // Validate query parameters
      const validation = backtestDto.safeParse({
        baseSymbol: req.query.base,
        quoteSymbol: req.query.quote,
        amount: req.query.amount,
        cadence: req.query.cadence,
        startDate: req.query.start,
        endDate: req.query.end,
        executionTimeUtc: req.query.execTime || '14:00', // Default 10:00 ET
      });

      if (!validation.success) {
        throw createError.validation(
          'Invalid backtest parameters',
          validation.error.errors
        );
      }

      const backtestData: BacktestRequest = validation.data;

      const result = await DCAService.runBacktest(userId, backtestData);
      const duration = Date.now() - startTime;

      logInfo('DCA backtest completed', {
        userId,
        baseSymbol: backtestData.baseSymbol,
        quoteSymbol: backtestData.quoteSymbol,
        cadence: backtestData.cadence,
        periods: result.periods,
        duration,
      });

      res.json({
        success: true,
        data: result,
        meta: {
          duration,
        },
      });
    } catch (error) {
      logError('Failed to run DCA backtest', {
        error: error as Error,
        userId: req.user?.id,
        query: req.query,
      });
      throw error;
    }
  }

  /**
   * GET /api/dca/health
   * Health check for DCA module
   */
  static async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const health = await DCAService.getHealthStatus();

      res.json({
        success: true,
        data: health,
      });
    } catch (error) {
      logError('DCA health check failed', error as Error);
      res.status(503).json({
        success: false,
        error: 'Service unavailable',
      });
    }
  }
}
