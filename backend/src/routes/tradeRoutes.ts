import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, requireKyc } from '@/middlewares/authMiddleware';
import { validateBody, validateQuery } from '@/utils/validators';
import { tradeOrderSchema } from '@/utils/validators';
import { RATE_LIMITS } from '@/utils/constants';
import { TradeController } from '@/controllers/TradeController';
import { TradeControllerDb } from '@/controllers/TradeControllerDb';
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
 * Get current spot prices for assets (Enhanced with caching)
 */
router.get(
  '/prices',
  validateQuery(
    z.object({
      asset: z.enum(['AU', 'AG', 'PT', 'PD', 'CU']).optional(),
    })
  ),
  TradeControllerDb.getPrices
);

/**
 * POST /api/trade/order
 * Place a market conversion order
 */
router.post(
  '/order',
  requireKyc(['APPROVED']),
  tradeLimiter,
  validateBody(tradeOrderSchema),
  TradeController.placeOrder
);

/**
 * POST /api/trade/quote
 * Get a trading quote without executing
 */
router.post(
  '/quote',
  requireKyc(['APPROVED']),
  validateBody(
    z.object({
      fromAsset: z.string().min(1),
      toAsset: z.string().min(1),
      amount: z
        .string()
        .regex(/^\d+\.?\d*$/, 'Amount must be a valid decimal number'),
    })
  ),
  TradeController.getQuote
);

/**
 * GET /api/trade/history
 * Get user's trade history with filters and KPIs
 */
router.get(
  '/history',
  validateQuery(
    z.object({
      pair: z.string().optional(),
      side: z.string().optional(),
      order_type: z.string().optional(),
      status: z.string().optional(),
      date_from: z.string().optional(),
      date_to: z.string().optional(),
      limit: z.string().optional(),
      offset: z.string().optional(),
    })
  ),
  TradeControllerDb.getTradeHistory
);

/**
 * GET /api/trade/history/export.csv
 * Export trade history as CSV
 */
router.get(
  '/history/export.csv',
  validateQuery(
    z.object({
      pair: z.string().optional(),
      side: z.string().optional(),
      order_type: z.string().optional(),
      status: z.string().optional(),
      date_from: z.string().optional(),
      date_to: z.string().optional(),
    })
  ),
  TradeControllerDb.exportTradeHistoryCsv
);

/**
 * GET /api/trade/history/export.xlsx
 * Export trade history as Excel
 */
router.get(
  '/history/export.xlsx',
  validateQuery(
    z.object({
      pair: z.string().optional(),
      side: z.string().optional(),
      order_type: z.string().optional(),
      status: z.string().optional(),
      date_from: z.string().optional(),
      date_to: z.string().optional(),
    })
  ),
  TradeControllerDb.exportTradeHistoryExcel
);

/**
 * GET /api/trade/pairs
 * Get available trading pairs and their stats
 */
router.get('/pairs', TradeController.getTradingPairs);

export default router;
