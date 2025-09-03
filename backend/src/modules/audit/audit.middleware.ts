import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service';
import { logError, logInfo } from '@/utils/logger';

/**
 * Audit middleware for recording sensitive actions
 */
export function auditAction(
  action: string,
  resourceType: string,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store audit context in request for post-response logging
    const auditContext = {
      action,
      resourceType,
      severity,
      startTime: Date.now(),
      resourceId: req.params.id || req.body?.id || 'unknown',
      resourceName: req.body?.name || req.params.name,
    };

    (req as any).auditContext = auditContext;

    // Override res.end to capture response and log audit
    const originalEnd = res.end;
    
    res.end = function(this: Response, chunk?: any, encoding?: any, cb?: any) {
      // Determine outcome based on response status
      let outcome: 'success' | 'failure' | 'partial' = 'success';
      if (res.statusCode >= 500) {
        outcome = 'failure';
      } else if (res.statusCode >= 400) {
        outcome = 'failure';
      }

      // Create audit entry
      if (req.user) {
        AuditService.append(
          auditContext.action,
          {
            userId: req.user.id,
            email: req.user.email,
            roles: req.user.roles || [],
            ipAddress: req.ip,
            deviceId: req.headers['x-device-id'] as string,
          },
          {
            type: auditContext.resourceType,
            id: auditContext.resourceId,
            name: auditContext.resourceName,
          },
          {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: Date.now() - auditContext.startTime,
            userAgent: req.get('User-Agent'),
            requestSize: req.get('Content-Length'),
            responseSize: chunk ? Buffer.byteLength(chunk) : 0,
            rbacContext: req.rbacContext,
          },
          outcome,
          auditContext.severity
        ).catch(error => {
          logError('Failed to create audit entry', error);
        });
      } else {
        logError('Audit middleware: No authenticated user found', {
          action: auditContext.action,
          path: req.path,
        });
      }

      // Call original end
      return originalEnd.call(this, chunk, encoding, cb);
    };

    next();
  };
}

/**
 * High-level audit decorator for sensitive operations
 */
export function auditSensitiveAction(
  action: string,
  resourceType: string = 'admin_action'
) {
  return auditAction(action, resourceType, 'high');
}

/**
 * Critical audit decorator for governance and security operations
 */
export function auditCriticalAction(
  action: string,
  resourceType: string = 'governance'
) {
  return auditAction(action, resourceType, 'critical');
}

/**
 * Audit middleware specifically for dual-approval actions
 */
export function auditDualApproval(
  action: string,
  resourceType: string,
  approvalId?: string
) {
  return auditAction(
    `dual_approval:${action}`,
    resourceType,
    'critical'
  );
}

/**
 * Manual audit helper for programmatic audit entries
 */
export async function createAuditEntry(
  req: Request,
  action: string,
  resourceType: string,
  resourceId: string,
  details: Record<string, any> = {},
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<string | null> {
  if (!req.user) {
    logError('Cannot create audit entry: No authenticated user', { action, resourceType });
    return null;
  }

  try {
    const entryId = await AuditService.append(
      action,
      {
        userId: req.user.id,
        email: req.user.email,
        roles: req.user.roles || [],
        ipAddress: req.ip,
        deviceId: req.headers['x-device-id'] as string,
      },
      {
        type: resourceType,
        id: resourceId,
      },
      {
        ...details,
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
        rbacContext: req.rbacContext,
      },
      'success',
      severity
    );

    return entryId;
  } catch (error) {
    logError('Failed to create manual audit entry', error as Error);
    return null;
  }
}
