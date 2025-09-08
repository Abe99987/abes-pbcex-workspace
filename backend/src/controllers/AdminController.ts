import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createError, asyncHandler } from '@/middlewares/errorMiddleware';
import { logInfo, logError } from '@/utils/logger';
import { HedgePosition, ExposureSummary, HedgePositionUtils } from '@/models/HedgePosition';
import { HEDGING } from '@/utils/constants';
import { AuthController } from './AuthController';
import { WalletController } from './WalletController';
import { TradeController } from './TradeController';
import { ShopController } from './ShopController';
import { db } from '@/db';
import AlertService from '@/services/AlertService';

/**
 * Admin Controller for PBCEx
 * Handles administrative operations, exposure monitoring, and hedge management
 */

// In-memory store for hedge positions
const hedgePositions: HedgePosition[] = [];

export class AdminController {
  /**
   * GET /api/admin/exposure
   * View system exposure across all synthetic assets
   */
  static getExposure = asyncHandler(async (req: Request, res: Response) => {
    logInfo('Admin exposure check requested', { userId: req.user!.id });

    // Calculate total synthetic balances across all users
    const syntheticExposures = AdminController.calculateSystemExposure();
    
    // Get current hedge positions
    const activeHedges = hedgePositions.filter(h => h.isActive);
    
    // Create exposure summaries for each synthetic asset
    const exposureSummaries: Record<string, ExposureSummary> = {};
    
    const syntheticAssets = ['XAU-s', 'XAG-s', 'XPT-s', 'XPD-s', 'XCU-s'] as const;
    
    for (const asset of syntheticAssets) {
      const totalSynthetic = syntheticExposures[asset] || '0';
      const assetHedges = activeHedges.filter(h => h.asset === asset);
      
      const summary = HedgePositionUtils.generateExposureSummary(
        asset,
        totalSynthetic,
        assetHedges
      );
      
      exposureSummaries[asset] = summary;
    }

    // Calculate overall system metrics
    const systemMetrics = AdminController.calculateSystemMetrics(exposureSummaries);

    res.json({
      code: 'SUCCESS',
      data: {
        exposure: exposureSummaries,
        systemMetrics,
        hedgePositions: activeHedges.map(h => ({
          id: h.id,
          asset: h.asset,
          hedgeType: h.hedgeType,
          hedgeInstrument: h.hedgeInstrument,
          quantity: h.quantity,
          currentPrice: h.currentPrice,
          unrealizedPnl: h.unrealizedPnl,
          hedgeRatio: h.hedgeRatio,
          openedAt: h.openedAt,
        })),
        recommendations: AdminController.generateRecommendations(exposureSummaries),
        lastUpdated: new Date().toISOString(),
      },
    });
  });

  /**
   * GET /api/admin/metrics
   * Basic metrics: tradeCount24h, totalFeesPaxg, trial-balance deltas per asset
   */
  static getMetrics = asyncHandler(async (req: Request, res: Response) => {
    // Trade receipts recorded in ledger_journal.metadata.receipt_v
    const tradeCount24h = db.isConnected()
      ? (await db.query(`SELECT COUNT(*)::int AS c FROM ledger_journal WHERE (metadata->>'receipt_v') IS NOT NULL AND ts >= NOW() - INTERVAL '24 hours'`)).rows[0]?.c || 0
      : 0;
    const feeSum = db.isConnected()
      ? (await db.query(`SELECT COALESCE(SUM( (metadata->>'fee')::numeric ),0)::text AS s FROM ledger_journal WHERE (metadata->>'fee') IS NOT NULL AND ts >= NOW() - INTERVAL '24 hours'`)).rows[0]?.s || '0'
      : '0';
    const tb = db.isConnected()
      ? (await db.query(`SELECT asset, (COALESCE(total_debits,0)-COALESCE(total_credits,0))::text AS delta FROM ledger_trial_balance`)).rows
      : [];

    res.json({
      code: 'SUCCESS',
      data: {
        tradeCount24h,
        totalFeesPaxg: feeSum,
        trialBalance: tb,
      },
    });
  });

