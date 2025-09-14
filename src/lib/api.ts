/**
 * API Client Layer for Markets functionality
 * Provides adapters for live data integration with feature flag support
 */

import { FEATURE_FLAGS } from '@/config/features';

// Environment configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Common types - aligned with OpenAPI spec
export interface ApiResponse<T> {
  code: 'SUCCESS' | 'ERROR' | 'VALIDATION_ERROR' | 'NOT_FOUND';
  data: T;
  timestamp: string;
  path?: string;
  message?: string;
}

// Error response format
export interface ApiError {
  code: string;
  message: string;
  timestamp: string;
  path?: string;
  details?: Record<string, any>;
}

// === MARKETS ADAPTER ===

export interface MarketSymbol {
  pair: string;
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: number;
  high24h: string;
  low24h: string;
  volume: string;
  sparklineData: number[];
  type: 'crypto' | 'commodity' | 'synthetic';
  isFavorite?: boolean;
  isNewlyListed?: boolean;
}

export interface MarketKPIs {
  fearGreedIndex: number;
  fearGreedLabel: string;
  ethGasPrice: string;
  ethGasPriceUsd: string;
  tradingVolumeUsd: string;
  tradingVolumeChange: string;
  longShortRatio: { long: number; short: number };
}

export interface SectorData {
  name: string;
  change: string;
  isPositive: boolean;
}

