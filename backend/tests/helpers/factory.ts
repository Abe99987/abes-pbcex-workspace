import { query } from './db';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../src/models/User';
import { Account } from '../../src/models/Account';
import { Balance } from '../../src/models/Balance';
import { Trade } from '../../src/models/Trade';
import { Order } from '../../src/models/Order';

import { KycRecord } from '../../src/models/KycRecord';

// -------------------------------------------------------------
// Local factory input types for DB-less tests
// These are intentionally minimal and only include fields used
// within this file to construct model-shaped objects. They are
// NOT exported and do not affect production code.
// -------------------------------------------------------------
type FactoryUser = {
  id?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: 'ADMIN' | 'USER' | 'TELLER' | 'SUPPORT';
  kycStatus?: 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  emailVerified?: boolean;
  phoneVerified?: boolean;
  phone?: string | null;
};

type FactoryAccount = {
  id?: string;
  userId?: string;
  name?: string;
  type?: 'FUNDING' | 'TRADING';
  isActive?: boolean;
  [key: string]: any;
};

type FactoryBalance = {
  id?: string;
  accountId?: string;
  asset?: string;
  amount?: string;
  lockedAmount?: string;
  createdAt?: Date;
  [key: string]: any;
};

type FactoryTrade = {
  id?: string;
  userId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  assetSold?: string;
  assetBought?: string;
  amountSold?: string;
  amountBought?: string;
  price?: string;
  feeAmount?: string;
  feeAsset?: string;
  status?: 'PENDING' | 'FILLED' | 'CANCELLED' | 'FAILED';
  orderType?: 'MARKET' | 'LIMIT';
};

type FactoryOrder = {
  id?: string;
  userId?: string;
  productCode?: string;
  productName?: string;
  productCategory?: 'COINS' | 'BARS' | 'ROUNDS' | 'JEWELRY';
  metal?: 'AU' | 'AG' | 'CU' | 'CRUDE';
  quantity?: number;
  unitPrice?: string;
  totalPrice?: string;
  status?:
    | 'QUOTE_LOCKED'
    | 'PENDING'
    | 'PROCESSING'
    | 'FULFILLED'
    | 'CANCELLED';
};

type FactoryKycRecord = {
  id?: string;
  userId?: string;
  type?: 'PERSONAL' | 'BUSINESS';
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  submissionData?: any;
};

const USE_NO_DB = process.env.TEST_NO_DB === '1';
const now = () => new Date();

/**
 * Factory for creating test users
 */
