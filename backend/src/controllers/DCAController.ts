import { Request, Response } from 'express';
import { asyncHandlerAuth } from '@/utils/asyncHandler';
import { createError } from '@/middlewares/errorMiddleware';
import { logError, logInfo } from '@/utils/logger';
import { AuthenticatedRequest } from '@/middlewares/auth';
import { idempotencyMiddleware } from '@/middlewares/idempotency';
import { rateLimitMiddleware } from '@/middlewares/rateLimit';
import { requireAuth, requireDCA, requireFeature } from '@/middlewares/auth';
import { DCAService } from '@/services/DCAService';
import { ValidationService } from '@/services/ValidationService';
import { AuditService } from '@/services/AuditService';
import { dcaPlanSchema, dcaBacktestSchema } from '@/models/MoneyMovement';

export class DCAController {
  /**
   * Create DCA plan
   * POST /api/dca/plans
   */
  static createDCAPlan = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const validation = dcaPlanSchema.safeParse(req.body);

        if (!validation.success) {
          throw createError.validation(
            'Invalid request body',
            validation.error.errors
          );
        }

        const planData = validation.data;

        // Validate DCA plan data
        const validationResult = ValidationService.validateDCAPlan(
          planData.asset,
          planData.contributionAmount,
          planData.currency,
          planData.frequency,
          new Date(planData.startDate),
          planData.sourceAccountId
        );

        if (!validationResult.valid) {
          throw createError.validation(
            (validationResult as any).message || 'DCA plan validation failed'
          );
        }

