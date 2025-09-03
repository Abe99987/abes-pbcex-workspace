import { Router } from 'express';
import { HealthController } from './health.controller';
import { authenticate, requireAdmin } from '@/middlewares/authMiddleware';

/**
 * Admin Terminal Health Routes
 * Provides health check endpoints for admin terminal
 */
const router = Router();

// All admin health routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/health
 * Get detailed system health status
 */
router.get('/', HealthController.getHealth);

/**
 * GET /api/admin/health/live
 * Liveness probe (basic health check)
 */
router.get('/live', HealthController.getLive);

/**
 * GET /api/admin/health/ready
 * Readiness probe (can serve traffic)
 */
router.get('/ready', HealthController.getReady);

export default router;
