import { Request, Response } from 'express';
import { asyncHandler, asyncHandlerAuth } from '@/utils/asyncHandler';
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
import { RecurringService } from '@/services/RecurringService';
import { ValidationService } from '@/services/ValidationService';
import { AuditService } from '@/services/AuditService';
import { recurringRuleSchema } from '@/models/MoneyMovement';

export class RecurringController {
  /**
   * Create recurring rule
   * POST /api/recurring/rules
   */
  static createRecurringRule = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const validation = recurringRuleSchema.safeParse(req.body);

        if (!validation.success) {
          throw createError.validation(
            'Invalid request body',
            validation.error.errors
          );
        }

        const ruleData = validation.data;

        // Validate recurring rule data
        const validationResult = ValidationService.validateRecurringRule(
          ruleData.kind,
          ruleData.sourceAccountId,
          ruleData.destinationRef,
          ruleData.assetOrCurrency,
          ruleData.amount,
          ruleData.frequency,
          new Date(ruleData.startAt),
          ruleData.endAt ? new Date(ruleData.endAt) : undefined
        );

        if (!validationResult.valid) {
          throw createError.validation(
            (validationResult as any).message ||
              'Recurring rule validation failed'
          );
        }

        // Create the recurring rule
        const recurringRule = await RecurringService.createRecurringRule(
          userId,
          ruleData
        );

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'recurring_rule_created',
          resourceType: 'recurring_rule',
          resourceId: recurringRule.ruleId,
          changes: {
            kind: ruleData.kind,
            sourceAccountId: ruleData.sourceAccountId,
            destinationRef: ruleData.destinationRef,
            assetOrCurrency: ruleData.assetOrCurrency,
            amount: ruleData.amount,
            frequency: ruleData.frequency,
            startAt: ruleData.startAt,
            endAt: ruleData.endAt,
            onFailure: ruleData.onFailure,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('Recurring rule created', {
          userId,
          ruleId: recurringRule.ruleId,
          kind: ruleData.kind,
          frequency: ruleData.frequency,
          amount: ruleData.amount,
        });

        res.status(201).json({
          success: true,
          data: recurringRule,
        });
      } catch (error) {
        logError('Failed to create recurring rule', {
          error: error as Error,
          userId: req.user?.id,
          body: req.body,
        });
        throw error;
      }
    }
  );

  /**
   * Get recurring rule
   * GET /api/recurring/rules/:id
   */
  static getRecurringRule = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const ruleId = req.params.id;

        if (!ruleId) {
          throw createError.validation('Rule ID is required');
        }

        const recurringRule = await RecurringService.getRecurringRule(
          ruleId,
          userId
        );

        if (!recurringRule) {
          throw createError.notFound('Recurring rule not found');
        }

        res.json({
          success: true,
          data: recurringRule,
        });
      } catch (error) {
        logError('Failed to get recurring rule', {
          error: error as Error,
          userId: req.user?.id,
          ruleId: req.params.id,
        });
        throw error;
      }
    }
  );

  /**
   * Get user's recurring rules
   * GET /api/recurring/rules
   */
  static getRecurringRules = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const kind = req.query.kind as string; // 'internal' | 'payment_link' | 'bank_swift'
        const enabled = req.query.enabled as string; // 'true' | 'false'

        // TODO: Implement recurring rules list retrieval
        // This would query the recurring_rules table for the user's rules
        const rules = {
          rules: [],
          total: 0,
          limit,
          offset,
        };

        res.json({
          success: true,
          data: rules,
        });
      } catch (error) {
        logError('Failed to get recurring rules', {
          error: error as Error,
          userId: req.user?.id,
          query: req.query,
        });
        throw error;
      }
    }
  );

  /**
   * Update recurring rule
   * PUT /api/recurring/rules/:id
   */
  static updateRecurringRule = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const ruleId = req.params.id;
        const updates = req.body;

        if (!ruleId) {
          throw createError.validation('Rule ID is required');
        }

        // Validate updates if provided
        if (
          updates.amount ||
          updates.frequency ||
          updates.startAt ||
          updates.endAt
        ) {
          const validationResult = ValidationService.validateRecurringRule(
            updates.kind || 'internal', // Use existing kind if not provided
            updates.sourceAccountId || 'temp', // Use existing source if not provided
            updates.destinationRef || {}, // Use existing destination if not provided
            updates.assetOrCurrency || 'USD', // Use existing asset if not provided
            updates.amount || '100', // Use existing amount if not provided
            updates.frequency || 'monthly', // Use existing frequency if not provided
            updates.startAt || new Date(), // Use existing start if not provided
            updates.endAt
          );

          if (!validationResult.valid) {
            throw createError.validation(
              (validationResult as any).message ||
                'Recurring rule validation failed'
            );
          }
        }

        // Update the recurring rule
        const updatedRule = await RecurringService.updateRecurringRule(
          ruleId,
          userId,
          updates
        );

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'recurring_rule_updated',
          resourceType: 'recurring_rule',
          resourceId: ruleId,
          changes: updates,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('Recurring rule updated', {
          userId,
          ruleId,
          updates: Object.keys(updates),
        });

        res.json({
          success: true,
          data: updatedRule,
        });
      } catch (error) {
        logError('Failed to update recurring rule', {
          error: error as Error,
          userId: req.user?.id,
          ruleId: req.params.id,
          body: req.body,
        });
        throw error;
      }
    }
  );

  /**
   * Duplicate recurring rule
   * POST /api/recurring/rules/:id/duplicate
   */
  static duplicateRecurringRule = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const ruleId = req.params.id;

        if (!ruleId) {
          throw createError.validation('Rule ID is required');
        }

        // Duplicate the recurring rule
        const duplicatedRule = await RecurringService.duplicateRecurringRule(
          ruleId,
          userId
        );

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'recurring_rule_duplicated',
          resourceType: 'recurring_rule',
          resourceId: duplicatedRule.ruleId,
          changes: {
            duplicatedFrom: ruleId,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('Recurring rule duplicated', {
          userId,
          originalRuleId: ruleId,
          newRuleId: duplicatedRule.ruleId,
        });

        res.status(201).json({
          success: true,
          data: duplicatedRule,
        });
      } catch (error) {
        logError('Failed to duplicate recurring rule', {
          error: error as Error,
          userId: req.user?.id,
          ruleId: req.params.id,
        });
        throw error;
      }
    }
  );

  /**
   * Delete recurring rule
   * DELETE /api/recurring/rules/:id
   */
  static deleteRecurringRule = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const ruleId = req.params.id;

        if (!ruleId) {
          throw createError.validation('Rule ID is required');
        }

        // Delete the recurring rule
        const deleted = await RecurringService.deleteRecurringRule(
          ruleId,
          userId
        );

        if (!deleted) {
          throw createError.validation(
            'Recurring rule cannot be deleted or not found'
          );
        }

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'recurring_rule_deleted',
          resourceType: 'recurring_rule',
          resourceId: ruleId,
          changes: {
            deleted: true,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('Recurring rule deleted', {
          userId,
          ruleId,
        });

        res.json({
          success: true,
          data: {
            ruleId,
            deleted: true,
          },
        });
      } catch (error) {
        logError('Failed to delete recurring rule', {
          error: error as Error,
          userId: req.user?.id,
          ruleId: req.params.id,
        });
        throw error;
      }
    }
  );

  /**
   * Enable/disable recurring rule
   * POST /api/recurring/rules/:id/toggle
   */
  static toggleRecurringRule = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const ruleId = req.params.id;
        const { enabled } = req.body;

        if (!ruleId) {
          throw createError.validation('Rule ID is required');
        }

        if (typeof enabled !== 'boolean') {
          throw createError.validation(
            'Enabled flag is required and must be boolean'
          );
        }

        // Update the recurring rule enabled status
        const updatedRule = await RecurringService.updateRecurringRule(
          ruleId,
          userId,
          { enabled }
        );

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: enabled
            ? 'recurring_rule_enabled'
            : 'recurring_rule_disabled',
          resourceType: 'recurring_rule',
          resourceId: ruleId,
          changes: {
            enabled,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('Recurring rule toggled', {
          userId,
          ruleId,
          enabled,
        });

        res.json({
          success: true,
          data: updatedRule,
        });
      } catch (error) {
        logError('Failed to toggle recurring rule', {
          error: error as Error,
          userId: req.user?.id,
          ruleId: req.params.id,
          body: req.body,
        });
        throw error;
      }
    }
  );

  /**
   * Get recurring rule execution history
   * GET /api/recurring/rules/:id/history
   */
  static getRecurringRuleHistory = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const ruleId = req.params.id;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        if (!ruleId) {
          throw createError.validation('Rule ID is required');
        }

        // TODO: Implement recurring rule execution history
        // This would query the execution history for the specific rule
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
        logError('Failed to get recurring rule history', {
          error: error as Error,
          userId: req.user?.id,
          ruleId: req.params.id,
          query: req.query,
        });
        throw error;
      }
    }
  );

  /**
   * Get recurring rules statistics
   * GET /api/recurring/rules/stats
   */
  static getRecurringRulesStats = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;

        // TODO: Implement recurring rules statistics
        // This would provide counts and totals of recurring rules
        const stats = {
          totalRules: 0,
          activeRules: 0,
          pausedRules: 0,
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
          totalAmount: '0',
          nextExecution: null,
        };

        res.json({
          success: true,
          data: stats,
        });
      } catch (error) {
        logError('Failed to get recurring rules stats', {
          error: error as Error,
          userId: req.user?.id,
        });
        throw error;
      }
    }
  );
}

// Export middleware chains for routes
export const recurringMiddleware = {
  // Write operations (create, update, delete, duplicate, toggle)
  write: [
    requireAuth,
    requireMoneyMovement,
    requireFeature('moneyMovement.recurringTransfers'),
    rateLimitMiddleware.moderate,
    idempotencyMiddleware,
  ],

  // Read operations (get rule, list rules, history, stats)
  read: [
    requireAuth,
    requireMoneyMovement,
    requireFeature('moneyMovement.recurringTransfers'),
    rateLimitMiddleware.moderate,
  ],
};