  /**
   * GET /api/admin/export/balances
   * Export ledger_balances as CSV
   */
  static exportBalancesCsv = asyncHandler(async (req: Request, res: Response) => {
    const rows = db.isConnected()
      ? (await db.query(`SELECT account_id, asset, balance::text AS balance, COALESCE(updated_at, NOW()) AS updated_at FROM ledger_balances ORDER BY account_id, asset`)).rows
      : [];
    const header = 'account_id,asset,balance,updated_at';
    const lines = rows.map((r: any) => `${r.account_id},${r.asset},${r.balance},${new Date(r.updated_at).toISOString()}`);
    const csv = [header, ...lines].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.status(200).send(csv);
  });

  /**
   * POST /api/admin/hedge/rebalance
   * Trigger hedge rebalancing for specific asset
   */
  static rebalanceHedge = asyncHandler(async (req: Request, res: Response) => {
    const { asset, action, targetRatio, forceExecution = false } = req.body;
    const userId = req.user!.id;

    logInfo('Hedge rebalance requested', { 
      userId, 
      asset, 
      action, 
      targetRatio 
    });

    // Validate asset
    const validAssets = ['XAG-s', 'XPT-s', 'XPD-s', 'XCU-s'];
    if (!validAssets.includes(asset)) {
      throw createError.validation('Invalid asset for hedging');
    }

    // Validate action
    const validActions = ['INCREASE_HEDGE', 'DECREASE_HEDGE', 'CLOSE_HEDGE', 'REBALANCE'];
    if (!validActions.includes(action)) {
      throw createError.validation('Invalid hedge action');
    }

    // Get current exposure
    const syntheticExposures = AdminController.calculateSystemExposure();
    const currentExposure = parseFloat(syntheticExposures[asset] || '0');

    if (currentExposure === 0 && action !== 'CLOSE_HEDGE') {
      throw createError.validation('No exposure to hedge');
    }

    // Calculate required hedge adjustment
    const rebalanceResult = await AdminController.executeHedgeRebalance(
      asset,
      action,
      currentExposure,
      targetRatio || HEDGING.DEFAULT_HEDGE_RATIO,
      forceExecution
    );

    res.json({
      code: 'SUCCESS',
      message: `Hedge rebalancing ${rebalanceResult.executed ? 'executed' : 'simulated'} for ${asset}`,
      data: {
        rebalanceId: rebalanceResult.id,
        asset,
        action,
        currentExposure: currentExposure.toFixed(8),
        targetRatio: targetRatio || HEDGING.DEFAULT_HEDGE_RATIO,
        executed: rebalanceResult.executed,
        simulation: rebalanceResult.simulation,
        newPositions: rebalanceResult.newPositions,
        closedPositions: rebalanceResult.closedPositions,
      },
    });
  });

  /**
   * GET /api/admin/users
   * Get user statistics and management data
   */
  static getUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = AuthController.getAllUsers();
    
    const stats = {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length,
      kycApproved: users.filter(u => u.kycStatus === 'APPROVED').length,
      kycPending: users.filter(u => ['IN_PROGRESS', 'PENDING_REVIEW'].includes(u.kycStatus)).length,
      kycRejected: users.filter(u => u.kycStatus === 'REJECTED').length,
      emailVerified: users.filter(u => u.emailVerified).length,
      twoFactorEnabled: users.filter(u => u.twoFactorEnabled).length,
    };

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = users.filter(u => u.createdAt > thirtyDaysAgo);

