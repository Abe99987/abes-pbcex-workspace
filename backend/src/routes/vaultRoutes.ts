import { Router } from 'express';
import { asyncHandler, createError } from '@/middlewares/errorMiddleware';
import { authenticate, requireAdmin } from '@/middlewares/authMiddleware';
import { validateBody, validateQuery } from '@/utils/validators';
import { env } from '@/config/env';
import VaultCustodyService from '@/services/VaultCustodyService';
import DillonGageService from '@/services/DillonGageService';
import { z } from 'zod';

const router = Router();

// All vault routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * Feature flag check middleware
 */
const checkVaultEnabled = (req: any, res: any, next: any) => {
  if (!env.ENABLE_VAULT_REDEMPTION) {
    return res.status(501).json({
      code: 'SERVICE_UNAVAILABLE',
      message: 'Vault redemption services are not implemented',
      feature: 'ENABLE_VAULT_REDEMPTION',
      status: 'DISABLED',
    });
  }
  next();
};

// Validation schemas
const restockRequestSchema = z.object({
  sku: z.string().min(1).max(50),
  quantity: z.number().int().min(1).max(1000),
  unitCost: z.string().regex(/^\d+\.?\d*$/).optional(),
});

const branchRestockSchema = z.object({
  branchId: z.string().min(1).max(20),
  metal: z.enum(['AU', 'AG', 'PT', 'PD', 'CU']),
  quantity: z.number().int().min(1).max(100),
});

const inventoryQuerySchema = z.object({
  metal: z.enum(['AU', 'AG', 'PT', 'PD', 'CU']).optional(),
  format: z.enum(['BAR', 'COIN', 'SHEET', 'COIL', 'ROUND']).optional(),
  vaultLocation: z.string().optional(),
  lowStock: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 50, 100)).optional(),
  offset: z.string().transform(val => Math.max(parseInt(val) || 0, 0)).optional(),
});

/**
 * GET /api/vault/inventory
 * Get vault inventory summary
 */
router.get('/inventory',
  checkVaultEnabled,
  validateQuery(inventoryQuerySchema),
  asyncHandler(async (req, res) => {
    const balances = await VaultCustodyService.getVaultBalances();

    res.json({
      code: 'SUCCESS',
      data: { balances },
    });
  })
);

/**
 * GET /api/vault/inventory/summary
 * Get inventory summary statistics
 */
router.get('/inventory/summary',
  checkVaultEnabled,
  asyncHandler(async (req, res) => {
    const summary = await VaultCustodyService.getInventorySummary();

    res.json({
      code: 'SUCCESS',
      data: summary,
    });
  })
);

/**
 * GET /api/vault/inventory/levels
 * Check inventory levels across all locations
 */
router.get('/inventory/levels',
  checkVaultEnabled,
  asyncHandler(async (req, res) => {
    const levels = await DillonGageService.checkInventoryLevels();

    res.json({
      code: 'SUCCESS',
      data: { levels },
    });
  })
);

/**
 * GET /api/vault/inventory/low-stock
 * Get items that need restocking
 */
router.get('/inventory/low-stock',
  checkVaultEnabled,
  validateQuery(z.object({
    threshold: z.string().transform(val => parseInt(val) || 10).pipe(z.number().min(1).max(100)).optional(),
  })),
  asyncHandler(async (req, res) => {
    const threshold = req.query.threshold as number || 10;
    const lowStockItems = await VaultCustodyService.getLowStockItems(threshold);

    res.json({
      code: 'SUCCESS',
      data: { items: lowStockItems },
    });
  })
);

/**
 * POST /api/vault/inventory/restock
 * Restock vault inventory
 */
router.post('/inventory/restock',
  checkVaultEnabled,
  validateBody(restockRequestSchema),
  asyncHandler(async (req, res) => {
    const { sku, quantity, unitCost } = req.body;

    await VaultCustodyService.restockInventory(sku, quantity, unitCost);

    res.json({
      code: 'SUCCESS',
      message: 'Inventory restock completed successfully',
      data: { sku, quantity },
    });
  })
);

/**
 * POST /api/vault/inventory/auto-restock
 * Trigger automatic restocking based on inventory levels
 */
