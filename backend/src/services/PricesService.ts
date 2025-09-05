import axios, { AxiosInstance, AxiosError } from 'axios';
import { logInfo, logWarn, logError } from '@/utils/logger';
import { env } from '@/config/env';
import { cache } from '@/cache/redis';

/**
 * Internal Price Service for PBCEx
 * Fetches prices from CoinGecko with Redis caching
 * Supports PAXG, USDC, and future metals price feeds
 */

export interface PriceData {
  symbol: string;
  usd: number;
  ts: number; // Unix timestamp
  source: 'COINGECKO' | 'CACHE' | 'MOCK';
  cachedAt?: number;
}

export interface PriceResult {
  success: boolean;
  data?: PriceData;
  error?: string;
  correlationId: string;
}

export class PricesService {
  private static httpClient: AxiosInstance;
  private static isInitialized = false;
  
  // Cache configuration
  private static readonly CACHE_TTL_SECONDS = 45; // 45 seconds (between 30-60 as requested)
  private static readonly CACHE_PREFIX = 'price';
  
  // CoinGecko API mapping
  private static readonly SYMBOL_TO_COINGECKO_ID = {
    // Metals mapping: map XAU to Pax Gold (PAXG) for USD proxy
    'XAU': 'pax-gold',
    'PAXG': 'pax-gold',
    'USDC': 'usd-coin',
    // Crypto
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    // Future metals could be added here
    // 'XAU': 'gold',
    // 'XAG': 'silver',
  } as const;

