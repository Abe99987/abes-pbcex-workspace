import axios from 'axios';
import WebSocket from 'ws';
import { logInfo, logWarn, logError } from '@/utils/logger';
import { env, integrations } from '@/config/env';
import { createError } from '@/middlewares/errorMiddleware';

/**
 * Price Feed Service for PBCEx
 * Handles real-time price data from TradingView and other sources
 */

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
  source: 'TRADINGVIEW' | 'CHAINLINK' | 'MOCK';
}

interface PriceSubscriber {
  id: string;
  symbols: string[];
  callback: (priceData: PriceData) => void;
}

export class PriceFeedService {
  private static priceCache = new Map<string, PriceData>();
  private static subscribers: PriceSubscriber[] = [];
  private static wsConnection: WebSocket | null = null;
  private static reconnectAttempts = 0;
  private static maxReconnectAttempts = 5;
  private static isInitialized = false;

  // Symbol mappings for different data sources
  private static readonly symbolMappings = {
    // PBCEx asset -> TradingView symbol
    'AU': 'OANDA:XAUUSD',
    'AG': 'OANDA:XAGUSD', 
    'PT': 'OANDA:XPTUSD',
    'PD': 'OANDA:XPDUSD',
    'CU': 'COMEX:HG1!', // Copper futures
    'USD': 'OANDA:EURUSD', // For USD index calculation
    'BTC': 'BINANCE:BTCUSDT',
    'ETH': 'BINANCE:ETHUSDT',
  };

  /**
   * Initialize the price feed service
   */
  static async initialize(): Promise<void> {
    if (PriceFeedService.isInitialized) {
      logWarn('PriceFeedService already initialized');
      return;
    }

    logInfo('Initializing PriceFeedService');

    try {
      // Initialize with mock data for development
      await PriceFeedService.initializeMockPrices();

      if (integrations.tradingView && env.TRADINGVIEW_API_KEY) {
        // Initialize TradingView connection
        await PriceFeedService.initializeTradingView();
      } else {
        logWarn('TradingView not configured, using mock prices');
      }

      // Start price update loop
      PriceFeedService.startPriceUpdateLoop();

      PriceFeedService.isInitialized = true;
      logInfo('PriceFeedService initialized successfully');

    } catch (error) {
      logError('Failed to initialize PriceFeedService', error as Error);
      throw createError.serviceUnavailable('PriceFeed', 'Failed to initialize price feed service');
    }
  }

  /**
   * Get current spot price for an asset
   */
  static getSpotPrice(asset: string): PriceData | null {
    const cached = PriceFeedService.priceCache.get(asset);
    
    if (!cached) {
      logWarn('Price not available for asset', { asset });
      return null;
    }

    // Check if price is stale (older than 5 minutes)
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    if (Date.now() - cached.timestamp.getTime() > staleThreshold) {
      logWarn('Cached price is stale', { 
        asset, 
        age: Math.round((Date.now() - cached.timestamp.getTime()) / 1000) + 's' 
      });
    }

    return cached;
  }

  /**
   * Get multiple spot prices
   */
  static getMultiplePrices(assets: string[]): Record<string, PriceData | null> {
    const prices: Record<string, PriceData | null> = {};
    
    for (const asset of assets) {
      prices[asset] = PriceFeedService.getSpotPrice(asset);
    }

    return prices;
  }

  /**
   * Subscribe to price updates
   */
  static subscribe(
    id: string, 
    symbols: string[], 
    callback: (priceData: PriceData) => void
  ): void {
    // Remove existing subscription with same ID
    PriceFeedService.unsubscribe(id);

    // Add new subscription
    PriceFeedService.subscribers.push({ id, symbols, callback });

    logInfo('Price subscription added', { subscriptionId: id, symbols });

    // Send current prices immediately
    for (const symbol of symbols) {
      const currentPrice = PriceFeedService.getSpotPrice(symbol);
      if (currentPrice) {
        callback(currentPrice);
      }
    }
  }

  /**
   * Unsubscribe from price updates
   */
  static unsubscribe(id: string): void {
    const index = PriceFeedService.subscribers.findIndex(sub => sub.id === id);
    if (index !== -1) {
      PriceFeedService.subscribers.splice(index, 1);
      logInfo('Price subscription removed', { subscriptionId: id });
    }
  }

  /**
   * Force update all prices
   */
  static async forceUpdate(): Promise<void> {
    logInfo('Forcing price update for all assets');

    const assets = Object.keys(PriceFeedService.symbolMappings);
    
    for (const asset of assets) {
      try {
        await PriceFeedService.updateAssetPrice(asset);
      } catch (error) {
        logError(`Failed to update price for ${asset}`, error as Error);
      }
    }
  }

