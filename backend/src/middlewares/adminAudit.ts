import { Request, Response, NextFunction } from 'express';
import { AdminAuditService } from '@/services/AdminAuditService';

/**
 * Middleware: records a minimal admin audit event for write operations under /api/admin
 * Captures method, route, userId, role, and outcome status. No PII.
 */
export function adminAudit(req: Request, res: Response, next: NextFunction): void {
  // Only record for mutating methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  const start = Date.now();

  res.on('finish', () => {
    try {
      const route = req.originalUrl || req.url;
      const userId = (req as any).user?.id || 'unknown';
      const role = (req as any).user?.role || 'unknown';
      const action = `${req.method} ${route}`;
      const status = res.statusCode;

      AdminAuditService.recordEvent({
        timestampIso: new Date(start).toISOString(),
        route,
        method: req.method,
        userId,
        role,
        action,
        status,
      });
    } catch {
      // best-effort; never block request on audit failure
    }
  });

  next();
}


