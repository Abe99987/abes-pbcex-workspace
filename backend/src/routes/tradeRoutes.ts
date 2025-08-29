import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, requireKyc } from '@/middlewares/authMiddleware';
import { validateBody, validateQuery } from '@/utils/validators';
import { tradeOrderSchema } from '@/utils/validators';
import { RATE_LIMITS } from '@/utils/constants';
import { TradeController } from '@/controllers/TradeController';
import { z } from 'zod';

const router = Router();

// Rate limiting for trading endpoints
const tradeLimiter = rateLimit({
  windowMs: RATE_LIMITS.TRADE.windowMs,
  max: RATE_LIMITS.TRADE.max,
  message: {
    code: 'RATE_LIMITED',
    message: 'Too many trading requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticate);

/**
 * GET /api/trade/prices
 * Get current spot prices for assets
 */
router.get('/prices',
  validateQuery(z.object({
    asset: z.enum(['AU', 'AG', 'PT', 'PD', 'CU']).optional(),
  })),
  TradeController.getPrices
);

/**
 * POST /api/trade/order
 * Place a market conversion order
 */
router.post('/order',
  requireKyc(['APPROVED']),
  tradeLimiter,
  validateBody(tradeOrderSchema),
  TradeController.placeOrder
);

/**
 * POST /api/trade/quote
 * Get a trading quote without executing
 */
router.post('/quote',
  requireKyc(['APPROVED']),
  validateBody(z.object({
    fromAsset: z.string().min(1),
    toAsset: z.string().min(1),
    amount: z.string().regex(/^\d+\.?\d*$/, 'Amount must be a valid decimal number'),
  })),
  TradeController.getQuote
);

/**
 * GET /api/trade/history
 * Get user's trade history
 */
router.get('/history',
  validateQuery(z.object({
    limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 100) : 50),
    offset: z.string().optional().transform(val => val ? Math.max(parseInt(val), 0) : 0),
    pair: z.string().optional(),
    status: z.enum(['PENDING', 'FILLED', 'CANCELLED', 'FAILED']).optional(),
  })),
  TradeController.getTradeHistory
);

/**
 * GET /api/trade/pairs
 * Get available trading pairs and their stats
 */
router.get('/pairs',
  TradeController.getTradingPairs
);

export default router;