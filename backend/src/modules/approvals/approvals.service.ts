import { logInfo, logError } from '@/utils/logger';
import { createError } from '@/middlewares/errorMiddleware';

export interface ApprovalRequest {
  id: string;
  action: string;
  resource: {
    type: string;
    id: string;
    name?: string;
  };
  requester: {
    userId: string;
    email: string;
    roles: string[];
  };
  approver?: {
    userId: string;
    email: string;
    roles: string[];
  };
  status: 'pending' | 'approved' | 'denied' | 'expired';
  reason?: string;
  requestData: Record<string, any>;
  stepUpId?: string;
  createdAt: Date;
  expiresAt: Date;
  processedAt?: Date;
  auditTrail: ApprovalAuditEntry[];
}

export interface ApprovalAuditEntry {
  timestamp: Date;
  action: 'created' | 'approved' | 'denied' | 'expired' | 'step_up_initiated' | 'step_up_verified';
  userId: string;
  details?: Record<string, any>;
}

export interface ApprovalRule {
  resourceType: string;
  action: string;
  requiredRole: string;
  requiresStepUp: boolean;
  timeoutMs: number;
  description: string;
}

/**
 * Admin Terminal Approvals Service
 * Manages dual-approval workflows with step-up authentication
 */
export class ApprovalsService {
  private static approvalRequests = new Map<string, ApprovalRequest>();
  private static currentRequestId = 0;

  // Approval rules configuration
  private static readonly APPROVAL_RULES: ApprovalRule[] = [
    {
      resourceType: 'hedging',
      action: 'write',
      requiredRole: 'admin',
      requiresStepUp: true,
      timeoutMs: 3600000, // 1 hour
      description: 'Hedging configuration changes require admin approval with step-up',
    },
    {
      resourceType: 'reserves',
      action: 'write',
      requiredRole: 'super_admin',
      requiresStepUp: true,
      timeoutMs: 1800000, // 30 minutes
      description: 'Reserve and IOU rules changes require super admin approval with step-up',
    },
    {
      resourceType: 'governance',
      action: 'write',
      requiredRole: 'super_admin',
      requiresStepUp: true,
      timeoutMs: 1800000, // 30 minutes
      description: 'Governance toggles require super admin approval with step-up',
    },
    {
      resourceType: 'cases',
      action: 'reimbursement',
      requiredRole: 'admin',
      requiresStepUp: false,
      timeoutMs: 7200000, // 2 hours
      description: 'Case reimbursements require admin approval',
    },
  ];

  /**
   * Create approval request
   */
  static async createRequest(
    action: string,
    resource: ApprovalRequest['resource'],
    requester: ApprovalRequest['requester'],
    requestData: Record<string, any>
  ): Promise<string> {
    try {
      const rule = ApprovalsService.findApprovalRule(resource.type, action);
      if (!rule) {
        throw createError.validation(`No approval rule found for ${resource.type}:${action}`);
      }

      ApprovalsService.currentRequestId++;
      const requestId = `approval_${Date.now()}_${ApprovalsService.currentRequestId}`;

      const now = new Date();
      const expiresAt = new Date(now.getTime() + rule.timeoutMs);

      const approvalRequest: ApprovalRequest = {
        id: requestId,
        action,
        resource,
        requester,
        status: 'pending',
        requestData,
        createdAt: now,
        expiresAt,
        auditTrail: [
          {
            timestamp: now,
            action: 'created',
            userId: requester.userId,
            details: {
              rule: rule.description,
              requiresStepUp: rule.requiresStepUp,
              timeoutMs: rule.timeoutMs,
            },
          },
        ],
      };

      ApprovalsService.approvalRequests.set(requestId, approvalRequest);

      // Auto-expire after timeout
      setTimeout(() => {
        ApprovalsService.expireRequest(requestId).catch(error => {
          logError('Failed to auto-expire approval request', error);
        });
      }, rule.timeoutMs);

      logInfo('Approval request created', {
        requestId,
        action,
        resource: `${resource.type}:${resource.id}`,
        requester: requester.userId,
        expiresAt: expiresAt.toISOString(),
      });

      return requestId;
    } catch (error) {
      logError('Failed to create approval request', error as Error);
      throw error;
    }
  }

