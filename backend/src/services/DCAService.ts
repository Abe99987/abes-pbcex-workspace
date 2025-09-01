import { db } from '@/db';
import { logInfo, logError } from '@/utils/logger';
import { createError } from '@/middlewares/errorMiddleware';
import { ValidationService } from './ValidationService';
import { OutboxService } from './OutboxService';
import { AuditService } from './AuditService';
import { DCABacktestCalculator } from './DCABacktestCalculator';
import { v4 as uuidv4 } from 'uuid';

export interface DCAPlanCreateRequest {
  asset: string;
  contributionAmount: string;
  currency: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  timeOfDay?: string;
  startDate: string;
  endCondition: 'never' | 'until_date' | 'occurrences';
  endValue?: Record<string, any>;
  sourceAccountId: string;
}

export interface DCAPlanResponse {
  planId: string;
  status: 'active' | 'paused' | 'ended';
  nextRunAt?: string;
  createdAt: string;
}

export interface DCAPlanDetails {
  id: string;
  asset: string;
  contributionAmount: string;
  currency: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  timeOfDay?: string;
  startDate: string;
  endCondition: 'never' | 'until_date' | 'occurrences';
  endValue?: Record<string, any>;
  sourceAccountId: string;
  status: 'active' | 'paused' | 'ended';
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DCABacktestRequest {
  asset: string;
  contribution: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  startDate: string;
  endDate: string;
}

export interface DCABacktestResponse {
  backtestId: string;
  summary: {
    totalInvested: string;
    totalUnits: string;
    averageCost: string;
    currentValue: string;
    totalReturn: string;
    totalReturnPercentage: string;
  };
  series: Array<{
    date: string;
    contribution: string;
    price: string;
    units: string;
    totalInvested: string;
    totalUnits: string;
    averageCost: string;
    currentValue: string;
  }>;
  createdAt: string;
}

export class DCAService {
  /**
   * Create DCA plan
   */
  static async createDCAPlan(
    userId: string,
    request: DCAPlanCreateRequest
  ): Promise<DCAPlanResponse> {
    try {
      // Validate request
      const validation = ValidationService.validateDCAPlan(
        request.asset,
        request.contributionAmount,
        request.currency,
        request.frequency,
        new Date(request.startDate),
        request.sourceAccountId
      );
      ValidationService.throwIfInvalid(
        validation,
        'DCA plan validation failed'
      );

      // Generate plan ID
      const planId = uuidv4();

      // Calculate next run time
      const startDate = new Date(request.startDate);
      const nextRunAt = DCAService.calculateNextRunAt(
        request.frequency,
        startDate,
        request.timeOfDay
      );

      // Create DCA plan record
      const query = `
        INSERT INTO dca_plans (
          id, user_id, asset, contribution_amount, currency, frequency, time_of_day,
          start_date, end_condition, end_value, source_account_id, status, next_run_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, status, next_run_at, created_at
      `;

      const result = await db.query(query, [
        planId,
        userId,
        request.asset.toUpperCase(),
        request.contributionAmount,
        request.currency.toUpperCase(),
        request.frequency,
        request.timeOfDay || null,
        startDate,
        request.endCondition,
        request.endValue ? JSON.stringify(request.endValue) : null,
        request.sourceAccountId,
        'active',
        nextRunAt,
      ]);

      const dcaPlan = result.rows[0];

      // Emit domain event
      await OutboxService.emitEvent('dca_plan.created', {
        planId: dcaPlan.id,
        userId,
        asset: request.asset.toUpperCase(),
        contributionAmount: request.contributionAmount,
        currency: request.currency.toUpperCase(),
        frequency: request.frequency,
        startDate: startDate.toISOString(),
        endCondition: request.endCondition,
        endValue: request.endValue,
        nextRunAt: nextRunAt.toISOString(),
      });

      // Audit log
      await AuditService.logOperation({
        userId,
        operation: 'dca_plan_created',
        resourceType: 'dca_plan',
        resourceId: dcaPlan.id,
        changes: {
          asset: request.asset.toUpperCase(),
          contributionAmount: request.contributionAmount,
          currency: request.currency.toUpperCase(),
          frequency: request.frequency,
          startDate: startDate.toISOString(),
          endCondition: request.endCondition,
          endValue: request.endValue,
          sourceAccountId: request.sourceAccountId,
        },
      });

      logInfo('DCA plan created', {
        planId: dcaPlan.id,
        userId,
        asset: request.asset.toUpperCase(),
        contributionAmount: request.contributionAmount,
        frequency: request.frequency,
        nextRunAt: nextRunAt.toISOString(),
      });

      return {
        planId: dcaPlan.id,
        status: dcaPlan.status,
        nextRunAt: nextRunAt.toISOString(),
        createdAt: dcaPlan.created_at.toISOString(),
      };
    } catch (error) {
      logError('Error creating DCA plan', {
        error: error as Error,
        userId,
        asset: request.asset,
        contributionAmount: request.contributionAmount,
        frequency: request.frequency,
      });
      throw error;
    }
  }

