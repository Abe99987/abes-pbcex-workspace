import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logWarn } from '@/utils/logger';

/**
 * Admin Terminal Rate Limiting
 * Protects admin endpoints from abuse
 */

// Rate limit store (in-memory for now, should use Redis in production)
const store = new Map<string, { count: number; resetTime: number }>();

/**
 * Admin Terminal Rate Limiter
 * Stricter limits for admin endpoints
 */
export const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    code: 'RATE_LIMITED',
    message: 'Too many requests from this IP, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logWarn('Rate limit exceeded for admin endpoint', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });

    res.status(429).json({
      code: 'RATE_LIMITED',
      message: 'Too many admin requests, please try again later',
      data: {
        limit: 100,
        window: '15 minutes',
        retryAfter: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      }
    });
  }
});

/**
 * Sensitive Operations Rate Limiter
 * Very strict limits for critical actions
 */
export const sensitiveOperationsLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 sensitive operations per hour
  message: {
    code: 'SENSITIVE_RATE_LIMITED',
    message: 'Too many sensitive operations, please try again later',
    retryAfter: '1 hour'
  },
  keyGenerator: (req: Request) => {
    // Rate limit by user ID for sensitive operations
    return req.user?.id || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    logWarn('Rate limit exceeded for sensitive operation', {
      userId: req.user?.id,
      ip: req.ip,
      path: req.path,
      body: req.body
    });

    res.status(429).json({
      code: 'SENSITIVE_RATE_LIMITED',
      message: 'Too many sensitive operations, account temporarily restricted',
      data: {
        limit: 10,
        window: '1 hour',
        retryAfter: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        contactSupport: true
      }
    });
  }
});

/**
 * Authentication Rate Limiter
 * Prevents brute force attacks
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
  message: {
    code: 'AUTH_RATE_LIMITED',
    message: 'Too many authentication attempts, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logWarn('Authentication rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent'),
      attemptedUser: req.body?.email || req.body?.userId
    });

    res.status(429).json({
      code: 'AUTH_RATE_LIMITED',
      message: 'Too many authentication attempts from this IP',
      data: {
        limit: 5,
        window: '15 minutes',
        retryAfter: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        securityNote: 'Account may be temporarily locked for protection'
      }
    });
  }
});

/**
 * API Rate Limiter
 * General API protection
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes  
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    code: 'API_RATE_LIMITED',
    message: 'API rate limit exceeded, please slow down',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path.includes('/health') || req.path.includes('/status');
  }
});

/**
 * Custom rate limiter for user-specific actions
 */
export function createUserRateLimit(maxRequests: number, windowMs: number) {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req: Request): string => {
      return req.user?.id || req.ip || 'unknown';
    },
    message: {
      code: 'USER_RATE_LIMITED',
      message: `Too many requests from this user, limit: ${maxRequests} per ${windowMs / 1000}s`,
    }
  });
}
