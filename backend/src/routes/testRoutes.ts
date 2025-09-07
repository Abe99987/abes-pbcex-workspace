import { Router } from 'express';
import { env } from '@/config/env';
import { AuthController } from '@/controllers/AuthController';
import { WalletController } from '@/controllers/WalletController';
import { KYC_STATUS, ACCOUNT_TYPES, REAL_ASSETS, USER_ROLES } from '@/utils/constants';
import { v4 as uuidv4 } from 'uuid';
import { AccountUtils } from '@/models/Account';

const router = Router();

// Safety: Disable in production
router.use((req, res, next) => {
  if (env.NODE_ENV === 'production') {
    res.status(404).json({ code: 'NOT_FOUND' });
    return;
  }
  next();
});

/**
 * POST /api/test/kyc/auto-approve
 * Body: { email?: string }
 * Forces user's KYC to APPROVED (test-only)
 */
router.post('/kyc/auto-approve', (req, res) => {
  const email = (req.body?.email as string | undefined)?.toLowerCase();
  const users = AuthController.getAllUsers();
  const user = email
    ? users.find(u => u.email.toLowerCase() === email)
    : users[users.length - 1];

  if (!user) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' });
    return;
  }

  user.kycStatus = KYC_STATUS.APPROVED;
  user.emailVerified = true;
  user.updatedAt = new Date();

  res.json({
    code: 'SUCCESS',
    message: 'KYC set to APPROVED (test-only) for user',
    data: { userId: user.id, email: user.email, kycStatus: user.kycStatus },
  });
});

/**
 * POST /api/test/balances/setup
 * Body: { email: string, balances: Record<string,string> }
 * Seeds balances into appropriate accounts (test-only, in-memory)
 */
router.post('/balances/setup', async (req, res) => {
  const { email, balances } = req.body as {
    email: string;
    balances: Record<string, string>;
  };

  if (!email || !balances) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'email and balances required' });
    return;
  }

  const allUsers = AuthController.getAllUsers();
  const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' });
    return;
  }

  // If dev fake login is enabled, ensure dev-user-id exists and seed it too
  let devUser: any = null;
  if (process.env.DEV_FAKE_LOGIN === 'true') {
    devUser = allUsers.find(u => u.id === 'dev-user-id');
    if (!devUser) {
      const now = new Date();
      devUser = {
        id: 'dev-user-id',
        email: 'dev@local.test',
        passwordHash: 'dev-bypass',
        role: USER_ROLES.USER,
        kycStatus: KYC_STATUS.APPROVED,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: false,
        loginCount: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      AuthController.addUser(devUser);
    }
  }

  // Ensure both FUNDING and TRADING accounts exist
  const userAccounts = AuthController.getUserAccounts(user.id);
  let funding = userAccounts.find(a => a.type === ACCOUNT_TYPES.FUNDING);
  let trading = userAccounts.find(a => a.type === ACCOUNT_TYPES.TRADING);

  const now = new Date();
  if (!funding) {
    const fundingAccount = {
      id: uuidv4(),
      userId: user.id,
      type: ACCOUNT_TYPES.FUNDING,
      name: AccountUtils.getDefaultName(ACCOUNT_TYPES.FUNDING),
      description: AccountUtils.getDefaultDescription(ACCOUNT_TYPES.FUNDING),
      custodyProvider: 'PAXOS',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    AuthController.addUserAccount(user.id, fundingAccount as any);
    funding = fundingAccount as any;
  }

  if (!trading) {
    const tradingAccount = {
      id: uuidv4(),
      userId: user.id,
      type: ACCOUNT_TYPES.TRADING,
      name: AccountUtils.getDefaultName(ACCOUNT_TYPES.TRADING),
      description: AccountUtils.getDefaultDescription(ACCOUNT_TYPES.TRADING),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    AuthController.addUserAccount(user.id, tradingAccount as any);
    trading = tradingAccount as any;
  }

  const entries = Object.entries(balances);
  const targetUsers = [user, devUser].filter(Boolean) as Array<{ id: string }>;
  for (const u of targetUsers) {
    // Ensure accounts for each target user
    const ua = AuthController.getUserAccounts(u.id);
    let f = ua.find(a => a.type === ACCOUNT_TYPES.FUNDING);
    let t = ua.find(a => a.type === ACCOUNT_TYPES.TRADING);
    const now2 = new Date();
    if (!f) {
      AuthController.addUserAccount(u.id, {
        id: uuidv4(), userId: u.id, type: ACCOUNT_TYPES.FUNDING,
        name: AccountUtils.getDefaultName(ACCOUNT_TYPES.FUNDING),
        description: AccountUtils.getDefaultDescription(ACCOUNT_TYPES.FUNDING),
        custodyProvider: 'PAXOS', isActive: true, createdAt: now2, updatedAt: now2,
      } as any);
    }
    if (!t) {
      AuthController.addUserAccount(u.id, {
        id: uuidv4(), userId: u.id, type: ACCOUNT_TYPES.TRADING,
        name: AccountUtils.getDefaultName(ACCOUNT_TYPES.TRADING),
        description: AccountUtils.getDefaultDescription(ACCOUNT_TYPES.TRADING),
        isActive: true, createdAt: now2, updatedAt: now2,
      } as any);
    }
    // Seed balances for each requested asset
    for (const [assetRaw, amount] of entries) {
      const asset = assetRaw as string;
      const accountType = (REAL_ASSETS as readonly string[]).includes(asset)
        ? ACCOUNT_TYPES.FUNDING
        : ACCOUNT_TYPES.TRADING;
      try {
        // eslint-disable-next-line no-await-in-loop
        await WalletController.seedBalanceForTest(u.id, accountType, asset, String(amount));
      } catch (e) {
        res.status(500).json({ code: 'INTERNAL_ERROR', message: `Failed to seed ${asset} for user ${u.id}`, error: (e as Error).message });
        return;
      }
    }
  }

  // Summarize ensured accounts/assets for debug
  const ensured = Object.keys(balances);
  res.status(201).json({ 
    code: 'SUCCESS', 
    message: 'Balances seeded', 
    data: { 
      email, 
      accounts: { fundingId: funding?.id, tradingId: trading?.id }, 
      assets: ensured 
    } 
  });
});

/**
 * POST /api/test/products/create
 * Minimal stub for E2E setup convenience
 */
router.post('/products/create', (req, res) => {
  res.status(201).json({ code: 'SUCCESS', message: 'Product stub created' });
});

/**
 * POST /api/test/vault/setup
 * Minimal stub for E2E setup convenience
 */
router.post('/vault/setup', (req, res) => {
  res.status(201).json({ code: 'SUCCESS', message: 'Vault stub configured' });
});

export default router;