  /**
   * Get DCA plan details
   */
  static async getDCAPlan(
    planId: string,
    userId: string
  ): Promise<DCAPlanDetails> {
    try {
      const query = `
        SELECT 
          id, asset, contribution_amount, currency, frequency, time_of_day,
          start_date, end_condition, end_value, source_account_id, status,
          last_run_at, next_run_at, created_at, updated_at
        FROM dca_plans
        WHERE id = $1 AND user_id = $2
      `;

      const result = await db.query(query, [planId, userId]);

      if (result.rows.length === 0) {
        throw createError.notFound('DCA plan not found');
      }

      const plan = result.rows[0];

      return {
        id: plan.id,
        asset: plan.asset,
        contributionAmount: plan.contribution_amount,
        currency: plan.currency,
        frequency: plan.frequency,
        timeOfDay: plan.time_of_day,
        startDate: plan.start_date.toISOString(),
        endCondition: plan.end_condition,
        endValue: plan.end_value ? JSON.parse(plan.end_value) : undefined,
        sourceAccountId: plan.source_account_id,
        status: plan.status,
        lastRunAt: plan.last_run_at?.toISOString(),
        nextRunAt: plan.next_run_at?.toISOString(),
        createdAt: plan.created_at.toISOString(),
        updatedAt: plan.updated_at.toISOString(),
      };
    } catch (error) {
      logError('Error getting DCA plan', {
        error: error as Error,
        planId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get user's DCA plans
   */
  static async getUserDCAPlans(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const query = `
        SELECT 
          id, asset, contribution_amount, currency, frequency, time_of_day,
          start_date, end_condition, end_value, source_account_id, status,
          last_run_at, next_run_at, created_at, updated_at
        FROM dca_plans
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await db.query(query, [userId, limit, offset]);

      return result.rows.map(plan => ({
        ...plan,
        startDate: plan.start_date.toISOString(),
        endValue: plan.end_value ? JSON.parse(plan.end_value) : undefined,
        lastRunAt: plan.last_run_at?.toISOString(),
        nextRunAt: plan.next_run_at?.toISOString(),
      }));
    } catch (error) {
      logError('Error getting user DCA plans', {
        error: error as Error,
        userId,
      });
      return [];
    }
  }

  /**
   * Update DCA plan
   */
  static async updateDCAPlan(
    planId: string,
    userId: string,
    updates: Partial<DCAPlanCreateRequest>
  ): Promise<DCAPlanResponse> {
    try {
      // Check if plan exists and belongs to user
      const existingPlan = await DCAService.getDCAPlan(planId, userId);

      // Build update query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (updates.asset !== undefined) {
        updateFields.push(`asset = $${paramIndex++}`);
        updateValues.push(updates.asset.toUpperCase());
      }

      if (updates.contributionAmount !== undefined) {
        updateFields.push(`contribution_amount = $${paramIndex++}`);
        updateValues.push(updates.contributionAmount);
      }

      if (updates.currency !== undefined) {
        updateFields.push(`currency = $${paramIndex++}`);
        updateValues.push(updates.currency.toUpperCase());
      }

      if (updates.frequency !== undefined) {
        updateFields.push(`frequency = $${paramIndex++}`);
        updateValues.push(updates.frequency);
      }

      if (updates.timeOfDay !== undefined) {
        updateFields.push(`time_of_day = $${paramIndex++}`);
        updateValues.push(updates.timeOfDay);
      }

      if (updates.startDate !== undefined) {
        updateFields.push(`start_date = $${paramIndex++}`);
        updateValues.push(new Date(updates.startDate));
      }

      if (updates.endCondition !== undefined) {
        updateFields.push(`end_condition = $${paramIndex++}`);
        updateValues.push(updates.endCondition);
      }

      if (updates.endValue !== undefined) {
        updateFields.push(`end_value = $${paramIndex++}`);
        updateValues.push(
          updates.endValue ? JSON.stringify(updates.endValue) : null
        );
      }

      if (updates.sourceAccountId !== undefined) {
        updateFields.push(`source_account_id = $${paramIndex++}`);
        updateValues.push(updates.sourceAccountId);
      }

      if (updateFields.length === 0) {
        throw createError.validation('No valid fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(planId, userId);

      const query = `
        UPDATE dca_plans
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
        RETURNING id, status, next_run_at, updated_at
      `;

      const result = await db.query(query, updateValues);

      if (result.rows.length === 0) {
        throw createError.notFound('DCA plan not found');
      }

      const updatedPlan = result.rows[0];

      // Emit domain event
      await OutboxService.emitEvent('dca_plan.updated', {
        planId: updatedPlan.id,
        userId,
        updates,
        nextRunAt: updatedPlan.next_run_at?.toISOString(),
      });

      // Audit log
      await AuditService.logOperation({
        userId,
        operation: 'dca_plan_updated',
        resourceType: 'dca_plan',
        resourceId: updatedPlan.id,
        changes: updates,
      });

      logInfo('DCA plan updated', {
        planId: updatedPlan.id,
        userId,
        updates,
      });

      return {
        planId: updatedPlan.id,
        status: updatedPlan.status,
        nextRunAt: updatedPlan.next_run_at?.toISOString(),
        createdAt: updatedPlan.updated_at.toISOString(),
      };
    } catch (error) {
      logError('Error updating DCA plan', {
        error: error as Error,
        planId,
        userId,
        updates,
      });
      throw error;
    }
  }

  /**
   * Pause DCA plan
   */
  static async pauseDCAPlan(
    planId: string,
    userId: string
  ): Promise<DCAPlanResponse> {
    try {
      const query = `
        UPDATE dca_plans
        SET status = 'paused', updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING id, status, next_run_at, updated_at
      `;

      const result = await db.query(query, [planId, userId]);

      if (result.rows.length === 0) {
        throw createError.notFound('DCA plan not found');
      }

      const plan = result.rows[0];

      // Emit domain event
      await OutboxService.emitEvent('dca_plan.paused', {
        planId: plan.id,
        userId,
      });

      // Audit log
      await AuditService.logOperation({
        userId,
        operation: 'dca_plan_paused',
        resourceType: 'dca_plan',
        resourceId: plan.id,
        changes: { status: 'paused' },
      });

      logInfo('DCA plan paused', { planId: plan.id, userId });

      return {
        planId: plan.id,
        status: plan.status,
        nextRunAt: plan.next_run_at?.toISOString(),
        createdAt: plan.updated_at.toISOString(),
      };
    } catch (error) {
      logError('Error pausing DCA plan', {
        error: error as Error,
        planId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Resume DCA plan
   */
  static async resumeDCAPlan(
    planId: string,
    userId: string
  ): Promise<DCAPlanResponse> {
    try {
      const query = `
        UPDATE dca_plans
        SET status = 'active', updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING id, status, next_run_at, updated_at
      `;

      const result = await db.query(query, [planId, userId]);

      if (result.rows.length === 0) {
        throw createError.notFound('DCA plan not found');
      }

      const plan = result.rows[0];

      // Emit domain event
      await OutboxService.emitEvent('dca_plan.resumed', {
        planId: plan.id,
        userId,
      });

      // Audit log
      await AuditService.logOperation({
        userId,
        operation: 'dca_plan_resumed',
        resourceType: 'dca_plan',
        resourceId: plan.id,
        changes: { status: 'active' },
      });

      logInfo('DCA plan resumed', { planId: plan.id, userId });

      return {
        planId: plan.id,
        status: plan.status,
        nextRunAt: plan.next_run_at?.toISOString(),
        createdAt: plan.updated_at.toISOString(),
      };
    } catch (error) {
      logError('Error resuming DCA plan', {
        error: error as Error,
        planId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Run DCA backtest
   */
  static async runDCABacktest(
    userId: string,
    request: DCABacktestRequest
  ): Promise<DCABacktestResponse> {
    try {
      // Validate request
      if (
        !request.asset ||
        !request.contribution ||
        !request.frequency ||
        !request.startDate ||
        !request.endDate
      ) {
        throw createError.validation('All backtest parameters are required');
      }

      // Run backtest calculation
      const backtestResult =
        await DCABacktestCalculator.calculateBacktest(request);

      // Generate backtest ID
      const backtestId = uuidv4();

      // Store backtest results
      const query = `
        INSERT INTO dca_backtests (
          id, user_id, params, results
        ) VALUES ($1, $2, $3, $4)
        RETURNING id, created_at
      `;

      const params = {
        asset: request.asset.toUpperCase(),
        contribution: request.contribution,
        frequency: request.frequency,
        startDate: request.startDate,
        endDate: request.endDate,
      };

      const result = await db.query(query, [
        backtestId,
        userId,
        JSON.stringify(params),
        JSON.stringify(backtestResult),
      ]);

      const backtest = result.rows[0];

      // Emit domain event
      await OutboxService.emitEvent('dca_backtest.completed', {
        backtestId: backtest.id,
        userId,
        asset: request.asset.toUpperCase(),
        contribution: request.contribution,
        frequency: request.frequency,
        summary: backtestResult.summary,
      });

      // Audit log
      await AuditService.logOperation({
        userId,
        operation: 'dca_backtest_completed',
        resourceType: 'dca_backtest',
        resourceId: backtest.id,
        changes: {
          params,
          summary: backtestResult.summary,
        },
      });

      logInfo('DCA backtest completed', {
        backtestId: backtest.id,
        userId,
        asset: request.asset.toUpperCase(),
        contribution: request.contribution,
        frequency: request.frequency,
      });

      return {
        backtestId: backtest.id,
        summary: backtestResult.summary,
        series: backtestResult.series,
        createdAt: backtest.created_at.toISOString(),
      };
    } catch (error) {
      logError('Error running DCA backtest', {
        error: error as Error,
        userId,
        asset: request.asset,
        contribution: request.contribution,
        frequency: request.frequency,
      });
      throw error;
    }
  }

  /**
   * Get DCA backtest by ID
   */
  static async getDCABacktest(
    backtestId: string,
    userId: string
  ): Promise<DCABacktestResponse> {
    try {
      const query = `
        SELECT id, params, results, created_at
        FROM dca_backtests
        WHERE id = $1 AND user_id = $2
      `;

      const result = await db.query(query, [backtestId, userId]);

      if (result.rows.length === 0) {
        throw createError.notFound('DCA backtest not found');
      }

      const backtest = result.rows[0];
      const results = JSON.parse(backtest.results);

      return {
        backtestId: backtest.id,
        summary: results.summary,
        series: results.series,
        createdAt: backtest.created_at.toISOString(),
      };
    } catch (error) {
      logError('Error getting DCA backtest', {
        error: error as Error,
        backtestId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get user's DCA backtests
   */
  static async getUserDCABacktests(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const query = `
        SELECT id, params, results, created_at
        FROM dca_backtests
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await db.query(query, [userId, limit, offset]);

      return result.rows.map(backtest => {
        const params = JSON.parse(backtest.params);
        const results = JSON.parse(backtest.results);

        return {
          id: backtest.id,
          params,
          summary: results.summary,
          createdAt: backtest.created_at.toISOString(),
        };
      });
    } catch (error) {
      logError('Error getting user DCA backtests', {
        error: error as Error,
        userId,
      });
      return [];
    }
  }

  /**
   * Calculate next run time for DCA plan
   */
  static calculateNextRunAt(
    frequency: string,
    lastRunAt: Date,
    timeOfDay?: string
  ): Date {
    const next = new Date(lastRunAt);

    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'biweekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      default:
        next.setDate(next.getDate() + 1);
    }

    // Set specific time of day if provided
    if (timeOfDay) {
      const [hours, minutes] = timeOfDay.split(':').map(Number);
      next.setHours(hours || 0, minutes || 0, 0, 0);
    }

    return next;
  }

  /**
   * Get DCA plans that are due to run
   */
  static async getDueDCAPlans(): Promise<any[]> {
    try {
      const query = `
        SELECT 
          id, user_id, asset, contribution_amount, currency, frequency,
          start_date, end_condition, end_value, source_account_id,
          last_run_at, next_run_at
        FROM dca_plans
        WHERE status = 'active'
        AND next_run_at <= NOW()
        AND (end_condition = 'never' OR 
             (end_condition = 'until_date' AND end_value::json->>'date' > NOW()::text) OR
             (end_condition = 'occurrences' AND (end_value::json->>'count')::int > 0))
        ORDER BY next_run_at ASC
      `;

      const result = await db.query(query);

      return result.rows.map(plan => ({
        ...plan,
        startDate: plan.start_date.toISOString(),
        endValue: plan.end_value ? JSON.parse(plan.end_value) : undefined,
        lastRunAt: plan.last_run_at?.toISOString(),
        nextRunAt: plan.next_run_at.toISOString(),
      }));
    } catch (error) {
      logError('Error getting due DCA plans', error as Error);
      return [];
    }
  }
}
