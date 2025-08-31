import { Router, Request, Response, NextFunction } from 'express';
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
const checkVaultEnabled = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!env.ENABLE_VAULT_REDEMPTION) {
    res.status(501).json({
      code: 'SERVICE_UNAVAILABLE',
      message: 'Vault redemption services are not implemented',
      feature: 'ENABLE_VAULT_REDEMPTION',
      status: 'DISABLED',
    });
    return;
  }
  next();
};

// Validation schemas
const restockRequestSchema = z.object({
  sku: z.string().min(1).max(50),
  quantity: z.number().int().min(1).max(1000),
  unitCost: z
    .string()
    .regex(/^\d+\.?\d*$/)
    .optional(),
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
  lowStock: z.coerce.boolean().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * GET /api/vault/inventory
 * Get vault inventory summary
 */
router.get(
  '/inventory',
  checkVaultEnabled,
  validateQuery(inventoryQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
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
router.get(
  '/inventory/summary',
  checkVaultEnabled,
  asyncHandler(async (req: Request, res: Response) => {
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
router.get(
  '/inventory/levels',
  checkVaultEnabled,
  asyncHandler(async (req: Request, res: Response) => {
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
router.get(
  '/inventory/low-stock',
  checkVaultEnabled,
  validateQuery(
    z.object({
      threshold: z.coerce.number().min(1).max(100).default(10),
    })
  ),
  asyncHandler(async (req: Request, res: Response) => {
    // Zod validation ensures threshold is a number, but we need to access it safely
    const validatedQuery = req.query as { threshold?: number };
    const threshold = validatedQuery.threshold ?? 10;
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
router.post(
  '/inventory/restock',
  checkVaultEnabled,
  validateBody(restockRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { sku, quantity, unitCost } = req.body as {
      sku: string;
      quantity: number;
      unitCost?: string;
    };

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
router.post(
  '/inventory/auto-restock',
  checkVaultEnabled,
  asyncHandler(async (req: Request, res: Response) => {
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
router.get(
  '/restock/history',
  checkVaultEnabled,
  validateQuery(
    z.object({
      limit: z.coerce.number().min(1).max(100).default(50),
      location: z.string().optional(),
      metal: z.enum(['AU', 'AG', 'PT', 'PD', 'CU']).optional(),
    })
  ),
  asyncHandler(async (req: Request, res: Response) => {
    // Zod validation ensures proper types
    const validatedQuery = req.query as {
      limit?: number;
      location?: string;
      metal?: 'AU' | 'AG' | 'PT' | 'PD' | 'CU';
    };
    const { limit, location, metal } = validatedQuery;

    const history = await DillonGageService.getRestockHistory(
      limit,
      location,
      metal
    );

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
router.post(
  '/branch/restock',
  checkVaultEnabled,
  validateBody(branchRestockSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { branchId, metal, quantity } = req.body as {
      branchId: string;
      metal: 'AU' | 'AG' | 'PT' | 'PD' | 'CU';
      quantity: number;
    };

    const response = await DillonGageService.restockBranch(
      branchId,
      metal,
      quantity
    );

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
router.get(
  '/redemptions/pending',
  checkVaultEnabled,
  validateQuery(
    z.object({
      status: z
        .enum(['PENDING', 'APPROVED', 'ALLOCATED', 'SHIPPED'])
        .optional(),
      limit: z.coerce.number().min(1).max(100).default(50),
      offset: z.coerce.number().min(0).default(0),
    })
  ),
  asyncHandler(async (req: Request, res: Response) => {
    // Mock implementation - would query redemption_requests table
    const mockRedemptions: Array<{
      id: string;
      userId: string;
      asset: string;
      status: string;
      createdAt: Date;
    }> = [];

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
router.post(
  '/redemptions/:id/approve',
  checkVaultEnabled,
  validateBody(
    z.object({
      notes: z.string().max(500).optional(),
    })
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9-]+$/)) {
      res.status(400).json({
        code: 'BAD_REQUEST',
        message: 'Missing or invalid redemption ID format',
      });
      return;
    }

    const { notes } = req.body as { notes?: string };

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
router.post(
  '/redemptions/:id/ship',
  checkVaultEnabled,
  validateBody(
    z.object({
      trackingNumber: z.string().min(1).max(100),
      shippingCarrier: z.string().max(50).default('FEDEX'),
    })
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || !id.match(/^[a-f0-9-]+$/)) {
      res.status(400).json({
        code: 'BAD_REQUEST',
        message: 'Missing or invalid redemption ID format',
      });
      return;
    }

    const { trackingNumber, shippingCarrier } = req.body as {
      trackingNumber: string;
      shippingCarrier: string;
    };

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
router.get(
  '/stats',
  checkVaultEnabled,
  asyncHandler(async (req: Request, res: Response) => {
    const [inventorySummary, restockStats] = await Promise.all([
      VaultCustodyService.getInventorySummary(),
      DillonGageService.getServiceStatistics(),
    ]);
    // Would add: const redemptionStats = await RedemptionService.getRedemptionStats();

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
