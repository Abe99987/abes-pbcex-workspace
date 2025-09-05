import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validateBody } from '@/utils/validators';
import { RATE_LIMITS } from '@/utils/constants';
import { PricesController } from '@/controllers/PricesController';
import { env } from '@/config/env';
import { z } from 'zod';

const router = Router();

// Rate limiting for price endpoints
const pricesLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Allow 60 price requests per minute
  message: {
    code: 'RATE_LIMITED',
    message: 'Too many price requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development
  skip: (req) => {
    return env.NODE_ENV === 'development' && req.headers['x-admin-bypass'] === 'true';
  },
});

// More restrictive rate limiting for batch requests
const batchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Allow 10 batch requests per minute
  message: {
    code: 'RATE_LIMITED',
    message: 'Too many batch price requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const batchPricesSchema = z.object({
  symbols: z.array(z.string().regex(/^[A-Za-z]{3,5}$/, 'Invalid symbol format'))
    .min(1, 'At least one symbol is required')
    .max(10, 'Maximum 10 symbols per request'),
});

// Routes

/**
 * GET /api/prices/health
 * Get price service health status
 * Public endpoint for monitoring
 */
router.get('/health', PricesController.getHealthStatus);

/**
 * GET /api/prices/symbols
 * Get list of supported symbols
 * Public endpoint
 */
router.get('/symbols', pricesLimiter, PricesController.getSupportedSymbols);

/**
 * GET /api/prices/stream
 * SSE price stream for live updates
 * Note: must be defined BEFORE '/:symbol' to avoid route conflicts
 */
router.get('/stream', PricesController.streamPricesSSE);

/**
 * GET /api/prices/:symbol
 * Get price for a specific symbol
 * Rate limited and input validated
 */
router.get('/:symbol', pricesLimiter, PricesController.getPrice);

/**
 * POST /api/prices/batch
 * Get prices for multiple symbols
 * More restrictive rate limiting due to higher load
 */
router.post(
  '/batch',
  batchLimiter,
  validateBody(batchPricesSchema),
  PricesController.getMultiplePrices
);

/**
 * DELETE /api/prices/cache/:symbol
 * Clear cache for a specific symbol
 * Dev/admin endpoint
 */
router.delete('/cache/:symbol', PricesController.clearCache);

export default router;
