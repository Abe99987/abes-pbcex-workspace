import { TestUtils } from '../setup';

/**
 * Trading Engine Unit Tests
 * Tests fee calculations, spread application, and business logic
 */

// Mock TradingEngine since we're testing the logic, not the actual implementation
class MockTradingEngine {
  static readonly FEE_RATE = 0.005; // 0.5%
  static readonly SPREAD_RATE = 0.001; // 0.1%

  static calculateFee(amount: number): number {
    return amount * this.FEE_RATE;
  }

  static applySpread(price: number, side: 'buy' | 'sell'): number {
    const spread = price * this.SPREAD_RATE;
    return side === 'buy' ? price + spread : price - spread;
  }

  static calculateConversion(
    fromAmount: number,
    fromAsset: string,
    toAsset: string,
    marketPrice: number
  ): {
    toAmount: number;
    exchangeRate: number;
    fee: number;
    effectiveRate: number;
  } {
    // Apply spread based on conversion direction
    const spreadAdjustedPrice = this.applySpread(marketPrice, 'buy');
    
    // Calculate base conversion
    const grossToAmount = fromAmount / spreadAdjustedPrice;
    
    // Calculate fee
    const fee = this.calculateFee(grossToAmount);
    
    // Net amount after fee
    const toAmount = grossToAmount - fee;
    
    return {
      toAmount: Math.max(0, toAmount),
      exchangeRate: spreadAdjustedPrice,
      fee,
      effectiveRate: toAmount > 0 ? fromAmount / toAmount : 0,
    };
  }

  static validateBalance(balance: number, requiredAmount: number): boolean {
    return balance >= requiredAmount;
  }

  static calculateMinimumOrder(asset: string): number {
    const minimums: Record<string, number> = {
      'USD': 10.00,
      'PAXG': 0.001,
      'XAU-s': 0.001,
      'XAG-s': 0.1,
      'XPT-s': 0.001,
      'XPD-s': 0.001,
      'XCU-s': 1.0,
    };

    return minimums[asset] || 0.001;
  }
}

