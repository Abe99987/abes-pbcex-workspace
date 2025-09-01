import { db } from '@/db';
import { logInfo, logError } from '@/utils/logger';
import { createError } from '@/middlewares/errorMiddleware';
import { ValidationService } from './ValidationService';
import { OutboxService } from './OutboxService';
import { AuditService } from './AuditService';
import { MoneyMovementUtils } from '@/models/MoneyMovement';
import { v4 as uuidv4 } from 'uuid';

export interface RecurringRuleCreateRequest {
  kind: 'internal' | 'payment_link' | 'bank_swift';
  sourceAccountId: string;
  destinationRef: Record<string, any>;
  assetOrCurrency: string;
  amount: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom_cron';
  startAt: string;
  endAt?: string;
  onFailure: 'skip' | 'retry';
}

export interface RecurringRuleResponse {
  ruleId: string;
  status: 'active' | 'paused' | 'ended';
  nextRunAt?: string;
  createdAt: string;
}

export interface RecurringRuleDetails {
  id: string;
  kind: 'internal' | 'payment_link' | 'bank_swift';
  sourceAccountId: string;
  destinationRef: Record<string, any>;
  assetOrCurrency: string;
  amount: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom_cron';
  startAt: string;
  endAt?: string;
  onFailure: 'skip' | 'retry';
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  status: 'active' | 'paused' | 'ended';
  createdAt: string;
  updatedAt: string;
}

export class RecurringService {
  /**
   * Create recurring rule
   */
  static async createRecurringRule(
    userId: string,
    request: RecurringRuleCreateRequest
  ): Promise<RecurringRuleResponse> {
    try {
      // Validate request
      const validation = ValidationService.validateRecurringRule(
        request.kind,
        request.sourceAccountId,
        request.destinationRef,
        request.assetOrCurrency,
        request.amount,
        request.frequency,
        new Date(request.startAt),
        request.endAt ? new Date(request.endAt) : undefined
      );
      ValidationService.throwIfInvalid(
        validation,
        'Recurring rule validation failed'
      );

      // Generate rule ID
      const ruleId = uuidv4();

      // Calculate next run time
      const startAt = new Date(request.startAt);
      const nextRunAt = RecurringService.calculateNextRunAt(
        request.frequency,
        startAt
      );

      // Create recurring rule record
      const query = `
        INSERT INTO recurring_rules (
          id, user_id, kind, source_account_id, destination_ref, asset_or_currency,
          amount, frequency, start_at, end_at, on_failure, enabled, next_run_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, enabled, next_run_at, created_at
      `;

      const result = await db.query(query, [
        ruleId,
        userId,
        request.kind,
        request.sourceAccountId,
        JSON.stringify(request.destinationRef),
        request.assetOrCurrency.toUpperCase(),
        request.amount,
        request.frequency,
        startAt,
        request.endAt ? new Date(request.endAt) : null,
        request.onFailure,
        true,
        nextRunAt,
      ]);

      const recurringRule = result.rows[0];

      // Emit domain event
      await OutboxService.emitEvent('recurring_rule.created', {
        ruleId: recurringRule.id,
        userId,
        kind: request.kind,
        assetOrCurrency: request.assetOrCurrency.toUpperCase(),
        amount: request.amount,
        frequency: request.frequency,
        startAt: startAt.toISOString(),
        endAt: request.endAt,
        nextRunAt: nextRunAt.toISOString(),
      });

      // Audit log
      await AuditService.logOperation({
        userId,
        operation: 'recurring_rule_created',
        resourceType: 'recurring_rule',
        resourceId: recurringRule.id,
        changes: {
          kind: request.kind,
          sourceAccountId: request.sourceAccountId,
          destinationRef: request.destinationRef,
          assetOrCurrency: request.assetOrCurrency.toUpperCase(),
          amount: request.amount,
          frequency: request.frequency,
          startAt: startAt.toISOString(),
          endAt: request.endAt,
          onFailure: request.onFailure,
        },
      });

      logInfo('Recurring rule created', {
        ruleId: recurringRule.id,
        userId,
        kind: request.kind,
        assetOrCurrency: request.assetOrCurrency.toUpperCase(),
        amount: request.amount,
        frequency: request.frequency,
        nextRunAt: nextRunAt.toISOString(),
      });

      return {
        ruleId: recurringRule.id,
        status: 'active',
        nextRunAt: nextRunAt.toISOString(),
        createdAt: recurringRule.created_at.toISOString(),
      };
    } catch (error) {
      logError('Error creating recurring rule', {
        error: error as Error,
        userId,
        kind: request.kind,
        assetOrCurrency: request.assetOrCurrency,
        amount: request.amount,
        frequency: request.frequency,
      });
      throw error;
    }
  }

