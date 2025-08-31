import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validateBody } from '@/utils/validators';
import { RATE_LIMITS } from '@/utils/constants';
import { EmailController } from '@/controllers/EmailController';
import { env } from '@/config/env';
import { z } from 'zod';

const router = Router();

// Rate limiting for email endpoints (stricter than general API)
const emailLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.windowMs, // Reuse auth rate limit window (15 minutes)
  max: 10, // Allow 10 email operations per 15 minutes
  message: {
    code: 'RATE_LIMITED',
    message: 'Too many email requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development for testing
  skip: (req) => {
    return env.NODE_ENV === 'development' && req.headers['x-admin-bypass'] === 'true';
  },
});

// Validation schemas
const testEmailSchema = z.object({
  to: z
    .string()
    .email('Invalid email format')
    .max(254, 'Email too long'), // RFC 5321 limit
});

const customEmailSchema = z.object({
  to: z
    .string()
    .email('Invalid email format')
    .max(254, 'Email too long'),
  subject: z
    .string()
    .min(1, 'Subject required')
    .max(200, 'Subject too long'),
  html: z
    .string()
    .min(1, 'HTML content required')
    .max(50000, 'HTML content too long'), // 50KB limit
  from: z
    .string()
    .email('Invalid from email format')
    .optional(),
  replyTo: z
    .string()
    .email('Invalid reply-to email format')
    .optional(),
});

// Development-only middleware to restrict access in production
const developmentOnly = (req: any, res: any, next: any) => {
  if (env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'This endpoint is only available in development environments',
    });
  }
  next();
};

// Routes

/**
 * GET /api/email/health
 * Get email service health status
 * Public endpoint for monitoring
 */
router.get('/health', EmailController.getHealthStatus);

/**
 * POST /api/email/test
 * Send a test email (development only)
 * Rate limited and input validated
 */
router.post(
  '/test',
  developmentOnly,
  emailLimiter,
  validateBody(testEmailSchema),
  EmailController.sendTestEmail
);

/**
 * POST /api/email/send
 * Send a custom email (development only)
 * For internal testing purposes
 * Rate limited and input validated
 */
router.post(
  '/send',
  developmentOnly,
  emailLimiter,
  validateBody(customEmailSchema),
  EmailController.sendCustomEmail
);

export default router;
