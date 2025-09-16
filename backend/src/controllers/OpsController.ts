import { Request, Response } from 'express';
import { createError, asyncHandler } from '@/middlewares/errorMiddleware';
import { logInfo, logWarn, logError } from '@/utils/logger';
import { SSEObservabilityService } from '@/services/SSEObservabilityService';
import { env } from '@/config/env';

/**
 * Operations Controller for PBCEx
 * Handles admin-only operational endpoints for monitoring and diagnostics
 */

interface AdminRequest extends Request {
  user?: { role: string };
}

export class OpsController {
  /**
   * Middleware to check admin access
   * Uses existing admin role or X-Admin-Key header for non-prod environments
   */
  static checkAdminAccess = asyncHandler(async (req: AdminRequest, res: Response, next: Function) => {
    // Check for admin role (production)
    if (req.user?.role === 'admin') {
      return next();
    }

    // Fallback to X-Admin-Key header for non-production
    if (process.env.NODE_ENV !== 'production') {
      const adminKey = req.headers['x-admin-key'] as string;
      const expectedKey = process.env.ADMIN_OPS_KEY;
      
      if (adminKey && expectedKey && adminKey === expectedKey) {
        logInfo('Admin access granted via X-Admin-Key', { 
          ip: req.ip,
          userAgent: req.headers['user-agent']?.substring(0, 50)
        });
        return next();
      }
    }

    throw createError.forbidden('Admin access required');
  });

  /**
   * GET /api/ops/sse/stats
   * Get SSE connection statistics (admin-only)
   */
  static getSSEStats = [
    OpsController.checkAdminAccess,
    asyncHandler(async (req: Request, res: Response) => {
      const requestId = (req as { requestId?: string }).requestId || 'unknown';

      logInfo('SSE stats request', { 
        requestId,
        ip: req.ip,
        userAgent: req.headers['user-agent']?.substring(0, 50)
      });

      try {
        const stats = await SSEObservabilityService.getStats();
        
        // Calculate total active connections
        const totalActive = Object.values(stats.activeByChannel)
          .reduce((sum, count) => sum + count, 0);

        // Determine health status based on heartbeat age
        let healthStatus = 'ok';
        if (stats.lastHeartbeatMaxAgeSec > 60) {
          healthStatus = 'stale';
        } else if (stats.lastHeartbeatMaxAgeSec > 30) {
          healthStatus = 'warn';
        }

        const response = {
          success: true,
          data: {
            ...stats,
            totalActive,
            healthStatus,
            timestamp: new Date().toISOString(),
          },
          meta: {
            requestId,
            collectedAt: new Date().toISOString(),
            description: 'SSE connection observability statistics',
          }
        };

        logInfo('SSE stats retrieved', {
          requestId,
          totalActive,
          healthStatus,
          channelCount: Object.keys(stats.activeByChannel).length,
        });

        res.status(200).json(response);
      } catch (error) {
        logError('Failed to get SSE stats', {
          requestId,
          error: error as Error,
        });

        throw createError.internalServerError('Failed to retrieve SSE statistics');
      }
    })
  ];

  /**
   * GET /api/ops/sse/health
   * Get SSE health status (admin-only)
   */
  static getSSEHealth = [
    OpsController.checkAdminAccess,
    asyncHandler(async (req: Request, res: Response) => {
      const requestId = (req as { requestId?: string }).requestId || 'unknown';

      try {
        const stats = await SSEObservabilityService.getStats();
        
        const health = {
          status: stats.lastHeartbeatMaxAgeSec > 60 ? 'unhealthy' : 'healthy',
          checks: {
            heartbeats: {
              status: stats.lastHeartbeatMaxAgeSec <= 30 ? 'pass' : 'fail',
              maxAgeSec: stats.lastHeartbeatMaxAgeSec,
              threshold: 30,
            },
            connections: {
              status: Object.keys(stats.activeByChannel).length > 0 ? 'pass' : 'warn',
              activeChannels: Object.keys(stats.activeByChannel).length,
              totalActive: Object.values(stats.activeByChannel).reduce((sum, count) => sum + count, 0),
            }
          },
          timestamp: new Date().toISOString(),
        };

        res.status(health.status === 'healthy' ? 200 : 503).json({
          success: true,
          service: 'SSE',
          ...health,
          meta: { requestId }
        });
      } catch (error) {
        logError('Failed to get SSE health', {
          requestId,
          error: error as Error,
        });

        res.status(503).json({
          success: false,
          service: 'SSE',
          status: 'error',
          error: (error as Error).message,
          timestamp: new Date().toISOString(),
          meta: { requestId }
        });
      }
    })
  ];

  /**
   * POST /api/ops/sse/cleanup
   * Cleanup stale SSE connections (admin-only)
   */
  static cleanupSSEConnections = [
    OpsController.checkAdminAccess,
    asyncHandler(async (req: Request, res: Response) => {
      const requestId = (req as { requestId?: string }).requestId || 'unknown';

      logInfo('SSE cleanup requested', { 
        requestId,
        ip: req.ip,
      });

      try {
        const result = await SSEObservabilityService.cleanupStale();

        logInfo('SSE cleanup completed', {
          requestId,
          cleaned: result.cleaned,
        });

        res.status(200).json({
          success: true,
          data: {
            cleaned: result.cleaned,
            timestamp: new Date().toISOString(),
          },
          meta: {
            requestId,
            action: 'cleanup_stale_connections',
          }
        });
      } catch (error) {
        logError('Failed to cleanup SSE connections', {
          requestId,
          error: error as Error,
        });

        throw createError.internalServerError('Failed to cleanup SSE connections');
      }
    })
  ];
}

export default OpsController;