  /**
   * Get recurring rule details
   */
  static async getRecurringRule(
    ruleId: string,
    userId: string
  ): Promise<RecurringRuleDetails> {
    try {
      const query = `
        SELECT 
          id, kind, source_account_id, destination_ref, asset_or_currency,
          amount, frequency, start_at, end_at, on_failure, enabled,
          last_run_at, next_run_at, created_at, updated_at
        FROM recurring_rules
        WHERE id = $1 AND user_id = $2
      `;

      const result = await db.query(query, [ruleId, userId]);

      if (result.rows.length === 0) {
        throw createError.notFound('Recurring rule not found');
      }

      const rule = result.rows[0];

      // Determine status based on enabled flag and dates
      let status: 'active' | 'paused' | 'ended' = 'active';
      if (!rule.enabled) {
        status = 'paused';
      } else if (rule.end_at && new Date() > rule.end_at) {
        status = 'ended';
      }

      return {
        id: rule.id,
        kind: rule.kind,
        sourceAccountId: rule.source_account_id,
        destinationRef: JSON.parse(rule.destination_ref),
        assetOrCurrency: rule.asset_or_currency,
        amount: rule.amount,
        frequency: rule.frequency,
        startAt: rule.start_at.toISOString(),
        endAt: rule.end_at?.toISOString(),
        onFailure: rule.on_failure,
        enabled: rule.enabled,
        lastRunAt: rule.last_run_at?.toISOString(),
        nextRunAt: rule.next_run_at?.toISOString(),
        status,
        createdAt: rule.created_at.toISOString(),
        updatedAt: rule.updated_at.toISOString(),
      };
    } catch (error) {
      logError('Error getting recurring rule', {
        error: error as Error,
        ruleId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get user's recurring rules
   */
  static async getUserRecurringRules(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const query = `
        SELECT 
          id, kind, source_account_id, destination_ref, asset_or_currency,
          amount, frequency, start_at, end_at, on_failure, enabled,
          last_run_at, next_run_at, created_at, updated_at
        FROM recurring_rules
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await db.query(query, [userId, limit, offset]);

      return result.rows.map(rule => {
        let status: 'active' | 'paused' | 'ended' = 'active';
        if (!rule.enabled) {
          status = 'paused';
        } else if (rule.end_at && new Date() > rule.end_at) {
          status = 'ended';
        }

        return {
          ...rule,
          destinationRef: JSON.parse(rule.destination_ref),
          startAt: rule.start_at.toISOString(),
          endAt: rule.end_at?.toISOString(),
          lastRunAt: rule.last_run_at?.toISOString(),
          nextRunAt: rule.next_run_at?.toISOString(),
          status,
        };
      });
    } catch (error) {
      logError('Error getting user recurring rules', {
        error: error as Error,
        userId,
      });
      return [];
    }
  }

  /**
   * Update recurring rule
   */
  static async updateRecurringRule(
    ruleId: string,
    userId: string,
    updates: Partial<RecurringRuleCreateRequest> & { enabled?: boolean }
  ): Promise<RecurringRuleResponse> {
    try {
      // Check if rule exists and belongs to user
      const existingRule = await RecurringService.getRecurringRule(
        ruleId,
        userId
      );

      // Build update query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (updates.kind !== undefined) {
        updateFields.push(`kind = $${paramIndex++}`);
        updateValues.push(updates.kind);
      }

      if (updates.sourceAccountId !== undefined) {
        updateFields.push(`source_account_id = $${paramIndex++}`);
        updateValues.push(updates.sourceAccountId);
      }

      if (updates.destinationRef !== undefined) {
        updateFields.push(`destination_ref = $${paramIndex++}`);
        updateValues.push(JSON.stringify(updates.destinationRef));
      }

      if (updates.assetOrCurrency !== undefined) {
        updateFields.push(`asset_or_currency = $${paramIndex++}`);
        updateValues.push(updates.assetOrCurrency.toUpperCase());
      }

      if (updates.amount !== undefined) {
        updateFields.push(`amount = $${paramIndex++}`);
        updateValues.push(updates.amount);
      }

      if (updates.frequency !== undefined) {
        updateFields.push(`frequency = $${paramIndex++}`);
        updateValues.push(updates.frequency);
      }

      if (updates.startAt !== undefined) {
        updateFields.push(`start_at = $${paramIndex++}`);
        updateValues.push(new Date(updates.startAt));
      }

      if (updates.endAt !== undefined) {
        updateFields.push(`end_at = $${paramIndex++}`);
        updateValues.push(updates.endAt ? new Date(updates.endAt) : null);
      }

      if (updates.onFailure !== undefined) {
        updateFields.push(`on_failure = $${paramIndex++}`);
        updateValues.push(updates.onFailure);
      }

      if (updates.enabled !== undefined) {
        updateFields.push(`enabled = $${paramIndex++}`);
        updateValues.push(updates.enabled);
      }

      // Recalculate next run time if frequency or start time changed
      if (updates.frequency !== undefined || updates.startAt !== undefined) {
        const newStartAt = updates.startAt
          ? new Date(updates.startAt)
          : new Date(existingRule.startAt);
        const newFrequency = updates.frequency || existingRule.frequency;
        const nextRunAt = RecurringService.calculateNextRunAt(
          newFrequency,
          newStartAt
        );

        updateFields.push(`next_run_at = $${paramIndex++}`);
        updateValues.push(nextRunAt);
      }

      if (updateFields.length === 0) {
        throw createError.validation('No valid fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(ruleId, userId);

      const query = `
        UPDATE recurring_rules
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
        RETURNING id, enabled, next_run_at, updated_at
      `;

      const result = await db.query(query, updateValues);

      if (result.rows.length === 0) {
        throw createError.notFound('Recurring rule not found');
      }

      const updatedRule = result.rows[0];

      // Emit domain event
      await OutboxService.emitEvent('recurring_rule.updated', {
        ruleId: updatedRule.id,
        userId,
        updates,
        nextRunAt: updatedRule.next_run_at?.toISOString(),
      });

      // Audit log
      await AuditService.logOperation({
        userId,
        operation: 'recurring_rule_updated',
        resourceType: 'recurring_rule',
        resourceId: updatedRule.id,
        changes: updates,
      });

      logInfo('Recurring rule updated', {
        ruleId: updatedRule.id,
        userId,
        updates,
      });

      return {
        ruleId: updatedRule.id,
        status: updatedRule.enabled ? 'active' : 'paused',
        nextRunAt: updatedRule.next_run_at?.toISOString(),
        createdAt: updatedRule.updated_at.toISOString(),
      };
    } catch (error) {
      logError('Error updating recurring rule', {
        error: error as Error,
        ruleId,
        userId,
        updates,
      });
      throw error;
    }
  }

  /**
   * Enable/disable recurring rule
   */
  static async toggleRecurringRule(
    ruleId: string,
    userId: string,
    enabled: boolean
  ): Promise<RecurringRuleResponse> {
    return RecurringService.updateRecurringRule(ruleId, userId, { enabled });
  }

  /**
   * Duplicate recurring rule
   */
  static async duplicateRecurringRule(
    ruleId: string,
    userId: string
  ): Promise<RecurringRuleResponse> {
    try {
      const existingRule = await RecurringService.getRecurringRule(
        ruleId,
        userId
      );

      // Create new rule with same parameters but new start time
      const newStartAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Start tomorrow
      const nextRunAt = RecurringService.calculateNextRunAt(
        existingRule.frequency,
        newStartAt
      );

      const request: RecurringRuleCreateRequest = {
        kind: existingRule.kind,
        sourceAccountId: existingRule.sourceAccountId,
        destinationRef: existingRule.destinationRef,
        assetOrCurrency: existingRule.assetOrCurrency,
        amount: existingRule.amount,
        frequency: existingRule.frequency,
        startAt: newStartAt.toISOString(),
        endAt: existingRule.endAt,
        onFailure: existingRule.onFailure,
      };

      return RecurringService.createRecurringRule(userId, request);
    } catch (error) {
      logError('Error duplicating recurring rule', {
        error: error as Error,
        ruleId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Delete recurring rule
   */
  static async deleteRecurringRule(
    ruleId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM recurring_rules
        WHERE id = $1 AND user_id = $2
      `;

      const result = await db.query(query, [ruleId, userId]);

      if (result.rowCount === 0) {
        throw createError.notFound('Recurring rule not found');
      }

      // Emit domain event
      await OutboxService.emitEvent('recurring_rule.deleted', {
        ruleId,
        userId,
      });

      // Audit log
      await AuditService.logOperation({
        userId,
        operation: 'recurring_rule_deleted',
        resourceType: 'recurring_rule',
        resourceId: ruleId,
        changes: { deleted: true },
      });

      logInfo('Recurring rule deleted', { ruleId, userId });
      return true;
    } catch (error) {
      logError('Error deleting recurring rule', {
        error: error as Error,
        ruleId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Calculate next run time based on frequency
   */
  static calculateNextRunAt(frequency: string, lastRunAt: Date): Date {
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

    return next;
  }

  /**
   * Get rules that are due to run
   */
  static async getDueRules(): Promise<any[]> {
    try {
      const query = `
        SELECT 
          id, user_id, kind, source_account_id, destination_ref, asset_or_currency,
          amount, frequency, start_at, end_at, on_failure, enabled,
          last_run_at, next_run_at
        FROM recurring_rules
        WHERE enabled = true
        AND next_run_at <= NOW()
        AND (end_at IS NULL OR end_at > NOW())
        ORDER BY next_run_at ASC
      `;

      const result = await db.query(query);

      return result.rows.map(rule => ({
        ...rule,
        destinationRef: JSON.parse(rule.destination_ref),
        startAt: rule.start_at.toISOString(),
        endAt: rule.end_at?.toISOString(),
        lastRunAt: rule.last_run_at?.toISOString(),
        nextRunAt: rule.next_run_at.toISOString(),
      }));
    } catch (error) {
      logError('Error getting due rules', error as Error);
      return [];
    }
  }
}
