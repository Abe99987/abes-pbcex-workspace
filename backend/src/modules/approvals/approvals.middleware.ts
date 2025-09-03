import { Request, Response, NextFunction } from 'express';
import { ApprovalsService } from './approvals.service';
import { createError } from '@/middlewares/errorMiddleware';
import { logInfo, logError } from '@/utils/logger';

/**
 * Dual-approval middleware for sensitive operations
 */
export function requireApproval(resourceType: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createError.authentication('User not authenticated');
      }

      // Check if approval is required for this operation
      if (!ApprovalsService.requiresApproval(resourceType, action)) {
        // No approval required, continue
        return next();
      }

      // Check for existing approval ID in request
      const approvalId = req.body?.approval_id || req.query?.approval_id;

      if (!approvalId) {
        // No approval ID provided, create approval request
        const requestId = await ApprovalsService.createRequest(
          action,
          {
            type: resourceType,
            id: req.params.id || req.body?.id || 'unknown',
            name: req.body?.name || req.params.name,
          },
          {
            userId: req.user.id,
            email: req.user.email,
            roles: req.user.roles || [],
          },
          {
            method: req.method,
            path: req.path,
            body: req.body,
            params: req.params,
            query: req.query,
          }
        );

        return res.status(202).json({
          code: 'APPROVAL_REQUIRED',
          message: 'Operation requires approval',
          data: {
            approvalId: requestId,
            status: 'pending',
            message: `${resourceType}:${action} requires approval before execution`,
            requiredRole: ApprovalsService.getApprovalRule(resourceType, action)?.requiredRole,
            requiresStepUp: ApprovalsService.getApprovalRule(resourceType, action)?.requiresStepUp,
          },
        });
      }

      // Approval ID provided, verify approval
      const approval = ApprovalsService.getRequest(approvalId as string);
      
      if (!approval) {
        throw createError.notFound('Approval request not found');
      }

      if (approval.status !== 'approved') {
        return res.status(403).json({
          code: 'APPROVAL_PENDING',
          message: `Approval is ${approval.status}`,
          data: {
            approvalId,
            status: approval.status,
            reason: approval.reason,
            processedAt: approval.processedAt?.toISOString(),
          },
        });
      }

      // Verify approval matches the current request
      if (approval.resource.type !== resourceType || approval.action !== action) {
        throw createError.validation('Approval does not match current operation');
      }

      if (approval.requester.userId !== req.user.id) {
        throw createError.authorization('Approval was not requested by current user');
      }

      // Approval is valid, store in request context and continue
      (req as any).approvalContext = {
        approvalId,
        approval,
        approver: approval.approver,
      };

      logInfo('Operation approved, continuing execution', {
        userId: req.user.id,
        approvalId,
        approver: approval.approver?.userId,
        resource: `${resourceType}:${approval.resource.id}`,
        action,
      });

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Step-up authentication middleware (used before dual approval)
 */
export function requireStepUpForApproval(resourceType: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createError.authentication('User not authenticated');
      }

      const rule = ApprovalsService.getApprovalRule(resourceType, action);
      if (!rule?.requiresStepUp) {
        // No step-up required
        return next();
      }

      const stepUpId = req.body?.step_up_id || req.headers['x-step-up-id'];

      if (!stepUpId) {
        // Step-up not initiated, require it
        const { AuthService } = await import('@/modules/auth');
        const stepUpSessionId = await AuthService.initiateStepUp({
          userId: req.user.id,
          action,
          resource: resourceType,
          timestamp: new Date(),
          deviceId: req.headers['x-device-id'] as string,
          ipAddress: req.ip,
        });

        return res.status(202).json({
          code: 'STEP_UP_REQUIRED',
          message: 'Step-up authentication required',
          data: {
            stepUpId: stepUpSessionId,
            expiresIn: 300, // 5 minutes
            requiredMethod: 'passkey',
          },
        });
      }

      // Verify step-up
      const { AuthService } = await import('@/modules/auth');
      const stepUpValid = await AuthService.verifyStepUp(stepUpId as string, req.user.id);

      if (!stepUpValid) {
        throw createError.authorization('Step-up authentication invalid or expired');
      }

      // Store step-up context
      (req as any).stepUpContext = {
        stepUpId,
        userId: req.user.id,
        verifiedAt: new Date(),
      };

      logInfo('Step-up authentication verified', {
        userId: req.user.id,
        stepUpId,
        resource: resourceType,
        action,
      });

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Combined middleware for operations requiring both step-up and dual approval
 */
export function requireStepUpAndApproval(resourceType: string, action: string) {
  return [
    requireStepUpForApproval(resourceType, action),
    requireApproval(resourceType, action),
  ];
}

/**
 * Check if user can approve specific request middleware
 */
export function requireApproverRole(resourceType: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createError.authentication('User not authenticated');
      }

      if (!ApprovalsService.canApprove(req.user.roles || [], resourceType, action)) {
        const rule = ApprovalsService.getApprovalRule(resourceType, action);
        throw createError.authorization(
          `Insufficient role to approve ${resourceType}:${action}. Required: ${rule?.requiredRole}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
