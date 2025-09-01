import { logInfo, logError } from '@/utils/logger';

export interface DCABacktestRequest {
  asset: string;
  contribution: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  startDate: string;
  endDate: string;
}

export interface DCABacktestResult {
  summary: {
    totalInvested: string;
    totalUnits: string;
    averageCost: string;
    currentValue: string;
    totalReturn: string;
    totalReturnPercentage: string;
  };
  series: Array<{
    date: string;
    contribution: string;
    price: string;
    units: string;
    totalInvested: string;
    totalUnits: string;
    averageCost: string;
    currentValue: string;
  }>;
}

export interface PriceDataPoint {
  date: string;
  price: number;
}

export class DCABacktestCalculator {
  /**
   * Calculate DCA backtest
   */
  static async calculateBacktest(
    request: DCABacktestRequest
  ): Promise<DCABacktestResult> {
    try {
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      const contribution = parseFloat(request.contribution);

      // Validate dates
      if (startDate >= endDate) {
        throw new Error('Start date must be before end date');
      }

      if (contribution <= 0) {
        throw new Error('Contribution amount must be positive');
      }

      // Get price data for the period
      const priceData = await DCABacktestCalculator.getPriceData(
        request.asset,
        startDate,
        endDate
      );

      if (priceData.length === 0) {
        throw new Error('No price data available for the specified period');
      }

      // Calculate investment dates based on frequency
      const investmentDates = DCABacktestCalculator.calculateInvestmentDates(
        startDate,
        endDate,
        request.frequency
      );

      // Filter price data to only include investment dates
      const investmentPriceData = priceData.filter(dataPoint =>
        investmentDates.some(
          date =>
            Math.abs(new Date(dataPoint.date).getTime() - date.getTime()) <
            24 * 60 * 60 * 1000
        )
      );

      // Calculate DCA series
      const series = DCABacktestCalculator.calculateDCASeries(
        investmentPriceData,
        contribution
      );

      // Calculate summary
      const summary = DCABacktestCalculator.calculateSummary(series);

      logInfo('DCA backtest calculated', {
        asset: request.asset,
        contribution: request.contribution,
        frequency: request.frequency,
        startDate: request.startDate,
        endDate: request.endDate,
        totalInvested: summary.totalInvested,
        totalReturn: summary.totalReturn,
        totalReturnPercentage: summary.totalReturnPercentage,
      });

      return { summary, series };
    } catch (error) {
      logError('Error calculating DCA backtest', {
        error: error as Error,
        request,
      });
      throw error;
    }
  }

  /**
   * Get price data for an asset (placeholder implementation)
   */
  private static async getPriceData(
    asset: string,
    startDate: Date,
    endDate: Date
  ): Promise<PriceDataPoint[]> {
    // In production, this would fetch real price data from:
    // - External APIs (CoinGecko, CoinMarketCap, etc.)
    // - Internal price feeds
    // - Historical data stores

    // For now, generate mock price data with realistic patterns
    const priceData: PriceDataPoint[] = [];
    const currentDate = new Date(startDate);
    const basePrice = DCABacktestCalculator.getBasePrice(asset);
    let currentPrice = basePrice;

    while (currentDate <= endDate) {
      // Add some realistic price volatility
      const volatility = 0.02; // 2% daily volatility
      const change = (Math.random() - 0.5) * 2 * volatility;
      currentPrice *= 1 + change;

      // Ensure price doesn't go negative
      currentPrice = Math.max(currentPrice, basePrice * 0.1);

      priceData.push({
        date: currentDate.toISOString().split('T')[0] || '',
        price: currentPrice,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return priceData;
  }

  /**
   * Calculate investment dates based on frequency
   */
  private static calculateInvestmentDates(
    startDate: Date,
    endDate: Date,
    frequency: string
  ): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));

      switch (frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'biweekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        default:
          currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return dates;
  }

  /**
   * Calculate DCA series
   */
  private static calculateDCASeries(
    priceData: PriceDataPoint[],
    contribution: number
  ): DCABacktestResult['series'] {
    const series: DCABacktestResult['series'] = [];
    let totalInvested = 0;
    let totalUnits = 0;

    for (const dataPoint of priceData) {
      const price = dataPoint.price;
      const units = contribution / price;

      totalInvested += contribution;
      totalUnits += units;

      const averageCost = totalInvested / totalUnits;
      const currentValue = totalUnits * price;
      const totalReturn = currentValue - totalInvested;
      const totalReturnPercentage = (totalReturn / totalInvested) * 100;

      series.push({
        date: dataPoint.date,
        contribution: contribution.toFixed(2),
        price: price.toFixed(6),
        units: units.toFixed(6),
        totalInvested: totalInvested.toFixed(2),
        totalUnits: totalUnits.toFixed(6),
        averageCost: averageCost.toFixed(6),
        currentValue: currentValue.toFixed(2),
      });
    }

    return series;
  }

  /**
   * Calculate summary from series
   */
  private static calculateSummary(
    series: DCABacktestResult['series']
  ): DCABacktestResult['summary'] {
    if (series.length === 0) {
      return {
        totalInvested: '0',
        totalUnits: '0',
        averageCost: '0',
        currentValue: '0',
        totalReturn: '0',
        totalReturnPercentage: '0',
      };
    }

    const lastEntry = series[series.length - 1];
    if (!lastEntry) {
      return {
        totalInvested: '0',
        totalUnits: '0',
        averageCost: '0',
        currentValue: '0',
        totalReturn: '0',
        totalReturnPercentage: '0',
      };
    }

    const totalInvested = parseFloat(lastEntry.totalInvested);
    const currentValue = parseFloat(lastEntry.currentValue);
    const totalReturn = currentValue - totalInvested;
    const totalReturnPercentage = (totalReturn / totalInvested) * 100;

    return {
      totalInvested: lastEntry.totalInvested,
      totalUnits: lastEntry.totalUnits,
      averageCost: lastEntry.averageCost,
      currentValue: lastEntry.currentValue,
      totalReturn: totalReturn.toFixed(2),
      totalReturnPercentage: totalReturnPercentage.toFixed(2),
    };
  }

  /**
   * Get base price for an asset (placeholder)
   */
  private static getBasePrice(asset: string): number {
    const basePrices: Record<string, number> = {
      BTC: 45000,
      ETH: 3000,
      USDC: 1,
      USDT: 1,
      USD: 1,
      AU: 2000, // Gold price per oz
      AG: 25, // Silver price per oz
    };

    return basePrices[asset.toUpperCase()] || 100;
  }

  /**
   * Calculate compound annual growth rate (CAGR)
   */
  static calculateCAGR(
    initialValue: number,
    finalValue: number,
    years: number
  ): number {
    if (years <= 0 || initialValue <= 0) {
      return 0;
    }

    return Math.pow(finalValue / initialValue, 1 / years) - 1;
  }

  /**
   * Calculate maximum drawdown
   */
  static calculateMaxDrawdown(series: DCABacktestResult['series']): {
    maxDrawdown: string;
    maxDrawdownPercentage: string;
    peakDate: string;
    troughDate: string;
  } {
    if (series.length === 0) {
      return {
        maxDrawdown: '0',
        maxDrawdownPercentage: '0',
        peakDate: '',
        troughDate: '',
      };
    }

    let peak = 0;
    let maxDrawdown = 0;
    let peakDate = '';
    let troughDate = '';

    for (const entry of series) {
      const currentValue = parseFloat(entry.currentValue);

      if (currentValue > peak) {
        peak = currentValue;
        peakDate = entry.date;
      }

      const drawdown = (peak - currentValue) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        troughDate = entry.date;
      }
    }

    return {
      maxDrawdown: (peak * maxDrawdown).toFixed(2),
      maxDrawdownPercentage: (maxDrawdown * 100).toFixed(2),
      peakDate,
      troughDate,
    };
  }

