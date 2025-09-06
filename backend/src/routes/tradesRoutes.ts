import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, requireKyc } from '@/middlewares/authMiddleware';
import { RATE_LIMITS } from '@/utils/constants';
import { z } from 'zod';
import { validateBody } from '@/utils/validators';
import { TradesController } from '@/controllers/TradesController';

const router = Router();

const tradeLimiter = rateLimit({
  windowMs: RATE_LIMITS.TRADE.windowMs,
  max: RATE_LIMITS.TRADE.max,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticate);

const tradeSchema = z.object({
  symbol: z.string().min(1),
  qty: z.string().regex(/^\d+\.?\d*$/),
  slippage: z.number().min(0).max(0.05).optional(),
  request_id: z.string().min(8),
});

router.post('/trades/buy', requireKyc(['APPROVED']), tradeLimiter, validateBody(tradeSchema), TradesController.buy);
router.post('/trades/sell', requireKyc(['APPROVED']), tradeLimiter, validateBody(tradeSchema), TradesController.sell);

export default router;