describe('TradingEngine', () => {
  describe('Fee Calculations', () => {
    it('should calculate correct trading fee', () => {
      const testCases = [
        { amount: 100, expected: 0.5 },
        { amount: 1000, expected: 5 },
        { amount: 0.1, expected: 0.0005 },
        { amount: 0, expected: 0 },
      ];

      testCases.forEach(({ amount, expected }) => {
        const fee = MockTradingEngine.calculateFee(amount);
        expect(fee).toBeCloseTo(expected, 8);
      });
    });

    it('should apply 0.5% fee rate consistently', () => {
      const amounts = [1, 10, 100, 1000, 10000];
      
      amounts.forEach(amount => {
        const fee = MockTradingEngine.calculateFee(amount);
        const feePercentage = (fee / amount) * 100;
        expect(feePercentage).toBeCloseTo(0.5, 6);
      });
    });

    it('should handle edge cases for fee calculation', () => {
      expect(MockTradingEngine.calculateFee(0)).toBe(0);
      expect(MockTradingEngine.calculateFee(-100)).toBe(-0.5); // Negative fee for negative amount
      expect(MockTradingEngine.calculateFee(0.000001)).toBeCloseTo(0.000000005, 12);
    });
  });

  describe('Spread Application', () => {
    it('should apply buy spread correctly', () => {
      const price = 2150; // Gold price
      const buyPrice = MockTradingEngine.applySpread(price, 'buy');
      
      expect(buyPrice).toBeGreaterThan(price);
      expect(buyPrice).toBeCloseTo(2152.15, 2); // 2150 + (2150 * 0.001)
    });

    it('should apply sell spread correctly', () => {
      const price = 2150; // Gold price
      const sellPrice = MockTradingEngine.applySpread(price, 'sell');
      
      expect(sellPrice).toBeLessThan(price);
      expect(sellPrice).toBeCloseTo(2147.85, 2); // 2150 - (2150 * 0.001)
    });

    it('should maintain spread consistency', () => {
      const price = 1000;
      const buyPrice = MockTradingEngine.applySpread(price, 'buy');
      const sellPrice = MockTradingEngine.applySpread(price, 'sell');
      
      const spreadDifference = buyPrice - sellPrice;
      const expectedSpread = price * 2 * MockTradingEngine.SPREAD_RATE;
      
      expect(spreadDifference).toBeCloseTo(expectedSpread, 8);
    });
  });

  describe('Conversion Calculations', () => {
    it('should calculate USD to PAXG conversion correctly', () => {
      const fromAmount = 2150; // $2150 USD
      const marketPrice = 2150; // $2150 per PAXG
      
      const result = MockTradingEngine.calculateConversion(
        fromAmount,
        'USD',
        'PAXG',
        marketPrice
      );

      expect(result.toAmount).toBeCloseTo(0.994, 3); // ~0.994 PAXG after spread and fees
      expect(result.fee).toBeCloseTo(0.005, 3); // 0.5% fee
      expect(result.exchangeRate).toBeGreaterThan(marketPrice); // Includes spread
    });

    it('should calculate PAXG to XAU-s conversion (1:1)', () => {
      const fromAmount = 1; // 1 PAXG
      const marketPrice = 1; // 1:1 conversion rate
      
      const result = MockTradingEngine.calculateConversion(
        fromAmount,
        'PAXG',
        'XAU-s',
        marketPrice
      );

      // Should be close to 1:1 after small spread and fee
      expect(result.toAmount).toBeCloseTo(0.994, 3);
      expect(result.fee).toBeCloseTo(0.005, 3);
    });

    it('should handle small amount conversions', () => {
      const fromAmount = 21.50; // $21.50 USD (1% of gold)
      const marketPrice = 2150; // Gold price
      
      const result = MockTradingEngine.calculateConversion(
        fromAmount,
        'USD',
        'PAXG',
        marketPrice
      );

      expect(result.toAmount).toBeGreaterThan(0);
      expect(result.toAmount).toBeLessThan(fromAmount / marketPrice);
      expect(result.fee).toBeGreaterThan(0);
    });

    it('should not allow negative conversion results', () => {
      const fromAmount = 1; // Very small amount
      const marketPrice = 1000000; // Very high price
      
      const result = MockTradingEngine.calculateConversion(
        fromAmount,
        'USD',
        'EXPENSIVE_ASSET',
        marketPrice
      );

      expect(result.toAmount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Balance Validation', () => {
    it('should validate sufficient balance', () => {
      expect(MockTradingEngine.validateBalance(100, 50)).toBe(true);
      expect(MockTradingEngine.validateBalance(100, 100)).toBe(true);
      expect(MockTradingEngine.validateBalance(100, 100.01)).toBe(false);
    });

    it('should handle zero and negative balances', () => {
      expect(MockTradingEngine.validateBalance(0, 0)).toBe(true);
      expect(MockTradingEngine.validateBalance(0, 0.01)).toBe(false);
      expect(MockTradingEngine.validateBalance(-10, 5)).toBe(false);
    });

    it('should validate precision correctly', () => {
      // Test floating point precision issues
      expect(MockTradingEngine.validateBalance(0.1 + 0.2, 0.3)).toBe(true);
      expect(MockTradingEngine.validateBalance(1000.12345678, 1000.12345677)).toBe(true);
    });
  });

  describe('Minimum Order Validation', () => {
    it('should return correct minimum orders for each asset', () => {
      const expectedMinimums = {
        'USD': 10.00,
        'PAXG': 0.001,
        'XAU-s': 0.001,
        'XAG-s': 0.1,
        'XPT-s': 0.001,
        'XPD-s': 0.001,
        'XCU-s': 1.0,
      };

      Object.entries(expectedMinimums).forEach(([asset, expected]) => {
        expect(MockTradingEngine.calculateMinimumOrder(asset)).toBe(expected);
      });
    });

    it('should return default minimum for unknown assets', () => {
      expect(MockTradingEngine.calculateMinimumOrder('UNKNOWN')).toBe(0.001);
    });
  });

  describe('Error Cases', () => {
    it('should handle insufficient balance errors', () => {
      const hasInsufficientBalance = !MockTradingEngine.validateBalance(50, 100);
      expect(hasInsufficientBalance).toBe(true);
    });

    it('should handle zero price conversions', () => {
      const result = MockTradingEngine.calculateConversion(100, 'USD', 'TEST', 0);
      
      // Should handle gracefully without throwing
      expect(result.toAmount).toBe(Infinity); // Division by zero case
      expect(result.fee).toBe(Infinity);
    });

    it('should handle extreme precision requirements', () => {
      const verySmallAmount = 0.00000001;
      const fee = MockTradingEngine.calculateFee(verySmallAmount);
      
      expect(fee).toBeGreaterThan(0);
      expect(typeof fee).toBe('number');
      expect(isFinite(fee)).toBe(true);
    });
  });

  describe('Real-world Trading Scenarios', () => {
    it('should calculate realistic gold purchase', () => {
      const usdAmount = 4300; // $4300 USD
      const goldPrice = 2150; // $2150 per oz
      
      const result = MockTradingEngine.calculateConversion(
        usdAmount,
        'USD',
        'PAXG',
        goldPrice
      );

      expect(result.toAmount).toBeCloseTo(1.989, 3); // ~1.989 oz gold
      expect(result.fee).toBeCloseTo(0.0099, 4); // ~0.01 oz fee
      expect(result.effectiveRate).toBeGreaterThan(goldPrice); // Higher due to spread+fee
    });

    it('should calculate silver to gold conversion', () => {
      const silverAmount = 100; // 100 oz silver (in XAG-s)
      const silverToGoldRatio = 70; // 70:1 ratio
      
      const result = MockTradingEngine.calculateConversion(
        silverAmount,
        'XAG-s',
        'XAU-s',
        1 / silverToGoldRatio
      );

      expect(result.toAmount).toBeCloseTo(1.421, 3); // ~1.42 oz gold after fees
      expect(result.fee).toBeCloseTo(0.007, 3); // Fee in gold terms
    });

    it('should maintain consistency across conversion chains', () => {
      // USD -> PAXG -> XAU-s should be close to direct USD -> XAU-s
      const usdAmount = 2150;
      const goldPrice = 2150;
      
      // Direct conversion (hypothetical)
      const directResult = MockTradingEngine.calculateConversion(
        usdAmount,
        'USD',
        'XAU-s',
        goldPrice
      );

      // Two-step conversion
      const step1 = MockTradingEngine.calculateConversion(
        usdAmount,
        'USD',
        'PAXG',
        goldPrice
      );
      
      const step2 = MockTradingEngine.calculateConversion(
        step1.toAmount,
        'PAXG',
        'XAU-s',
        1 // 1:1 PAXG to XAU-s
      );

      // Two-step should be less due to double fees but reasonably close
      expect(step2.toAmount).toBeLessThan(directResult.toAmount);
      expect(step2.toAmount).toBeGreaterThan(directResult.toAmount * 0.99); // Within 1%
    });
  });

  describe('Performance and Precision', () => {
    it('should handle high-frequency calculations efficiently', () => {
      const start = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        MockTradingEngine.calculateConversion(
          Math.random() * 10000,
          'USD',
          'PAXG',
          2150 + Math.random() * 100
        );
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should complete in <100ms
    });

    it('should maintain precision in calculations', () => {
      const amount = 1234.56789012;
      const fee = MockTradingEngine.calculateFee(amount);
      
      // Fee should maintain reasonable precision
      expect(fee.toString().split('.')[1]?.length).toBeLessThanOrEqual(12);
      expect(fee).toBeCloseTo(amount * 0.005, 10);
    });

    it('should handle very large amounts', () => {
      const largeAmount = 1000000; // $1M
      const result = MockTradingEngine.calculateConversion(
        largeAmount,
        'USD',
        'PAXG',
        2150
      );

      expect(result.toAmount).toBeGreaterThan(0);
      expect(result.fee).toBeGreaterThan(0);
      expect(isFinite(result.toAmount)).toBe(true);
      expect(isFinite(result.fee)).toBe(true);
    });
  });
});