  /**
   * Calculate Sharpe ratio (simplified)
   */
  static calculateSharpeRatio(series: DCABacktestResult['series']): string {
    if (series.length < 2) {
      return '0';
    }

    // Calculate daily returns
    const returns: number[] = [];
    for (let i = 1; i < series.length; i++) {
      const prevEntry = series[i - 1];
      const currEntry = series[i];
      if (!prevEntry || !currEntry) continue;

      const prevValue = parseFloat(prevEntry.currentValue);
      const currValue = parseFloat(currEntry.currentValue);
      const dailyReturn = (currValue - prevValue) / prevValue;
      returns.push(dailyReturn);
    }

    // Calculate average return and standard deviation
    const avgReturn =
      returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance =
      returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) /
      returns.length;
    const stdDev = Math.sqrt(variance);

    // Risk-free rate assumed to be 0 for simplicity
    const riskFreeRate = 0;
    const sharpeRatio = stdDev > 0 ? (avgReturn - riskFreeRate) / stdDev : 0;

    return sharpeRatio.toFixed(4);
  }

  /**
   * Generate performance metrics
   */
  static generatePerformanceMetrics(series: DCABacktestResult['series']): {
    cagr: string;
    maxDrawdown: string;
    maxDrawdownPercentage: string;
    sharpeRatio: string;
    volatility: string;
  } {
    if (series.length === 0) {
      return {
        cagr: '0',
        maxDrawdown: '0',
        maxDrawdownPercentage: '0',
        sharpeRatio: '0',
        volatility: '0',
      };
    }

    const firstEntry = series[0];
    const lastEntry = series[series.length - 1];
    if (!firstEntry || !lastEntry) {
      return {
        cagr: '0',
        maxDrawdown: '0',
        maxDrawdownPercentage: '0',
        sharpeRatio: '0',
        volatility: '0',
      };
    }

    const initialValue = parseFloat(firstEntry.currentValue);
    const finalValue = parseFloat(lastEntry.currentValue);

    // Calculate years (approximate)
    const startDate = new Date(firstEntry.date);
    const endDate = new Date(lastEntry.date);
    const years =
      (endDate.getTime() - startDate.getTime()) /
      (1000 * 60 * 60 * 24 * 365.25);

    const cagr = DCABacktestCalculator.calculateCAGR(
      initialValue,
      finalValue,
      years
    );
    const maxDrawdown = DCABacktestCalculator.calculateMaxDrawdown(series);
    const sharpeRatio = DCABacktestCalculator.calculateSharpeRatio(series);

    // Calculate volatility (annualized)
    const returns: number[] = [];
    for (let i = 1; i < series.length; i++) {
      const prevEntry = series[i - 1];
      const currEntry = series[i];
      if (!prevEntry || !currEntry) continue;

      const prevValue = parseFloat(prevEntry.currentValue);
      const currValue = parseFloat(currEntry.currentValue);
      const dailyReturn = (currValue - prevValue) / prevValue;
      returns.push(dailyReturn);
    }

    const avgReturn =
      returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance =
      returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) /
      returns.length;
    const dailyVolatility = Math.sqrt(variance);
    const annualizedVolatility = dailyVolatility * Math.sqrt(365);

    return {
      cagr: (cagr * 100).toFixed(2),
      maxDrawdown: maxDrawdown.maxDrawdown,
      maxDrawdownPercentage: maxDrawdown.maxDrawdownPercentage,
      sharpeRatio,
      volatility: (annualizedVolatility * 100).toFixed(2),
    };
  }
}
