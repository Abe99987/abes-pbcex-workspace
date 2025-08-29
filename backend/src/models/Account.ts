import { z } from 'zod';
import { ACCOUNT_TYPES } from '@/utils/constants';

/**
 * Account model for PBCEx platform
 * Represents both FUNDING (real assets) and TRADING (synthetic assets) accounts
 */

// Account interface
export interface Account {
  id: string;
  userId: string;
  type: typeof ACCOUNT_TYPES[keyof typeof ACCOUNT_TYPES];
  name: string;
  description?: string;
  custodyProvider?: string; // For FUNDING accounts
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Account creation interface
export interface CreateAccountInput {
  userId: string;
  type: typeof ACCOUNT_TYPES[keyof typeof ACCOUNT_TYPES];
  name?: string;
  description?: string;
  custodyProvider?: string;
}

// Account update interface
export interface UpdateAccountInput {
  name?: string;
  description?: string;
  custodyProvider?: string;
  isActive?: boolean;
}

// Account with balances (for display purposes)
export interface AccountWithBalances extends Account {
  balances: Array<{
    asset: string;
    amount: string;
    usdValue?: string;
  }>;
  totalUsdValue: string;
}

// Database schema validation
export const accountSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum([ACCOUNT_TYPES.FUNDING, ACCOUNT_TYPES.TRADING]),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  custodyProvider: z.string().max(100).optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createAccountInputSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum([ACCOUNT_TYPES.FUNDING, ACCOUNT_TYPES.TRADING]),
  name: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  custodyProvider: z.string().max(100).optional(),
});

export const updateAccountInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  custodyProvider: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

// Account utility functions
export class AccountUtils {
  /**
   * Generate default account name based on type
   */
  static getDefaultName(type: string): string {
    switch (type) {
      case ACCOUNT_TYPES.FUNDING:
        return 'Funding Account';
      case ACCOUNT_TYPES.TRADING:
        return 'Trading Account';
      default:
        return 'Account';
    }
  }

  /**
   * Generate default account description based on type
   */
  static getDefaultDescription(type: string): string {
    switch (type) {
      case ACCOUNT_TYPES.FUNDING:
        return 'Real assets held in custody (PAXG, USD, USDC)';
      case ACCOUNT_TYPES.TRADING:
        return 'Synthetic assets for active trading (XAU-s, XAG-s, XPT-s, XPD-s, XCU-s)';
      default:
        return 'PBCEx account';
    }
  }

  /**
   * Check if account can hold specific asset
   */
  static canHoldAsset(account: Account, asset: string): boolean {
    const realAssets = ['PAXG', 'USD', 'USDC'];
    const syntheticAssets = ['XAU-s', 'XAG-s', 'XPT-s', 'XPD-s', 'XCU-s'];

    if (account.type === ACCOUNT_TYPES.FUNDING) {
      return realAssets.includes(asset);
    } else if (account.type === ACCOUNT_TYPES.TRADING) {
      return syntheticAssets.includes(asset);
    }

    return false;
  }

  /**
   * Check if transfer is allowed between accounts
   */
  static canTransferBetween(fromAccount: Account, toAccount: Account, asset: string): boolean {
    // Must be same user
    if (fromAccount.userId !== toAccount.userId) {
      return false;
    }

    // Must be different account types
    if (fromAccount.type === toAccount.type) {
      return false;
    }

    // Check asset compatibility
    if (asset === 'PAXG' && fromAccount.type === ACCOUNT_TYPES.FUNDING && toAccount.type === ACCOUNT_TYPES.TRADING) {
      return true; // PAXG -> XAU-s conversion
    }

    if (asset === 'XAU-s' && fromAccount.type === ACCOUNT_TYPES.TRADING && toAccount.type === ACCOUNT_TYPES.FUNDING) {
      return true; // XAU-s -> PAXG conversion (burn)
    }

    return false;
  }

  /**
   * Get custody provider requirements for account
   */
  static requiresCustodyProvider(type: string): boolean {
    return type === ACCOUNT_TYPES.FUNDING;
  }

  /**
   * Get available custody providers
   */
  static getAvailableCustodyProviders(): string[] {
    return ['PAXOS', 'PRIMETRUST', 'ANCHORAGE'];
  }

  /**
   * Generate default account values for creation
   */
  static getDefaultValues(input: CreateAccountInput): Partial<Account> {
    return {
      name: input.name || AccountUtils.getDefaultName(input.type),
      description: input.description || AccountUtils.getDefaultDescription(input.type),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Validate account data
   */
  static validate(account: Partial<Account>): Account {
    return accountSchema.parse(account);
  }

  /**
   * Validate create account input
   */
  static validateCreateInput(input: any): CreateAccountInput {
    return createAccountInputSchema.parse(input);
  }

  /**
   * Validate update account input
   */
  static validateUpdateInput(input: any): UpdateAccountInput {
    return updateAccountInputSchema.parse(input);
  }

  /**
   * Check if account type supports withdrawals
   */
  static supportsWithdrawals(type: string): boolean {
    return type === ACCOUNT_TYPES.FUNDING;
  }

  /**
   * Check if account type supports deposits
   */
  static supportsDeposits(type: string): boolean {
    return type === ACCOUNT_TYPES.FUNDING;
  }

  /**
   * Get account display name with type
   */
  static getDisplayName(account: Account): string {
    const typeLabel = account.type === ACCOUNT_TYPES.FUNDING ? 'Funding' : 'Trading';
    return `${account.name} (${typeLabel})`;
  }

  /**
   * Calculate total USD value from balances
   */
  static calculateTotalValue(balances: Array<{ asset: string; amount: string; usdValue?: string }>): string {
    const total = balances.reduce((sum, balance) => {
      const value = parseFloat(balance.usdValue || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    return total.toFixed(2);
  }

  /**
   * Format account with balances for API response
   */
  static withBalances(
    account: Account,
    balances: Array<{ asset: string; amount: string; usdValue?: string }>
  ): AccountWithBalances {
    return {
      ...account,
      balances,
      totalUsdValue: AccountUtils.calculateTotalValue(balances),
    };
  }
}

// SQL table definition (for reference/migration)
export const ACCOUNT_TABLE_SQL = `
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('FUNDING', 'TRADING')),
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  custody_provider VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure each user has only one account of each type
  UNIQUE(user_id, type)
);

-- Indexes
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_custody_provider ON accounts(custody_provider) WHERE custody_provider IS NOT NULL;
CREATE INDEX idx_accounts_created_at ON accounts(created_at);

-- Ensure funding accounts have custody provider
ALTER TABLE accounts ADD CONSTRAINT chk_funding_custody_provider 
  CHECK ((type != 'FUNDING') OR (type = 'FUNDING' AND custody_provider IS NOT NULL));

-- Updated at trigger
CREATE TRIGGER trigger_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
`;
