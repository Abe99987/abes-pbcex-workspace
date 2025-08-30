/**
 * Wallet and Transaction types for PBCEx frontend
 */

export interface Transaction {
  id: string;
  type: string; // Flexible to handle backend variations
  asset: string;
  amount: string;
  accountType: string; // Flexible to handle backend variations
  description: string;
  reference?: string;
  createdAt: string;
}

export interface Balance {
  asset: string;
  amount: string;
  lockedAmount: string;
  availableAmount: string;
  usdValue: string;
}

export interface Account {
  id: string;
  type: 'FUNDING' | 'TRADING';
  name: string;
  balances: Balance[];
  totalUsdValue: string;
}

export interface WalletBalances {
  funding: Account;
  trading: Account;
  totalUsdValue: string;
}

export interface BalancesResponse {
  funding: {
    id: string;
    type: string;
    name: string;
    balances: Balance[];
    totalUsdValue: string;
  };
  trading: {
    id: string;
    type: string;
    name: string;
    balances: Balance[];
    totalUsdValue: string;
  };
  totalUsdValue: string;
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  total: number;
  limit: number;
  offset: number;
}
