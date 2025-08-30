import { Router } from 'express';
import { authenticate, requireKyc } from '@/middlewares/authMiddleware';
import { validateBody, validateQuery } from '@/utils/validators';
import {
  transferSchema,
  depositSchema,
  withdrawalSchema,
} from '@/utils/validators';
import { WalletController } from '@/controllers/WalletController';
import { WalletControllerDb } from '@/controllers/WalletControllerDb';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

/**
 * GET /api/wallet/balances
 * Get user account balances (Database-first with fallback)
 */
router.get('/balances', WalletControllerDb.getBalances);

/**
 * POST /api/wallet/transfer
 * Transfer between funding and trading accounts (PAXG ↔ XAU-s conversion)
 */
router.post(
  '/transfer',
  requireKyc(['APPROVED']),
  validateBody(transferSchema),
  WalletController.transfer
);

/**
 * POST /api/wallet/deposit
 * Initiate deposit to funding account
 */
router.post(
  '/deposit',
  requireKyc(['APPROVED']),
  validateBody(depositSchema),
  WalletController.deposit
);

/**
 * POST /api/wallet/withdraw
 * Initiate withdrawal from funding account
 */
router.post(
  '/withdraw',
  requireKyc(['APPROVED']),
  validateBody(withdrawalSchema),
  WalletController.withdraw
);

/**
 * GET /api/wallet/transactions
 * Get transaction history with filters
 */
router.get(
  '/transactions',
  validateQuery(
    z.object({
      q: z.string().optional(), // Search query
      asset: z.string().optional(),
      type: z.string().optional(),
      status: z.string().optional(),
      date_from: z.string().optional(),
      date_to: z.string().optional(),
      limit: z.string().optional(),
      offset: z.string().optional(),
    })
  ),
  WalletControllerDb.getTransactions
);

/**
 * GET /api/wallet/transactions/export.csv
 * Export transaction history as CSV
 */
router.get(
  '/transactions/export.csv',
  validateQuery(
    z.object({
      asset: z.string().optional(),
      type: z.string().optional(),
      status: z.string().optional(),
      date_from: z.string().optional(),
      date_to: z.string().optional(),
    })
  ),
  WalletControllerDb.exportTransactionsCsv
);

/**
 * GET /api/wallet/transactions/export.xlsx
 * Export transaction history as Excel
 */
router.get(
  '/transactions/export.xlsx',
  validateQuery(
    z.object({
      asset: z.string().optional(),
      type: z.string().optional(),
      status: z.string().optional(),
      date_from: z.string().optional(),
      date_to: z.string().optional(),
    })
  ),
  WalletControllerDb.exportTransactionsExcel
);

export default router;
