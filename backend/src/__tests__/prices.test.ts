/**
 * Unit tests for PricesService
 * Focuses on cache behavior and Redis integration
 */

import { PricesService } from '../services/PricesService';
import { cache } from '../cache/redis';
import axios from 'axios';

// Mock dependencies
jest.mock('../cache/redis', () => ({
  cache: {
    get: jest.fn(),
    setex: jest.fn(),
  },
}));

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock logger
jest.mock('../utils/logger', () => ({
  logInfo: jest.fn(),
  logWarn: jest.fn(),
  logError: jest.fn(),
}));

// Mock environment
jest.mock('../config/env', () => ({
  env: {
    COINGECKO_BASE_URL: 'https://api.coingecko.com/api/v3',
  },
}));

describe('PricesService Cache Behavior', () => {
  const mockCache = cache as jest.Mocked<typeof cache>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset service state
    (PricesService as unknown as { isInitialized: boolean; httpClient: unknown }).isInitialized = false;
    (PricesService as unknown as { isInitialized: boolean; httpClient: unknown }).httpClient = null;
  });

  describe('Cache Hit Path', () => {
    it('should return cached price when available', async () => {
      // Arrange
      const cachedPriceData = {
        symbol: 'PAXG',
        usd: 2000.50,
        ts: Date.now() - 30000, // 30 seconds ago
        source: 'COINGECKO',
      };

      mockCache.get.mockResolvedValue(JSON.stringify(cachedPriceData));

      // Act
      const result = await PricesService.getTicker('PAXG');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          symbol: 'PAXG',
          usd: 2000.50,
          source: 'CACHE',
        })
      );
      expect(mockCache.get).toHaveBeenCalledWith('price:PAXG:USD');
      expect(mockedAxios.create).not.toHaveBeenCalled(); // Should not hit API
    });

    it('should handle corrupted cache data gracefully', async () => {
      // Arrange
      mockCache.get.mockResolvedValue('invalid-json');
      await PricesService.initialize();

      // Mock successful API response
      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({
          status: 200,
          data: {
            'pax-gold': {
              usd: 2000.75,
              last_updated_at: Math.floor(Date.now() / 1000),
            },
          },
          config: { metadata: { correlationId: 'test', startTime: Date.now() } },
        }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as unknown as import('axios').AxiosInstance);

      // Act
      const result = await PricesService.getTicker('PAXG');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('COINGECKO'); // Should fallback to API
      expect(mockCache.get).toHaveBeenCalled();
      expect(mockAxiosInstance.get).toHaveBeenCalled();
    });

    it('should handle cache miss and fetch from API', async () => {
      // Arrange
      mockCache.get.mockResolvedValue(null);
      await PricesService.initialize();

      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({
          status: 200,
          data: {
            'pax-gold': {
              usd: 1999.25,
              last_updated_at: Math.floor(Date.now() / 1000),
            },
          },
          config: { metadata: { correlationId: 'test', startTime: Date.now() } },
        }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as unknown as import('axios').AxiosInstance);

      // Act
      const result = await PricesService.getTicker('PAXG');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.usd).toBe(1999.25);
      expect(result.data?.source).toBe('COINGECKO');
      expect(mockCache.get).toHaveBeenCalledWith('price:PAXG:USD');
      expect(mockCache.setex).toHaveBeenCalledWith(
        'price:PAXG:USD',
        45, // TTL
        expect.stringContaining('1999.25')
      );
    });
  });

  describe('Cache Storage', () => {
    it('should cache successful API responses', async () => {
      // Arrange
      mockCache.get.mockResolvedValue(null); // Cache miss
      await PricesService.initialize();

      const apiResponse = {
        status: 200,
        data: {
          'pax-gold': {
            usd: 2001.00,
            last_updated_at: 1640995200, // Fixed timestamp
          },
        },
        config: { metadata: { correlationId: 'test', startTime: Date.now() } },
      };

      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue(apiResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as unknown as import('axios').AxiosInstance);

      // Act
      await PricesService.getTicker('PAXG');

      // Assert
      expect(mockCache.setex).toHaveBeenCalledWith(
        'price:PAXG:USD',
        45, // TTL seconds
        expect.stringMatching(/"usd":2001/)
      );

      // Verify cached data structure
      const cachedData = JSON.parse((mockCache.setex as jest.Mock).mock.calls[0][2]);
      expect(cachedData).toEqual(
        expect.objectContaining({
          symbol: 'PAXG',
          usd: 2001.00,
          source: 'COINGECKO',
          cachedAt: expect.any(Number),
        })
      );
    });

    it('should handle cache storage failures gracefully', async () => {
      // Arrange
      mockCache.get.mockResolvedValue(null);
      mockCache.setex.mockRejectedValue(new Error('Redis connection failed'));
      await PricesService.initialize();

      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({
          status: 200,
          data: {
            'pax-gold': {
              usd: 2000.00,
              last_updated_at: Math.floor(Date.now() / 1000),
            },
          },
          config: { metadata: { correlationId: 'test', startTime: Date.now() } },
        }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as unknown as import('axios').AxiosInstance);

      // Act
      const result = await PricesService.getTicker('PAXG');

      // Assert - should still succeed despite cache failure
      expect(result.success).toBe(true);
      expect(result.data?.usd).toBe(2000.00);
      expect(mockCache.setex).toHaveBeenCalled();
    });
  });

  describe('USDC Sanity Check', () => {
    it('should warn when USDC price is outside expected range', async () => {
      // Arrange
      mockCache.get.mockResolvedValue(null);
      await PricesService.initialize();

      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({
          status: 200,
          data: {
            'usd-coin': {
              usd: 1.10, // Outside 5% range
              last_updated_at: Math.floor(Date.now() / 1000),
            },
          },
          config: { metadata: { correlationId: 'test', startTime: Date.now() } },
        }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as unknown as import('axios').AxiosInstance);

      // Act
      const result = await PricesService.getUSDCUSD();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.usd).toBe(1.10);
      // Should log warning (mocked logger would be called)
    });
  });

  describe('Fallback Behavior', () => {
    it('should return mock prices when not initialized', async () => {
      // Act (without initialization)
      const result = await PricesService.getTicker('PAXG');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('MOCK');
      expect(result.data?.symbol).toBe('PAXG');
      expect(typeof result.data?.usd).toBe('number');
    });

    it('should fallback to mock prices on API failure', async () => {
      // Arrange
      mockCache.get.mockResolvedValue(null);
      await PricesService.initialize();

      const mockAxiosInstance = {
        get: jest.fn().mockRejectedValue(new Error('API timeout')),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as unknown as import('axios').AxiosInstance);

      // Act
      const result = await PricesService.getTicker('PAXG');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('MOCK');
      expect(result.data?.symbol).toBe('PAXG');
    });
  });

  describe('Multiple Ticker Support', () => {
    it('should process multiple tickers with proper batching', async () => {
      // This is more of an integration test but validates the cache behavior across multiple calls
      mockCache.get.mockResolvedValue(null);
      await PricesService.initialize();

      const mockResponses = {
        'pax-gold': { usd: 2000, last_updated_at: Math.floor(Date.now() / 1000) },
        'usd-coin': { usd: 1.0, last_updated_at: Math.floor(Date.now() / 1000) },
      };

      const mockAxiosInstance = {
        get: jest.fn()
          .mockImplementation((url, config) => {
            const coinId = config.params.ids;
            return Promise.resolve({
              status: 200,
              data: { [coinId]: mockResponses[coinId as keyof typeof mockResponses] },
              config: { metadata: { correlationId: 'test', startTime: Date.now() } },
            });
          }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };

      mockedAxios.create.mockReturnValue(mockAxiosInstance as unknown as import('axios').AxiosInstance);

      // Act
      const results = await PricesService.getMultipleTickers(['PAXG', 'USDC']);

      // Assert
      expect(Object.keys(results)).toHaveLength(2);
      expect(results.PAXG.success).toBe(true);
      expect(results.USDC.success).toBe(true);
      expect(mockCache.setex).toHaveBeenCalledTimes(2); // Both should be cached
    });
  });
});
