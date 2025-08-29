import { z } from 'zod';
import { ASSETS, REAL_ASSETS, SYNTHETIC_ASSETS } from '@/utils/constants';

/**
 * Balance model for PBCEx platform
 * Tracks asset balances within accounts
 */

// Balance interface
export interface Balance {
  id: string;
  accountId: string;
  asset: string;
  amount: string; // Using string for precise decimal handling
  lockedAmount: string; // Amount locked in pending trades/orders
  lastUpdated: Date;
  createdAt: Date;
}

// Balance creation interface
export interface CreateBalanceInput {
  accountId: string;
  asset: string;
  amount: string;
  lockedAmount?: string;
}

// Balance update interface
export interface UpdateBalanceInput {
  amount?: string;
  lockedAmount?: string;
}

// Balance with USD value for display
export interface BalanceWithValue extends Balance {
  usdValue: string;
  availableAmount: string; // amount - lockedAmount
  pricePerUnit?: string;
}

// Balance change record for auditing
export interface BalanceChange {
  id: string;
  balanceId: string;
  changeType: 'CREDIT' | 'DEBIT' | 'LOCK' | 'UNLOCK' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'TRADE' | 'FEE' | 'MINT' | 'BURN';
  amount: string;
  previousAmount: string;
  newAmount: string;
  reference?: string; // Trade ID, Order ID, etc.
  description?: string;
  createdAt: Date;
}

// Database schema validation
export const balanceSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  asset: z.string().min(1).max(20),
  amount: z.string().regex(/^\d+\.?\d*$/, 'Amount must be a valid decimal number'),
  lockedAmount: z.string().regex(/^\d+\.?\d*$/, 'Locked amount must be a valid decimal number'),
  lastUpdated: z.date(),
  createdAt: z.date(),
});

export const createBalanceInputSchema = z.object({
  accountId: z.string().uuid(),
  asset: z.string().min(1).max(20),
  amount: z.string().regex(/^\d+\.?\d*$/, 'Amount must be a valid decimal number'),
  lockedAmount: z.string().regex(/^\d+\.?\d*$/, 'Locked amount must be a valid decimal number').default('0'),
});

export const updateBalanceInputSchema = z.object({
  amount: z.string().regex(/^\d+\.?\d*$/, 'Amount must be a valid decimal number').optional(),
  lockedAmount: z.string().regex(/^\d+\.?\d*$/, 'Locked amount must be a valid decimal number').optional(),
});

export const balanceChangeSchema = z.object({
  id: z.string().uuid(),
  balanceId: z.string().uuid(),
  changeType: z.enum(['CREDIT', 'DEBIT', 'LOCK', 'UNLOCK', 'TRANSFER_IN', 'TRANSFER_OUT', 'TRADE', 'FEE', 'MINT', 'BURN']),
  amount: z.string().regex(/^\d+\.?\d*$/, 'Amount must be a valid decimal number'),
  previousAmount: z.string().regex(/^\d+\.?\d*$/, 'Previous amount must be a valid decimal number'),
  newAmount: z.string().regex(/^\d+\.?\d*$/, 'New amount must be a valid decimal number'),
  reference: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  createdAt: z.date(),
});

// Balance utility functions
export class BalanceUtils {
  /**
   * Add two decimal amounts safely
   */
  static add(amount1: string, amount2: string): string {
    const num1 = parseFloat(amount1) || 0;
    const num2 = parseFloat(amount2) || 0;
    return (num1 + num2).toFixed(8);
  }

  /**
   * Subtract two decimal amounts safely
   */
  static subtract(amount1: string, amount2: string): string {
    const num1 = parseFloat(amount1) || 0;
    const num2 = parseFloat(amount2) || 0;
    const result = num1 - num2;
    return Math.max(0, result).toFixed(8);
  }

  /**
   * Compare two decimal amounts
   */
  static compare(amount1: string, amount2: string): number {
    const num1 = parseFloat(amount1) || 0;
    const num2 = parseFloat(amount2) || 0;
    
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
    return 0;
  }

  /**
   * Check if amount is greater than zero
   */
  static isPositive(amount: string): boolean {
    return parseFloat(amount) > 0;
  }

  /**
   * Check if amount is zero
   */
  static isZero(amount: string): boolean {
    return parseFloat(amount) === 0;
  }

  /**
   * Format amount for display (remove trailing zeros)
   */
  static formatAmount(amount: string, maxDecimals: number = 8): string {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    
    return num.toFixed(maxDecimals).replace(/\.?0+$/, '');
  }

  /**
   * Calculate available amount (total - locked)
   */
  static getAvailableAmount(balance: Balance): string {
    return BalanceUtils.subtract(balance.amount, balance.lockedAmount);
  }

  /**
   * Check if sufficient balance for operation
   */
  static hasSufficientBalance(balance: Balance, requiredAmount: string, includeLocked: boolean = false): boolean {
    const availableAmount = includeLocked ? balance.amount : BalanceUtils.getAvailableAmount(balance);
    return BalanceUtils.compare(availableAmount, requiredAmount) >= 0;
  }

  /**
   * Get asset type (real vs synthetic)
   */
  static getAssetType(asset: string): 'REAL' | 'SYNTHETIC' | 'UNKNOWN' {
    if (REAL_ASSETS.includes(asset as any)) {
      return 'REAL';
    } else if (SYNTHETIC_ASSETS.includes(asset as any)) {
      return 'SYNTHETIC';
    }
    return 'UNKNOWN';
  }

