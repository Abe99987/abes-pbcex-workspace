import { Router } from 'express';
import { authenticate, requireKyc } from '@/middlewares/authMiddleware';
import { validateBody, validateQuery } from '@/utils/validators';
import { transferSchema, depositSchema, withdrawalSchema } from '@/utils/validators';
import { WalletController } from '@/controllers/WalletController';
import { z } from 'zod';

const router = Router();

router.use(authenticate);

/**
 * GET /api/wallet/balances
 * Get user account balances
 */
router.get('/balances',
  WalletController.getBalances
);

/**
 * POST /api/wallet/transfer
 * Transfer between funding and trading accounts (PAXG ↔ XAU-s conversion)
 */
router.post('/transfer',
  requireKyc(['APPROVED']),
  validateBody(transferSchema),
  WalletController.transfer
);

/**
 * POST /api/wallet/deposit
 * Initiate deposit to funding account
 */
router.post('/deposit',
  requireKyc(['APPROVED']),
  validateBody(depositSchema),
  WalletController.deposit
);

/**
 * POST /api/wallet/withdraw
 * Initiate withdrawal from funding account
 */
router.post('/withdraw',
  requireKyc(['APPROVED']),
  validateBody(withdrawalSchema),
  WalletController.withdraw
);

/**
 * GET /api/wallet/transactions
 * Get transaction history
 */
router.get('/transactions',
  validateQuery(z.object({
    limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
    offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
    type: z.enum(['CREDIT', 'DEBIT', 'LOCK', 'UNLOCK', 'TRANSFER_IN', 'TRANSFER_OUT', 'TRADE', 'FEE', 'MINT', 'BURN']).optional(),
  })),
  WalletController.getTransactions
);

export default router;