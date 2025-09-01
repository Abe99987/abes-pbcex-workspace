import { Request, Response, NextFunction } from 'express';
import { createError } from '@/middlewares/errorMiddleware';
import { logError, logInfo, logWarn } from '@/utils/logger';
import { AuthenticatedRequest } from './auth';
import { cache } from '@/cache/redis';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: RateLimitRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip rate limiting for successful requests
  skipFailedRequests?: boolean; // Skip rate limiting for failed requests
}

export interface RateLimitRequest extends AuthenticatedRequest {
  rateLimitKey?: string;
}

/**
 * Create a rate limiting middleware
 */
export function createRateLimit(config: RateLimitConfig) {
  return (req: RateLimitRequest, res: Response, next: NextFunction): void => {
    // Generate rate limit key
    const key = config.keyGenerator
      ? config.keyGenerator(req)
      : generateDefaultKey(req);

    req.rateLimitKey = key;

    // Use Promise.resolve().then() to handle async operations
    Promise.resolve().then(async () => {
      try {
        // Check current request count
        const currentCount = await getCurrentRequestCount(key, config.windowMs);

        if (currentCount >= config.maxRequests) {
          logWarn('Rate limit exceeded', {
            key,
            currentCount,
            maxRequests: config.maxRequests,
            windowMs: config.windowMs,
            userId: req.user?.id,
            ip: req.ip,
          });

          const error = createError.rateLimited(
            `Rate limit exceeded. Maximum ${config.maxRequests} requests per ${Math.round(config.windowMs / 1000)} seconds.`
          );
          return next(error);
        }

        // Increment request count
        await incrementRequestCount(key, config.windowMs);

        // Add rate limit headers
        res.set({
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': Math.max(
            0,
            config.maxRequests - currentCount - 1
          ).toString(),
          'X-RateLimit-Reset': new Date(
            Date.now() + config.windowMs
          ).toISOString(),
        });

        logInfo('Rate limit check passed', {
          key,
          currentCount: currentCount + 1,
          maxRequests: config.maxRequests,
          userId: req.user?.id,
        });

        next();
      } catch (error) {
        logError('Rate limit middleware error', error as Error);
        next(error);
      }
    });
  };
}

/**
 * Generate default rate limit key
 */
function generateDefaultKey(req: RateLimitRequest): string {
  const userId = req.user?.id || 'anonymous';
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  return `rate_limit:${userId}:${ip}:${req.path}`;
}

/**
 * Get current request count for a key
 */
async function getCurrentRequestCount(
  key: string,
  windowMs: number
): Promise<number> {
  try {
    const result = await cache.get(key);
    return result ? parseInt(result) : 0;
  } catch (error) {
    logError('Error getting rate limit count', error as Error);
    return 0;
  }
}

/**
 * Increment request count for a key
 */
async function incrementRequestCount(
  key: string,
  windowMs: number
): Promise<void> {
  try {
    // Use atomic increment for thread-safe counting
    const newCount = await cache.increment(key);
    if (newCount === 1) {
      // First request, set TTL
      await cache.expire(key, Math.ceil(windowMs / 1000));
    }
  } catch (error) {
    logError('Error incrementing rate limit count', error as Error);
  }
}

/**
 * Predefined rate limit configurations
 */
export const rateLimitConfigs = {
  // Strict rate limiting for write operations
  strict: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },

  // Moderate rate limiting for read operations
  moderate: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },

  // Generous rate limiting for public endpoints
  generous: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000,
  },

  // Per-user rate limiting
  perUser: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    keyGenerator: (req: RateLimitRequest) => {
      const userId = req.user?.id || 'anonymous';
      return `rate_limit:user:${userId}:${req.path}`;
    },
  },

  // Per-IP rate limiting
  perIP: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyGenerator: (req: RateLimitRequest) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      return `rate_limit:ip:${ip}:${req.path}`;
    },
  },

  // Money movement specific rate limiting
  moneyMovement: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    keyGenerator: (req: RateLimitRequest) => {
      const userId = req.user?.id || 'anonymous';
      return `rate_limit:money_movement:${userId}`;
    },
  },

  // DCA specific rate limiting
  dca: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 15,
    keyGenerator: (req: RateLimitRequest) => {
      const userId = req.user?.id || 'anonymous';
      return `rate_limit:dca:${userId}`;
    },
  },

  // Authentication rate limiting
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (req: RateLimitRequest) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      return `rate_limit:auth:${ip}`;
    },
  },
};

/**
 * Create rate limit middleware for specific endpoints
 */
export const rateLimitMiddleware = {
  // Strict rate limiting for write operations
  strict: createRateLimit(rateLimitConfigs.strict),

  // Moderate rate limiting for read operations
  moderate: createRateLimit(rateLimitConfigs.moderate),

  // Generous rate limiting for public endpoints
  generous: createRateLimit(rateLimitConfigs.generous),

  // Per-user rate limiting
  perUser: createRateLimit(rateLimitConfigs.perUser),

  // Per-IP rate limiting
  perIP: createRateLimit(rateLimitConfigs.perIP),

  // Money movement specific rate limiting
  moneyMovement: createRateLimit(rateLimitConfigs.moneyMovement),

  // DCA specific rate limiting
  dca: createRateLimit(rateLimitConfigs.dca),

  // Authentication rate limiting
  auth: createRateLimit(rateLimitConfigs.auth),
};

/**
 * Dynamic rate limiting based on user tier
 */
export function createDynamicRateLimit(baseConfig: RateLimitConfig) {
  return async (
    req: RateLimitRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;

      // Adjust rate limits based on user tier
      const adjustedConfig = { ...baseConfig };

      if (user?.kycStatus === 'APPROVED') {
        // Approved users get normal limits
        adjustedConfig.maxRequests = baseConfig.maxRequests;
      } else {
        // Unverified users get lower limits
        adjustedConfig.maxRequests = Math.floor(baseConfig.maxRequests * 0.5);
        adjustedConfig.windowMs = Math.floor(baseConfig.windowMs * 1.5); // Longer window
      }

      // Apply the adjusted rate limit
      const rateLimitMiddleware = createRateLimit(adjustedConfig);
      await rateLimitMiddleware(req, res, next);
    } catch (error) {
      logError('Dynamic rate limit error', error as Error);
      next(error);
    }
  };
}

/**
 * Get rate limit statistics
 */
export async function getRateLimitStats(): Promise<{
  totalKeys: number;
  activeKeys: number;
  topKeys: Array<{ key: string; count: number }>;
}> {
  try {
    // Note: Redis keys operation not available in cache instance
    // Return placeholder stats for now
    return {
      totalKeys: 0,
      activeKeys: 0,
      topKeys: [],
    };
  } catch (error) {
    logError('Error getting rate limit stats', error as Error);
    return {
      totalKeys: 0,
      activeKeys: 0,
      topKeys: [],
    };
  }
}

/**
 * Clear rate limit for a specific key
 */
export async function clearRateLimit(key: string): Promise<boolean> {
  try {
    const result = await cache.del(key);
    return result;
  } catch (error) {
    logError('Error clearing rate limit', error as Error);
    return false;
  }
}

/**
 * Clear all rate limits for a user
 */
export async function clearUserRateLimits(userId: string): Promise<number> {
  try {
    // Note: Redis keys operation not available in cache instance
    // Return 0 for now - in production, this would need a different approach
    logInfo('User rate limits clear requested', {
      userId,
      note: 'keys operation not available',
    });
    return 0;
  } catch (error) {
    logError('Error clearing user rate limits', error as Error);
    return 0;
  }
}
