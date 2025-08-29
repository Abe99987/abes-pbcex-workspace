import { z } from 'zod';

/**
 * Hedge Position model for PBCEx platform
 * Tracks hedging positions for synthetic asset exposure
 */

export interface HedgePosition {
  id: string;
  asset: 'XAG-s' | 'XPT-s' | 'XPD-s' | 'XCU-s'; // Synthetic assets that need hedging
  hedgeType: 'ETF' | 'UNALLOCATED' | 'FUTURES';
  hedgeInstrument: string; // ETF ticker (SLV, PPLT, etc.) or instrument ID
  quantity: string; // Amount hedged
  entryPrice: string;
  currentPrice?: string;
  unrealizedPnl?: string;
  exposure: string; // Total synthetic asset exposure being hedged
  hedgeRatio: string; // Percentage of exposure hedged (0.8 = 80%)
  brokerage?: string; // Which brokerage holds the hedge
  brokerageAccountId?: string;
  brokeragePositionId?: string;
  isActive: boolean;
  openedAt: Date;
  closedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHedgePositionInput {
  asset: HedgePosition['asset'];
  hedgeType: HedgePosition['hedgeType'];
  hedgeInstrument: string;
  quantity: string;
  entryPrice: string;
  exposure: string;
  hedgeRatio: string;
  brokerage?: string;
  brokerageAccountId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateHedgePositionInput {
  quantity?: string;
  currentPrice?: string;
  unrealizedPnl?: string;
  exposure?: string;
  hedgeRatio?: string;
  brokeragePositionId?: string;
  isActive?: boolean;
  closedAt?: Date;
  metadata?: Record<string, any>;
}

// Exposure summary for admin dashboard
export interface ExposureSummary {
  asset: string;
  totalSyntheticAmount: string;
  totalHedgedAmount: string;
  netExposure: string;
  hedgeRatio: string;
  recommendedAction: 'INCREASE_HEDGE' | 'DECREASE_HEDGE' | 'MAINTAIN' | 'CLOSE_HEDGE';
  positions: HedgePosition[];
}

export class HedgePositionUtils {
  /**
   * Calculate unrealized P&L for a position
   */
  static calculateUnrealizedPnl(position: HedgePosition): string {
    const entry = parseFloat(position.entryPrice);
    const current = parseFloat(position.currentPrice || position.entryPrice);
    const quantity = parseFloat(position.quantity);
    
    const pnl = (current - entry) * quantity;
    return pnl.toFixed(2);
  }

  /**
   * Check if hedge position needs rebalancing
   */
  static needsRebalancing(position: HedgePosition, targetRatio: number = 0.8): boolean {
    const currentRatio = parseFloat(position.hedgeRatio);
    const tolerance = 0.1; // 10% tolerance
    
    return Math.abs(currentRatio - targetRatio) > tolerance;
  }

  /**
   * Get recommended ETF for asset
   */
  static getRecommendedETF(asset: string): string[] {
    const etfMappings: Record<string, string[]> = {
      'XAG-s': ['SLV', 'SIVR'],
      'XPT-s': ['PPLT'],
      'XPD-s': ['PALL'],
      'XCU-s': ['CPER'],
    };
    
    return etfMappings[asset] || [];
  }

  /**
   * Calculate required hedge quantity
   */
  static calculateRequiredHedge(
    exposure: string, 
    targetRatio: string, 
    etfPrice: string,
    conversionFactor: number = 1
  ): string {
    const exposureAmount = parseFloat(exposure);
    const ratio = parseFloat(targetRatio);
    const price = parseFloat(etfPrice);
    
    const requiredValue = exposureAmount * ratio;
    const requiredShares = (requiredValue / price) * conversionFactor;
    
    return requiredShares.toFixed(8);
  }

  /**
   * Generate exposure summary for admin dashboard
   */
  static generateExposureSummary(
    asset: string,
    syntheticAmount: string,
    hedgePositions: HedgePosition[]
  ): ExposureSummary {
    const totalSynthetic = parseFloat(syntheticAmount);
    const totalHedged = hedgePositions
      .filter(p => p.isActive)
      .reduce((sum, p) => sum + parseFloat(p.quantity), 0);
    
    const netExposure = totalSynthetic - totalHedged;
    const hedgeRatio = totalSynthetic > 0 ? (totalHedged / totalSynthetic) : 0;
    
    let recommendedAction: ExposureSummary['recommendedAction'] = 'MAINTAIN';
    
    if (hedgeRatio < 0.7) {
      recommendedAction = 'INCREASE_HEDGE';
    } else if (hedgeRatio > 0.9) {
      recommendedAction = 'DECREASE_HEDGE';
    } else if (totalSynthetic === 0 && totalHedged > 0) {
      recommendedAction = 'CLOSE_HEDGE';
    }

    return {
      asset,
      totalSyntheticAmount: totalSynthetic.toFixed(8),
      totalHedgedAmount: totalHedged.toFixed(8),
      netExposure: netExposure.toFixed(8),
      hedgeRatio: (hedgeRatio * 100).toFixed(2),
      recommendedAction,
      positions: hedgePositions,
    };
  }

  /**
   * Check if position is profitable
   */
  static isProfitable(position: HedgePosition): boolean {
    const pnl = parseFloat(position.unrealizedPnl || '0');
    return pnl > 0;
  }

  /**
   * Get position age in days
   */
  static getPositionAge(position: HedgePosition): number {
    const now = new Date();
    const opened = position.openedAt;
    const diffTime = Math.abs(now.getTime() - opened.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export const HEDGE_POSITION_TABLE_SQL = `
CREATE TABLE hedge_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset VARCHAR(10) NOT NULL CHECK (asset IN ('XAG-s', 'XPT-s', 'XPD-s', 'XCU-s')),
  hedge_type VARCHAR(20) NOT NULL CHECK (hedge_type IN ('ETF', 'UNALLOCATED', 'FUTURES')),
  hedge_instrument VARCHAR(50) NOT NULL,
  quantity DECIMAL(20,8) NOT NULL CHECK (quantity > 0),
  entry_price DECIMAL(20,8) NOT NULL CHECK (entry_price > 0),
  current_price DECIMAL(20,8),
  unrealized_pnl DECIMAL(20,2),
  exposure DECIMAL(20,8) NOT NULL CHECK (exposure > 0),
  hedge_ratio DECIMAL(5,4) NOT NULL CHECK (hedge_ratio >= 0 AND hedge_ratio <= 1),
  brokerage VARCHAR(50),
  brokerage_account_id VARCHAR(100),
  brokerage_position_id VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CHECK ((is_active = FALSE) OR (closed_at IS NULL)),
  CHECK ((is_active = TRUE) OR (closed_at IS NOT NULL))
);

-- Indexes
CREATE INDEX idx_hedge_positions_asset ON hedge_positions(asset);
CREATE INDEX idx_hedge_positions_active ON hedge_positions(is_active, asset) WHERE is_active = TRUE;
CREATE INDEX idx_hedge_positions_hedge_type ON hedge_positions(hedge_type);
CREATE INDEX idx_hedge_positions_instrument ON hedge_positions(hedge_instrument);
CREATE INDEX idx_hedge_positions_brokerage ON hedge_positions(brokerage) WHERE brokerage IS NOT NULL;
CREATE INDEX idx_hedge_positions_opened_at ON hedge_positions(opened_at);

-- Updated at trigger  
CREATE TRIGGER trigger_hedge_positions_updated_at
  BEFORE UPDATE ON hedge_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
`;