  /**
   * Get price history for an asset (mock implementation)
   */
  static async getPriceHistory(
    asset: string, 
    period: '1h' | '1d' | '1w' | '1m' = '1d',
    points: number = 100
  ): Promise<Array<{ timestamp: Date; price: number; volume: number }>> {
    logInfo('Fetching price history', { asset, period, points });

    // Mock historical data generation
    const currentPrice = PriceFeedService.getSpotPrice(asset)?.price || 100;
    const history: Array<{ timestamp: Date; price: number; volume: number }> = [];

    const periodMs = {
      '1h': 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
      '1m': 30 * 24 * 60 * 60 * 1000,
    }[period];

    const intervalMs = periodMs / points;
    const now = new Date();

    for (let i = points - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * intervalMs));
      
      // Generate mock price with some volatility
      const volatility = 0.02; // 2% volatility
      const randomChange = (Math.random() - 0.5) * volatility;
      const price = currentPrice * (1 + randomChange * (i / points));
      const volume = Math.floor(Math.random() * 1000000);

      history.push({ timestamp, price, volume });
    }

    return history;
  }

  /**
   * Get market status
   */
  static getMarketStatus(): {
    isOpen: boolean;
    nextOpen?: Date;
    nextClose?: Date;
    timezone: string;
  } {
    // Simplified market hours (in production, would check multiple markets)
    const now = new Date();
    const utcHour = now.getUTCHours();

    // Assume 24/7 for precious metals, but major trading hours 9 AM - 5 PM ET
    const marketHours = {
      start: 14, // 9 AM ET in UTC
      end: 22,   // 5 PM ET in UTC
    };

    const isOpen = utcHour >= marketHours.start && utcHour < marketHours.end;

    return {
      isOpen,
      timezone: 'UTC',
    };
  }

  // Private methods

  private static async initializeMockPrices(): Promise<void> {
    logInfo('Initializing mock price data');

    const mockPrices: Array<{ asset: string; price: number; volume: number }> = [
      { asset: 'AU', price: 2050.25, volume: 125000 },
      { asset: 'AG', price: 24.75, volume: 890000 },
      { asset: 'PT', price: 975.50, volume: 45000 },
      { asset: 'PD', price: 1150.75, volume: 25000 },
      { asset: 'CU', price: 8.25, volume: 2500000 },
      { asset: 'USD', price: 1.0, volume: 0 },
      { asset: 'BTC', price: 45000, volume: 1200 },
      { asset: 'ETH', price: 3200, volume: 15000 },
    ];

    for (const { asset, price, volume } of mockPrices) {
      const priceData: PriceData = {
        symbol: asset,
        price,
        change: (Math.random() - 0.5) * price * 0.02, // ±1% change
        changePercent: (Math.random() - 0.5) * 2, // ±1%
        volume,
        timestamp: new Date(),
        source: 'MOCK',
      };

      PriceFeedService.priceCache.set(asset, priceData);
    }

    logInfo('Mock prices initialized', { count: mockPrices.length });
  }

  private static async initializeTradingView(): Promise<void> {
    if (!env.TRADINGVIEW_API_KEY) {
      throw createError.internal('TradingView API key not configured');
    }

    logInfo('Connecting to TradingView data feed');

    try {
      // In production, connect to TradingView WebSocket or REST API
      // For now, we'll simulate the connection
      
      PriceFeedService.wsConnection = null; // Mock connection
      
      logInfo('TradingView connection established (simulated)');
    } catch (error) {
      logError('Failed to connect to TradingView', error as Error);
      throw error;
    }
  }

  private static startPriceUpdateLoop(): void {
    logInfo('Starting price update loop');

    // Update prices every 5 seconds
    setInterval(async () => {
      try {
        await PriceFeedService.updateAllPrices();
      } catch (error) {
        logError('Error in price update loop', error as Error);
      }
    }, 5000);

    // Update less frequently for some assets
    setInterval(async () => {
      try {
        await PriceFeedService.updateSlowAssets();
      } catch (error) {
        logError('Error updating slow assets', error as Error);
      }
    }, 30000); // Every 30 seconds
  }

  private static async updateAllPrices(): Promise<void> {
    const assets = ['AU', 'AG', 'PT', 'PD', 'CU'];
    
    const updatePromises = assets.map(asset => 
      PriceFeedService.updateAssetPrice(asset).catch(error => {
        logWarn(`Failed to update ${asset} price`, { error: error.message });
      })
    );

    await Promise.allSettled(updatePromises);
  }

  private static async updateSlowAssets(): Promise<void> {
    const slowAssets = ['USD', 'BTC', 'ETH'];
    
    for (const asset of slowAssets) {
      try {
        await PriceFeedService.updateAssetPrice(asset);
      } catch (error) {
        logWarn(`Failed to update ${asset} price`, { error: (error as Error).message });
      }
    }
  }

  private static async updateAssetPrice(asset: string): Promise<void> {
    const currentPrice = PriceFeedService.priceCache.get(asset);
    if (!currentPrice) return;

    // Simulate price movement
    const volatility = PriceFeedService.getAssetVolatility(asset);
    const change = (Math.random() - 0.5) * volatility * currentPrice.price;
    const newPrice = Math.max(0.01, currentPrice.price + change);

    const updatedPrice: PriceData = {
      ...currentPrice,
      price: newPrice,
      change: newPrice - currentPrice.price,
      changePercent: ((newPrice - currentPrice.price) / currentPrice.price) * 100,
      timestamp: new Date(),
    };

    PriceFeedService.priceCache.set(asset, updatedPrice);

    // Notify subscribers
    PriceFeedService.notifySubscribers(updatedPrice);
  }

  private static getAssetVolatility(asset: string): number {
    const volatilities: Record<string, number> = {
      'AU': 0.015, // 1.5% volatility
      'AG': 0.025, // 2.5% volatility
      'PT': 0.020, // 2.0% volatility
      'PD': 0.035, // 3.5% volatility
      'CU': 0.025, // 2.5% volatility
      'USD': 0.005, // 0.5% volatility
      'BTC': 0.050, // 5.0% volatility
      'ETH': 0.045, // 4.5% volatility
    };

    return volatilities[asset] || 0.02;
  }

  private static notifySubscribers(priceData: PriceData): void {
    for (const subscriber of PriceFeedService.subscribers) {
      if (subscriber.symbols.includes(priceData.symbol)) {
        try {
          subscriber.callback(priceData);
        } catch (error) {
          logError('Error in price subscriber callback', error as Error);
        }
      }
    }
  }

  /**
   * Simulate Chainlink price oracle (for future integration)
   */
  static async getChainlinkPrice(asset: string): Promise<PriceData | null> {
    logInfo('Fetching Chainlink price', { asset });

    // Mock Chainlink price feed
    const mockChainlinkPrices: Record<string, number> = {
      'AU': 2051.75,
      'AG': 24.82,
      'PT': 976.25,
      'PD': 1152.30,
      'CU': 8.27,
    };

    const price = mockChainlinkPrices[asset];
    if (!price) return null;

    return {
      symbol: asset,
      price,
      change: 0,
      changePercent: 0,
      volume: 0,
      timestamp: new Date(),
      source: 'CHAINLINK',
    };
  }

  /**
   * Get aggregated price from multiple sources
   */
  static async getAggregatedPrice(asset: string): Promise<PriceData | null> {
    const sources = [
      () => PriceFeedService.getSpotPrice(asset),
      () => PriceFeedService.getChainlinkPrice(asset),
    ];

    const prices: PriceData[] = [];

    for (const source of sources) {
      try {
        const price = await source();
        if (price) prices.push(price);
      } catch (error) {
        logWarn('Price source failed', { asset, error: (error as Error).message });
      }
    }

    if (prices.length === 0) return null;

    // Calculate weighted average (simple average for now)
    const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
    const latestTimestamp = new Date(Math.max(...prices.map(p => p.timestamp.getTime())));

    return {
      symbol: asset,
      price: avgPrice,
      change: prices[0].change, // Use first source for change calculation
      changePercent: prices[0].changePercent,
      volume: Math.max(...prices.map(p => p.volume)),
      timestamp: latestTimestamp,
      source: 'TRADINGVIEW', // Primary source
    };
  }

  /**
   * Shutdown the price feed service
   */
  static async shutdown(): Promise<void> {
    logInfo('Shutting down PriceFeedService');

    if (PriceFeedService.wsConnection) {
      PriceFeedService.wsConnection.close();
      PriceFeedService.wsConnection = null;
    }

    PriceFeedService.subscribers.length = 0;
    PriceFeedService.priceCache.clear();
    PriceFeedService.isInitialized = false;

    logInfo('PriceFeedService shutdown complete');
  }

  /**
   * Get service health status
   */
  static getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    cachedPrices: number;
    subscribers: number;
    lastUpdate: Date | null;
    uptime: number;
  } {
    const cachedPrices = PriceFeedService.priceCache.size;
    const subscribers = PriceFeedService.subscribers.length;
    
    let lastUpdate: Date | null = null;
    let oldestPrice = Date.now();

    for (const priceData of PriceFeedService.priceCache.values()) {
      const priceAge = priceData.timestamp.getTime();
      if (priceAge > (lastUpdate?.getTime() || 0)) {
        lastUpdate = priceData.timestamp;
      }
      if (priceAge < oldestPrice) {
        oldestPrice = priceAge;
      }
    }

    // Determine health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (cachedPrices < 5) {
      status = 'unhealthy';
    } else if (lastUpdate && (Date.now() - lastUpdate.getTime()) > 60000) {
      status = 'degraded'; // No updates in last minute
    }

    return {
      status,
      cachedPrices,
      subscribers,
      lastUpdate,
      uptime: PriceFeedService.isInitialized ? Date.now() - oldestPrice : 0,
    };
  }
}

export default PriceFeedService;