  /**
   * Initialize Prices service
   */
  static async initialize(): Promise<void> {
    if (PricesService.isInitialized) {
      logWarn('PricesService already initialized');
      return;
    }

    logInfo('Initializing PricesService with CoinGecko');

    try {
      // Create HTTP client with timeout and retry
      PricesService.httpClient = axios.create({
        baseURL: env.COINGECKO_BASE_URL,
        timeout: 10000, // 10 seconds
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PBCEx/1.0',
        },
      });

      // Add request interceptor for logging
      PricesService.httpClient.interceptors.request.use(
        (config) => {
          const correlationId = Math.random().toString(36).substr(2, 9);
          config.metadata = { correlationId, startTime: Date.now() };
          
          logInfo('CoinGecko API request', {
            url: config.url,
            correlationId,
          });
          
          return config;
        }
      );

      // Add response interceptor
      PricesService.httpClient.interceptors.response.use(
        (response) => {
          const { correlationId, startTime } = response.config.metadata || {};
          const duration = startTime ? Date.now() - startTime : 0;
          
          logInfo('CoinGecko API response', {
            status: response.status,
            correlationId,
            duration,
          });
          
          return response;
        },
        (error: AxiosError) => {
          const { correlationId, startTime } = error.config?.metadata || {};
          const duration = startTime ? Date.now() - startTime : 0;
          
          logError('CoinGecko API error', {
            status: error.response?.status,
            correlationId,
            duration,
            message: error.message,
          });
          
          return Promise.reject(error);
        }
      );

      // Test connectivity
      await PricesService.testConnection();
      
      PricesService.isInitialized = true;
      logInfo('PricesService initialized successfully');

    } catch (error) {
      logError('Failed to initialize PricesService', error as Error);
      // Continue with mock service
    }
  }

  /**
   * Get PAXG/USD price
   */
  static async getPAXGUSD(): Promise<PriceResult> {
    return PricesService.getTicker('PAXG');
  }

  /**
   * Get USDC/USD price (should be ~1.00 with sanity check)
   */
  static async getUSDCUSD(): Promise<PriceResult> {
    const correlationId = Math.random().toString(36).substr(2, 9);

    logInfo('Getting USDC/USD price', { correlationId });

    try {
      // Check cache first
      const cachedResult = await PricesService.getCachedPrice('USDC');
      if (cachedResult) {
        logInfo('USDC price served from cache', { 
          price: cachedResult.usd,
          correlationId,
        });
        return {
          success: true,
          data: cachedResult,
          correlationId,
        };
      }

      // Get fresh price and perform sanity check
      const result = await PricesService.fetchPriceFromCoinGecko('USDC', correlationId);
      
      if (result.success && result.data) {
        // Sanity check: USDC should be close to $1.00 (allow 5% deviation)
        const price = result.data.usd;
        if (price < 0.95 || price > 1.05) {
          logWarn('USDC price outside expected range', { 
            price,
            correlationId,
          });
        }

        // Cache the result
        await PricesService.cachePrice('USDC', result.data);
      }

      return result;

    } catch (error) {
      logError('Failed to get USDC price', {
        error: error as Error,
        correlationId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown price error',
        correlationId,
      };
    }
  }

  /**
   * Get ticker price by symbol
   */
  static async getTicker(symbol: string): Promise<PriceResult> {
    const correlationId = Math.random().toString(36).substr(2, 9);
    const upperSymbol = symbol.toUpperCase();

    logInfo('Getting ticker price', { 
      symbol: upperSymbol,
      correlationId,
    });

    try {
      // Validate symbol
      if (!PricesService.SYMBOL_TO_COINGECKO_ID[upperSymbol as keyof typeof PricesService.SYMBOL_TO_COINGECKO_ID]) {
        return {
          success: false,
          error: `Unsupported symbol: ${upperSymbol}`,
          correlationId,
        };
      }

      // Check cache first
      const cachedResult = await PricesService.getCachedPrice(upperSymbol);
      if (cachedResult) {
        logInfo('Price served from cache', { 
          symbol: upperSymbol,
          price: cachedResult.usd,
          age: Date.now() - cachedResult.cachedAt!,
          correlationId,
        });
        return {
          success: true,
          data: cachedResult,
          correlationId,
        };
      }

      // Fetch fresh price
      const result = await PricesService.fetchPriceFromCoinGecko(upperSymbol, correlationId);
      
      if (result.success && result.data) {
        // Cache the result
        await PricesService.cachePrice(upperSymbol, result.data);
      }

      return result;

    } catch (error) {
      logError('Failed to get ticker price', {
        symbol: upperSymbol,
        error: error as Error,
        correlationId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown price error',
        correlationId,
      };
    }
  }

  /**
   * Get multiple tickers at once (batch operation)
   */
  static async getMultipleTickers(symbols: string[]): Promise<{ [symbol: string]: PriceResult }> {
    const results: { [symbol: string]: PriceResult } = {};
    
    // Process in parallel but limit concurrency to avoid rate limits
    const batchSize = 3;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const batchPromises = batch.map(symbol => 
        PricesService.getTicker(symbol).then(result => ({ symbol, result }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ symbol, result }) => {
        results[symbol.toUpperCase()] = result;
      });

      // Small delay between batches
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Get service health status
   */
  static getHealthStatus(): {
    status: string;
    configured: boolean;
    baseUrl: string;
    cacheEnabled: boolean;
    supportedSymbols: string[];
  } {
    return {
      status: PricesService.isInitialized ? 'initialized' : 'not_initialized',
      configured: !!env.COINGECKO_BASE_URL,
      baseUrl: env.COINGECKO_BASE_URL,
      cacheEnabled: true, // Redis is always used if available
      supportedSymbols: Object.keys(PricesService.SYMBOL_TO_COINGECKO_ID),
    };
  }

  /**
   * Shutdown service gracefully
   */
  static async shutdown(): Promise<void> {
    logInfo('Shutting down PricesService');
    PricesService.isInitialized = false;
    logInfo('PricesService shut down');
  }

  // Private helper methods

  private static async testConnection(): Promise<void> {
    try {
      // Test with a simple ping endpoint
      const response = await PricesService.httpClient.get('/ping', {
        timeout: 5000,
        validateStatus: () => true, // Accept any status for test
      });

      if (response.status === 404) {
        // Ping endpoint doesn't exist, try a real endpoint with minimal data
        await PricesService.httpClient.get('/simple/price', {
          params: {
            ids: 'bitcoin',
            vs_currencies: 'usd',
          },
          timeout: 5000,
        });
      }

      logInfo('CoinGecko API connectivity verified');
    } catch (error) {
      logWarn('CoinGecko API connectivity test failed', { error });
      // Don't throw - continue with mock service
    }
  }

  private static async getCachedPrice(symbol: string): Promise<PriceData | null> {
    try {
      const cacheKey = `${PricesService.CACHE_PREFIX}:${symbol}:USD`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        const priceData: PriceData = JSON.parse(cached);
        
        // Verify cache data is valid and not corrupted
        if (priceData.symbol && priceData.usd && priceData.ts) {
          return {
            ...priceData,
            source: 'CACHE',
            cachedAt: priceData.ts,
          };
        }
      }
      
      return null;
    } catch (error) {
      logWarn('Failed to get cached price', { symbol, error });
      return null;
    }
  }

  private static async cachePrice(symbol: string, priceData: PriceData): Promise<void> {
    try {
      const cacheKey = `${PricesService.CACHE_PREFIX}:${symbol}:USD`;
      const cacheData = {
        ...priceData,
        cachedAt: Date.now(),
      };
      
      await cache.setex(cacheKey, PricesService.CACHE_TTL_SECONDS, JSON.stringify(cacheData));
      
      logInfo('Price cached', { 
        symbol,
        price: priceData.usd,
        ttl: PricesService.CACHE_TTL_SECONDS,
      });
    } catch (error) {
      logWarn('Failed to cache price', { symbol, error });
      // Don't throw - caching failure shouldn't break price fetching
    }
  }

  private static async fetchPriceFromCoinGecko(symbol: string, correlationId: string): Promise<PriceResult> {
    try {
      if (!PricesService.isInitialized || !PricesService.httpClient) {
        // Return mock price
        return {
          success: true,
          data: PricesService.generateMockPrice(symbol),
          correlationId,
        };
      }

      const coinGeckoId = PricesService.SYMBOL_TO_COINGECKO_ID[symbol as keyof typeof PricesService.SYMBOL_TO_COINGECKO_ID];
      
      const response = await PricesService.httpClient.get('/simple/price', {
        params: {
          ids: coinGeckoId,
          vs_currencies: 'usd',
          include_last_updated_at: true,
        },
      });

      if (response.status !== 200) {
        throw new Error(`CoinGecko API returned status ${response.status}`);
      }

      const data = response.data[coinGeckoId];
      if (!data || typeof data.usd !== 'number') {
        throw new Error(`Invalid price data for ${symbol}`);
      }

      const priceData: PriceData = {
        symbol,
        usd: data.usd,
        ts: data.last_updated_at ? data.last_updated_at * 1000 : Date.now(), // Convert to milliseconds
        source: 'COINGECKO',
      };

      logInfo('Price fetched from CoinGecko', {
        symbol,
        price: priceData.usd,
        correlationId,
      });

      return {
        success: true,
        data: priceData,
        correlationId,
      };

    } catch (error) {
      logError('Failed to fetch price from CoinGecko', {
        symbol,
        error: error as Error,
        correlationId,
      });

      // Fallback to mock price
      return {
        success: true,
        data: PricesService.generateMockPrice(symbol),
        correlationId,
      };
    }
  }

  private static generateMockPrice(symbol: string): PriceData {
    // Generate somewhat realistic mock prices
    const basePrices = {
      'PAXG': 2000 + (Math.random() - 0.5) * 100, // Gold ~$2000 ± $50
      'USDC': 1.0 + (Math.random() - 0.5) * 0.02, // USDC ~$1.00 ± $0.01
    };

    const basePrice = basePrices[symbol as keyof typeof basePrices] || 100;

    return {
      symbol,
      usd: parseFloat(basePrice.toFixed(symbol === 'USDC' ? 4 : 2)),
      ts: Date.now(),
      source: 'MOCK',
    };
  }
}

// Extend AxiosRequestConfig for metadata
declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      correlationId: string;
      startTime: number;
    };
  }
}

export default PricesService;
