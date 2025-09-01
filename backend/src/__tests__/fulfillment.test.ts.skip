import { env } from '../config/env';
import { FULFILLMENT_STRATEGIES } from '../utils/constants';

/**
 * Fulfillment Strategy Tests
 * Tests the Phase-3 fulfillment system with JM vs Brinks strategies
 */

describe('Fulfillment Strategy', () => {
  let FulfillmentStrategy: any;
  let DillonGageService: any;

  beforeAll(async () => {
    // Import services
    const fulfillmentModule = await import('../services/FulfillmentStrategy');
    const dillonGageModule = await import('../services/DillonGageService');
    
    FulfillmentStrategy = fulfillmentModule.default;
    DillonGageService = dillonGageModule.default;
  });

  describe('Strategy Selection', () => {
    it('should return JM strategy when FULFILLMENT_STRATEGY=JM', () => {
      // Mock environment
      const originalStrategy = process.env.FULFILLMENT_STRATEGY;
      process.env.FULFILLMENT_STRATEGY = 'JM';
      
      const strategy = FulfillmentStrategy.getActiveStrategy();
      expect(strategy.name).toBe('JM Bullion');
      
      // Restore
      if (originalStrategy) {
        process.env.FULFILLMENT_STRATEGY = originalStrategy;
      }
    });

    it('should return Brinks strategy when FULFILLMENT_STRATEGY=BRINKS', () => {
      const originalStrategy = process.env.FULFILLMENT_STRATEGY;
      process.env.FULFILLMENT_STRATEGY = 'BRINKS';
      
      const strategy = FulfillmentStrategy.getActiveStrategy();
      expect(strategy.name).toBe('Brinks Memphis');
      
      // Restore
      if (originalStrategy) {
        process.env.FULFILLMENT_STRATEGY = originalStrategy;
      }
    });

    it('should throw error for invalid strategy', () => {
      const originalStrategy = process.env.FULFILLMENT_STRATEGY;
      process.env.FULFILLMENT_STRATEGY = 'INVALID';
      
      expect(() => {
        FulfillmentStrategy.getActiveStrategy();
      }).toThrow(/Invalid fulfillment strategy/);
      
      // Restore
      if (originalStrategy) {
        process.env.FULFILLMENT_STRATEGY = originalStrategy;
      }
    });
  });

  describe('JM Bullion Strategy', () => {
    const mockFulfillmentRequest = {
      orderId: 'order-123',
      productCode: 'AU-EAGLE-1OZ',
      quantity: 2,
      shippingAddress: {
        name: 'John Doe',
        line1: '123 Test St',
        city: 'Test City',
        state: 'CA',
        postalCode: '90210',
        country: 'US',
        phone: '555-0123',
      },
      customerInfo: {
        userId: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0123',
      },
    };

    beforeEach(() => {
      // Mock JM strategy
      process.env.FULFILLMENT_STRATEGY = 'JM';
    });

    it('should process JM fulfillment successfully', async () => {
      const result = await FulfillmentStrategy.processFulfillment(mockFulfillmentRequest);

      expect(result.success).toBe(true);
      expect(result.providerOrderId).toMatch(/^JM-/);
      expect(result.shippingCarrier).toBe('UPS');
      expect(result.estimatedDelivery).toBeInstanceOf(Date);
      expect(parseFloat(result.cost || '0')).toBeGreaterThan(0);
    });

    it('should check JM order status', async () => {
      const mockProviderOrderId = 'JM-1234567890-ABC123';
      
      const status = await FulfillmentStrategy.checkOrderStatus(mockProviderOrderId);

      expect(status).toMatchObject({
        status: expect.any(String),
        estimatedDelivery: expect.any(Date),
      });
    });

    it('should allow JM order cancellation', async () => {
      const mockProviderOrderId = 'JM-1234567890-ABC123';
      
      const cancelled = await FulfillmentStrategy.cancelOrder(mockProviderOrderId);
      expect(cancelled).toBe(true);
    });

    it('should return JM strategy capabilities', () => {
      const capabilities = FulfillmentStrategy.getStrategyCapabilities();
      
      expect(capabilities).toMatchObject({
        name: 'JM Bullion',
        estimatedDeliveryDays: 5,
        shippingCarriers: ['UPS', 'FEDEX'],
        cancellationPolicy: expect.stringContaining('24 hours'),
        averageCost: expect.stringContaining('$'),
      });
    });
  });

  describe('Brinks Strategy', () => {
    const mockFulfillmentRequest = {
      orderId: 'order-456',
      productCode: 'AG-EAGLE-1OZ',
      quantity: 10,
      shippingAddress: {
        name: 'Jane Smith',
        line1: '456 Test Ave',
        city: 'Test Town',
        state: 'TX',
        postalCode: '77002',
        country: 'US',
        phone: '555-0456',
      },
      customerInfo: {
        userId: 'user-456',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '555-0456',
      },
    };

    beforeEach(() => {
      // Mock Brinks strategy
      process.env.FULFILLMENT_STRATEGY = 'BRINKS';
    });

    it('should process Brinks fulfillment successfully', async () => {
      const result = await FulfillmentStrategy.processFulfillment(mockFulfillmentRequest);

      expect(result.success).toBe(true);
      expect(result.providerOrderId).toMatch(/^BRINKS-/);
      expect(result.shippingCarrier).toBe('FEDEX');
      expect(result.estimatedDelivery).toBeInstanceOf(Date);
      expect(parseFloat(result.cost || '0')).toBeGreaterThan(0);
      
      // Brinks should be faster than JM
      const deliveryTime = result.estimatedDelivery!.getTime() - Date.now();
      const expectedMaxDelivery = 4 * 24 * 60 * 60 * 1000; // 4 days max
      expect(deliveryTime).toBeLessThan(expectedMaxDelivery);
    });

    it('should check Brinks order status with tracking', async () => {
      const mockProviderOrderId = 'BRINKS-1234567890-XYZ789';
      
      const status = await FulfillmentStrategy.checkOrderStatus(mockProviderOrderId);

      expect(status).toMatchObject({
        status: expect.any(String),
        trackingNumber: expect.stringMatching(/^1Z999AA/), // UPS format
        estimatedDelivery: expect.any(Date),
      });
    });

    it('should reject Brinks order cancellation', async () => {
      const mockProviderOrderId = 'BRINKS-1234567890-XYZ789';
      
      const cancelled = await FulfillmentStrategy.cancelOrder(mockProviderOrderId);
      expect(cancelled).toBe(false); // Brinks doesn't allow cancellations
    });

    it('should return Brinks strategy capabilities', () => {
      const capabilities = FulfillmentStrategy.getStrategyCapabilities();
      
      expect(capabilities).toMatchObject({
        name: 'Brinks Memphis',
        estimatedDeliveryDays: 3,
        shippingCarriers: ['FEDEX'],
        cancellationPolicy: expect.stringContaining('No cancellations'),
        averageCost: expect.stringContaining('$'),
      });
    });
  });

  describe('Strategy Comparison', () => {
    it('should compare available strategies', () => {
      const comparison = FulfillmentStrategy.compareStrategies();
      
      expect(comparison).toHaveLength(2);
      expect(comparison).toContainEqual(
        expect.objectContaining({
          strategy: 'JM',
          name: 'JM Bullion',
          deliveryDays: 5,
        })
      );
      expect(comparison).toContainEqual(
        expect.objectContaining({
          strategy: 'BRINKS',
          name: 'Brinks Memphis',
          deliveryDays: 3,
        })
      );
    });

    it('should show strategy metrics', async () => {
      const originalStrategy = process.env.FULFILLMENT_STRATEGY;
      
      // Test JM metrics
      process.env.FULFILLMENT_STRATEGY = 'JM';
      const jmMetrics = await FulfillmentStrategy.getFulfillmentMetrics();
      expect(jmMetrics.strategy).toBe('JM Bullion');
      expect(parseFloat(jmMetrics.successRate)).toBeGreaterThan(90);
      
      // Test Brinks metrics
      process.env.FULFILLMENT_STRATEGY = 'BRINKS';
      const brinksMetrics = await FulfillmentStrategy.getFulfillmentMetrics();
      expect(brinksMetrics.strategy).toBe('Brinks Memphis');
      expect(brinksMetrics.averageDeliveryTime).toBeLessThan(jmMetrics.averageDeliveryTime);
      
      // Restore
      if (originalStrategy) {
        process.env.FULFILLMENT_STRATEGY = originalStrategy;
      }
    });
  });

  describe('Dillon Gage Integration', () => {
    const mockRestockRequest = {
      orderId: 'order-789',
      productCode: 'AU-BAR-1OZ',
      quantity: 5,
    };

    beforeEach(() => {
      // Reset to JM strategy for restock testing
      process.env.FULFILLMENT_STRATEGY = 'JM';
    });

    it('should trigger Dillon Gage restock after successful fulfillment', async () => {
      // Spy on DillonGageService.restockVault
      const restockSpy = jest.spyOn(DillonGageService, 'restockVault')
        .mockResolvedValue({
          success: true,
          restockId: 'DG-TEST-123',
          estimatedDelivery: new Date(),
          cost: '10750.00',
        });

      const fulfillmentRequest = {
        orderId: 'order-with-restock',
        productCode: 'AU-EAGLE-1OZ', // Gold product
        quantity: 5,
        shippingAddress: { /* mock address */ },
        customerInfo: { /* mock customer */ },
      };

      const result = await FulfillmentStrategy.processFulfillment(fulfillmentRequest);
      
      expect(result.success).toBe(true);
      
      // Should have called restock with gold metal
      expect(restockSpy).toHaveBeenCalledWith('AU', 5);
      
      restockSpy.mockRestore();
    });

    it('should handle restock failure gracefully', async () => {
      // Mock restock to fail
      const restockSpy = jest.spyOn(DillonGageService, 'restockVault')
        .mockRejectedValue(new Error('Restock service unavailable'));

      const fulfillmentRequest = {
        orderId: 'order-restock-fail',
        productCode: 'AG-MAPLE-1OZ',
        quantity: 10,
        shippingAddress: { /* mock address */ },
        customerInfo: { /* mock customer */ },
      };

      // Fulfillment should still succeed even if restock fails
      const result = await FulfillmentStrategy.processFulfillment(fulfillmentRequest);
      expect(result.success).toBe(true);
      
      restockSpy.mockRestore();
    });

    it('should extract correct metal from product code', async () => {
      const restockSpy = jest.spyOn(DillonGageService, 'restockVault')
        .mockResolvedValue({ success: true, restockId: 'test', estimatedDelivery: new Date(), cost: '0' });

      const testCases = [
        { productCode: 'AU-EAGLE-1OZ', expectedMetal: 'AU' },
        { productCode: 'AG-MAPLE-1OZ', expectedMetal: 'AG' },
        { productCode: 'PT-BAR-1OZ', expectedMetal: 'PT' },
        { productCode: 'PD-LEAF-1OZ', expectedMetal: 'PD' },
        { productCode: 'CU-COIL-1LB', expectedMetal: 'CU' },
      ];

      for (const testCase of testCases) {
        const request = {
          orderId: `order-${testCase.expectedMetal}`,
          productCode: testCase.productCode,
          quantity: 1,
          shippingAddress: { /* mock */ },
          customerInfo: { /* mock */ },
        };

        await FulfillmentStrategy.processFulfillment(request);
        expect(restockSpy).toHaveBeenCalledWith(testCase.expectedMetal, 1);
      }

      restockSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      process.env.FULFILLMENT_STRATEGY = 'JM';
    });

    it('should handle fulfillment service errors gracefully', async () => {
      // Mock a fulfillment request that would cause an error
      const problematicRequest = {
        orderId: '',  // Invalid order ID
        productCode: 'INVALID-PRODUCT',
        quantity: -1, // Invalid quantity
        shippingAddress: null,
        customerInfo: null,
      };

      const result = await FulfillmentStrategy.processFulfillment(problematicRequest as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should timeout long-running fulfillment requests', async () => {
      // This would test timeout behavior in a real implementation
      // For now, we just ensure our mock doesn't take too long
      const startTime = Date.now();
      
      const request = {
        orderId: 'timeout-test',
        productCode: 'AU-EAGLE-1OZ',
        quantity: 1,
        shippingAddress: { /* mock */ },
        customerInfo: { /* mock */ },
      };

      await FulfillmentStrategy.processFulfillment(request);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should validate fulfillment request data', async () => {
      const invalidRequests = [
        { /* empty object */ },
        { orderId: 'test', /* missing other fields */ },
        { orderId: 'test', productCode: '', quantity: 0 }, /* invalid values */
      ];

      for (const invalidRequest of invalidRequests) {
        const result = await FulfillmentStrategy.processFulfillment(invalidRequest as any);
        expect(result.success).toBe(false);
      }
    });
  });

  describe('Strategy Switching', () => {
    it('should allow admin to switch fulfillment strategy', async () => {
      const originalStrategy = process.env.FULFILLMENT_STRATEGY;
      
      // Mock switching from JM to BRINKS
      await expect(
        FulfillmentStrategy.switchStrategy('BRINKS')
      ).resolves.not.toThrow();
      
      // Mock switching to invalid strategy
      await expect(
        FulfillmentStrategy.switchStrategy('INVALID' as any)
      ).rejects.toThrow(/Invalid strategy/);
      
      // Restore
      if (originalStrategy) {
        process.env.FULFILLMENT_STRATEGY = originalStrategy;
      }
    });

    it('should handle strategy switch during active orders', async () => {
      // In a real implementation, this would test:
      // 1. Completing in-flight orders with old strategy
      // 2. New orders using new strategy
      // 3. Proper state transition
      
      // For stub implementation, just ensure no errors
      const originalStrategy = process.env.FULFILLMENT_STRATEGY;
      
      process.env.FULFILLMENT_STRATEGY = 'JM';
      const jmStrategy = FulfillmentStrategy.getActiveStrategy();
      expect(jmStrategy.name).toBe('JM Bullion');
      
      process.env.FULFILLMENT_STRATEGY = 'BRINKS';
      const brinksStrategy = FulfillmentStrategy.getActiveStrategy();
      expect(brinksStrategy.name).toBe('Brinks Memphis');
      
      // Restore
      if (originalStrategy) {
        process.env.FULFILLMENT_STRATEGY = originalStrategy;
      }
    });
  });
});

// Test helper functions
export const fulfillmentTestHelpers = {
  createMockFulfillmentRequest: (overrides = {}) => ({
    orderId: 'test-order-' + Date.now(),
    productCode: 'AU-EAGLE-1OZ',
    quantity: 1,
    shippingAddress: {
      name: 'Test User',
      line1: '123 Test St',
      city: 'Test City',
      state: 'CA',
      postalCode: '90210',
      country: 'US',
      phone: '555-0123',
    },
    customerInfo: {
      userId: 'test-user',
      name: 'Test User',
      email: 'test@example.com',
      phone: '555-0123',
    },
    ...overrides,
  }),

  expectFulfillmentResult: (result: any) => {
    expect(result).toMatchObject({
      success: expect.any(Boolean),
      providerOrderId: expect.any(String),
      estimatedDelivery: expect.any(Date),
      shippingCarrier: expect.any(String),
      cost: expect.any(String),
    });
  },

  expectStrategyCapabilities: (capabilities: any) => {
    expect(capabilities).toMatchObject({
      name: expect.any(String),
      estimatedDeliveryDays: expect.any(Number),
      shippingCarriers: expect.any(Array),
      cancellationPolicy: expect.any(String),
      averageCost: expect.any(String),
    });
  },

  withStrategy: async (strategy: string, testFn: () => Promise<void>) => {
    const original = process.env.FULFILLMENT_STRATEGY;
    process.env.FULFILLMENT_STRATEGY = strategy;
    
    try {
      await testFn();
    } finally {
      if (original) {
        process.env.FULFILLMENT_STRATEGY = original;
      }
    }
  },
};
