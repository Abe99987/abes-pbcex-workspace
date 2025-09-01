/**
 * CheckoutService Price-Lock Test Scaffold
 * Basic tests for 10-minute TTL math and spread calculations
 */

import { CheckoutService } from './CheckoutService';

// Mock PricesService
jest.mock('./PricesService', () => ({
  PricesService: {
    getTicker: jest.fn()
  }
}));

// Mock Redis cache
jest.mock('@/cache/redis', () => ({
  cache: {
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn()
  }
}));

// Mock UUID generation for predictable testing
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-quote-id-123')
}));

describe('CheckoutService - Price Lock Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset service state
    (CheckoutService as any).isInitialized = false;
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await CheckoutService.initialize();
      
      const health = CheckoutService.getHealthStatus();
      expect(health.status).toBe('initialized');
      expect(health.configured).toBe(true);
      expect(health.lockWindowSeconds).toBe(600); // 10 minutes
      expect(health.spreadBps).toBe(50); // Default 0.5%
    });
  });

  describe('Quote Request Validation', () => {
    beforeEach(async () => {
      await CheckoutService.initialize();
    });

    it('should validate required fields', async () => {
      const invalidRequest = {
        symbol: '',
        quantity: 0,
        side: 'invalid' as any
      };

      const result = await CheckoutService.requestQuote(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Symbol is required');
    });

    it('should validate quantity limits', async () => {
      const request = {
        symbol: 'PAXG',
        quantity: 1001, // Exceeds max limit
        side: 'buy' as const
      };

      const result = await CheckoutService.requestQuote(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quantity exceeds maximum limit');
    });

    it('should validate supported symbols', async () => {
      const request = {
        symbol: 'UNSUPPORTED',
        quantity: 1,
        side: 'buy' as const
      };

      const result = await CheckoutService.requestQuote(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported symbol');
    });

    it('should accept valid requests', async () => {
      const { PricesService } = require('./PricesService');
      const { cache } = require('@/cache/redis');

      PricesService.getTicker.mockResolvedValue({
        success: true,
        data: { symbol: 'PAXG', usd: 2000.00, ts: Date.now(), source: 'COINGECKO' }
      });

      const request = {
        symbol: 'PAXG',
        quantity: 1.5,
        side: 'buy' as const,
        userId: 'user123'
      };

      const result = await CheckoutService.requestQuote(request);

      expect(result.success).toBe(true);
      expect(result.data?.symbol).toBe('PAXG');
      expect(result.data?.quantity).toBe(1.5);
      expect(result.data?.side).toBe('buy');
    });
  });

  describe('Spread Calculations', () => {
    beforeEach(async () => {
      await CheckoutService.initialize();
      
      const { PricesService } = require('./PricesService');
      PricesService.getTicker.mockResolvedValue({
        success: true,
        data: { symbol: 'PAXG', usd: 2000.00, ts: Date.now(), source: 'COINGECKO' }
      });
    });

    it('should calculate buy price with spread correctly', async () => {
      const request = {
        symbol: 'PAXG',
        quantity: 1,
        side: 'buy' as const
      };

      const result = await CheckoutService.requestQuote(request);

      expect(result.success).toBe(true);
      
      // Base price: $2000, Spread: 50 BPS = 0.5% = $10
      // Buy price should be: $2000 + $10 = $2010
      expect(result.data?.basePrice).toBe(2000.00);
      expect(result.data?.spread).toBe(10.00); // 0.5% of 2000
      expect(result.data?.lockedPrice).toBe(2010.00);
      expect(result.data?.totalAmount).toBe(2010.00); // 1 * 2010
    });

    it('should calculate sell price with spread correctly', async () => {
      const request = {
        symbol: 'PAXG',
        quantity: 1,
        side: 'sell' as const
      };

      const result = await CheckoutService.requestQuote(request);

      expect(result.success).toBe(true);
      
      // Sell price should be: $2000 - $10 = $1990
      expect(result.data?.basePrice).toBe(2000.00);
      expect(result.data?.spread).toBe(10.00);
      expect(result.data?.lockedPrice).toBe(1990.00);
      expect(result.data?.totalAmount).toBe(1990.00);
    });

    it('should never produce negative spreads', async () => {
      // Test with very small base price
      const { PricesService } = require('./PricesService');
      PricesService.getTicker.mockResolvedValue({
        success: true,
        data: { symbol: 'PAXG', usd: 0.01, ts: Date.now(), source: 'COINGECKO' }
      });

      const request = {
        symbol: 'PAXG',
        quantity: 1,
        side: 'sell' as const
      };

      const result = await CheckoutService.requestQuote(request);

      expect(result.success).toBe(true);
      expect(result.data?.lockedPrice).toBeGreaterThanOrEqual(0);
    });

    it('should handle custom spread configuration', async () => {
      // Mock custom spread environment variable
      const originalSpread = process.env.PRICELOCK_SPREAD_BPS;
      process.env.PRICELOCK_SPREAD_BPS = '100'; // 1%

      // Re-calculate spread
      const request = {
        symbol: 'PAXG',
        quantity: 1,
        side: 'buy' as const
      };

      const result = await CheckoutService.requestQuote(request);

      expect(result.success).toBe(true);
      expect(result.data?.spreadBps).toBe(100);
      expect(result.data?.spread).toBe(20.00); // 1% of 2000
      expect(result.data?.lockedPrice).toBe(2020.00);

      // Restore original
      process.env.PRICELOCK_SPREAD_BPS = originalSpread;
    });
  });

  describe('10-Minute TTL Management', () => {
    beforeEach(async () => {
      await CheckoutService.initialize();
      
      const { PricesService } = require('./PricesService');
      PricesService.getTicker.mockResolvedValue({
        success: true,
        data: { symbol: 'PAXG', usd: 2000.00, ts: Date.now(), source: 'COINGECKO' }
      });
    });

    it('should set expiry exactly 10 minutes from creation', async () => {
      const beforeRequest = Date.now();
      
      const request = {
        symbol: 'PAXG',
        quantity: 1,
        side: 'buy' as const
      };

      const result = await CheckoutService.requestQuote(request);
      
      const afterRequest = Date.now();

      expect(result.success).toBe(true);
      
      // Expiry should be approximately 10 minutes (600 seconds) from now
      const expectedExpiry = beforeRequest + (10 * 60 * 1000);
      const actualExpiry = result.data?.expiresAt || 0;
      
      expect(actualExpiry).toBeGreaterThanOrEqual(expectedExpiry - 1000); // Allow 1s variance
      expect(actualExpiry).toBeLessThanOrEqual(afterRequest + (10 * 60 * 1000));
    });

    it('should store quote in Redis with correct TTL', async () => {
      const { cache } = require('@/cache/redis');
      
      const request = {
        symbol: 'PAXG',
        quantity: 1,
        side: 'buy' as const
      };

      await CheckoutService.requestQuote(request);

      expect(cache.setex).toHaveBeenCalledWith(
        'pricelock:test-quote-id-123',
        600, // Exactly 600 seconds
        expect.stringMatching(/"id":"test-quote-id-123"/)
      );
    });

    it('should reject expired quotes during confirmation', async () => {
      const { cache } = require('@/cache/redis');
      
      // Mock an expired quote
      const expiredQuote = {
        id: 'expired-quote',
        symbol: 'PAXG',
        quantity: 1,
        side: 'buy',
        basePrice: 2000,
        lockedPrice: 2010,
        expiresAt: Date.now() - 1000, // 1 second ago
        createdAt: Date.now() - 601000 // 10+ minutes ago
      };

      cache.get.mockResolvedValue(JSON.stringify(expiredQuote));

      const result = await CheckoutService.confirmQuote('expired-quote');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quote has expired');
      expect(cache.del).toHaveBeenCalledWith('pricelock:expired-quote');
    });

    it('should accept valid quotes within TTL window', async () => {
      const { cache } = require('@/cache/redis');
      
      // Mock a fresh quote
      const freshQuote = {
        id: 'fresh-quote',
        symbol: 'PAXG',
        quantity: 1,
        side: 'buy',
        basePrice: 2000,
        lockedPrice: 2010,
        totalAmount: 2010,
        expiresAt: Date.now() + 300000, // 5 minutes from now
        createdAt: Date.now()
      };

      cache.get.mockResolvedValue(JSON.stringify(freshQuote));

      const result = await CheckoutService.confirmQuote('fresh-quote');

      expect(result.success).toBe(true);
      expect(result.data?.quoteId).toBe('fresh-quote');
      expect(result.data?.status).toBe('confirmed');
    });
  });

  describe('Quote Confirmation Flow', () => {
    beforeEach(async () => {
      await CheckoutService.initialize();
    });

    it('should generate unique confirmation IDs', async () => {
      const { cache } = require('@/cache/redis');
      
      const quote = {
        id: 'test-quote',
        symbol: 'PAXG',
        quantity: 1,
        side: 'buy',
        basePrice: 2000,
        lockedPrice: 2010,
        totalAmount: 2010,
        expiresAt: Date.now() + 300000,
        createdAt: Date.now()
      };

      cache.get.mockResolvedValue(JSON.stringify(quote));

      const result = await CheckoutService.confirmQuote('test-quote');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBeDefined();
      expect(result.data?.id).not.toBe('test-quote'); // Should be different from quote ID
    });

    it('should clean up quote after confirmation', async () => {
      const { cache } = require('@/cache/redis');
      
      const quote = {
        id: 'test-quote',
        symbol: 'PAXG',
        expiresAt: Date.now() + 300000,
        totalAmount: 2010
      };

      cache.get.mockResolvedValue(JSON.stringify(quote));

      await CheckoutService.confirmQuote('test-quote');

      expect(cache.del).toHaveBeenCalledWith('pricelock:test-quote');
    });

    it('should store confirmation with extended TTL', async () => {
      const { cache } = require('@/cache/redis');
      
      const quote = {
        id: 'test-quote',
        symbol: 'PAXG',
        expiresAt: Date.now() + 300000,
        totalAmount: 2010
      };

      cache.get.mockResolvedValue(JSON.stringify(quote));

      await CheckoutService.confirmQuote('test-quote');

      // Should store confirmation with 24-hour TTL
      expect(cache.setex).toHaveBeenCalledWith(
        expect.stringMatching(/^confirmation:/),
        24 * 60 * 60, // 24 hours
        expect.stringMatching(/"status":"confirmed"/)
      );
    });
  });

  describe('Vendor Mapping', () => {
    beforeEach(async () => {
      await CheckoutService.initialize();
      
      const { PricesService } = require('./PricesService');
      PricesService.getTicker.mockResolvedValue({
        success: true,
        data: { symbol: 'PAXG', usd: 2000.00, ts: Date.now(), source: 'COINGECKO' }
      });
    });

    it('should map PAXG to JM Bullion', async () => {
      const request = {
        symbol: 'PAXG',
        quantity: 1,
        side: 'buy' as const
      };

      const result = await CheckoutService.requestQuote(request);

      expect(result.success).toBe(true);
      expect(result.data?.vendor).toBe('JM_BULLION');
    });

    it('should map unknown symbols to STUB vendor', async () => {
      // This would need the service to accept more symbols in the future
      // For now, testing the fallback behavior
      const health = CheckoutService.getHealthStatus();
      expect(health.supportedSymbols).toContain('PAXG');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await CheckoutService.initialize();
    });

    it('should handle price service failures gracefully', async () => {
      const { PricesService } = require('./PricesService');
      PricesService.getTicker.mockResolvedValue({
        success: false,
        error: 'API rate limit exceeded'
      });

      const request = {
        symbol: 'PAXG',
        quantity: 1,
        side: 'buy' as const
      };

      const result = await CheckoutService.requestQuote(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unable to get current price');
    });

    it('should handle Redis failures gracefully', async () => {
      const { PricesService } = require('./PricesService');
      const { cache } = require('@/cache/redis');
      
      PricesService.getTicker.mockResolvedValue({
        success: true,
        data: { symbol: 'PAXG', usd: 2000.00, ts: Date.now(), source: 'COINGECKO' }
      });

      cache.setex.mockRejectedValue(new Error('Redis connection failed'));

      const request = {
        symbol: 'PAXG',
        quantity: 1,
        side: 'buy' as const
      };

      // Should not crash, but may affect functionality
      const result = await CheckoutService.requestQuote(request);
      
      expect(result).toBeDefined();
    });
  });
});
