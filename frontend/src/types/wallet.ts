/**
 * Wallet and Transaction types for PBCEx frontend
 */

export interface Transaction {
  id: string;
  type:
    | 'CREDIT'
    | 'DEBIT'
    | 'LOCK'
    | 'UNLOCK'
    | 'TRANSFER_IN'
    | 'TRANSFER_OUT'
    | 'TRADE'
    | 'FEE'
    | 'MINT'
    | 'BURN';
  asset: string;
  amount: string;
  accountType: 'FUNDING' | 'TRADING';
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

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  total: number;
  limit: number;
  offset: number;
}
