import { z } from 'zod';
import { TRADE_STATUS } from '@/utils/constants';

/**
 * Trade model for PBCEx platform
 * Records all trading activity between assets
 */

// Trade interface
export interface Trade {
  id: string;
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  assetSold: string;
  assetBought: string;
  amountSold: string;
  amountBought: string;
  price: string; // Price per unit of asset bought
  feeAmount: string;
  feeAsset: string;
  status: typeof TRADE_STATUS[keyof typeof TRADE_STATUS];
  orderType: 'MARKET' | 'LIMIT';
  executedAt?: Date;
  reference?: string; // External reference or order ID
  metadata?: Record<string, any>; // Additional trade details
  createdAt: Date;
  updatedAt: Date;
}

// Trade creation interface
export interface CreateTradeInput {
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  assetSold: string;
  assetBought: string;
  amountSold: string;
  amountBought: string;
  price: string;
  feeAmount?: string;
  feeAsset?: string;
  orderType?: 'MARKET' | 'LIMIT';
  reference?: string;
  metadata?: Record<string, any>;
}

// Trade update interface
export interface UpdateTradeInput {
  status?: typeof TRADE_STATUS[keyof typeof TRADE_STATUS];
  executedAt?: Date;
  reference?: string;
  metadata?: Record<string, any>;
}

// Trade with additional calculated fields for display
export interface TradeWithDetails extends Trade {
  effectiveRate: string; // amountBought / amountSold
  feeRate: string; // fee as percentage of trade
  netAmountBought: string; // amountBought - fees (if fee in bought asset)
  usdValue?: string; // trade value in USD
}

// Database schema validation
export const tradeSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  assetSold: z.string().min(1).max(20),
  assetBought: z.string().min(1).max(20),
  amountSold: z.string().regex(/^\d+\.?\d*$/, 'Amount sold must be a valid decimal number'),
  amountBought: z.string().regex(/^\d+\.?\d*$/, 'Amount bought must be a valid decimal number'),
  price: z.string().regex(/^\d+\.?\d*$/, 'Price must be a valid decimal number'),
  feeAmount: z.string().regex(/^\d+\.?\d*$/, 'Fee amount must be a valid decimal number'),
  feeAsset: z.string().min(1).max(20),
  status: z.enum([TRADE_STATUS.PENDING, TRADE_STATUS.FILLED, TRADE_STATUS.CANCELLED, TRADE_STATUS.FAILED]),
  orderType: z.enum(['MARKET', 'LIMIT']),
  executedAt: z.date().optional(),
  reference: z.string().max(100).optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createTradeInputSchema = z.object({
  userId: z.string().uuid(),
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  assetSold: z.string().min(1).max(20),
  assetBought: z.string().min(1).max(20),
  amountSold: z.string().regex(/^\d+\.?\d*$/, 'Amount sold must be a valid decimal number'),
  amountBought: z.string().regex(/^\d+\.?\d*$/, 'Amount bought must be a valid decimal number'),
  price: z.string().regex(/^\d+\.?\d*$/, 'Price must be a valid decimal number'),
  feeAmount: z.string().regex(/^\d+\.?\d*$/, 'Fee amount must be a valid decimal number').default('0'),
  feeAsset: z.string().min(1).max(20).default('USD'),
  orderType: z.enum(['MARKET', 'LIMIT']).default('MARKET'),
  reference: z.string().max(100).optional(),
  metadata: z.record(z.any()).optional(),
});

// Trade utility functions
export class TradeUtils {
  /**
   * Calculate effective exchange rate
   */
  static calculateEffectiveRate(amountSold: string, amountBought: string): string {
    const sold = parseFloat(amountSold);
    const bought = parseFloat(amountBought);
    
    if (sold === 0) return '0';
    return (bought / sold).toFixed(8);
  }

  /**
   * Calculate fee rate as percentage
   */
  static calculateFeeRate(feeAmount: string, tradeAmount: string): string {
    const fee = parseFloat(feeAmount);
    const amount = parseFloat(tradeAmount);
    
    if (amount === 0) return '0';
    return ((fee / amount) * 100).toFixed(4);
  }

  /**
   * Calculate net amount after fees
   */
  static calculateNetAmount(amountBought: string, feeAmount: string, feeAsset: string, boughtAsset: string): string {
    const bought = parseFloat(amountBought);
    const fee = parseFloat(feeAmount);
    
    // Only subtract fee if it's in the same asset as what was bought
    if (feeAsset === boughtAsset) {
      return Math.max(0, bought - fee).toFixed(8);
    }
    
    return bought.toFixed(8);
  }

  /**
   * Check if trade is a conversion (PAXG <-> XAU-s)
   */
  static isConversion(trade: Trade): boolean {
    return (
      (trade.assetSold === 'PAXG' && trade.assetBought === 'XAU-s') ||
      (trade.assetSold === 'XAU-s' && trade.assetBought === 'PAXG')
    );
  }

  /**
   * Check if trade is a synthetic trade (between synthetic assets)
   */
  static isSyntheticTrade(trade: Trade): boolean {
    const syntheticAssets = ['XAU-s', 'XAG-s', 'XPT-s', 'XPD-s', 'XCU-s'];
    return syntheticAssets.includes(trade.assetSold) && syntheticAssets.includes(trade.assetBought);
  }

