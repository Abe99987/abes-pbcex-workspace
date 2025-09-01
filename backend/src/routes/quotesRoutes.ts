import { Router } from 'express';
import { QuotesController } from '@/controllers/QuotesController';

const router = Router();

/**
 * GET /api/quotes/estimate
 * Get price estimate for buy/sell operation
 * Query params: symbol, side, amount, format?, payout?
 */
router.get('/estimate', QuotesController.getEstimate);

/**
 * GET /api/quotes/:quoteId
 * Get cached quote details by ID
 */
router.get('/:quoteId', QuotesController.getQuote);

export default router;
