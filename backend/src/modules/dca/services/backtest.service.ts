import { DCACadence } from '../entities/dca-rule.entity';
import { BacktestResponse } from '../dto/dca.dto';
import { PriceCandle } from './price-history.service';
import { logError, logInfo } from '@/utils/logger';

/**
 * Backtest Service
 * Handles DCA backtest calculations with price data
 */
export class BacktestService {
  /**
   * Run a DCA backtest simulation
   */
  async runBacktest(params: {
    baseSymbol: string;
    quoteSymbol: string;
    amount: number;
    cadence: DCACadence;
    startDate: Date;
    endDate: Date;
    executionTimeUtc: string;
    candles: PriceCandle[];
  }): Promise<BacktestResponse> {
    try {
      const {
        baseSymbol,
        quoteSymbol,
        amount,
        cadence,
        startDate,
        endDate,
        executionTimeUtc,
        candles,
      } = params;

      // Generate execution dates based on cadence
      const executionDates = this.generateExecutionDates(
        startDate,
        endDate,
        cadence,
        executionTimeUtc
      );

      // Calculate fills for each execution date
      const fills = [];
      let cumUnits = 0;
      let cumCost = 0;

      for (const execDate of executionDates) {
        // Find the candle at or after execution time (snap forward)
        const candle = this.findCandleAtOrAfter(candles, execDate);

        if (!candle) {
          // Skip if no candle available (holiday/weekend handling)
          continue;
        }

        const price = candle.close;
        const units = amount / price;
        cumUnits += units;
        cumCost += amount;

        const currentValue = cumUnits * price;

        fills.push({
          date: execDate.toISOString(),
          price,
          units,
          cost: amount,
          cumUnits,
          cumCost,
          value: currentValue,
        });
      }

      // Calculate final metrics
      const finalPrice = candles[candles.length - 1]?.close || 0;
      const endValue = cumUnits * finalPrice;
      const pnlAbs = endValue - cumCost;
      const pnlPct = cumCost > 0 ? (pnlAbs / cumCost) * 100 : 0;
      const avgCost = cumUnits > 0 ? cumCost / cumUnits : 0;

      const result: BacktestResponse = {
        inputs: {
          baseSymbol,
          quoteSymbol,
          amount,
          cadence,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          executionTimeUtc,
        },
        periods: fills.length,
        fills,
        totals: {
          invested: cumCost,
          units: cumUnits,
          avgCost,
          endValue,
          pnlAbs,
          pnlPct,
        },
        series: fills, // Same as fills for now
      };

      logInfo('Backtest calculation completed', {
        baseSymbol,
        quoteSymbol,
        periods: fills.length,
        invested: cumCost,
        endValue,
        pnlPct: pnlPct.toFixed(2),
      });

      return result;
    } catch (error) {
      logError('Backtest calculation failed', error as Error);
      throw error;
    }
  }

  /**
   * Generate execution dates based on cadence
   */
  private generateExecutionDates(
    startDate: Date,
    endDate: Date,
    cadence: DCACadence,
    executionTimeUtc: string
  ): Date[] {
    const dates: Date[] = [];
    const [hours, minutes] = executionTimeUtc.split(':').map(Number);

    let currentDate = new Date(startDate);
    currentDate.setUTCHours(hours || 14, minutes || 0, 0, 0);

    // If start time has passed today, start from next occurrence
    if (currentDate <= new Date()) {
      currentDate = this.getNextExecutionDate(currentDate, cadence);
    }

    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate = this.getNextExecutionDate(currentDate, cadence);
    }

    return dates;
  }

  /**
   * Get next execution date based on cadence
   */
  private getNextExecutionDate(currentDate: Date, cadence: DCACadence): Date {
    const nextDate = new Date(currentDate);

    switch (cadence) {
      case 'daily':
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
        break;
      case 'weekly':
        nextDate.setUTCDate(nextDate.getUTCDate() + 7);
        break;
      case 'monthly':
        nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
        // Handle month-end edge cases
        if (nextDate.getUTCDate() !== currentDate.getUTCDate()) {
          nextDate.setUTCDate(0); // Last day of previous month
        }
        break;
    }

    return nextDate;
  }

  /**
   * Find candle at or immediately after execution timestamp
   * Implements snap-forward logic for weekends/holidays
   */
  private findCandleAtOrAfter(
    candles: PriceCandle[],
    targetDate: Date
  ): PriceCandle | null {
    // Sort candles by timestamp to ensure proper ordering
    const sortedCandles = candles.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Find first candle at or after target date
    for (const candle of sortedCandles) {
      if (candle.timestamp >= targetDate) {
        return candle;
      }
    }

    // If no candle found after target date, check if we're within 48h window
    const latestCandle = sortedCandles[sortedCandles.length - 1];
    if (
      latestCandle &&
      targetDate.getTime() - latestCandle.timestamp.getTime() <=
        48 * 60 * 60 * 1000
    ) {
      // Use latest available candle if within 48h window
      return latestCandle;
    }

    // No suitable candle found (would be marked as missed in production)
    return null;
  }
}