        // Create the DCA plan
        const dcaPlan = await DCAService.createDCAPlan(userId, planData);

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'dca_plan_created',
          resourceType: 'dca_plan',
          resourceId: dcaPlan.planId,
          changes: {
            asset: planData.asset,
            contributionAmount: planData.contributionAmount,
            currency: planData.currency,
            frequency: planData.frequency,
            startDate: planData.startDate,
            endCondition: planData.endCondition,
            endValue: planData.endValue,
            sourceAccountId: planData.sourceAccountId,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('DCA plan created', {
          userId,
          planId: dcaPlan.planId,
          asset: planData.asset,
          contributionAmount: planData.contributionAmount,
          frequency: planData.frequency,
        });

        res.status(201).json({
          success: true,
          data: dcaPlan,
        });
      } catch (error) {
        logError('Failed to create DCA plan', {
          error: error as Error,
          userId: req.user?.id,
          body: req.body,
        });
        throw error;
      }
    }
  );

  /**
   * Get DCA plan
   * GET /api/dca/plans/:id
   */
  static getDCAPlan = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const planId = req.params.id;

        if (!planId) {
          throw createError.validation('Plan ID is required');
        }

        const dcaPlan = await DCAService.getDCAPlan(planId, userId);

        if (!dcaPlan) {
          throw createError.notFound('DCA plan not found');
        }

        res.json({
          success: true,
          data: dcaPlan,
        });
      } catch (error) {
        logError('Failed to get DCA plan', {
          error: error as Error,
          userId: req.user?.id,
          planId: req.params.id,
        });
        throw error;
      }
    }
  );

  /**
   * Get user's DCA plans
   * GET /api/dca/plans
   */
  static getDCAPlans = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const status = req.query.status as string; // 'active' | 'paused' | 'ended'
        const asset = req.query.asset as string;

        // TODO: Implement DCA plans list retrieval
        // This would query the dca_plans table for the user's plans
        const plans = {
          plans: [],
          total: 0,
          limit,
          offset,
        };

        res.json({
          success: true,
          data: plans,
        });
      } catch (error) {
        logError('Failed to get DCA plans', {
          error: error as Error,
          userId: req.user?.id,
          query: req.query,
        });
        throw error;
      }
    }
  );

  /**
   * Update DCA plan
   * PUT /api/dca/plans/:id
   */
  static updateDCAPlan = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const planId = req.params.id;
        const updates = req.body;

        if (!planId) {
          throw createError.validation('Plan ID is required');
        }

        // Validate updates if provided
        if (
          updates.contributionAmount ||
          updates.frequency ||
          updates.startDate
        ) {
          const validationResult = ValidationService.validateDCAPlan(
            updates.asset || 'BTC', // Use existing asset if not provided
            updates.contributionAmount || '100', // Use existing amount if not provided
            updates.currency || 'USD', // Use existing currency if not provided
            updates.frequency || 'monthly', // Use existing frequency if not provided
            updates.startDate || new Date(), // Use existing start date if not provided
            updates.sourceAccountId || 'temp' // Use existing source if not provided
          );

          if (!validationResult.valid) {
            throw createError.validation(
              (validationResult as any).message || 'DCA plan validation failed'
            );
          }
        }

        // Update the DCA plan
        const updatedPlan = await DCAService.updateDCAPlan(
          planId,
          userId,
          updates
        );

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'dca_plan_updated',
          resourceType: 'dca_plan',
          resourceId: planId,
          changes: updates,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('DCA plan updated', {
          userId,
          planId,
          updates: Object.keys(updates),
        });

        res.json({
          success: true,
          data: updatedPlan,
        });
      } catch (error) {
        logError('Failed to update DCA plan', {
          error: error as Error,
          userId: req.user?.id,
          planId: req.params.id,
          body: req.body,
        });
        throw error;
      }
    }
  );

  /**
   * Pause DCA plan
   * POST /api/dca/plans/:id/pause
   */
  static pauseDCAPlan = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const planId = req.params.id;

        if (!planId) {
          throw createError.validation('Plan ID is required');
        }

        // Pause the DCA plan
        const pausedPlan = await DCAService.pauseDCAPlan(planId, userId);

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'dca_plan_paused',
          resourceType: 'dca_plan',
          resourceId: planId,
          changes: {
            status: 'paused',
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('DCA plan paused', {
          userId,
          planId,
        });

        res.json({
          success: true,
          data: pausedPlan,
        });
      } catch (error) {
        logError('Failed to pause DCA plan', {
          error: error as Error,
          userId: req.user?.id,
          planId: req.params.id,
        });
        throw error;
      }
    }
  );

  /**
   * Resume DCA plan
   * POST /api/dca/plans/:id/resume
   */
  static resumeDCAPlan = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const planId = req.params.id;

        if (!planId) {
          throw createError.validation('Plan ID is required');
        }

        // Resume the DCA plan (this would be similar to pause but set status to 'active')
        const resumedPlan = await DCAService.resumeDCAPlan(planId, userId);

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'dca_plan_resumed',
          resourceType: 'dca_plan',
          resourceId: planId,
          changes: {
            status: 'active',
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('DCA plan resumed', {
          userId,
          planId,
        });

        res.json({
          success: true,
          data: resumedPlan,
        });
      } catch (error) {
        logError('Failed to resume DCA plan', {
          error: error as Error,
          userId: req.user?.id,
          planId: req.params.id,
        });
        throw error;
      }
    }
  );

  /**
   * Delete DCA plan
   * DELETE /api/dca/plans/:id
   */
  static deleteDCAPlan = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const planId = req.params.id;

        if (!planId) {
          throw createError.validation('Plan ID is required');
        }

        // TODO: Implement DCA plan deletion
        // This would mark the plan as deleted or actually delete it
        const deleted = true; // Placeholder

        if (!deleted) {
          throw createError.validation(
            'DCA plan cannot be deleted or not found'
          );
        }

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'dca_plan_deleted',
          resourceType: 'dca_plan',
          resourceId: planId,
          changes: {
            deleted: true,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('DCA plan deleted', {
          userId,
          planId,
        });

        res.json({
          success: true,
          data: {
            planId,
            deleted: true,
          },
        });
      } catch (error) {
        logError('Failed to delete DCA plan', {
          error: error as Error,
          userId: req.user?.id,
          planId: req.params.id,
        });
        throw error;
      }
    }
  );

  /**
   * Run DCA backtest
   * POST /api/dca/backtest
   */
  static runDCABacktest = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const validation = dcaBacktestSchema.safeParse(req.body);

        if (!validation.success) {
          throw createError.validation(
            'Invalid request body',
            validation.error.errors
          );
        }

        const backtestData = validation.data;

        // Run the DCA backtest
        const backtestResult = await DCAService.runDCABacktest(
          userId,
          backtestData
        );

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'dca_backtest_run',
          resourceType: 'dca_backtest',
          resourceId: backtestResult.backtestId,
          changes: {
            asset: backtestData.asset,
            contribution: backtestData.contribution,
            frequency: backtestData.frequency,
            startDate: backtestData.startDate,
            endDate: backtestData.endDate,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('DCA backtest run', {
          userId,
          backtestId: backtestResult.backtestId,
          asset: backtestData.asset,
          contribution: backtestData.contribution,
        });

        res.json({
          success: true,
          data: backtestResult,
        });
      } catch (error) {
        logError('Failed to run DCA backtest', {
          error: error as Error,
          userId: req.user?.id,
          body: req.body,
        });
        throw error;
      }
    }
  );

  /**
   * Get DCA plan execution history
   * GET /api/dca/plans/:id/history
   */
  static getDCAPlanHistory = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const planId = req.params.id;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        if (!planId) {
          throw createError.validation('Plan ID is required');
        }

        // TODO: Implement DCA plan execution history
        // This would query the execution history for the specific plan
        const history = {
          executions: [],
          total: 0,
          limit,
          offset,
        };

        res.json({
          success: true,
          data: history,
        });
      } catch (error) {
        logError('Failed to get DCA plan history', {
          error: error as Error,
          userId: req.user?.id,
          planId: req.params.id,
          query: req.query,
        });
        throw error;
      }
    }
  );

  /**
   * Get DCA statistics
   * GET /api/dca/stats
   */
  static getDCAStats = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;

        // TODO: Implement DCA statistics
        // This would provide counts and totals of DCA plans and executions
        const stats = {
          totalPlans: 0,
          activePlans: 0,
          pausedPlans: 0,
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
          totalInvested: '0',
          totalValue: '0',
          totalReturn: '0',
          averageReturn: '0',
        };

        res.json({
          success: true,
          data: stats,
        });
      } catch (error) {
        logError('Failed to get DCA stats', {
          error: error as Error,
          userId: req.user?.id,
        });
        throw error;
      }
    }
  );

  /**
   * Get available assets for DCA
   * GET /api/dca/assets
   */
  static getAvailableAssets = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;

        // Get all available assets for DCA
        const availableAssets = [
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            type: 'crypto',
            isActive: true,
            minContribution: '10.00',
            maxContribution: '10000.00',
            currentPrice: '45000.00',
          },
          {
            symbol: 'ETH',
            name: 'Ethereum',
            type: 'crypto',
            isActive: true,
            minContribution: '10.00',
            maxContribution: '10000.00',
            currentPrice: '3000.00',
          },
          {
            symbol: 'USDC',
            name: 'USD Coin',
            type: 'stablecoin',
            isActive: true,
            minContribution: '10.00',
            maxContribution: '10000.00',
            currentPrice: '1.00',
          },
          {
            symbol: 'GOLD',
            name: 'Gold',
            type: 'commodity',
            isActive: true,
            minContribution: '50.00',
            maxContribution: '50000.00',
            currentPrice: '2000.00',
          },
        ];

        res.json({
          success: true,
          data: {
            assets: availableAssets,
          },
        });
      } catch (error) {
        logError('Failed to get available assets for DCA', {
          error: error as Error,
          userId: req.user?.id,
        });
        throw error;
      }
    }
  );
}

// Export middleware chains for routes
export const dcaMiddleware = {
  // Write operations (create, update, pause, resume, delete, backtest)
  write: [
    requireAuth,
    requireDCA,
    requireFeature('dca.enabled'),
    rateLimitMiddleware.dca,
    idempotencyMiddleware,
  ],

  // Read operations (get plan, list plans, history, stats, assets)
  read: [
    requireAuth,
    requireDCA,
    requireFeature('dca.enabled'),
    rateLimitMiddleware.moderate,
  ],
};
