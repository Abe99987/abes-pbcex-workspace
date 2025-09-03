import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate, requireAdmin } from '@/middlewares/authMiddleware';
import { validateBody } from '@/utils/validators';
import { z } from 'zod';

/**
 * Admin Terminal Auth Routes
 * Authentication-related endpoints for admin terminal
 */
const router = Router();

// All auth routes require authentication
router.use(authenticate);

/**
 * GET /api/admin/auth/session
 * Get current session information
 */
router.get('/session', AuthController.getSession);

/**
 * POST /api/admin/auth/introspect
 * Introspect JWT token
 */
router.post('/introspect',
  validateBody(z.object({
    token: z.string().min(1, 'Token is required'),
  })),
  AuthController.introspectToken
);

/**
 * POST /api/admin/auth/step-up
 * Initiate step-up authentication
 */
router.post('/step-up',
  validateBody(z.object({
    action: z.string().min(1, 'Action is required'),
    resource: z.string().min(1, 'Resource is required'),
  })),
  AuthController.initiateStepUp
);

/**
 * POST /api/admin/auth/step-up/verify
 * Verify step-up authentication
 */
router.post('/step-up/verify',
  validateBody(z.object({
    stepUpId: z.string().min(1, 'Step-up ID is required'),
  })),
  AuthController.verifyStepUp
);

/**
 * GET /api/admin/auth/devices
 * List user devices
 */
router.get('/devices', AuthController.listDevices);

/**
 * POST /api/admin/auth/cleanup
 * Cleanup expired sessions (admin only)
 */
router.post('/cleanup',
  requireAdmin,
  AuthController.cleanupSessions
);

export default router;
