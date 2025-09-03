import { Request, Response } from 'express';
import { asyncHandler } from '@/middlewares/errorMiddleware';
import { HealthService } from './health.service';
import { logInfo } from '@/utils/logger';

/**
 * Admin Terminal Health Controller
 * Provides health status for admin terminal components
 */
export class HealthController {
  /**
   * GET /api/admin/health
   * Get detailed system health status for admin terminal
   */
  static getHealth = asyncHandler(async (req: Request, res: Response) => {
    logInfo('Admin terminal health check requested', { userId: req.user?.id });

    const healthStatus = await HealthService.getSystemHealth();

    res.json({
      code: 'SUCCESS',
      data: healthStatus,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /api/admin/health/live
   * Liveness probe for admin terminal
   */
  static getLive = asyncHandler(async (req: Request, res: Response) => {
    const liveStatus = await HealthService.getLivenessStatus();

    if (liveStatus.status === 'healthy') {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    } else {
      res.status(503).json({
        status: 'unhealthy',
        issues: liveStatus.issues,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /api/admin/health/ready
   * Readiness probe for admin terminal
   */
  static getReady = asyncHandler(async (req: Request, res: Response) => {
    const readyStatus = await HealthService.getReadinessStatus();

    if (readyStatus.status === 'ready') {
      res.json({ status: 'ready', timestamp: new Date().toISOString() });
    } else {
      res.status(503).json({
        status: 'not_ready',
        blockers: readyStatus.blockers,
        timestamp: new Date().toISOString(),
      });
    }
  });
}