router.post('/inventory/auto-restock',
  checkVaultEnabled,
  asyncHandler(async (req, res) => {
    const result = await DillonGageService.triggerAutoRestock();

    res.json({
      code: 'SUCCESS',
      message: 'Auto restock process completed',
      data: result,
    });
  })
);

/**
 * GET /api/vault/restock/history
 * Get restock history
 */
router.get('/restock/history',
  checkVaultEnabled,
  validateQuery(z.object({
    limit: z.string().transform(val => Math.min(parseInt(val) || 50, 100)).optional(),
    location: z.string().optional(),
    metal: z.enum(['AU', 'AG', 'PT', 'PD', 'CU']).optional(),
  })),
  asyncHandler(async (req, res) => {
    const { limit, location, metal } = req.query as any;

    const history = await DillonGageService.getRestockHistory(limit, location, metal);

    res.json({
      code: 'SUCCESS',
      data: { history },
    });
  })
);

/**
 * POST /api/vault/branch/restock
 * Restock branch inventory
 */
router.post('/branch/restock',
  checkVaultEnabled,
  validateBody(branchRestockSchema),
  asyncHandler(async (req, res) => {
    const { branchId, metal, quantity } = req.body;

    const response = await DillonGageService.restockBranch(branchId, metal, quantity);

    res.json({
      code: 'SUCCESS',
      message: 'Branch restock initiated successfully',
      data: response,
    });
  })
);

/**
 * GET /api/vault/redemptions/pending
 * Get pending redemption requests (admin view)
 */
router.get('/redemptions/pending',
  checkVaultEnabled,
  validateQuery(z.object({
    status: z.enum(['PENDING', 'APPROVED', 'ALLOCATED', 'SHIPPED']).optional(),
    limit: z.string().transform(val => Math.min(parseInt(val) || 50, 100)).optional(),
    offset: z.string().transform(val => Math.max(parseInt(val) || 0, 0)).optional(),
  })),
  asyncHandler(async (req, res) => {
    // Mock implementation - would query redemption_requests table
    const mockRedemptions = [];

    res.json({
      code: 'SUCCESS',
      data: { 
        redemptions: mockRedemptions,
        total: 0,
      },
    });
  })
);

/**
 * POST /api/vault/redemptions/:id/approve
 * Approve a redemption request
 */
router.post('/redemptions/:id/approve',
  checkVaultEnabled,
  validateBody(z.object({
    notes: z.string().max(500).optional(),
  })),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;

    if (!id.match(/^[a-f0-9-]+$/)) {
      throw createError.validation('Invalid redemption ID format');
    }

    // Mock implementation - would update redemption status
    // TODO: Implement actual redemption approval logic
    // await RedemptionService.approveRedemption(id, req.user!.id, notes);

    res.json({
      code: 'SUCCESS',
      message: 'Redemption request approved successfully',
    });
  })
);

/**
 * POST /api/vault/redemptions/:id/ship
 * Mark redemption as shipped
 */
router.post('/redemptions/:id/ship',
  checkVaultEnabled,
  validateBody(z.object({
    trackingNumber: z.string().min(1).max(100),
    shippingCarrier: z.string().max(50).default('FEDEX'),
  })),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { trackingNumber, shippingCarrier } = req.body;

    if (!id.match(/^[a-f0-9-]+$/)) {
      throw createError.validation('Invalid redemption ID format');
    }

    await VaultCustodyService.markShipped(id, trackingNumber, shippingCarrier);

    res.json({
      code: 'SUCCESS',
      message: 'Redemption marked as shipped successfully',
      data: { trackingNumber, shippingCarrier },
    });
  })
);

/**
 * GET /api/vault/stats
 * Get vault and redemption statistics
 */
router.get('/stats',
  checkVaultEnabled,
  asyncHandler(async (req, res) => {
    const [inventorySummary, restockStats, redemptionStats] = await Promise.all([
      VaultCustodyService.getInventorySummary(),
      DillonGageService.getServiceStatistics(),
      // RedemptionService.getRedemptionStats(), // Would implement
    ]);

    const stats = {
      inventory: inventorySummary,
      restock: restockStats,
      // redemption: redemptionStats,
    };

    res.json({
      code: 'SUCCESS',
      data: stats,
    });
  })
);

export default router;
