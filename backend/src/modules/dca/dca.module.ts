/**
 * DCA Module - Dollar Cost Averaging Engine v1
 *
 * This module provides DCA (Dollar Cost Averaging) functionality including:
 * - Rule persistence and management
 * - Backtest calculations with pluggable price adapters
 * - Integration with spending/trading modules
 *
 * Feature flag: dca.v1 (off by default)
 */

import { Router } from 'express';
import { DCAController } from './dca.controller';
import { DCAService } from './dca.service';
import { DCARepository } from './repo/dca.repository';
import { PriceHistoryService } from './services/price-history.service';
import { BacktestService } from './services/backtest.service';
import { requireAuth, requireFeature } from '@/middlewares/auth';
import { createRateLimit } from '@/middlewares/rateLimit';
import { idempotencyMiddleware } from '@/middlewares/idempotency';

const router = Router();

// Feature flag middleware
const requireDCAFeature = requireFeature('dca.enabled');

// Rate limiting for DCA endpoints
const dcaRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute for rules
});

const backtestRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 6, // 6 requests per minute for backtest
});

// DCA Rules endpoints
router.get(
  '/rules',
  requireAuth as any,
  requireDCAFeature as any,
  dcaRateLimit as any,
  DCAController.getRules as any
);

router.post(
  '/rules',
  requireAuth as any,
  requireDCAFeature as any,
  dcaRateLimit as any,
  idempotencyMiddleware as any,
  DCAController.createRule as any
);

router.patch(
  '/rules/:id',
  requireAuth as any,
  requireDCAFeature as any,
  dcaRateLimit as any,
  idempotencyMiddleware as any,
  DCAController.updateRule as any
);

router.delete(
  '/rules/:id',
  requireAuth as any,
  requireDCAFeature as any,
  dcaRateLimit as any,
  DCAController.deleteRule as any
);

// Backtest endpoint
router.get(
  '/backtest',
  requireAuth as any,
  requireDCAFeature as any,
  backtestRateLimit as any,
  DCAController.runBacktest as any
);

// Health check for DCA module
router.get('/health', DCAController.healthCheck);

export {
  DCAController,
  DCAService,
  DCARepository,
  PriceHistoryService,
  BacktestService,
};
export default router;
