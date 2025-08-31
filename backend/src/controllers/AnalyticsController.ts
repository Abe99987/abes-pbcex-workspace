import { Request, Response } from 'express';
import { createError, asyncHandler } from '@/middlewares/errorMiddleware';
import { logInfo, logError } from '@/utils/logger';
import { TradeController } from './TradeController';
import { WalletController } from './WalletController';

interface UserPayload {
  id: string;
  role: string;
}

type AuthedRequest = Request & { user: UserPayload };

/**
 * Analytics Controller for PBCEx
 * Handles spending analytics, PnL calculations, and portfolio performance
 */

// Mock spending categories for development
const SPENDING_CATEGORIES = [
  'Trading Fees',
  'Withdrawal Fees',
  'Transfer Fees',
  'Storage Fees',
  'Insurance',
  'Other',
];

interface SpendingAnalytics {
  period: string;
  totalSpent: number;
  monthlySpend: number;
  recurringSpend: number;
  discretionarySpend: number;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    isRecurring: boolean;
  }>;
  topMerchants: Array<{
    name: string;
    amount: number;
    transactions: number;
  }>;
  burnRate: number;
  savingsRate: number;
  trends: Array<{
    date: string;
    amount: number;
  }>;
}

interface PnLAnalytics {
  period: string;
  totalPnL: number;
  winRate: number;
  profitFactor: number;
  bestDay: {
    date: string;
    pnl: number;
  };
  worstDay: {
    date: string;
    pnl: number;
  };
  averageWin: number;
  averageLoss: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  dailyPnL: Array<{
    date: string;
    pnl: number;
    cumulativePnL: number;
    trades: number;
  }>;
  monthlyPerformance: Array<{
    month: string;
    pnl: number;
    trades: number;
    winRate: number;
  }>;
}

interface PortfolioAnalytics {
  totalValue: number;
  totalPnL: number;
  pnlPercentage: number;
  breakdown: Array<{
    category: string;
    value: number;
    percentage: number;
    pnl: number;
    pnlPercentage: number;
  }>;
  performance: Array<{
    date: string;
    value: number;
    pnl: number;
  }>;
  riskMetrics: {
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    beta: number;
  };
}

export class AnalyticsController {
  /**
   * GET /api/analytics/spending
   * Get spending analytics and categorization
   */
  static getSpendingAnalytics = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const userId = req.user.id;
    const period = req.query.period as string || 'month';
    const currency = req.query.currency as string || 'USD';

    logInfo('Fetching spending analytics', { userId, period, currency });

    // Generate mock spending data (replace with real data later)
    const spendingData = AnalyticsController.generateMockSpendingData(period);