  /**
   * Approve request
   */
  static async approveRequest(
    requestId: string,
    approver: ApprovalRequest['approver'],
    reason?: string,
    stepUpId?: string
  ): Promise<void> {
    try {
      const request = ApprovalsService.approvalRequests.get(requestId);
      if (!request) {
        throw createError.notFound('Approval request not found');
      }

      if (request.status !== 'pending') {
        throw createError.validation(`Request is ${request.status}, cannot approve`);
      }

      if (new Date() > request.expiresAt) {
        request.status = 'expired';
        throw createError.validation('Approval request has expired');
      }

      // Check if approver has required role
      const rule = ApprovalsService.findApprovalRule(request.resource.type, request.action);
      if (!rule) {
        throw createError.validation('Approval rule not found');
      }

      if (!approver?.roles.includes(rule.requiredRole) && !approver?.roles.includes('super_admin')) {
        throw createError.authorization(`Approver lacks required role: ${rule.requiredRole}`);
      }

      // Step-up verification if required
      if (rule.requiresStepUp && stepUpId) {
        const { AuthService } = await import('@/modules/auth');
        const stepUpValid = await AuthService.verifyStepUp(stepUpId, approver.userId);
        if (!stepUpValid) {
          throw createError.authorization('Step-up authentication required');
        }

        // Clear step-up session after verification
        AuthService.clearStepUp(stepUpId);

        request.auditTrail.push({
          timestamp: new Date(),
          action: 'step_up_verified',
          userId: approver.userId,
          details: { stepUpId },
        });
      } else if (rule.requiresStepUp) {
        throw createError.authorization('Step-up authentication required');
      }

      // Approve the request
      request.status = 'approved';
      request.approver = approver;
      request.reason = reason;
      request.processedAt = new Date();

      request.auditTrail.push({
        timestamp: new Date(),
        action: 'approved',
        userId: approver.userId,
        details: {
          reason,
          stepUpId,
          approverRoles: approver.roles,
        },
      });

      logInfo('Approval request approved', {
        requestId,
        action: request.action,
        resource: `${request.resource.type}:${request.resource.id}`,
        approver: approver.userId,
        reason,
      });
    } catch (error) {
      logError('Failed to approve request', error as Error);
      throw error;
    }
  }

  /**
   * Deny request
   */
  static async denyRequest(
    requestId: string,
    approver: ApprovalRequest['approver'],
    reason: string
  ): Promise<void> {
    try {
      const request = ApprovalsService.approvalRequests.get(requestId);
      if (!request) {
        throw createError.notFound('Approval request not found');
      }

      if (request.status !== 'pending') {
        throw createError.validation(`Request is ${request.status}, cannot deny`);
      }

      // Check if approver has required role
      const rule = ApprovalsService.findApprovalRule(request.resource.type, request.action);
      if (!rule) {
        throw createError.validation('Approval rule not found');
      }

      if (!approver?.roles.includes(rule.requiredRole) && !approver?.roles.includes('super_admin')) {
        throw createError.authorization(`Approver lacks required role: ${rule.requiredRole}`);
      }

      // Deny the request
      request.status = 'denied';
      request.approver = approver;
      request.reason = reason;
      request.processedAt = new Date();

      request.auditTrail.push({
        timestamp: new Date(),
        action: 'denied',
        userId: approver.userId,
        details: {
          reason,
          approverRoles: approver.roles,
        },
      });

      logInfo('Approval request denied', {
        requestId,
        action: request.action,
        resource: `${request.resource.type}:${request.resource.id}`,
        approver: approver.userId,
        reason,
      });
    } catch (error) {
      logError('Failed to deny request', error as Error);
      throw error;
    }
  }

