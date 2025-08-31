import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '@/middlewares/authMiddleware';
import { validateQuery } from '@/middlewares/validationMiddleware';
import { AnalyticsController } from '@/controllers/AnalyticsController';

const router = Router();

router.use(authenticate);

/**
 * GET /api/analytics/spending
 * Get spending analytics and categorization
 */
router.get('/spending',
  validateQuery(z.object({
    period: z.enum(['month', 'quarter', 'year']).default('month'),
    currency: z.string().default('USD'),
  })),
  AnalyticsController.getSpendingAnalytics
);

/**
 * GET /api/analytics/pnl
 * Get profit and loss analytics
 */
router.get('/pnl',
  validateQuery(z.object({
    period: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
    currency: z.string().default('USD'),
  })),
  AnalyticsController.getPnLAnalytics
);

/**
 * GET /api/analytics/portfolio
 * Get portfolio performance analytics
 */
router.get('/portfolio',
  validateQuery(z.object({
    period: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
    includeBreakdown: z.coerce.boolean().default(true),
  })),
  AnalyticsController.getPortfolioAnalytics
);

export default router;