import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, requireAdmin } from '@/middlewares/authMiddleware';
import { validateBody } from '@/utils/validators';
import { AdminController } from '@/controllers/AdminController';
import { z } from 'zod';
import { RATE_LIMITS } from '@/utils/constants';
import { adminAudit } from '@/middlewares/adminAudit';
import { AdminAuditService } from '@/services/AdminAuditService';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Generic admin limiter to protect sensitive operations
const adminLimiter = rateLimit({
  windowMs: RATE_LIMITS.GENERAL.windowMs,
  max: Math.max(50, Math.floor(RATE_LIMITS.GENERAL.max / 10)),
  message: {
    code: 'RATE_LIMITED',
    message: 'Too many admin requests, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(adminLimiter);

// Record audit for admin write operations
router.use(adminAudit);

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
 * GET /api/admin/metrics
 */
router.get('/metrics', AdminController.getMetrics);

/**
 * GET /api/admin/export/balances
 */
router.get('/export/balances', AdminController.exportBalancesCsv);

/**
 * GET /api/admin/kpi/overview
 */
router.get('/kpi/overview', AdminController.getKpiOverview);

/**
 * GET /api/admin/audit/recent
 */
router.get('/audit/recent', (req, res) => {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  const events = AdminAuditService.getRecentEvents(limit);
  res.json({ code: 'SUCCESS', data: { events } });
});

/**
 * GET /api/admin/health/ledger-drift
 */
router.get('/health/ledger-drift', AdminController.getLedgerDriftHealth);

export default router;