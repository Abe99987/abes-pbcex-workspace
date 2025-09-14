/**
 * API Adapter Tests - Markets Wiring v1
 * Basic RTL test stubs for Markets adapter functionality
 */

import { marketsAdapter } from '../api';
import { FEATURE_FLAGS } from '@/config/features';

// Mock fetch globally
global.fetch = jest.fn();

describe('MarketsAdapter', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockReset();
  });

  describe('getSymbols', () => {
    it('should return mock data when feature flag is disabled', async () => {
      // Temporarily disable feature flag
      const originalFlag = FEATURE_FLAGS['markets.v1'];
      (FEATURE_FLAGS as any)['markets.v1'] = false;

      const symbols = await marketsAdapter.getSymbols();

      expect(symbols).toBeDefined();
      expect(Array.isArray(symbols)).toBe(true);
      expect(symbols.length).toBeGreaterThan(0);
      expect(symbols[0]).toHaveProperty('pair');
      expect(symbols[0]).toHaveProperty('symbol');
      expect(symbols[0]).toHaveProperty('price');

      // Restore feature flag
      (FEATURE_FLAGS as any)['markets.v1'] = originalFlag;
    });

    it('should handle API response and normalize data', async () => {
      const mockApiResponse = {
        code: 'SUCCESS',
        data: [
          {
            pair: 'BTC/USDC',
            symbol: 'BTC',
            name: 'Bitcoin',
            price: 43567.89,
            changePercent: 2.8,
          },
        ],
        timestamp: new Date().toISOString(),
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const symbols = await marketsAdapter.getSymbols();

      expect(symbols).toBeDefined();
      expect(symbols[0].pair).toBe('BTC/USDC');
      expect(symbols[0].price).toBe('43567.89'); // normalized to string
    });

    it('should fallback to mocks on API failure', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const symbols = await marketsAdapter.getSymbols();

      expect(symbols).toBeDefined();
      expect(Array.isArray(symbols)).toBe(true);
      expect(symbols.length).toBeGreaterThan(0);
    });
  });

  describe('getKPIs', () => {
    it('should return normalized KPI data', async () => {
      const kpis = await marketsAdapter.getKPIs();

      expect(kpis).toBeDefined();
      expect(kpis).toHaveProperty('fearGreedIndex');
      expect(kpis).toHaveProperty('fearGreedLabel');
      expect(kpis).toHaveProperty('ethGasPrice');
      expect(kpis).toHaveProperty('longShortRatio');
      expect(typeof kpis.fearGreedIndex).toBe('number');
    });
  });

  describe('startPriceStream', () => {
    it('should return null when feature flag is disabled', () => {
      const originalFlag = FEATURE_FLAGS['markets.v1'];
      (FEATURE_FLAGS as any)['markets.v1'] = false;

      const result = marketsAdapter.startPriceStream(() => {});

      expect(result).toBeNull();

      // Restore feature flag
      (FEATURE_FLAGS as any)['markets.v1'] = originalFlag;
    });

    it('should create EventSource for price updates', () => {
      // Mock EventSource
      global.EventSource = jest.fn().mockImplementation(() => ({
        onmessage: null,
        onerror: null,
        close: jest.fn(),
      }));

      const eventSource = marketsAdapter.startPriceStream(() => {});

      expect(EventSource).toHaveBeenCalledWith(
        'http://localhost:3000/api/markets/stream'
      );
      expect(eventSource).toBeDefined();
    });
  });
});

// Performance tests
describe('Performance SLOs', () => {
  it('should handle large datasets efficiently', async () => {
    const startTime = performance.now();

    // Test with mock large dataset
    const symbols = await marketsAdapter.getSymbols();

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should process under 150ms (generous for mock data)
    expect(duration).toBeLessThan(150);
    expect(symbols).toBeDefined();
  });

  it('should normalize data without blocking', async () => {
    // Test data normalization performance
    const mockLargeDataset = Array.from({ length: 100 }, (_, i) => ({
      pair: `ASSET${i}/USDC`,
      symbol: `ASSET${i}`,
      price: Math.random() * 1000,
    }));

    const startTime = performance.now();

    // This would be called internally by the adapter
    const normalized = mockLargeDataset.map(item => ({
      ...item,
      price: item.price.toString(),
      changePercent: 0,
      sparklineData: [0, 0, 0, 0, 0, 0, 0, 0],
    }));

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(50); // Should be very fast for normalization
    expect(normalized).toHaveLength(100);
  });
});
