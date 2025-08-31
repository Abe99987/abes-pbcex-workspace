import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validateBody } from '@/utils/validators';
import { RATE_LIMITS } from '@/utils/constants';
import { CheckoutController } from '@/controllers/CheckoutController';
import { env } from '@/config/env';
import { z } from 'zod';

const router = Router();

// Rate limiting for checkout endpoints (more restrictive due to financial nature)
const checkoutLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Allow 20 checkout operations per 5 minutes
  message: {
    code: 'RATE_LIMITED',
    message: 'Too many checkout requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development
  skip: (req) => {
    return env.NODE_ENV === 'development' && req.headers['x-admin-bypass'] === 'true';
  },
});

// More restrictive rate limiting for price-lock quotes (expensive operations)
const quoteLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 5, // Allow 5 quotes per 2 minutes
  message: {
    code: 'RATE_LIMITED',
    message: 'Too many quote requests, please wait before requesting another quote.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schemas
const quoteRequestSchema = z.object({
  symbol: z.string()
    .min(3)
    .max(5)
    .regex(/^[A-Z]+$/, 'Symbol must be uppercase letters only')
    .transform(val => val.toUpperCase()),
  quantity: z.number()
    .min(0.001, 'Minimum quantity is 0.001')
    .max(1000, 'Maximum quantity is 1000')
    .multipleOf(0.001, 'Quantity must have at most 3 decimal places'),
  side: z.enum(['buy', 'sell'], {
    errorMap: () => ({ message: 'Side must be either "buy" or "sell"' }),
  }),
  userId: z.string().uuid().optional(),
});

const confirmRequestSchema = z.object({
  quoteId: z.string().uuid('Invalid quote ID format'),
});

// Routes

/**
 * GET /api/checkout/health
 * Get checkout service health status
 * Public endpoint for monitoring
 */
router.get('/health', CheckoutController.getHealthStatus);

/**
 * POST /api/checkout/price-lock/quote
 * Request a price-lock quote
 * Rate limited and input validated
 */
router.post(
  '/price-lock/quote',
  quoteLimiter,
  validateBody(quoteRequestSchema),
  CheckoutController.requestQuote
);

/**
 * POST /api/checkout/confirm
 * Confirm a price-lock quote
 * Rate limited and input validated
 */
router.post(
  '/confirm',
  checkoutLimiter,
  validateBody(confirmRequestSchema),
  CheckoutController.confirmQuote
);

/**
 * GET /api/checkout/quote/:id
 * Get quote details by ID
 * Rate limited
 */
router.get(
  '/quote/:id',
  checkoutLimiter,
  CheckoutController.getQuote
);

export default router;
