import { Router } from 'express';
import { Request, Response } from 'express';
import { authenticate, requireAdmin } from '@/middlewares/authMiddleware';
import { asyncHandler } from '@/middlewares/errorMiddleware';

/**
 * Admin Terminal Routes
 * Main entry point for admin terminal API endpoints
 */
const router = Router();

// All admin terminal routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/ping
 * Simple ping endpoint for admin terminal connectivity test
 */
router.get('/ping', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    code: 'SUCCESS',
    message: 'Admin Terminal API is running',
    data: {
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      userId: req.user?.id,
    },
  });
}));

export default router;
