import { Request, Response } from 'express';
import { createError, asyncHandler } from '@/middlewares/errorMiddleware';
import { logInfo, logWarn, logError } from '@/utils/logger';
import { SSEObservabilityService } from '@/services/SSEObservabilityService';
import { IdempotencyMetricsService } from '@/services/IdempotencyMetricsService';
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

  /**
   * POST /api/ops/idem/test
   * Safe test endpoint for idempotency duplicate testing (admin-only, non-prod)
   */
  static testIdempotency = [
    OpsController.checkAdminAccess,
    IdempotencyMetricsService.createMiddleware(),
    asyncHandler(async (req: Request, res: Response) => {
      const requestId = (req as { requestId?: string }).requestId || 'unknown';

      // Only available in non-production
      if (process.env.NODE_ENV === 'production') {
        throw createError.forbidden('Test endpoint not available in production');
      }

      logInfo('Idempotency test endpoint hit', { 
        requestId,
        ip: req.ip,
        idempotencyKey: req.headers['x-idempotency-key'] ? 'present' : 'absent',
      });

      // Return 204 No Content - no side effects
      res.status(204).end();
    })
  ];

  /**
   * GET /api/ops/idem/stats
   * Get idempotency key usage statistics (admin-only)
   */
  static getIdempotencyStats = [
    OpsController.checkAdminAccess,
    asyncHandler(async (req: Request, res: Response) => {
      const requestId = (req as { requestId?: string }).requestId || 'unknown';

      logInfo('Idempotency stats request', { 
        requestId,
        ip: req.ip,
      });

      try {
        const stats = await IdempotencyMetricsService.getStats();
        
        // Calculate percentages
        const dupePercentage5m = stats.window5m.present > 0 
          ? ((stats.window5m.dupes / stats.window5m.present) * 100).toFixed(1)
          : '0.0';
        
        const dupePercentage60m = stats.window60m.present > 0
          ? ((stats.window60m.dupes / stats.window60m.present) * 100).toFixed(1)
          : '0.0';

        const response = {
          success: true,
          data: {
            ...stats,
            window5m: {
              ...stats.window5m,
              dupePercentage: `${dupePercentage5m}%`,
            },
            window60m: {
              ...stats.window60m,
              dupePercentage: `${dupePercentage60m}%`,
            },
            timestamp: new Date().toISOString(),
          },
          meta: {
            requestId,
            collectedAt: new Date().toISOString(),
            description: 'Idempotency key usage statistics',
          }
        };

        logInfo('Idempotency stats retrieved', {
          requestId,
          present5m: stats.window5m.present,
          dupes5m: stats.window5m.dupes,
          present60m: stats.window60m.present,
          dupes60m: stats.window60m.dupes,
        });

        res.status(200).json(response);
      } catch (error) {
        logError('Failed to get idempotency stats', {
          requestId,
          error: error as Error,
        });

        throw createError.internalServerError('Failed to retrieve idempotency statistics');
      }
    })
  ];

  /**
   * GET /api/ops/idem/samples
   * Get sample idempotency keys for debugging (admin-only)
   */
  static getIdempotencySamples = [
    OpsController.checkAdminAccess,
    asyncHandler(async (req: Request, res: Response) => {
      const requestId = (req as { requestId?: string }).requestId || 'unknown';

      try {
        const stats = await IdempotencyMetricsService.getStats();
        
        const response = {
          success: true,
          data: {
            samples5m: stats.window5m.sampleKeys.map(key => ({
              key: key.substring(0, 12) + '...', // Truncate for privacy
              window: '5m'
            })),
            samples60m: stats.window60m.sampleKeys.map(key => ({
              key: key.substring(0, 12) + '...', // Truncate for privacy  
              window: '60m'
            })),
            timestamp: new Date().toISOString(),
          },
          meta: {
            requestId,
            description: 'Sample idempotency keys for debugging',
          }
        };

        res.status(200).json(response);
      } catch (error) {
        logError('Failed to get idempotency samples', {
          requestId,
          error: error as Error,
        });

        throw createError.internalServerError('Failed to retrieve idempotency samples');
      }
    })
  ];
}

export default OpsController;