export async function createUser(overrides: FactoryUser = {}): Promise<User> {
  const userData = {
    id: overrides.id || uuidv4(),
    email: overrides.email || `test-${Date.now()}@example.com`,
    password: overrides.password || 'password123',
    firstName: overrides.firstName || 'Test',
    lastName: overrides.lastName || 'User',
    role: overrides.role || 'USER',
    kycStatus: overrides.kycStatus || 'NOT_STARTED',
    emailVerified: overrides.emailVerified ?? false,
    phoneVerified: overrides.phoneVerified ?? false,
    phone: overrides.phone || null,
  };

  if (USE_NO_DB) {
    return {
      id: userData.id,
      email: userData.email,
      passwordHash: await bcrypt.hash(userData.password, 10),
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role as any,
      kycStatus: userData.kycStatus as any,
      emailVerified: !!userData.emailVerified,
      phoneVerified: !!userData.phoneVerified,
      phone: userData.phone ?? null,
      twoFactorEnabled: false,
      lastLoginAt: null,
      loginCount: 0,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    } as unknown as User;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(userData.password, 10);

  const result = await query(
    `
    INSERT INTO users (
      id, email, password_hash, first_name, last_name, role, 
      kyc_status, email_verified, phone_verified, phone
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `,
    [
      userData.id,
      userData.email,
      passwordHash,
      userData.firstName,
      userData.lastName,
      userData.role,
      userData.kycStatus,
      userData.emailVerified,
      userData.phoneVerified,
      userData.phone,
    ]
  );

  return {
    id: result.rows[0].id,
    email: result.rows[0].email,
    passwordHash: result.rows[0].password_hash,
    firstName: result.rows[0].first_name,
    lastName: result.rows[0].last_name,
    role: result.rows[0].role,
    kycStatus: result.rows[0].kyc_status,
    emailVerified: result.rows[0].email_verified,
    phoneVerified: result.rows[0].phone_verified,
    phone: result.rows[0].phone,
    twoFactorEnabled: result.rows[0].two_factor_enabled,
    lastLoginAt: result.rows[0].last_login_at,
    loginCount: result.rows[0].login_count ?? 0,
    isActive: result.rows[0].is_active ?? true,
    createdAt: result.rows[0].created_at,
    updatedAt: result.rows[0].updated_at,
  };
}

/**
 * Factory for creating test accounts
 */
export async function createAccount(
  overrides: FactoryAccount = {}
): Promise<Account> {
  let userId = overrides.userId;

  // Create user if not provided
  if (!userId) {
    const user = await createUser();
    userId = user.id;
  }

  const accountData = {
    id: overrides.id || uuidv4(),
    userId: userId,
    name: (overrides as any).name || 'Default Account',
    type: overrides.type || 'FUNDING',
    isActive: overrides.isActive ?? true,
  };

  if (USE_NO_DB) {
    return {
      id: accountData.id,
      userId: accountData.userId,
      name: accountData.name,
      type: accountData.type as any,
      isActive: !!accountData.isActive,
      createdAt: now(),
      updatedAt: now(),
    } as unknown as Account;
  }

  const result = await query(
    `
    INSERT INTO accounts (id, user_id, type, is_active)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `,
    [accountData.id, accountData.userId, accountData.type, accountData.isActive]
  );

  return {
    id: result.rows[0].id,
    userId: result.rows[0].user_id,
    name: accountData.name,
    type: result.rows[0].type,
    isActive: result.rows[0].is_active,
    createdAt: result.rows[0].created_at,
    updatedAt: result.rows[0].updated_at,
  };
}

/**
 * Factory for creating test balances
 */
export async function createBalance(
  overrides: FactoryBalance = {}
): Promise<Balance> {
  let accountId = overrides.accountId;

  // Create account if not provided
  if (!accountId) {
    const account = await createAccount();
    accountId = account.id;
  }

  const balanceData = {
    accountId: accountId,
    asset: overrides.asset || 'USD',
    amount: overrides.amount || '1000.00',
    lockedAmount: overrides.lockedAmount || '0.00',
  };

  if (USE_NO_DB) {
    return {
      id: 'bal_' + uuidv4(),
      accountId: balanceData.accountId,
      asset: balanceData.asset,
      amount: balanceData.amount,
      lockedAmount: balanceData.lockedAmount,
      createdAt: now(),
      lastUpdated: now(),
    } as unknown as Balance;
  }

  const result = await query(
    `
    INSERT INTO balances (account_id, asset, amount, locked_amount)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (account_id, asset) DO UPDATE SET
      amount = EXCLUDED.amount,
      locked_amount = EXCLUDED.locked_amount,
      last_updated = NOW()
    RETURNING *
  `,
    [
      balanceData.accountId,
      balanceData.asset,
      balanceData.amount,
      balanceData.lockedAmount,
    ]
  );

  return {
    id: result.rows[0].id ?? 'bal_' + uuidv4(),
    accountId: result.rows[0].account_id,
    asset: result.rows[0].asset,
    amount: result.rows[0].amount,
    lockedAmount: result.rows[0].locked_amount,
    createdAt:
      result.rows[0].created_at ?? result.rows[0].last_updated ?? now(),
    lastUpdated: result.rows[0].last_updated,
  };
}

/**
 * Factory for creating test trades
 */
export async function createTrade(
  overrides: FactoryTrade = {}
): Promise<Trade> {
  let userId = overrides.userId;

  // Create user if not provided
  if (!userId) {
    const user = await createUser();
    userId = user.id;
  }

  // Create accounts if not provided
  let fromAccountId = overrides.fromAccountId;
  let toAccountId = overrides.toAccountId;

  if (!fromAccountId) {
    const fromAccount = await createAccount({ userId, type: 'FUNDING' });
    fromAccountId = fromAccount.id;
  }

  if (!toAccountId) {
    const toAccount = await createAccount({ userId, type: 'TRADING' });
    toAccountId = toAccount.id;
  }

  const tradeData = {
    id: overrides.id || uuidv4(),
    userId: userId,
    fromAccountId: fromAccountId,
    toAccountId: toAccountId,
    assetSold: overrides.assetSold || 'USD',
    assetBought: overrides.assetBought || 'PAXG',
    amountSold: overrides.amountSold || '2150.00',
    amountBought: overrides.amountBought || '1.00000000',
    price: overrides.price || '2150.00',
    feeAmount: overrides.feeAmount || '0',
    feeAsset: overrides.feeAsset || 'USD',
    status: overrides.status || 'FILLED',
    orderType: overrides.orderType || 'MARKET',
  };

  if (USE_NO_DB) {
    return {
      id: tradeData.id,
      userId: tradeData.userId,
      fromAccountId: tradeData.fromAccountId,
      toAccountId: tradeData.toAccountId,
      assetSold: tradeData.assetSold,
      assetBought: tradeData.assetBought,
      amountSold: tradeData.amountSold,
      amountBought: tradeData.amountBought,
      price: tradeData.price,
      feeAmount: tradeData.feeAmount,
      feeAsset: tradeData.feeAsset,
      status: tradeData.status as any,
      orderType: tradeData.orderType as any,
      executedAt: tradeData.status === 'FILLED' ? now() : undefined,
      reference: undefined,
      metadata: undefined,
      createdAt: now(),
      updatedAt: now(),
    } as unknown as Trade;
  }

  const result = await query(
    `
    INSERT INTO trades (
      id, user_id, from_account_id, to_account_id, asset_sold, asset_bought, 
      amount_sold, amount_bought, price, fee_amount, fee_asset, status, order_type, executed_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `,
    [
      tradeData.id,
      tradeData.userId,
      tradeData.fromAccountId,
      tradeData.toAccountId,
      tradeData.assetSold,
      tradeData.assetBought,
      tradeData.amountSold,
      tradeData.amountBought,
      tradeData.price,
      tradeData.feeAmount,
      tradeData.feeAsset,
      tradeData.status,
      tradeData.orderType,
      tradeData.status === 'FILLED' ? new Date() : null,
    ]
  );

  return {
    id: result.rows[0].id,
    userId: result.rows[0].user_id,
    fromAccountId: result.rows[0].from_account_id,
    toAccountId: result.rows[0].to_account_id,
    assetSold: result.rows[0].asset_sold,
    assetBought: result.rows[0].asset_bought,
    amountSold: result.rows[0].amount_sold,
    amountBought: result.rows[0].amount_bought,
    price: result.rows[0].price,
    feeAmount: result.rows[0].fee_amount,
    feeAsset: result.rows[0].fee_asset,
    status: result.rows[0].status,
    orderType: result.rows[0].order_type,
    executedAt: result.rows[0].executed_at,
    reference: result.rows[0].reference,
    metadata: result.rows[0].metadata,
    createdAt: result.rows[0].created_at,
    updatedAt: result.rows[0].updated_at,
  } as unknown as Trade;
}

/**
 * Factory for creating test orders
 */
export async function createOrder(
  overrides: FactoryOrder = {}
): Promise<Order> {
  let userId = overrides.userId;

  // Create user if not provided
  if (!userId) {
    const user = await createUser();
    userId = user.id;
  }

  const orderData = {
    id: overrides.id || uuidv4(),
    userId: userId,
    productCode: overrides.productCode || 'AU-EAGLE-1OZ',
    productName: overrides.productName || 'Gold Eagle 1oz',
    productCategory: 'COINS' as const,
    metal: 'AU' as const,
    quantity: overrides.quantity || 1,
    unitPrice: overrides.unitPrice || '2150.00',
    totalPrice: overrides.totalPrice || '2150.00',
    lockedPrice: overrides.unitPrice || '2150.00',
    lockExpiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
    status: overrides.status || 'QUOTE_LOCKED',
    paymentMethod: 'BALANCE' as const,
    shippingAddress: {
      name: 'Test User',
      line1: '123 Test St',
      city: 'Test City',
      state: 'TS',
      postalCode: '12345',
      country: 'US',
      phone: '555-123-4567',
    },
    shipping: {
      carrier: 'FEDEX' as const,
      service: 'STANDARD' as const,
      cost: '15.00',
    },
    fulfillmentProvider: 'JM_BULLION' as const,
  };

  if (USE_NO_DB) {
    return {
      id: orderData.id,
      userId: orderData.userId,
      productCode: orderData.productCode,
      productName: orderData.productName,
      productCategory: orderData.productCategory,
      metal: orderData.metal,
      quantity: orderData.quantity,
      unitPrice: orderData.unitPrice,
      totalPrice: orderData.totalPrice,
      lockedPrice: orderData.lockedPrice,
      lockExpiresAt: orderData.lockExpiresAt,
      status: orderData.status as any,
      paymentMethod: orderData.paymentMethod,
      shippingAddress: orderData.shippingAddress,
      shipping: orderData.shipping,
      fulfillmentProvider: orderData.fulfillmentProvider,
      createdAt: now(),
      updatedAt: now(),
    } as unknown as Order;
  }

  const result = await query(
    `
    INSERT INTO orders (
      id, user_id, product_code, product_name, quantity, unit_price, total_price, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `,
    [
      orderData.id,
      orderData.userId,
      orderData.productCode,
      orderData.productName,
      orderData.quantity,
      orderData.unitPrice,
      orderData.totalPrice,
      orderData.status,
    ]
  );

  return {
    id: result.rows[0].id,
    userId: result.rows[0].user_id,
    productCode: result.rows[0].product_code,
    productName: result.rows[0].product_name,
    productCategory: orderData.productCategory,
    metal: orderData.metal,
    quantity: result.rows[0].quantity,
    unitPrice: result.rows[0].unit_price,
    totalPrice: result.rows[0].total_price,
    lockedPrice: orderData.lockedPrice,
    lockExpiresAt: orderData.lockExpiresAt,
    status: result.rows[0].status as any,
    paymentMethod: orderData.paymentMethod,
    shippingAddress: orderData.shippingAddress,
    shipping: orderData.shipping,
    fulfillmentProvider: orderData.fulfillmentProvider,
    createdAt: result.rows[0].created_at,
    updatedAt: result.rows[0].updated_at,
  };
}

/**
 * Factory for creating test KYC records
 */
export async function createKycRecord(
  overrides: FactoryKycRecord = {}
): Promise<KycRecord> {
  let userId = overrides.userId;

  // Create user if not provided
  if (!userId) {
    const user = await createUser();
    userId = user.id;
  }

  const kycData = {
    id: overrides.id || uuidv4(),
    userId: userId,
    type: overrides.type || 'PERSONAL',
    status: overrides.status || 'PENDING',
    submissionData: overrides.submissionData || {
      firstName: 'Test',
      lastName: 'User',
      dateOfBirth: '1990-01-01',
      ssn: '***-**-****',
      address: {
        line1: '123 Test St',
        city: 'Test City',
        state: 'CA',
        postalCode: '90210',
      },
    },
  };

  if (USE_NO_DB) {
    return {
      id: kycData.id,
      userId: kycData.userId,
      type: kycData.type as any,
      status: kycData.status as any,
      submissionData: kycData.submissionData,
      reviewNotes: undefined,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: now(),
      updatedAt: now(),
    } as unknown as KycRecord;
  }

  const result = await query(
    `
    INSERT INTO kyc_records (id, user_id, type, status, submission_data)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `,
    [
      kycData.id,
      kycData.userId,
      kycData.type,
      kycData.status,
      JSON.stringify(kycData.submissionData),
    ]
  );

  return {
    id: result.rows[0].id,
    userId: result.rows[0].user_id,
    type: result.rows[0].type,
    status: result.rows[0].status,
    submissionData: result.rows[0].submission_data,
    reviewNotes: result.rows[0].review_notes,
    reviewedBy: result.rows[0].reviewed_by,
    reviewedAt: result.rows[0].reviewed_at,
    createdAt: result.rows[0].created_at,
    updatedAt: result.rows[0].updated_at,
  };
}

/**
 * Create a complete user with funding and trading accounts and balances
 */
export async function createUserWithAccounts(
  overrides: FactoryUser = {}
): Promise<{
  user: User;
  fundingAccount: Account;
  tradingAccount: Account;
  balances: Balance[];
}> {
  const user = await createUser(overrides);

  const fundingAccount = await createAccount({
    userId: user.id,
    type: 'FUNDING',
  });

  const tradingAccount = await createAccount({
    userId: user.id,
    type: 'TRADING',
  });

  // Create some default balances
  const balances = await Promise.all([
    createBalance({
      accountId: fundingAccount.id,
      asset: 'USD',
      amount: '10000.00',
    }),
    createBalance({
      accountId: fundingAccount.id,
      asset: 'PAXG',
      amount: '2.00000000',
    }),
    createBalance({
      accountId: tradingAccount.id,
      asset: 'XAU-s',
      amount: '1.50000000',
    }),
    createBalance({
      accountId: tradingAccount.id,
      asset: 'XAG-s',
      amount: '100.00000000',
    }),
  ]);

  return {
    user,
    fundingAccount,
    tradingAccount,
    balances,
  };
}

/**
 * Create admin user with full permissions
 */
export async function createAdminUser(
  overrides: Partial<FactoryUser> = {}
): Promise<User> {
  return await createUser({
    role: 'ADMIN',
    kycStatus: 'APPROVED',
    emailVerified: true,
    email: 'admin@pbcex.com',
    firstName: 'Admin',
    lastName: 'User',
    ...overrides,
  });
}

/**
 * Create support user
 */
export async function createSupportUser(
  overrides: Partial<FactoryUser> = {}
): Promise<User> {
  return await createUser({
    role: 'SUPPORT',
    kycStatus: 'APPROVED',
    emailVerified: true,
    email: 'support@pbcex.com',
    firstName: 'Support',
    lastName: 'Agent',
    ...overrides,
  });
}

/**
 * Create teller user
 */
export async function createTellerUser(
  overrides: Partial<FactoryUser> = {}
): Promise<User> {
  return await createUser({
    role: 'TELLER',
    kycStatus: 'APPROVED',
    emailVerified: true,
    email: 'teller@pbcex.com',
    firstName: 'Bank',
    lastName: 'Teller',
    ...overrides,
  });
}

/**
 * Factory for creating random test data
 */
export const Factory = {
  createUser,
  createAccount,
  createBalance,
  createTrade,
  createOrder,
  createKycRecord,
  createUserWithAccounts,
  createAdminUser,
  createSupportUser,
  createTellerUser,
  createTransaction: async (overrides: any = {}) => ({ id: uuidv4(), ...overrides }),
};

export default Factory;
