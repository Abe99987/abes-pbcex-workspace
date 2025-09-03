import { Request, Response, NextFunction } from 'express';
import { RbacService, AdminRole, UserAttributes, PolicyResult } from './rbac.service';
import { createError } from '@/middlewares/errorMiddleware';
import { logError, logInfo } from '@/utils/logger';

// Extend Express Request interface to include RBAC context
declare module 'express' {
  interface Request {
    rbacContext?: {
      resource: string;
      action: string;
      policyResult: PolicyResult;
    };
  }
}

/**
 * Require specific admin role middleware
 */
export function requireRole(role: AdminRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createError.authentication('User not authenticated');
      }

      if (!RbacService.hasRole(req.user.roles || [req.user.role], role)) {
        logError('RBAC: Role check failed', {
          userId: req.user.id,
          userRoles: req.user.roles,
          requiredRole: role,
          resource: req.path,
        });

        throw createError.authorization(
          `Access denied: requires ${role} role`
        );
      }

      logInfo('RBAC: Role check passed', {
        userId: req.user.id,
        role,
        resource: req.path,
      });

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Require specific permission middleware
 */
export function requirePermission(resource: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createError.authentication('User not authenticated');
      }

      if (!RbacService.hasPermission(req.user.roles || [req.user.role], resource, action)) {
        logError('RBAC: Permission check failed', {
          userId: req.user.id,
          userRoles: req.user.roles,
          resource,
          action,
          path: req.path,
        });

        throw createError.authorization(
          `Access denied: requires ${resource}:${action} permission`
        );
      }

      logInfo('RBAC: Permission check passed', {
        userId: req.user.id,
        resource,
        action,
        path: req.path,
      });

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Full ABAC policy evaluation middleware (deny by default)
 */
export function requirePolicy(resource: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createError.authentication('User not authenticated');
      }

      // Extract user attributes from user object
      const userAttributes: UserAttributes = {
        org_id: req.user.attributes?.org_id || 'unknown',
        region: req.user.attributes?.region,
        branch_id: req.user.attributes?.branch_id,
        risk_level: req.user.attributes?.risk_level || 'high',
        clearance_level: req.user.attributes?.clearance_level || 'l1',
        access_scope: req.user.attributes?.access_scope || 'self',
      };

      // Extract resource context from request (params, body, query)
      const resourceContext = {
        ...req.params,
        ...req.query,
        org_id: req.body?.org_id,
        branch_id: req.body?.branch_id,
        region: req.body?.region,
      };

      // Evaluate ABAC policy (DENY BY DEFAULT)
      const policyResult = RbacService.evaluatePolicy(
        req.user.roles || [req.user.role],
        userAttributes,
        resource,
        action,
        resourceContext
      );

      if (!policyResult.allowed) {
        logError('RBAC: Policy evaluation DENIED', {
          userId: req.user.id,
          userRoles: req.user.roles,
          userAttributes,
          resource,
          action,
          reason: policyResult.reason,
          path: req.path,
          denyByDefault: policyResult.denyByDefault,
        });

        // Return detailed error for debugging in development
        if (process.env.NODE_ENV === 'development') {
          throw createError.authorization(
            `Access denied: ${policyResult.reason}. Required: ${policyResult.requiredAttributes?.join(', ') || 'N/A'}`
          );
        } else {
          throw createError.authorization('Access denied');
        }
      }

      // Store policy result in request context for audit logging
      req.rbacContext = {
        resource,
        action,
        policyResult,
      };

      logInfo('RBAC: Policy evaluation ALLOWED', {
        userId: req.user.id,
        resource,
        action,
        reason: policyResult.reason,
        path: req.path,
      });

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Require specific clearance level
 */
export function requireClearance(level: 'l1' | 'l2' | 'l3' | 'l4') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createError.authentication('User not authenticated');
      }

      const userClearance = req.user.attributes?.clearance_level || 'l1';
      const levelOrder: Record<string, number> = { 'l1': 1, 'l2': 2, 'l3': 3, 'l4': 4 };

      if ((levelOrder[userClearance] ?? 1) < (levelOrder[level] ?? 4)) {
        logError('RBAC: Clearance check failed', {
          userId: req.user.id,
          userClearance,
          requiredClearance: level,
          path: req.path,
        });

        throw createError.authorization(
          `Access denied: requires ${level} clearance level`
        );
      }

      logInfo('RBAC: Clearance check passed', {
        userId: req.user.id,
        clearanceLevel: level,
        path: req.path,
      });

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Scope access to user's organization only
 */
export function requireOrgScope(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw createError.authentication('User not authenticated');
    }

    const userOrgId = req.user.attributes?.org_id;
    const resourceOrgId = req.params.org_id || req.body?.org_id || req.query.org_id;

    if (!userOrgId) {
      throw createError.authorization('User organization not specified');
    }

    if (resourceOrgId && resourceOrgId !== userOrgId) {
      // Allow super admins to access any organization
      if (!RbacService.hasRole(req.user.roles || [req.user.role], AdminRole.SUPER_ADMIN)) {
        logError('RBAC: Organization scope check failed', {
          userId: req.user.id,
          userOrgId,
          resourceOrgId,
          path: req.path,
        });

        throw createError.authorization('Access denied: organization scope restriction');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Investor view redaction middleware
 * Removes sensitive fields from responses for investor-only users
 */
export function applyInvestorRedaction(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !(req.user.roles || [req.user.role]).includes(AdminRole.INVESTOR_VIEW)) {
    return next();
  }

  // Store original json method
  const originalJson = res.json;

  // Override json method to apply redaction
  res.json = function(data: any) {
    const redactedData = applyDataRedaction(data);
    return originalJson.call(this, redactedData);
  };

  next();
}

/**
 * Apply data redaction for investor view
 */
function applyDataRedaction(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(applyDataRedaction);
  }

  const redacted = { ...data };
  
  // Remove sensitive fields for investor view
  const sensitiveFields = [
    'email',
    'phone',
    'address',
    'ssn',
    'account_number',
    'routing_number',
    'device_id',
    'ip_address',
    'user_agent',
    'detailed_breakdown',
    'individual_amounts',
    'transaction_details',
  ];

  sensitiveFields.forEach(field => {
    if (field in redacted) {
      redacted[field] = '[REDACTED]';
    }
  });

  // Recursively apply redaction to nested objects
  Object.keys(redacted).forEach(key => {
    if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = applyDataRedaction(redacted[key]);
    }
  });

  return redacted;
}
