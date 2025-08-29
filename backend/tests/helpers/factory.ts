import { query } from './db';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../src/models/User';
import { Account } from '../../src/models/Account';
import { Balance } from '../../src/models/Balance';
import { Trade } from '../../src/models/Trade';
import { Order } from '../../src/models/Order';
import { KycRecord } from '../../src/models/KycRecord';

/**
 * Test Data Factory
 * Creates test fixtures with realistic data
 */

export interface FactoryUser {
  id?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: 'USER' | 'ADMIN' | 'SUPPORT' | 'TELLER';
  kycStatus?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  phone?: string;
}

export interface FactoryAccount {
  id?: string;
  userId?: string;
  type?: 'FUNDING' | 'TRADING';
  isActive?: boolean;
}

export interface FactoryBalance {
  accountId?: string;
  asset?: string;
  amount?: string;
  lockedAmount?: string;
}

export interface FactoryTrade {
  id?: string;
  userId?: string;
  fromAsset?: string;
  toAsset?: string;
  fromAmount?: string;
  toAmount?: string;
  status?: string;
}

export interface FactoryOrder {
  id?: string;
  userId?: string;
  productId?: string;
  quantity?: number;
  unitPrice?: string;
  totalPrice?: string;
  status?: string;
}

export interface FactoryKycRecord {
  id?: string;
  userId?: string;
  type?: 'PERSONAL' | 'BUSINESS';
  status?: string;
  submissionData?: any;
}

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

  // Hash password
  const passwordHash = await bcrypt.hash(userData.password, 10);

  const result = await query(`
    INSERT INTO users (
      id, email, password_hash, first_name, last_name, role, 
      kyc_status, email_verified, phone_verified, phone
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `, [
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
  ]);

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
    createdAt: result.rows[0].created_at,
    updatedAt: result.rows[0].updated_at,
  };
}

/**
 * Factory for creating test accounts
 */
export async function createAccount(overrides: FactoryAccount = {}): Promise<Account> {
  let userId = overrides.userId;
  
  // Create user if not provided
  if (!userId) {
    const user = await createUser();
    userId = user.id;
  }

  const accountData = {
    id: overrides.id || uuidv4(),
    userId: userId,
    type: overrides.type || 'FUNDING',
    isActive: overrides.isActive ?? true,
  };

  const result = await query(`
    INSERT INTO accounts (id, user_id, type, is_active)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [
    accountData.id,
    accountData.userId,
    accountData.type,
    accountData.isActive,
  ]);

  return {
    id: result.rows[0].id,
    userId: result.rows[0].user_id,
    type: result.rows[0].type,
    isActive: result.rows[0].is_active,
    createdAt: result.rows[0].created_at,
    updatedAt: result.rows[0].updated_at,
  };
}

/**
 * Factory for creating test balances
 */
export async function createBalance(overrides: FactoryBalance = {}): Promise<Balance> {
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

  const result = await query(`
    INSERT INTO balances (account_id, asset, amount, locked_amount)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (account_id, asset) DO UPDATE SET
      amount = EXCLUDED.amount,
      locked_amount = EXCLUDED.locked_amount,
      last_updated = NOW()
    RETURNING *
  `, [
    balanceData.accountId,
    balanceData.asset,
    balanceData.amount,
    balanceData.lockedAmount,
  ]);

  return {
    accountId: result.rows[0].account_id,
    asset: result.rows[0].asset,
    amount: result.rows[0].amount,
    lockedAmount: result.rows[0].locked_amount,
    lastUpdated: result.rows[0].last_updated,
  };
}

/**
 * Factory for creating test trades
 */
export async function createTrade(overrides: FactoryTrade = {}): Promise<Trade> {
  let userId = overrides.userId;
  
  // Create user if not provided
  if (!userId) {
    const user = await createUser();
    userId = user.id;
  }

  const tradeData = {
    id: overrides.id || uuidv4(),
    userId: userId,
    fromAsset: overrides.fromAsset || 'USD',
    toAsset: overrides.toAsset || 'PAXG',
    fromAmount: overrides.fromAmount || '2150.00',
    toAmount: overrides.toAmount || '1.00000000',
    status: overrides.status || 'COMPLETED',
  };

  // Calculate exchange rate
  const exchangeRate = (
    parseFloat(tradeData.fromAmount) / parseFloat(tradeData.toAmount)
  ).toFixed(8);

  const result = await query(`
    INSERT INTO trades (
      id, user_id, from_asset, to_asset, from_amount, to_amount, 
      exchange_rate, status, executed_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    tradeData.id,
    tradeData.userId,
    tradeData.fromAsset,
    tradeData.toAsset,
    tradeData.fromAmount,
    tradeData.toAmount,
    exchangeRate,
    tradeData.status,
    tradeData.status === 'COMPLETED' ? new Date() : null,
  ]);

  return {
    id: result.rows[0].id,
    userId: result.rows[0].user_id,
    fromAsset: result.rows[0].from_asset,
    toAsset: result.rows[0].to_asset,
    fromAmount: result.rows[0].from_amount,
    toAmount: result.rows[0].to_amount,
    exchangeRate: result.rows[0].exchange_rate,
    feeAmount: result.rows[0].fee_amount,
    status: result.rows[0].status,
    executedAt: result.rows[0].executed_at,
    createdAt: result.rows[0].created_at,
  };
}

/**
 * Factory for creating test orders
 */
export async function createOrder(overrides: FactoryOrder = {}): Promise<Order> {
  let userId = overrides.userId;
  
  // Create user if not provided
  if (!userId) {
    const user = await createUser();
    userId = user.id;
  }

  const orderData = {
    id: overrides.id || uuidv4(),
    userId: userId,
    productId: overrides.productId || 'AU-EAGLE-1OZ',
    quantity: overrides.quantity || 1,
    unitPrice: overrides.unitPrice || '2150.00',
    totalPrice: overrides.totalPrice || '2150.00',
    status: overrides.status || 'PROCESSING',
  };

  const result = await query(`
    INSERT INTO orders (
      id, user_id, product_id, quantity, unit_price, total_price, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [
    orderData.id,
    orderData.userId,
    orderData.productId,
    orderData.quantity,
    orderData.unitPrice,
    orderData.totalPrice,
    orderData.status,
  ]);

  return {
    id: result.rows[0].id,
    userId: result.rows[0].user_id,
    productId: result.rows[0].product_id,
    quantity: result.rows[0].quantity,
    unitPrice: result.rows[0].unit_price,
    totalPrice: result.rows[0].total_price,
    status: result.rows[0].status,
    shippingAddress: result.rows[0].shipping_address,
    createdAt: result.rows[0].created_at,
    updatedAt: result.rows[0].updated_at,
  };
}

/**
 * Factory for creating test KYC records
 */
export async function createKycRecord(overrides: FactoryKycRecord = {}): Promise<KycRecord> {
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

  const result = await query(`
    INSERT INTO kyc_records (id, user_id, type, status, submission_data)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [
    kycData.id,
    kycData.userId,
    kycData.type,
    kycData.status,
    JSON.stringify(kycData.submissionData),
  ]);

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
export async function createUserWithAccounts(overrides: FactoryUser = {}): Promise<{
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
export async function createAdminUser(overrides: Partial<FactoryUser> = {}): Promise<User> {
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
export async function createSupportUser(overrides: Partial<FactoryUser> = {}): Promise<User> {
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
export async function createTellerUser(overrides: Partial<FactoryUser> = {}): Promise<User> {
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
};

export default Factory;