  /**
   * Get asset display name
   */
  static getAssetDisplayName(asset: string): string {
    const displayNames: Record<string, string> = {
      'PAXG': 'Gold (PAXG)',
      'USD': 'US Dollar',
      'USDC': 'USD Coin',
      'XAU-s': 'Gold Synthetic',
      'XAG-s': 'Silver Synthetic',
      'XPT-s': 'Platinum Synthetic',
      'XPD-s': 'Palladium Synthetic',
      'XCU-s': 'Copper Synthetic',
    };
    
    return displayNames[asset] || asset;
  }

  /**
   * Get asset decimal precision
   */
  static getAssetPrecision(asset: string): number {
    const precisions: Record<string, number> = {
      'PAXG': 8,
      'USD': 2,
      'USDC': 6,
      'XAU-s': 8,
      'XAG-s': 8,
      'XPT-s': 8,
      'XPD-s': 8,
      'XCU-s': 8,
    };
    
    return precisions[asset] || 8;
  }

  /**
   * Create balance with USD value
   */
  static withValue(balance: Balance, pricePerUnit: string): BalanceWithValue {
    const price = parseFloat(pricePerUnit) || 0;
    const amount = parseFloat(balance.amount) || 0;
    const usdValue = (amount * price).toFixed(2);
    
    return {
      ...balance,
      usdValue,
      availableAmount: BalanceUtils.getAvailableAmount(balance),
      pricePerUnit,
    };
  }

  /**
   * Generate default balance values
   */
  static getDefaultValues(input: CreateBalanceInput): Partial<Balance> {
    return {
      amount: input.amount || '0',
      lockedAmount: input.lockedAmount || '0',
      lastUpdated: new Date(),
      createdAt: new Date(),
    };
  }

  /**
   * Validate balance data
   */
  static validate(balance: Partial<Balance>): Balance {
    return balanceSchema.parse(balance);
  }

  /**
   * Validate create balance input
   */
  static validateCreateInput(input: any): CreateBalanceInput {
    return createBalanceInputSchema.parse(input);
  }

  /**
   * Validate update balance input
   */
  static validateUpdateInput(input: any): UpdateBalanceInput {
    return updateBalanceInputSchema.parse(input);
  }

  /**
   * Validate balance change record
   */
  static validateBalanceChange(change: any): BalanceChange {
    return balanceChangeSchema.parse(change);
  }

  /**
   * Create balance change record
   */
  static createBalanceChange(
    balanceId: string,
    changeType: BalanceChange['changeType'],
    amount: string,
    previousAmount: string,
    newAmount: string,
    reference?: string,
    description?: string
  ): Omit<BalanceChange, 'id'> {
    return {
      balanceId,
      changeType,
      amount,
      previousAmount,
      newAmount,
      reference,
      description,
      createdAt: new Date(),
    };
  }

  /**
   * Check if two balances are for convertible assets (PAXG <-> XAU-s)
   */
  static areConvertible(asset1: string, asset2: string): boolean {
    return (
      (asset1 === 'PAXG' && asset2 === 'XAU-s') ||
      (asset1 === 'XAU-s' && asset2 === 'PAXG')
    );
  }

  /**
   * Get conversion rate between assets (1:1 for PAXG <-> XAU-s)
   */
  static getConversionRate(fromAsset: string, toAsset: string): string {
    if (BalanceUtils.areConvertible(fromAsset, toAsset)) {
      return '1'; // 1:1 conversion
    }
    return '0'; // No direct conversion
  }
}

// SQL table definitions (for reference/migration)
export const BALANCE_TABLES_SQL = `
-- Balances table
CREATE TABLE balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  asset VARCHAR(20) NOT NULL,
  amount DECIMAL(20,8) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  locked_amount DECIMAL(20,8) NOT NULL DEFAULT 0 CHECK (locked_amount >= 0),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one balance per account per asset
  UNIQUE(account_id, asset),
  
  -- Ensure locked amount doesn't exceed total amount
  CHECK (locked_amount <= amount)
);

-- Balance changes table for audit trail
CREATE TABLE balance_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  balance_id UUID NOT NULL REFERENCES balances(id) ON DELETE CASCADE,
  change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('CREDIT', 'DEBIT', 'LOCK', 'UNLOCK', 'TRANSFER_IN', 'TRANSFER_OUT', 'TRADE', 'FEE', 'MINT', 'BURN')),
  amount DECIMAL(20,8) NOT NULL,
  previous_amount DECIMAL(20,8) NOT NULL,
  new_amount DECIMAL(20,8) NOT NULL,
  reference VARCHAR(100),
  description VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_balances_account_id ON balances(account_id);
CREATE INDEX idx_balances_asset ON balances(asset);
CREATE INDEX idx_balances_amount ON balances(amount) WHERE amount > 0;
CREATE INDEX idx_balances_last_updated ON balances(last_updated);

CREATE INDEX idx_balance_changes_balance_id ON balance_changes(balance_id);
CREATE INDEX idx_balance_changes_type ON balance_changes(change_type);
CREATE INDEX idx_balance_changes_reference ON balance_changes(reference) WHERE reference IS NOT NULL;
CREATE INDEX idx_balance_changes_created_at ON balance_changes(created_at);

-- Triggers
CREATE OR REPLACE FUNCTION update_balance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_balances_last_updated
  BEFORE UPDATE ON balances
  FOR EACH ROW
  EXECUTE FUNCTION update_balance_timestamp();
`;
