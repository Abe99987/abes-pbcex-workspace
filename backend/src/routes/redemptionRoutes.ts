import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler, createError } from '@/middlewares/errorMiddleware';
import { authenticate, requireKyc } from '@/middlewares/authMiddleware';
import { validateBody, validateQuery } from '@/utils/validators';
import { env } from '@/config/env';
import RedemptionService from '@/services/RedemptionService';
import { z } from 'zod';

interface UserPayload {
  id: string;
  role: string;
}

type AuthedRequest<T = unknown> = Request & { user: UserPayload; body: T };

const router = Router();

// All redemption routes require authentication and approved KYC
router.use(authenticate);
router.use(requireKyc(['APPROVED']));

// Validation schemas
const redemptionQuoteSchema = z.object({
  asset: z.string().regex(/^X[A-Z]{2,3}-s$/, 'Invalid synthetic asset format'),
  amount: z
    .string()
    .regex(/^\d+\.?\d*$/, 'Amount must be a valid decimal number'),
  format: z.enum(['BAR', 'COIN', 'SHEET', 'COIL', 'ROUND']),
});

const redemptionRequestSchema = z.object({
  asset: z.string().regex(/^X[A-Z]{2,3}-s$/, 'Invalid synthetic asset format'),
  amount: z
    .string()
    .regex(/^\d+\.?\d*$/, 'Amount must be a valid decimal number'),
  format: z.enum(['BAR', 'COIN', 'SHEET', 'COIL', 'ROUND']),
  shippingAddress: z.object({
    name: z.string().min(1).max(100),
    line1: z.string().min(1).max(100),
    line2: z.string().max(100).optional(),
    city: z.string().min(1).max(50),
    state: z.string().min(2).max(50),
    postalCode: z.string().min(5).max(10),
    country: z.string().length(2).default('US'),
    phone: z.string().min(10).max(20),
  }),
  preferences: z
    .object({
      vaultLocation: z.string().optional(),
      priority: z.boolean().default(false),
      insuranceRequired: z.boolean().default(true),
    })
    .optional(),
});

/**
 * Feature flag check middleware
 */
const checkRedemptionEnabled = (
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

/**
 * GET /api/redeem/quote
 * Get redemption quote for synthetic asset
 */
router.get(
  '/quote',
  checkRedemptionEnabled,
  validateQuery(redemptionQuoteSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { asset, amount, format } = req.query as z.infer<
      typeof redemptionQuoteSchema
    >;

    const quote = await RedemptionService.getRedemptionQuote(
      asset,
      amount,
      format
    );

    res.json({
      code: 'SUCCESS',
      data: { quote },
    });
  })
);

/**
 * POST /api/redeem
 * Submit redemption request
 */
router.post(
  '/',
  checkRedemptionEnabled,
  validateBody(redemptionRequestSchema),
  asyncHandler(
    async (
      req: AuthedRequest<z.infer<typeof redemptionRequestSchema>>,
      res: Response
    ) => {
      const redemptionInput = {
        userId: req.user.id,
        ...req.body,
      };

      const redemptionRequest =
        await RedemptionService.requestRedemption(redemptionInput);

      res.status(201).json({
        code: 'SUCCESS',
        message: 'Redemption request submitted successfully',
        data: {
          redemption: redemptionRequest,
          referenceNumber: `RED-${redemptionRequest.id.substring(0, 8).toUpperCase()}`,
        },
      });
    }
  )
);

/**
 * GET /api/redeem/history
 * Get user's redemption history
 */
router.get(
  '/history',
  checkRedemptionEnabled,
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const limitParam = req.query.limit;
    const offsetParam = req.query.offset;

    const limit = Math.min(
      typeof limitParam === 'string' && /^\d+$/.test(limitParam)
        ? parseInt(limitParam)
        : 50,
      100
    );
    const offset = Math.max(
      typeof offsetParam === 'string' && /^\d+$/.test(offsetParam)
        ? parseInt(offsetParam)
        : 0,
      0
    );

    const result = await RedemptionService.getUserRedemptions(
      req.user.id,
      limit,
      offset
    );

    res.json({
      code: 'SUCCESS',
      data: result,
    });
  })
);

/**
 * GET /api/redeem/status/:id
 * Get redemption status by ID
 */
router.get(
  '/status/:id',
  checkRedemptionEnabled,
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { id } = req.params;

    if (!id || !id.match(/^[a-f0-9-]+$/)) {
      throw createError.validation('Invalid redemption ID format');
    }

    const redemption = await RedemptionService.getRedemptionStatus(id);

    // Check ownership
    if (redemption.userId !== req.user.id && req.user.role !== 'ADMIN') {
      throw createError.authorization('Access denied');
    }

    res.json({
      code: 'SUCCESS',
      data: { redemption },
    });
  })
);

/**
 * POST /api/redeem/:id/cancel
 * Cancel a redemption request
 */
router.post(
  '/:id/cancel',
  checkRedemptionEnabled,
  validateBody(
    z.object({
      reason: z.string().max(500).optional(),
    })
  ),
  asyncHandler(
    async (req: AuthedRequest<{ reason?: string }>, res: Response) => {
      const { id } = req.params;
      const { reason } = req.body;

      if (!id || !id.match(/^[a-f0-9-]+$/)) {
        throw createError.validation('Invalid redemption ID format');
      }

      await RedemptionService.cancelRedemption(id, req.user.id, reason);

      res.json({
        code: 'SUCCESS',
        message: 'Redemption request cancelled successfully',
      });
    }
  )
);

/**
 * GET /api/redeem/stats (Admin only)
 * Get redemption statistics
 */
router.get(
  '/stats',
  checkRedemptionEnabled,
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    // Check admin role
    if (req.user.role !== 'ADMIN') {
      throw createError.authorization('Admin access required');
    }

    const stats = await RedemptionService.getRedemptionStats();

    res.json({
      code: 'SUCCESS',
      data: stats,
    });
  })
);

export default router;
