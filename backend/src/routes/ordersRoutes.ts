import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, requireKyc } from '@/middlewares/authMiddleware';
import { validateBody } from '@/utils/validators';
import { OrdersController } from '@/controllers/OrdersController';
import { z } from 'zod';
import { RATE_LIMITS } from '@/utils/constants';

const router = Router();

// Rate limiting for order creation endpoints (public and authed variants)
const ordersLimiter = rateLimit({
  windowMs: RATE_LIMITS.TRADE.windowMs,
  max: RATE_LIMITS.TRADE.max,
  message: {
    code: 'RATE_LIMITED',
    message: 'Too many order requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Basic order schema for POST /api/orders (no auth per OpenAPI for now)
const basicOrderSchema = z.object({
  metal: z.string().min(1),
  qty: z.number().positive(),
});

/**
 * POST /api/orders
 * Create basic order and lock price for 10 minutes
 */
router.post('/', ordersLimiter, validateBody(basicOrderSchema), OrdersController.createOrder);

// Validation schemas
const physicalOrderSchema = z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
  amount: z.number().positive(),
  format: z.string().min(1),
  paymentMethod: z.enum(['BALANCE', 'STRIPE_CARD']),
  clientId: z.string().min(8),
  idempotencyKey: z.string().min(16),
  shippingAddress: z
    .object({
      name: z.string().min(1),
      line1: z.string().min(1),
      line2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      postalCode: z.string().min(1),
      country: z.string().min(1),
      phone: z.string().min(1),
    })
    .optional(),
});

const sellConvertSchema = z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
  amount: z.number().positive(),
  payout: z.enum(['USD', 'USDC', 'USDT', 'TOKEN']),
  clientId: z.string().min(8),
  idempotencyKey: z.string().min(16),
});

/**
 * POST /api/orders/physical
 * Place physical commodity order
 */
router.post(
  '/physical',
  authenticate,
  requireKyc(['APPROVED']),
  ordersLimiter,
  validateBody(physicalOrderSchema),
  OrdersController.createPhysicalOrder
);

/**
 * POST /api/orders/sell-convert
 * Process sell/convert operation
 */
router.post(
  '/sell-convert',
  authenticate,
  requireKyc(['APPROVED']),
  ordersLimiter,
  validateBody(sellConvertSchema),
  OrdersController.createSellConvertOrder
);

export default router;

// Additional order state endpoints
router.post('/:id/relock', OrdersController.relockOrder);
router.post('/:id/cancel', OrdersController.cancelOrder);