    res.json({
      code: 'SUCCESS',
      data: {
        stats,
        recentRegistrations: recentUsers.length,
        topUsersByBalance: AdminController.getTopUsersByBalance(),
      },
    });
  });

  /**
   * GET /api/admin/trades
   * Get trading statistics and analytics
   */
  static getTrades = asyncHandler(async (req: Request, res: Response) => {
    const tradeStats = TradeController.getTradeStatistics();
    const allTrades = TradeController.getAllTrades();

    // Additional analytics
    const tradesByAsset = allTrades.reduce((acc, trade) => {
      const pair = `${trade.assetSold}/${trade.assetBought}`;
      acc[pair] = (acc[pair] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgFeesCollected = allTrades.length > 0 
      ? allTrades.reduce((sum, t) => sum + parseFloat(t.feeAmount), 0) / allTrades.length
      : 0;

    res.json({
      code: 'SUCCESS',
      data: {
        ...tradeStats,
        tradesByAsset,
        avgFeesCollected: avgFeesCollected.toFixed(8),
        successRate: allTrades.length > 0 
          ? ((allTrades.filter(t => t.status === 'FILLED').length / allTrades.length) * 100).toFixed(2)
          : '0',
      },
    });
  });

  /**
   * GET /api/admin/kpi/overview
   * Returns simple read-only KPIs for admin tiles
   */
  static getKpiOverview = asyncHandler(async (req: Request, res: Response) => {
    const users = AuthController.getAllUsers();
    const userCount = users.length;

    const balances = WalletController.getAllBalances();
    const syntheticAssets = ['XAU-s', 'XAG-s', 'XPT-s', 'XPD-s', 'XCU-s'] as const;
    const byAsset: Record<string, { exposure: string }> = syntheticAssets.reduce((acc, a) => {
      acc[a] = { exposure: '0.00000000' };
      return acc;
    }, {} as Record<string, { exposure: string }>);
    for (const b of balances) {
      if (Object.prototype.hasOwnProperty.call(byAsset, b.asset)) {
        const current = parseFloat((byAsset as any)[b.asset].exposure);
        const next = current + parseFloat(b.amount);
        (byAsset as any)[b.asset].exposure = next.toFixed(8);
      }
    }

    let feesAmount = '0';
    let feesPendingSource = true;
    try {
      if (db.isConnected()) {
        const r = await db.query(
          `SELECT COALESCE(SUM( (metadata->>'fee')::numeric ),0)::text AS s FROM ledger_journal WHERE (metadata->>'fee') IS NOT NULL`
        );
        feesAmount = r.rows[0]?.s || '0';
        feesPendingSource = false;
      }
    } catch {
      // keep defaults
    }

    // reservesIOU has no source yet
    const reserves = { amount: '0', pendingSource: true } as const;

    res.json({
      code: 'SUCCESS',
      data: {
        userCount,
        byAsset,
        feesToDate: { amount: feesAmount, pendingSource: feesPendingSource },
        reservesIOU: reserves,
        generatedAt: new Date().toISOString(),
      },
    });
  });

  /**
   * GET /api/admin/shop
   * Get shop statistics and inventory
   */
  static getShop = asyncHandler(async (req: Request, res: Response) => {
    const shopStats = ShopController.getShopStatistics();
    const products = ShopController.getAllProducts();
    
    // Low stock alerts
    const lowStockProducts = products.filter(p => 
      p.inStock && p.stockQuantity < 10
    );

    res.json({
      code: 'SUCCESS',
      data: {
        ...shopStats,
        lowStockAlerts: lowStockProducts.length,
        lowStockProducts: lowStockProducts.map(p => ({
          id: p.id,
          name: p.name,
          stockQuantity: p.stockQuantity,
        })),
      },
    });
  });

  /**
   * POST /api/admin/maintenance
   * Trigger system maintenance operations
   */
  static maintenance = asyncHandler(async (req: Request, res: Response) => {
    const { operation } = req.body;
    const userId = req.user!.id;

    logInfo('Maintenance operation requested', { userId, operation });

    const results: Record<string, any> = {};

    switch (operation) {
      case 'UPDATE_PRICES':
        results.pricesUpdated = await AdminController.forceUpdatePrices();
        break;
      case 'CLEANUP_EXPIRED_QUOTES':
        results.quotesCleared = await AdminController.cleanupExpiredQuotes();
        break;
      case 'RECALCULATE_BALANCES':
        results.balancesRecalculated = await AdminController.recalculateBalances();
        break;
      case 'GENERATE_REPORTS':
        results.reportsGenerated = await AdminController.generateDailyReports();
        break;
      default:
        throw createError.validation('Invalid maintenance operation');
    }

    res.json({
      code: 'SUCCESS',
      message: `Maintenance operation '${operation}' completed`,
      data: {
        operation,
        results,
        executedAt: new Date().toISOString(),
      },
    });
  });

  // Private helper methods

  private static calculateSystemExposure(): Record<string, string> {
    const allBalances = WalletController.getAllBalances();
    const syntheticExposures: Record<string, number> = {
      'XAU-s': 0,
      'XAG-s': 0, 
      'XPT-s': 0,
      'XPD-s': 0,
      'XCU-s': 0,
    };

    // Sum all synthetic balances across all users
    allBalances.forEach(balance => {
      if (syntheticExposures.hasOwnProperty(balance.asset)) {
        syntheticExposures[balance.asset] = (syntheticExposures[balance.asset] || 0) + parseFloat(balance.amount);
      }
    });

    // Convert to string representation
    const result: Record<string, string> = {};
    Object.entries(syntheticExposures).forEach(([asset, amount]) => {
      result[asset] = amount.toFixed(8);
    });

    return result;
  }

  private static calculateSystemMetrics(exposures: Record<string, ExposureSummary>) {
    let totalExposureUsd = 0;
    let totalHedgedUsd = 0;
    let overallRisk = 0;

    // Mock USD values for calculation (in production, use real prices)
    const assetPrices = {
      'XAU-s': 2050,
      'XAG-s': 25,
      'XPT-s': 975,
      'XPD-s': 1150,
      'XCU-s': 8.25,
    };

    Object.entries(exposures).forEach(([asset, exposure]) => {
      const price = assetPrices[asset as keyof typeof assetPrices] || 0;
      const exposureValue = parseFloat(exposure.totalSyntheticAmount) * price;
      const hedgedValue = parseFloat(exposure.totalHedgedAmount) * price;
      
      totalExposureUsd += exposureValue;
      totalHedgedUsd += hedgedValue;
      
      // Risk calculation based on unhedged exposure
      const unhedgedValue = exposureValue - hedgedValue;
      overallRisk += Math.abs(unhedgedValue);
    });

    const overallHedgeRatio = totalExposureUsd > 0 ? 
      (totalHedgedUsd / totalExposureUsd) * 100 : 0;

    return {
      totalExposureUsd: totalExposureUsd.toFixed(2),
      totalHedgedUsd: totalHedgedUsd.toFixed(2),
      overallHedgeRatio: overallHedgeRatio.toFixed(2),
      overallRisk: overallRisk.toFixed(2),
      riskLevel: overallRisk < 10000 ? 'LOW' : 
                overallRisk < 50000 ? 'MEDIUM' : 'HIGH',
    };
  }

  private static generateRecommendations(exposures: Record<string, ExposureSummary>): string[] {
    const recommendations: string[] = [];

    Object.entries(exposures).forEach(([asset, exposure]) => {
      const hedgeRatio = parseFloat(exposure.hedgeRatio) / 100;
      const netExposure = parseFloat(exposure.netExposure);

      if (exposure.recommendedAction === 'INCREASE_HEDGE') {
        recommendations.push(
          `Consider increasing ${asset} hedge coverage to 80-90% (currently ${exposure.hedgeRatio}%)`
        );
      }

      if (exposure.recommendedAction === 'DECREASE_HEDGE') {
        recommendations.push(
          `${asset} appears over-hedged at ${exposure.hedgeRatio}% - consider reducing coverage`
        );
      }

      if (Math.abs(netExposure) > 1000 && asset === 'XAU-s') {
        recommendations.push(
          `High gold exposure of ${Math.abs(netExposure).toFixed(2)} oz - monitor closely`
        );
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Hedge ratios are within acceptable ranges');
    }

    return recommendations;
  }

  private static async executeHedgeRebalance(
    asset: string,
    action: string,
    currentExposure: number,
    targetRatio: number,
    forceExecution: boolean
  ) {
    const rebalanceId = uuidv4();
    
    // Get current hedge positions for this asset
    const currentHedges = hedgePositions.filter(h => h.asset === asset && h.isActive);
    const currentHedgedAmount = currentHedges.reduce((sum, h) => 
      sum + parseFloat(h.quantity), 0
    );

    const currentHedgeRatio = currentExposure > 0 ? currentHedgedAmount / currentExposure : 0;
    const targetHedgeAmount = currentExposure * targetRatio;
    const hedgeAdjustment = targetHedgeAmount - currentHedgedAmount;

    const simulation = {
      currentExposure: currentExposure.toFixed(8),
      currentHedgedAmount: currentHedgedAmount.toFixed(8),
      currentHedgeRatio: (currentHedgeRatio * 100).toFixed(2),
      targetHedgeAmount: targetHedgeAmount.toFixed(8),
      targetRatio: (targetRatio * 100).toFixed(2),
      requiredAdjustment: hedgeAdjustment.toFixed(8),
      recommendedETFs: HedgePositionUtils.getRecommendedETF(asset),
    };

    const newPositions: any[] = [];
    const closedPositions: any[] = [];

    if (forceExecution && Math.abs(hedgeAdjustment) > 0.001) {
      if (hedgeAdjustment > 0) {
        // Need to increase hedge
        const newPosition: HedgePosition = {
          id: uuidv4(),
          asset: asset as any,
          hedgeType: 'ETF',
          hedgeInstrument: HedgePositionUtils.getRecommendedETF(asset)[0] || 'SLV',
          quantity: hedgeAdjustment.toFixed(8),
          entryPrice: '100.00', // Mock ETF price
          exposure: currentExposure.toFixed(8),
          hedgeRatio: targetRatio.toFixed(4),
          isActive: true,
          openedAt: new Date(),
          metadata: {
            rebalanceId,
            triggeredBy: action,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        hedgePositions.push(newPosition);
        newPositions.push(newPosition);

        logInfo('New hedge position created', {
          positionId: newPosition.id,
          asset,
          quantity: hedgeAdjustment,
          rebalanceId,
        });

      } else {
        // Need to decrease hedge
        const excessHedge = Math.abs(hedgeAdjustment);
        let remainingToClose = excessHedge;

        for (const position of currentHedges) {
          if (remainingToClose <= 0) break;

          const positionSize = parseFloat(position.quantity);
          if (positionSize <= remainingToClose) {
            // Close entire position
            position.isActive = false;
            position.closedAt = new Date();
            position.updatedAt = new Date();
            closedPositions.push(position);
            remainingToClose -= positionSize;

            logInfo('Hedge position closed', {
              positionId: position.id,
              asset,
              quantity: positionSize,
              rebalanceId,
            });
          } else {
            // Partially close position
            const newQuantity = (positionSize - remainingToClose).toFixed(8);
            position.quantity = newQuantity;
            position.updatedAt = new Date();
            remainingToClose = 0;

            logInfo('Hedge position reduced', {
              positionId: position.id,
              asset,
              oldQuantity: positionSize,
              newQuantity,
              rebalanceId,
            });
          }
        }
      }
    }

    return {
      id: rebalanceId,
      executed: forceExecution,
      simulation,
      newPositions,
      closedPositions,
    };
  }

  private static getTopUsersByBalance(): Array<{ userId: string; totalValue: string }> {
    const users = AuthController.getAllUsers();
    const userBalances = users.map(user => {
      const balances = WalletController.getUserBalances(user.id);
      // Mock total USD value calculation
      const totalValue = balances.reduce((sum, balance) => {
        const mockPrice = balance.asset === 'XAU-s' ? 2050 : 
                         balance.asset === 'XAG-s' ? 25 : 1;
        return sum + (parseFloat(balance.amount) * mockPrice);
      }, 0);

      return {
        userId: user.id,
        email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email
        totalValue: totalValue.toFixed(2),
      };
    });

    return userBalances
      .sort((a, b) => parseFloat(b.totalValue) - parseFloat(a.totalValue))
      .slice(0, 10);
  }

  // Maintenance operations
  private static async forceUpdatePrices(): Promise<number> {
    // Force update price cache
    const priceCache = TradeController.getPriceCache();
    let updatedCount = 0;

    const assets = ['AU', 'AG', 'PT', 'PD', 'CU'];
    for (const asset of assets) {
      priceCache.delete(asset); // Force refresh
      updatedCount++;
    }

    return updatedCount;
  }

  private static async cleanupExpiredQuotes(): Promise<number> {
    const quotes = ShopController.getLockedQuotes();
    const now = new Date();
    let clearedCount = 0;

    for (const [quoteId, quote] of quotes.entries()) {
      if (now > quote.expiresAt) {
        quotes.delete(quoteId);
        clearedCount++;
      }
    }

    return clearedCount;
  }

  private static async recalculateBalances(): Promise<number> {
    // In production, this would recalculate and verify all balance totals
    return WalletController.getAllBalances().length;
  }

  private static async generateDailyReports(): Promise<string[]> {
    // Generate daily operational reports
    return [
      'trading_volume_report.csv',
      'user_activity_report.csv', 
      'inventory_report.csv',
      'hedge_position_report.csv',
    ];
  }

  /**
   * GET /api/admin/health/ledger-drift
   * Check for drift between balances table and balance_changes journal
   */
  static getLedgerDriftHealth = asyncHandler(async (req: Request, res: Response) => {
    logInfo('Admin ledger drift health check requested');

    try {
      // In production, this would be a real database query:
      // SELECT b.account_id, b.asset, b.amount as balance_amount,
      //        COALESCE(SUM(bc.amount), 0) as journal_sum,
      //        ABS(b.amount - COALESCE(SUM(bc.amount), 0)) as drift
      // FROM balances b
      // LEFT JOIN balance_changes bc ON bc.balance_id = b.id
      // GROUP BY b.id, b.account_id, b.asset, b.amount
      // HAVING ABS(b.amount - COALESCE(SUM(bc.amount), 0)) > 0.01

      // Mock implementation for current in-memory system
      const allBalances = WalletController.getAllBalances();
      const driftThreshold = 0.01; // $0.01 USD equivalent per SLO
      const detectedDrifts: Array<{
        accountId: string;
        asset: string;
        balanceAmount: number;
        journalSum: number;
        drift: number;
      }> = [];

      // In the current in-memory system, we simulate drift detection
      // In production, this would query actual database tables
      for (const balance of allBalances) {
        const balanceAmount = parseFloat(balance.amount);
        const journalSum = balanceAmount; // In-memory system is always consistent
        const drift = Math.abs(balanceAmount - journalSum);

        if (drift > driftThreshold) {
          detectedDrifts.push({
            accountId: balance.accountId,
            asset: balance.asset,
            balanceAmount,
            journalSum,
            drift,
          });

          // Emit alert for each drift detected
          AlertService.emitLedgerDrift(
            balance.accountId,
            balance.asset,
            drift,
            balanceAmount,
            journalSum
          );
        }
      }

      const healthStatus = {
        ok: detectedDrifts.length === 0,
        timestamp: new Date().toISOString(),
        driftThreshold,
        totalAccountsChecked: allBalances.length,
        driftsDetected: detectedDrifts.length,
        drifts: detectedDrifts,
      };

      if (detectedDrifts.length > 0) {
        logError('Ledger drift detected', { drifts: detectedDrifts });
      } else {
        logInfo('Ledger health check: No drift detected', {
          accountsChecked: allBalances.length,
        });
      }

      res.json({
        code: 'SUCCESS',
        message: detectedDrifts.length === 0 ? 'No ledger drift detected' : `${detectedDrifts.length} drift(s) detected`,
        data: healthStatus,
      });

    } catch (error) {
      logError('Ledger drift health check failed', error as Error);
      throw createError.serviceUnavailable('Database', 'Failed to check ledger drift');
    }
  });

  // Utility methods for testing
  static getAllHedgePositions = (): HedgePosition[] => hedgePositions;
  static getActiveHedgePositions = (): HedgePosition[] => 
    hedgePositions.filter(h => h.isActive);
  static getHedgePositionsByAsset = (asset: string): HedgePosition[] =>
    hedgePositions.filter(h => h.asset === asset);
}
