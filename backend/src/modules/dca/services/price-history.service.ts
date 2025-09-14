import { logError, logInfo } from '@/utils/logger';

/**
 * Price History Adapter Interface
 * Pluggable interface for different price data sources
 */
export interface PriceHistoryAdapter {
  candles(
    symbolPair: string,
    start: Date,
    end: Date,
    interval: '1d' | '1h' | '4h'
  ): Promise<PriceCandle[]>;
}

export interface PriceCandle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * In-Memory Price History Adapter
 * Used for testing and development
 */
export class InMemoryPriceHistoryAdapter implements PriceHistoryAdapter {
  private priceData: Map<string, PriceCandle[]> = new Map();

  constructor() {
    this.initializeTestData();
  }

  async candles(
    symbolPair: string,
    start: Date,
    end: Date,
    interval: '1d' | '1h' | '4h'
  ): Promise<PriceCandle[]> {
    const key = `${symbolPair}-${interval}`;
    const data = this.priceData.get(key) || [];

    return data.filter(
      candle => candle.timestamp >= start && candle.timestamp <= end
    );
  }

  private initializeTestData() {
    // Generate test data for common pairs
    const pairs = ['BTC-USDC', 'ETH-USDC', 'GOLD-USD'];
    const intervals: ('1d' | '1h' | '4h')[] = ['1d', '1h', '4h'];

    pairs.forEach(pair => {
      intervals.forEach(interval => {
        const key = `${pair}-${interval}`;
        const data = this.generateTestCandles(pair, interval);
        this.priceData.set(key, data);
      });
    });

    logInfo('InMemoryPriceHistoryAdapter initialized with test data', {
      pairs: pairs.length,
      intervals: intervals.length,
    });
  }

  private generateTestCandles(
    pair: string,
    interval: '1d' | '1h' | '4h'
  ): PriceCandle[] {
    const candles: PriceCandle[] = [];
    const now = new Date();
    const startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year ago

    const intervalMs =
      interval === '1d'
        ? 24 * 60 * 60 * 1000
        : interval === '4h'
          ? 4 * 60 * 60 * 1000
          : 60 * 60 * 1000; // 1h

    // Base prices for different assets
    const basePrices: Record<string, number> = {
      'BTC-USDC': 45000,
      'ETH-USDC': 3000,
      'GOLD-USD': 2000,
    };

    let basePrice = basePrices[pair] || 100;
    let currentTime = startDate.getTime();

    while (currentTime < now.getTime()) {
      // Add some realistic price movement
      const volatility = 0.02; // 2% daily volatility
      const change = (Math.random() - 0.5) * volatility;
      basePrice *= 1 + change;

      const open = basePrice;
      const close = basePrice * (1 + (Math.random() - 0.5) * 0.01);
      const high = Math.max(open, close) * (1 + Math.random() * 0.005);
      const low = Math.min(open, close) * (1 - Math.random() * 0.005);
      const volume = Math.random() * 1000000;

      candles.push({
        timestamp: new Date(currentTime),
        open,
        high,
        low,
        close,
        volume,
      });

      currentTime += intervalMs;
    }

    return candles;
  }
}

/**
 * CoinGecko Price History Adapter (stub)
 * Would integrate with CoinGecko API in production
 */
export class CoinGeckoPriceHistoryAdapter implements PriceHistoryAdapter {
  private apiKey?: string;
  private baseUrl = 'https://api.coingecko.com/api/v3';

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async candles(
    symbolPair: string,
    start: Date,
    end: Date,
    interval: '1d' | '1h' | '4h'
  ): Promise<PriceCandle[]> {
    // This is a stub implementation
    // In production, this would make actual API calls to CoinGecko

    logInfo('CoinGeckoPriceHistoryAdapter: Stub implementation', {
      symbolPair,
      start: start.toISOString(),
      end: end.toISOString(),
      interval,
    });

    // Return empty array for now
    return [];
  }
}

/**
 * Price History Service
 * Main service that manages price data adapters
 */
export class PriceHistoryService {
  private adapter: PriceHistoryAdapter;

  constructor(adapter?: PriceHistoryAdapter) {
    this.adapter = adapter || new InMemoryPriceHistoryAdapter();
  }

  /**
   * Set the price history adapter
   */
  setAdapter(adapter: PriceHistoryAdapter): void {
    this.adapter = adapter;
  }

  /**
   * Get price candles for a symbol pair
   */
  async getCandles(
    symbolPair: string,
    start: Date,
    end: Date,
    interval: '1d' | '1h' | '4h' = '1d'
  ): Promise<PriceCandle[]> {
    try {
      logInfo('Fetching price candles', {
        symbolPair,
        start: start.toISOString(),
        end: end.toISOString(),
        interval,
      });

      const candles = await this.adapter.candles(
        symbolPair,
        start,
        end,
        interval
      );

      logInfo('Price candles fetched successfully', {
        symbolPair,
        count: candles.length,
        interval,
      });

      return candles;
    } catch (error) {
      logError('Failed to fetch price candles', error as Error);
      throw error;
    }
  }

  /**
   * Get the latest price for a symbol pair
   */
  async getLatestPrice(symbolPair: string): Promise<number> {
    try {
      const end = new Date();
      const start = new Date(end.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

      const candles = await this.getCandles(symbolPair, start, end, '1d');

      if (candles.length === 0) {
        throw new Error(`No price data available for ${symbolPair}`);
      }

      // Return the close price of the most recent candle
      const lastCandle = candles[candles.length - 1];
      if (!lastCandle) {
        throw new Error(`No price data available for ${symbolPair}`);
      }
      return lastCandle.close;
    } catch (error) {
      logError('Failed to get latest price', error as Error);
      throw error;
    }
  }
}
