import { PriceFeedService } from '@/services/PriceFeedService';
import AlertService from '@/services/AlertService';

// Mock AlertService to verify alert emissions
jest.mock('@/services/AlertService');
const mockAlertService = AlertService as jest.Mocked<typeof AlertService>;

describe('PriceFeedService Alert Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AlertService.resetMetrics();
    
    // Reset PriceFeedService state
    if (PriceFeedService['isInitialized']) {
      PriceFeedService.shutdown();
    }
  });

  afterEach(async () => {
    await PriceFeedService.shutdown();
  });

  describe('Price Stall Detection', () => {
    it('should not emit alerts for fresh prices', async () => {
      // Initialize with fresh prices
      await PriceFeedService.initialize();
      
      // Get a current price to ensure cache is populated
      const price = PriceFeedService.getSpotPrice('AU');
      expect(price).toBeTruthy();

      // Call price stall check immediately (should not trigger alerts)
      PriceFeedService['checkPriceStalls']();

      expect(mockAlertService.emitPriceStall).not.toHaveBeenCalled();
    });

    it('should emit alerts for stale prices', async () => {
      // Initialize service
      await PriceFeedService.initialize();
      
      // Manually set an old timestamp in cache to simulate stale price
      const staleTimestamp = new Date(Date.now() - 45000); // 45 seconds ago
      const stalePriceData = {
        symbol: 'AU',
        price: 2050.25,
        change: -5.50,
        changePercent: -0.27,
        volume: 125000,
        timestamp: staleTimestamp,
        source: 'MOCK' as const,
      };

      // Access private cache and set stale data
      PriceFeedService['priceCache'].set('AU', stalePriceData);

      // Run stall detection
      PriceFeedService['checkPriceStalls']();

      expect(mockAlertService.emitPriceStall).toHaveBeenCalledWith('AU', 45);
    });

    it('should emit alerts for multiple stale assets', async () => {
      await PriceFeedService.initialize();
      
      // Set multiple stale prices
      const now = Date.now();
      const staleAssets = [
        { symbol: 'AU', ageSeconds: 35 },
        { symbol: 'AG', ageSeconds: 60 }, 
        { symbol: 'BTC', ageSeconds: 120 },
      ];

      staleAssets.forEach(({ symbol, ageSeconds }) => {
        const staleTimestamp = new Date(now - (ageSeconds * 1000));
        const stalePriceData = {
          symbol,
          price: 1000,
          change: 0,
          changePercent: 0,
          volume: 1000,
          timestamp: staleTimestamp,
          source: 'MOCK' as const,
        };
        PriceFeedService['priceCache'].set(symbol, stalePriceData);
      });

      PriceFeedService['checkPriceStalls']();

      expect(mockAlertService.emitPriceStall).toHaveBeenCalledTimes(3);
      expect(mockAlertService.emitPriceStall).toHaveBeenCalledWith('AU', 35);
      expect(mockAlertService.emitPriceStall).toHaveBeenCalledWith('AG', 60);
      expect(mockAlertService.emitPriceStall).toHaveBeenCalledWith('BTC', 120);
    });

    it('should handle empty price cache gracefully', async () => {
      await PriceFeedService.initialize();
      
      // Clear cache
      PriceFeedService['priceCache'].clear();

      // Should not throw error
      expect(() => {
        PriceFeedService['checkPriceStalls']();
      }).not.toThrow();

      expect(mockAlertService.emitPriceStall).not.toHaveBeenCalled();
    });

    it('should use 30-second threshold per SLO', async () => {
      await PriceFeedService.initialize();
      
      // Set price at exactly 30 seconds ago (should trigger)
      const exactlyStaleTimestamp = new Date(Date.now() - 30001); // 30.001 seconds
      const stalePriceData = {
        symbol: 'ETH',
        price: 3200,
        change: 0,
        changePercent: 0,
        volume: 15000,
        timestamp: exactlyStaleTimestamp,
        source: 'MOCK' as const,
      };
      
      PriceFeedService['priceCache'].set('ETH', stalePriceData);

      PriceFeedService['checkPriceStalls']();

      expect(mockAlertService.emitPriceStall).toHaveBeenCalledWith('ETH', 30);
    });

    it('should not alert for prices at exactly 30 seconds', async () => {
      await PriceFeedService.initialize();
      
      // Set price at exactly 30 seconds ago (should NOT trigger - needs to be > 30)
      const exactlyThresholdTimestamp = new Date(Date.now() - 30000); // Exactly 30 seconds
      const priceData = {
        symbol: 'PT',
        price: 975.50,
        change: 0,
        changePercent: 0,
        volume: 45000,
        timestamp: exactlyThresholdTimestamp,
        source: 'MOCK' as const,
      };
      
      PriceFeedService['priceCache'].set('PT', priceData);

      PriceFeedService['checkPriceStalls']();

      expect(mockAlertService.emitPriceStall).not.toHaveBeenCalled();
    });

    it('should calculate stale duration correctly', async () => {
      await PriceFeedService.initialize();
      
      const testCases = [
        { ageMs: 31000, expectedSeconds: 31 },
        { ageMs: 45500, expectedSeconds: 45 }, // Should floor decimal seconds
        { ageMs: 120000, expectedSeconds: 120 },
        { ageMs: 300000, expectedSeconds: 300 }, // 5 minutes
      ];

      testCases.forEach(({ ageMs, expectedSeconds }, index) => {
        const symbol = `TEST${index}`;
        const staleTimestamp = new Date(Date.now() - ageMs);
        const priceData = {
          symbol,
          price: 100,
          change: 0,
          changePercent: 0,
          volume: 1000,
          timestamp: staleTimestamp,
          source: 'MOCK' as const,
        };
        
        PriceFeedService['priceCache'].set(symbol, priceData);
      });

      PriceFeedService['checkPriceStalls']();

      testCases.forEach(({ expectedSeconds }, index) => {
        const symbol = `TEST${index}`;
        expect(mockAlertService.emitPriceStall).toHaveBeenCalledWith(symbol, expectedSeconds);
      });
    });
  });
});