export class MarketsAdapter {
  private baseUrl: string;

  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get market symbols with price data
   */
  async getSymbols(): Promise<MarketSymbol[]> {
    if (!FEATURE_FLAGS['markets.v1']) {
      return this.getMockSymbols();
    }

    try {
      const response = await fetch(`${this.baseUrl}/markets/symbols`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Normalize response shape according to OpenAPI contract
      if (this.isOpenAPIResponse(result)) {
        if (result.code === 'SUCCESS') {
          return this.normalizeMarketSymbols(result.data);
        } else {
          throw new Error(`API Error: ${result.message || result.code}`);
        }
      } else {
        // Handle legacy or non-standard response format
        console.warn(
          'Non-standard API response format detected, attempting to normalize'
        );
        return this.normalizeMarketSymbols(result.data || result);
      }
    } catch (error) {
      console.warn('Markets API failed, falling back to mock data:', error);
      return this.getMockSymbols();
    }
  }

  /**
   * Get market KPIs (sentiment, gas prices, volume)
   */
  async getKPIs(): Promise<MarketKPIs> {
    if (!FEATURE_FLAGS['markets.v1']) {
      return this.getMockKPIs();
    }

    try {
      const response = await fetch(`${this.baseUrl}/markets/kpis`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Normalize response shape according to OpenAPI contract
      if (this.isOpenAPIResponse(result)) {
        if (result.code === 'SUCCESS') {
          return this.normalizeMarketKPIs(result.data);
        } else {
          throw new Error(`API Error: ${result.message || result.code}`);
        }
      } else {
        // Handle legacy or non-standard response format
        return this.normalizeMarketKPIs(result.data || result);
      }
    } catch (error) {
      console.warn('Markets KPIs API failed, falling back to mock:', error);
      return this.getMockKPIs();
    }
  }

  /**
   * Get sector performance data
   */
  async getSectors(): Promise<{
    crypto: SectorData[];
    commodity: SectorData[];
  }> {
    if (!FEATURE_FLAGS['markets.v1']) {
      return this.getMockSectors();
    }

    try {
      const response = await fetch(`${this.baseUrl}/markets/sectors`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Normalize response shape according to OpenAPI contract
      if (this.isOpenAPIResponse(result)) {
        if (result.code === 'SUCCESS') {
          return result.data;
        } else {
          throw new Error(`API Error: ${result.message || result.code}`);
        }
      } else {
        return result.data || result;
      }
    } catch (error) {
      console.warn('Markets sectors API failed, falling back to mock:', error);
      return this.getMockSectors();
    }
  }

  /**
   * Start SSE connection for live price updates
   */
  startPriceStream(
    onUpdate: (symbol: string, price: string, change: number) => void
  ): EventSource | null {
    if (!FEATURE_FLAGS['markets.v1']) {
      return null; // No SSE for mocks
    }

    try {
      const eventSource = new EventSource(`${this.baseUrl}/markets/stream`);

      eventSource.onmessage = event => {
        try {
          const update = JSON.parse(event.data);
          onUpdate(update.symbol, update.price, update.changePercent);
        } catch (error) {
          console.warn('Price stream parse error:', error);
        }
      };

      eventSource.onerror = error => {
        console.warn('Price stream error:', error);
      };

      return eventSource;
    } catch (error) {
      console.warn('Failed to start price stream:', error);
      return null;
    }
  }

  // Response validation and normalization helpers
  private isOpenAPIResponse(response: any): response is ApiResponse<any> {
    return (
      response &&
      typeof response.code === 'string' &&
      response.data !== undefined &&
      typeof response.timestamp === 'string'
    );
  }

  private normalizeMarketSymbols(data: any): MarketSymbol[] {
    if (!Array.isArray(data)) {
      console.warn('Invalid market symbols data format, using empty array');
      return [];
    }

    return data.map((item: any) => ({
      pair: item.pair || item.symbol || 'UNKNOWN',
      symbol: item.symbol || item.pair?.split('/')[0] || 'UNKNOWN',
      name: item.name || item.symbol || 'Unknown Asset',
      price: item.price?.toString() || '0.00',
      change: item.change || '+0.0%',
      changePercent:
        typeof item.changePercent === 'number' ? item.changePercent : 0,
      high24h: item.high24h?.toString() || item.price?.toString() || '0.00',
      low24h: item.low24h?.toString() || item.price?.toString() || '0.00',
      volume: item.volume?.toString() || '0',
      sparklineData: Array.isArray(item.sparklineData)
        ? item.sparklineData
        : [0, 0, 0, 0, 0, 0, 0, 0],
      type: item.type || 'crypto',
      isFavorite: Boolean(item.isFavorite),
      isNewlyListed: Boolean(item.isNewlyListed),
    }));
  }

  private normalizeMarketKPIs(data: any): MarketKPIs {
    return {
      fearGreedIndex:
        typeof data?.fearGreedIndex === 'number' ? data.fearGreedIndex : 53,
      fearGreedLabel: data?.fearGreedLabel || 'Neutral',
      ethGasPrice: data?.ethGasPrice?.toString() || '0.127955129',
      ethGasPriceUsd: data?.ethGasPriceUsd?.toString() || '0.013',
      tradingVolumeUsd: data?.tradingVolumeUsd?.toString() || '1525.04 B USD',
      tradingVolumeChange: data?.tradingVolumeChange?.toString() || '+14.66%',
      longShortRatio: {
        long:
          typeof data?.longShortRatio?.long === 'number'
            ? data.longShortRatio.long
            : 77,
        short:
          typeof data?.longShortRatio?.short === 'number'
            ? data.longShortRatio.short
            : 23,
      },
    };
  }

  // Mock data methods
  private getMockSymbols(): MarketSymbol[] {
    return [
      // Crypto
      {
        pair: 'BTC/USDC',
        symbol: 'BTC',
        name: 'Bitcoin',
        price: '43,567.89',
        change: '+2.8%',
        changePercent: 2.8,
        high24h: '44,120.50',
        low24h: '42,890.20',
        volume: '2.1B',
        sparklineData: [42000, 42500, 41800, 43000, 43200, 43600, 43500, 43567],
        type: 'crypto',
        isFavorite: true,
      },
      {
        pair: 'ETH/USDC',
        symbol: 'ETH',
        name: 'Ethereum',
        price: '2,687.45',
        change: '+1.9%',
        changePercent: 1.9,
        high24h: '2,720.80',
        low24h: '2,640.10',
        volume: '1.8B',
        sparklineData: [2650, 2660, 2640, 2670, 2680, 2690, 2685, 2687],
        type: 'crypto',
        isFavorite: true,
      },
      {
        pair: 'SOL/USDC',
        symbol: 'SOL',
        name: 'Solana',
        price: '142.33',
        change: '+4.2%',
        changePercent: 4.2,
        high24h: '145.80',
        low24h: '138.90',
        volume: '845M',
        sparklineData: [135, 138, 140, 142, 144, 143, 142.5, 142.33],
        type: 'crypto',
        isNewlyListed: true,
      },
      // Commodities
      {
        pair: 'XAU/USD',
        symbol: 'XAU',
        name: 'Gold',
        price: '2,048.50',
        change: '+1.2%',
        changePercent: 1.2,
        high24h: '2,055.20',
        low24h: '2,035.80',
        volume: '1.2B',
        sparklineData: [2040, 2045, 2038, 2042, 2048, 2050, 2049, 2048],
        type: 'commodity',
        isFavorite: true,
      },
      {
        pair: 'XAG/USD',
        symbol: 'XAG',
        name: 'Silver',
        price: '24.85',
        change: '+0.8%',
        changePercent: 0.8,
        high24h: '25.12',
        low24h: '24.42',
        volume: '456M',
        sparklineData: [24.2, 24.5, 24.3, 24.7, 24.8, 24.9, 24.85, 24.85],
        type: 'commodity',
      },
      {
        pair: 'XPT/USD',
        symbol: 'XPT',
        name: 'Platinum',
        price: '924.80',
        change: '+0.6%',
        changePercent: 0.6,
        high24h: '932.40',
        low24h: '918.60',
        volume: '234M',
        sparklineData: [920, 922, 918, 925, 924, 926, 925, 924.8],
        type: 'commodity',
      },
      // Synthetics
      {
        pair: 'OIL-s/USD',
        symbol: 'OIL-s',
        name: 'Synthetic Oil',
        price: '78.45',
        change: '-1.2%',
        changePercent: -1.2,
        high24h: '79.80',
        low24h: '77.90',
        volume: '123M',
        sparklineData: [80, 79.5, 78.8, 78.2, 78.5, 78.3, 78.4, 78.45],
        type: 'synthetic',
      },
      {
        pair: 'STEEL-s/USD',
        symbol: 'STEEL-s',
        name: 'Synthetic Steel',
        price: '0.85',
        change: '+0.5%',
        changePercent: 0.5,
        high24h: '0.87',
        low24h: '0.83',
        volume: '67M',
        sparklineData: [0.82, 0.83, 0.84, 0.85, 0.86, 0.85, 0.85, 0.85],
        type: 'synthetic',
        isNewlyListed: true,
      },
    ];
  }

  private getMockKPIs(): MarketKPIs {
    return {
      fearGreedIndex: 53,
      fearGreedLabel: 'Neutral',
      ethGasPrice: '0.127955129',
      ethGasPriceUsd: '0.013',
      tradingVolumeUsd: '1525.04 B USD',
      tradingVolumeChange: '+14.66%',
      longShortRatio: { long: 77, short: 23 },
    };
  }

  private getMockSectors(): { crypto: SectorData[]; commodity: SectorData[] } {
    return {
      crypto: [
        { name: 'Memes', change: '+12.4%', isPositive: true },
        { name: 'AI', change: '+8.7%', isPositive: true },
        { name: 'DeFi', change: '+5.2%', isPositive: true },
        { name: 'Gaming', change: '-2.1%', isPositive: false },
      ],
      commodity: [
        { name: 'Metals', change: '+1.8%', isPositive: true },
        { name: 'Energy', change: '-0.9%', isPositive: false },
        { name: 'Agriculture', change: '+2.3%', isPositive: true },
      ],
    };
  }
}

// Export singleton instance
export const marketsAdapter = new MarketsAdapter();
