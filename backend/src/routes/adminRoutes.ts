import { Router } from 'express';
import { authenticate, requireAdmin } from '@/middlewares/authMiddleware';
import { validateBody } from '@/utils/validators';
import { AdminController } from '@/controllers/AdminController';
import { z } from 'zod';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/exposure
 * View system exposure across all synthetic assets
 */
router.get('/exposure',
  AdminController.getExposure
);

/**
 * POST /api/admin/hedge/rebalance
 * Trigger hedge rebalancing for specific asset
 */
router.post('/hedge/rebalance',
  validateBody(z.object({
    asset: z.enum(['XAG-s', 'XPT-s', 'XPD-s', 'XCU-s']),
    action: z.enum(['INCREASE_HEDGE', 'DECREASE_HEDGE', 'CLOSE_HEDGE', 'REBALANCE']),
    targetRatio: z.number().min(0).max(1).optional(),
    forceExecution: z.boolean().default(false),
  })),
  AdminController.rebalanceHedge
);

/**
 * GET /api/admin/users
 * Get user statistics and management data
 */
router.get('/users',
  AdminController.getUsers
);

/**
 * GET /api/admin/trades
 * Get trading statistics and analytics
 */
router.get('/trades',
  AdminController.getTrades
);

/**
 * GET /api/admin/shop
 * Get shop statistics and inventory
 */
router.get('/shop',
  AdminController.getShop
);

/**
 * POST /api/admin/maintenance
 * Trigger system maintenance operations
 */
router.post('/maintenance',
  validateBody(z.object({
    operation: z.enum([
      'UPDATE_PRICES',
      'CLEANUP_EXPIRED_QUOTES',
      'RECALCULATE_BALANCES',
      'GENERATE_REPORTS',
    ]),
  })),
  AdminController.maintenance
);

export default router;