  /**
   * Get approval request
   */
  static getRequest(requestId: string): ApprovalRequest | undefined {
    return ApprovalsService.approvalRequests.get(requestId);
  }

  /**
   * List approval requests with filters
   */
  static listRequests(filters: {
    status?: ApprovalRequest['status'];
    requesterUserId?: string;
    resourceType?: string;
    limit?: number;
    offset?: number;
  } = {}): ApprovalRequest[] {
    let requests = Array.from(ApprovalsService.approvalRequests.values());

    // Apply filters
    if (filters.status) {
      requests = requests.filter(r => r.status === filters.status);
    }

    if (filters.requesterUserId) {
      requests = requests.filter(r => r.requester.userId === filters.requesterUserId);
    }

    if (filters.resourceType) {
      requests = requests.filter(r => r.resource.type === filters.resourceType);
    }

    // Sort by creation date (newest first)
    requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;

    return requests.slice(offset, offset + limit);
  }

  /**
   * Check if approval is required for action
   */
  static requiresApproval(resourceType: string, action: string): boolean {
    return !!ApprovalsService.findApprovalRule(resourceType, action);
  }

  /**
   * Get approval rule for resource type and action
   */
  static getApprovalRule(resourceType: string, action: string): ApprovalRule | undefined {
    return ApprovalsService.findApprovalRule(resourceType, action);
  }

  /**
   * Check if user can approve for given resource type and action
   */
  static canApprove(userRoles: string[], resourceType: string, action: string): boolean {
    const rule = ApprovalsService.findApprovalRule(resourceType, action);
    if (!rule) return false;

    return userRoles.includes(rule.requiredRole) || userRoles.includes('super_admin');
  }

  /**
   * Get pending requests for approver
   */
  static getPendingRequestsForApprover(approverRoles: string[]): ApprovalRequest[] {
    return Array.from(ApprovalsService.approvalRequests.values())
      .filter(request => {
        if (request.status !== 'pending') return false;
        if (new Date() > request.expiresAt) return false;

        const rule = ApprovalsService.findApprovalRule(request.resource.type, request.action);
        if (!rule) return false;

        return approverRoles.includes(rule.requiredRole) || approverRoles.includes('super_admin');
      })
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /**
   * Cleanup expired requests
   */
  static cleanupExpiredRequests(): number {
    const now = new Date();
    let cleaned = 0;

    for (const [requestId, request] of ApprovalsService.approvalRequests.entries()) {
      if (request.status === 'pending' && now > request.expiresAt) {
        request.status = 'expired';
        request.processedAt = now;
        request.auditTrail.push({
          timestamp: now,
          action: 'expired',
          userId: 'system',
          details: { reason: 'Automatic expiration due to timeout' },
        });
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logInfo('Cleaned up expired approval requests', { count: cleaned });
    }

    return cleaned;
  }

  /**
   * Find approval rule
   */
  private static findApprovalRule(resourceType: string, action: string): ApprovalRule | undefined {
    return ApprovalsService.APPROVAL_RULES.find(
      rule => rule.resourceType === resourceType && rule.action === action
    );
  }

  /**
   * Expire a specific request
   */
  private static async expireRequest(requestId: string): Promise<void> {
    const request = ApprovalsService.approvalRequests.get(requestId);
    if (request && request.status === 'pending') {
      request.status = 'expired';
      request.processedAt = new Date();
      request.auditTrail.push({
        timestamp: new Date(),
        action: 'expired',
        userId: 'system',
        details: { reason: 'Automatic expiration due to timeout' },
      });

      logInfo('Approval request expired', {
        requestId,
        action: request.action,
        resource: `${request.resource.type}:${request.resource.id}`,
      });
    }
  }

  /**
   * Clear all requests (testing only)
   */
  static clearRequests(): void {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Clear requests only allowed in test environment');
    }
    ApprovalsService.approvalRequests.clear();
    ApprovalsService.currentRequestId = 0;
  }
}