    res.json({
      code: 'SUCCESS',
      data: spendingData,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /api/analytics/pnl
   * Get profit and loss analytics
   */
  static getPnLAnalytics = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const userId = req.user.id;
    const period = req.query.period as string || 'month';
    const currency = req.query.currency as string || 'USD';

    logInfo('Fetching PnL analytics', { userId, period, currency });

    // Generate mock PnL data (replace with real calculations later)
    const pnlData = AnalyticsController.generateMockPnLData(period);

    res.json({
      code: 'SUCCESS',
      data: pnlData,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /api/analytics/portfolio
   * Get portfolio performance analytics
   */
  static getPortfolioAnalytics = asyncHandler(async (req: AuthedRequest, res: Response) => {
    const userId = req.user.id;
    const period = req.query.period as string || 'month';
    const includeBreakdown = (req.query.includeBreakdown as string) || 'true';

    logInfo('Fetching portfolio analytics', { userId, period, includeBreakdown });

    // Generate mock portfolio data (replace with real calculations later)
    const portfolioData = AnalyticsController.generateMockPortfolioData(
      period,
      includeBreakdown === 'true'
    );

    res.json({
      code: 'SUCCESS',
      data: portfolioData,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Generate mock spending data for development
   */
  private static generateMockSpendingData(period: string): SpendingAnalytics {
    const baseSpend = period === 'year' ? 12000 : period === 'quarter' ? 3000 : 1000;
    
    // Generate category breakdown
    const categoryBreakdown = SPENDING_CATEGORIES.map((category, index) => {
      const amount = baseSpend * (0.1 + Math.random() * 0.3);
      return {
        category,
        amount: Math.round(amount * 100) / 100,
        percentage: Math.round((amount / baseSpend) * 100 * 100) / 100,
        isRecurring: index < 3, // First 3 categories are recurring
      };
    });

    const totalSpent = categoryBreakdown.reduce((sum, cat) => sum + cat.amount, 0);
    const recurringSpend = categoryBreakdown
      .filter(cat => cat.isRecurring)
      .reduce((sum, cat) => sum + cat.amount, 0);

    // Generate trends data
    const trends = [];
    const daysInPeriod = period === 'year' ? 365 : period === 'quarter' ? 90 : 30;
    
    for (let i = daysInPeriod - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        date: date.toISOString().split('T')[0] || date.toISOString().slice(0, 10),
        amount: Math.round((totalSpent / daysInPeriod) * (0.5 + Math.random()) * 100) / 100,
      });
    }

    return {
      period,
      totalSpent: Math.round(totalSpent * 100) / 100,
      monthlySpend: Math.round((totalSpent / (period === 'year' ? 12 : period === 'quarter' ? 3 : 1)) * 100) / 100,
      recurringSpend: Math.round(recurringSpend * 100) / 100,
      discretionarySpend: Math.round((totalSpent - recurringSpend) * 100) / 100,
      categoryBreakdown,
      topMerchants: [
        { name: 'PBCEx Trading Fees', amount: 450.75, transactions: 24 },
        { name: 'Storage Fees', amount: 200.00, transactions: 12 },
        { name: 'Transfer Fees', amount: 125.50, transactions: 8 },
        { name: 'Insurance Premium', amount: 89.99, transactions: 3 },
        { name: 'Withdrawal Fees', amount: 75.25, transactions: 5 },
      ],
      burnRate: Math.round((totalSpent / 30) * 100) / 100, // Daily burn rate
      savingsRate: Math.round((1 - (totalSpent / (totalSpent * 1.3))) * 100 * 100) / 100, // Assuming 30% savings
      trends,
    };
  }

  /**
   * Generate mock PnL data for development
   */
  private static generateMockPnLData(period: string): PnLAnalytics {
    const daysInPeriod = period === 'year' ? 365 : period === 'quarter' ? 90 : 30;
    
    // Generate daily PnL data
    const dailyPnL = [];
    let cumulativePnL = 0;
    let bestDay = { date: '', pnl: -Infinity };
    let worstDay = { date: '', pnl: Infinity };
    
    for (let i = daysInPeriod - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0] || date.toISOString().slice(0, 10);
      
      // Random PnL with slight positive bias
      const pnl = (Math.random() - 0.4) * 1000;
      cumulativePnL += pnl;
      
      const trades = Math.floor(Math.random() * 8) + 1;
      
      if (pnl > bestDay.pnl) {
        bestDay = { date: dateStr, pnl };
      }
      if (pnl < worstDay.pnl) {
        worstDay = { date: dateStr, pnl };
      }
      
      dailyPnL.push({
        date: dateStr,
        pnl: Math.round(pnl * 100) / 100,
        cumulativePnL: Math.round(cumulativePnL * 100) / 100,
        trades,
      });
    }

    // Calculate statistics
    const profitableDays = dailyPnL.filter(d => d.pnl > 0);
    const lossDays = dailyPnL.filter(d => d.pnl < 0);
    
    const totalTrades = dailyPnL.reduce((sum, d) => sum + d.trades, 0);
    const winningTrades = profitableDays.length;
    const losingTrades = lossDays.length;
    const winRate = winningTrades / (winningTrades + losingTrades) * 100;
    
    const averageWin = profitableDays.length > 0 
      ? profitableDays.reduce((sum, d) => sum + d.pnl, 0) / profitableDays.length 
      : 0;
    const averageLoss = lossDays.length > 0 
      ? Math.abs(lossDays.reduce((sum, d) => sum + d.pnl, 0) / lossDays.length)
      : 0;
    
    const profitFactor = averageLoss > 0 ? averageWin / averageLoss : 0;

    // Generate monthly performance
    const monthlyPerformance = [];
    const monthsToShow = Math.min(12, Math.ceil(daysInPeriod / 30));
    
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      
      const monthStr = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const monthPnL = (Math.random() - 0.3) * 5000;
      const monthTrades = Math.floor(Math.random() * 50) + 20;
      const monthWinRate = 40 + Math.random() * 40;
      
      monthlyPerformance.push({
        month: monthStr,
        pnl: Math.round(monthPnL * 100) / 100,
        trades: monthTrades,
        winRate: Math.round(monthWinRate * 100) / 100,
      });
    }

    return {
      period,
      totalPnL: Math.round(cumulativePnL * 100) / 100,
      winRate: Math.round(winRate * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      bestDay: {
        date: bestDay.date,
        pnl: Math.round(bestDay.pnl * 100) / 100,
      },
      worstDay: {
        date: worstDay.date,
        pnl: Math.round(worstDay.pnl * 100) / 100,
      },
      averageWin: Math.round(averageWin * 100) / 100,
      averageLoss: Math.round(averageLoss * 100) / 100,
      totalTrades,
      winningTrades,
      losingTrades,
      dailyPnL,
      monthlyPerformance,
    };
  }

  /**
   * Generate mock portfolio data for development
   */
  private static generateMockPortfolioData(period: string, includeBreakdown: boolean): PortfolioAnalytics {
    const totalValue = 125000 + Math.random() * 50000;
    const totalPnL = (Math.random() - 0.3) * 10000;
    const pnlPercentage = (totalPnL / (totalValue - totalPnL)) * 100;

    let breakdown: Array<{ category: string; value: number; pnl: number; percentage: number; pnlPercentage: number }> = [];
    if (includeBreakdown) {
      const categories = [
        { name: 'Funding', baseValue: 0.4 },
        { name: 'Trading', baseValue: 0.3 },
        { name: 'FX', baseValue: 0.1 },
        { name: 'Commodities', baseValue: 0.15 },
        { name: 'Crypto', baseValue: 0.03 },
        { name: 'Titled Assets', baseValue: 0.02 },
      ];

      breakdown = categories.map(cat => {
        const value = totalValue * (cat.baseValue + (Math.random() - 0.5) * 0.1);
        const pnl = value * ((Math.random() - 0.3) * 0.2);
        const pnlPerc = (pnl / (value - pnl)) * 100;

        return {
          category: cat.name,
          value: Math.round(value * 100) / 100,
          percentage: Math.round((value / totalValue) * 100 * 100) / 100,
          pnl: Math.round(pnl * 100) / 100,
          pnlPercentage: Math.round(pnlPerc * 100) / 100,
        };
      });
    }

    // Generate performance data
    const daysInPeriod = period === 'year' ? 365 : period === 'quarter' ? 90 : 30;
    const performance: Array<{ date: string; value: number; pnl: number }> = [];
    let currentValue = totalValue - totalPnL;
    
    for (let i = daysInPeriod - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dailyChange = (Math.random() - 0.5) * 0.02 * currentValue;
      currentValue += dailyChange;
      const currentPnL = currentValue - (totalValue - totalPnL);
      
      const dateStr = date.toISOString().split('T')[0] || date.toISOString().slice(0, 10);
      performance.push({
        date: dateStr,
        value: Math.round(currentValue * 100) / 100,
        pnl: Math.round(currentPnL * 100) / 100,
      });
    }

    // Calculate risk metrics (simplified mock calculations)
    const dailyReturns = performance.slice(1).map((p, i) => {
      const previousPerformance = performance[i];
      return previousPerformance ? (p.value - previousPerformance.value) / previousPerformance.value : 0;
    });
    
    const avgReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length;
    const volatility = Math.sqrt(variance * 252); // Annualized volatility
    
    const riskFreeRate = 0.03; // 3% risk-free rate
    const sharpeRatio = volatility > 0 ? (avgReturn * 252 - riskFreeRate) / volatility : 0;
    
    // Max drawdown calculation
    let peak = performance[0]?.value || 0;
    let maxDrawdown = 0;
    for (const p of performance) {
      if (p.value > peak) peak = p.value;
      const drawdown = (peak - p.value) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    return {
      totalValue: Math.round(totalValue * 100) / 100,
      totalPnL: Math.round(totalPnL * 100) / 100,
      pnlPercentage: Math.round(pnlPercentage * 100) / 100,
      breakdown,
      performance,
      riskMetrics: {
        volatility: Math.round(volatility * 100 * 100) / 100,
        sharpeRatio: Math.round(sharpeRatio * 100) / 100,
        maxDrawdown: Math.round(maxDrawdown * 100 * 100) / 100,
        beta: Math.round((0.8 + Math.random() * 0.4) * 100) / 100, // Mock beta between 0.8-1.2
      },
    };
  }
}