  /**
   * Get trade direction description
   */
  static getTradeDirection(trade: Trade): string {
    if (TradeUtils.isConversion(trade)) {
      return trade.assetSold === 'PAXG' ? 'MINT' : 'BURN';
    }
    return 'TRADE';
  }

  /**
   * Format trade description
   */
  static getTradeDescription(trade: Trade): string {
    const direction = TradeUtils.getTradeDirection(trade);
    
    if (direction === 'MINT') {
      return `Convert ${trade.amountSold} PAXG to ${trade.amountBought} XAU-s`;
    } else if (direction === 'BURN') {
      return `Convert ${trade.amountSold} XAU-s to ${trade.amountBought} PAXG`;
    } else {
      return `Trade ${trade.amountSold} ${trade.assetSold} for ${trade.amountBought} ${trade.assetBought}`;
    }
  }

  /**
   * Add calculated details to trade
   */
  static withDetails(trade: Trade, usdValue?: string): TradeWithDetails {
    return {
      ...trade,
      effectiveRate: TradeUtils.calculateEffectiveRate(trade.amountSold, trade.amountBought),
      feeRate: TradeUtils.calculateFeeRate(trade.feeAmount, trade.amountSold),
      netAmountBought: TradeUtils.calculateNetAmount(trade.amountBought, trade.feeAmount, trade.feeAsset, trade.assetBought),
      usdValue,
    };
  }

  /**
   * Check if trade can be cancelled
   */
  static canCancel(trade: Trade): boolean {
    return trade.status === TRADE_STATUS.PENDING;
  }

  /**
   * Check if trade is final (completed or failed)
   */
  static isFinal(trade: Trade): boolean {
    return [TRADE_STATUS.FILLED, TRADE_STATUS.CANCELLED, TRADE_STATUS.FAILED].includes(trade.status);
  }

  /**
   * Generate default trade values
   */
  static getDefaultValues(input: CreateTradeInput): Partial<Trade> {
    return {
      status: TRADE_STATUS.PENDING,
      feeAmount: input.feeAmount || '0',
      feeAsset: input.feeAsset || 'USD',
      orderType: input.orderType || 'MARKET',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Validate trade data
   */
  static validate(trade: Partial<Trade>): Trade {
    return tradeSchema.parse(trade);
  }

  /**
   * Validate create trade input
   */
  static validateCreateInput(input: any): CreateTradeInput {
    return createTradeInputSchema.parse(input);
  }

  /**
   * Calculate trade statistics for a set of trades
   */
  static calculateStatistics(trades: Trade[]): {
    totalTrades: number;
    totalVolume: string;
    averageTradeSize: string;
    totalFees: string;
    successRate: string;
  } {
    const totalTrades = trades.length;
    const successfulTrades = trades.filter(t => t.status === TRADE_STATUS.FILLED);
    
    const totalVolume = trades.reduce((sum, trade) => {
      return sum + (parseFloat(trade.amountSold) || 0);
    }, 0);

    const totalFees = trades.reduce((sum, trade) => {
      return sum + (parseFloat(trade.feeAmount) || 0);
    }, 0);

    const averageTradeSize = totalTrades > 0 ? (totalVolume / totalTrades) : 0;
    const successRate = totalTrades > 0 ? ((successfulTrades.length / totalTrades) * 100) : 0;

    return {
      totalTrades,
      totalVolume: totalVolume.toFixed(8),
      averageTradeSize: averageTradeSize.toFixed(8),
      totalFees: totalFees.toFixed(8),
      successRate: successRate.toFixed(2),
    };
  }
}

// SQL table definition (for reference/migration)
export const TRADE_TABLE_SQL = `
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_account_id UUID NOT NULL REFERENCES accounts(id),
  to_account_id UUID NOT NULL REFERENCES accounts(id),
  asset_sold VARCHAR(20) NOT NULL,
  asset_bought VARCHAR(20) NOT NULL,
  amount_sold DECIMAL(20,8) NOT NULL CHECK (amount_sold > 0),
  amount_bought DECIMAL(20,8) NOT NULL CHECK (amount_bought > 0),
  price DECIMAL(20,8) NOT NULL CHECK (price > 0),
  fee_amount DECIMAL(20,8) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  fee_asset VARCHAR(20) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'FILLED', 'CANCELLED', 'FAILED')),
  order_type VARCHAR(20) NOT NULL DEFAULT 'MARKET' CHECK (order_type IN ('MARKET', 'LIMIT')),
  executed_at TIMESTAMPTZ,
  reference VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Business rules
  CHECK (from_account_id != to_account_id),
  CHECK (asset_sold != asset_bought),
  CHECK ((status != 'FILLED') OR (executed_at IS NOT NULL))
);

-- Indexes
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_from_account ON trades(from_account_id);
CREATE INDEX idx_trades_to_account ON trades(to_account_id);
CREATE INDEX idx_trades_asset_sold ON trades(asset_sold);
CREATE INDEX idx_trades_asset_bought ON trades(asset_bought);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_created_at ON trades(created_at);
CREATE INDEX idx_trades_executed_at ON trades(executed_at) WHERE executed_at IS NOT NULL;
CREATE INDEX idx_trades_reference ON trades(reference) WHERE reference IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX idx_trades_user_status_created ON trades(user_id, status, created_at);
CREATE INDEX idx_trades_asset_pair_created ON trades(asset_sold, asset_bought, created_at);

-- Updated at trigger
CREATE TRIGGER trigger_trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
`;
