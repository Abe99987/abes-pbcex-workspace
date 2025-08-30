/**
 * Wallet and transaction types for PBCEx frontend
 * Matches backend API response structures
 */

export interface Transaction {
  id: string;
  timestamp: string;
  asset: string;
  amount: string;
  usdValue: string;
  type:
    | 'DEPOSIT'
    | 'WITHDRAWAL'
    | 'TRADE'
    | 'CONVERSION'
    | 'SPENDING'
    | 'TRANSFER_IN'
    | 'TRANSFER_OUT';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  fee: string;
  reference: string;
  description: string;
}

export interface TransactionFilters {
  q?: string;
  asset?: string;
  type?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionResponse {
  transactions: Transaction[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
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

export interface WalletData {
  funding: Account;
  trading: Account;
  combined: {
    totalUsdValue: string;
  };
}

export interface Trade {
  id: string;
  timestamp: string;
  pair: string;
  side: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP_LOSS';
  price: string;
  amount: string;
  filled: string;
  total: string;
  fee: string;
  feeAsset: string;
  status: 'PENDING' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  fillPercentage: string;
}

export interface TradeFilters {
  pair?: string;
  side?: string;
  order_type?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface TradeKPIs {
  totalOrders: number;
  filledOrders: number;
  totalVolume: string;
  totalFees: string;
}

export interface TradeHistoryResponse {
  kpis: TradeKPIs;
  trades: Trade[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
