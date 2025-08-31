import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, optionalAuthenticate } from '@/middlewares/authMiddleware';
import { validateBody } from '@/utils/validators';
import { RATE_LIMITS } from '@/utils/constants';
import { AuthController } from '@/controllers/AuthController';
import { VerifyController } from '@/controllers/VerifyController';
import { z } from 'zod';

const router = Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.windowMs,
  max: RATE_LIMITS.AUTH.max,
  message: {
    code: 'RATE_LIMITED',
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')  
    .regex(/\d/, 'Password must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().max(20).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'New password must contain uppercase letter')
    .regex(/[a-z]/, 'New password must contain lowercase letter')
    .regex(/\d/, 'New password must contain a number')
    .regex(/[^A-Za-z0-9]/, 'New password must contain special character'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const enable2FASchema = z.object({
  code: z.string().length(6, '2FA code must be 6 digits'),
});

const disable2FASchema = z.object({
  password: z.string().min(1, 'Password required to disable 2FA'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

const verifyStartSchema = z.object({
  phone: z.string()
    .min(10, 'Phone number too short')
    .max(20, 'Phone number too long')
    .regex(/[\d\s\-\+\(\)]+/, 'Invalid phone number format'),
  channel: z.enum(['sms', 'call']).optional(),
});

const verifyCheckSchema = z.object({
  phone: z.string()
    .min(10, 'Phone number too short')
    .max(20, 'Phone number too long')
    .regex(/[\d\s\-\+\(\)]+/, 'Invalid phone number format'),
  code: z.string()
    .regex(/^\d{4,8}$/, 'Code must be 4-8 digits'),
});

// Routes

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', 
  authLimiter,
  validateBody(registerSchema),
  AuthController.register
);

/**
 * POST /api/auth/login
 * Authenticate user login
 */
router.post('/login',
  authLimiter,
  validateBody(loginSchema),
  AuthController.login
);

/**
 * POST /api/auth/logout
 * Logout user and blacklist token
 */
router.post('/logout',
  authenticate,
  AuthController.logout
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me',
  authenticate,
  AuthController.getProfile
);

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  AuthController.changePassword
);

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password',
  authLimiter,
  validateBody(forgotPasswordSchema),
  AuthController.forgotPassword
);

/**
 * POST /api/auth/2fa/setup
 * Setup two-factor authentication
 */
router.post('/2fa/setup',
  authenticate,
  AuthController.setup2FA
);

/**
 * POST /api/auth/2fa/enable
 * Enable two-factor authentication
 */
router.post('/2fa/enable',
  authenticate,
  validateBody(enable2FASchema),
  AuthController.enable2FA
);

/**
 * POST /api/auth/2fa/disable
 * Disable two-factor authentication
 */
router.post('/2fa/disable',
  authenticate,
  validateBody(disable2FASchema),
  AuthController.disable2FA
);

/**
 * POST /api/auth/verify/start
 * Start phone number verification
 */
router.post('/verify/start',
  authLimiter,
  validateBody(verifyStartSchema),
  VerifyController.startVerification
);

/**
 * POST /api/auth/verify/check
 * Check verification code
 */
router.post('/verify/check',
  authLimiter,
  validateBody(verifyCheckSchema),
  VerifyController.checkVerification
);

/**
 * GET /api/auth/verify/status
 * Get verification service status
 */
router.get('/verify/status',
  VerifyController.getVerificationStatus
);

/**
 * POST /api/auth/verify/test
 * Send test verification (development only)
 */
router.post('/verify/test',
  VerifyController.sendTestVerification
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh',
  validateBody(refreshTokenSchema),
  AuthController.refreshToken
);

export default router;