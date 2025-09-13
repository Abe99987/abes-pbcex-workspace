/**
 * Unit test for symbol canonical mapping - Sprint 26
 * Tests the canonical symbol mapping functionality for TradingView parity
 */

import {
  getCanonicalSymbol,
  getSymbolDisplayName,
  isValidSymbol,
  CANONICAL_SYMBOL_MAP,
} from '@/utils/tradingview';

describe('Symbol Canonical Mapping', () => {
  describe('getCanonicalSymbol', () => {
    it('should map PBCEx asset codes to canonical TradingView symbols', () => {
      expect(getCanonicalSymbol('AU')).toBe('OANDA:XAUUSD');
      expect(getCanonicalSymbol('XAU')).toBe('OANDA:XAUUSD');
      expect(getCanonicalSymbol('AG')).toBe('OANDA:XAGUSD');
      expect(getCanonicalSymbol('XAG')).toBe('OANDA:XAGUSD');
      expect(getCanonicalSymbol('PT')).toBe('OANDA:XPTUSD');
      expect(getCanonicalSymbol('XPT')).toBe('OANDA:XPTUSD');
      expect(getCanonicalSymbol('PD')).toBe('OANDA:XPDUSD');
      expect(getCanonicalSymbol('XPD')).toBe('OANDA:XPDUSD');
      expect(getCanonicalSymbol('CU')).toBe('COMEX:HG1!');
      expect(getCanonicalSymbol('XCU')).toBe('COMEX:HG1!');
    });

    it('should map crypto asset codes correctly', () => {
      expect(getCanonicalSymbol('BTC')).toBe('BINANCE:BTCUSDT');
      expect(getCanonicalSymbol('ETH')).toBe('BINANCE:ETHUSDT');
    });

    it('should handle PAXG correctly', () => {
      expect(getCanonicalSymbol('PAXG')).toBe('OANDA:XAUUSD');
    });

    it('should return original symbol if not found in mapping', () => {
      expect(getCanonicalSymbol('UNKNOWN')).toBe('UNKNOWN');
      expect(getCanonicalSymbol('INVALID')).toBe('INVALID');
    });

    it('should be consistent with backend PriceFeedService mappings', () => {
      // Ensure frontend mapping aligns with backend canonical symbols
      const expectedBackendMappings = {
        AU: 'OANDA:XAUUSD',
        AG: 'OANDA:XAGUSD',
        PT: 'OANDA:XPTUSD',
        PD: 'OANDA:XPDUSD',
        CU: 'COMEX:HG1!',
        BTC: 'BINANCE:BTCUSDT',
        ETH: 'BINANCE:ETHUSDT',
      };

      Object.entries(expectedBackendMappings).forEach(([asset, expected]) => {
        expect(getCanonicalSymbol(asset)).toBe(expected);
      });
    });
  });

  describe('getSymbolDisplayName', () => {
    it('should return user-friendly names for canonical symbols', () => {
      expect(getSymbolDisplayName('AU')).toBe('Gold');
      expect(getSymbolDisplayName('XAU')).toBe('Gold');
      expect(getSymbolDisplayName('OANDA:XAUUSD')).toBe('Gold');
      expect(getSymbolDisplayName('AG')).toBe('Silver');
      expect(getSymbolDisplayName('XAG')).toBe('Silver');
      expect(getSymbolDisplayName('OANDA:XAGUSD')).toBe('Silver');
      expect(getSymbolDisplayName('PT')).toBe('Platinum');
      expect(getSymbolDisplayName('PD')).toBe('Palladium');
      expect(getSymbolDisplayName('CU')).toBe('Copper');
      expect(getSymbolDisplayName('BTC')).toBe('Bitcoin');
      expect(getSymbolDisplayName('ETH')).toBe('Ethereum');
      expect(getSymbolDisplayName('PAXG')).toBe('Pax Gold');
    });

    it('should fallback to original symbol for unknown symbols', () => {
      expect(getSymbolDisplayName('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('isValidSymbol', () => {
    it('should validate symbols from SYMBOLS constant', () => {
      expect(isValidSymbol('OANDA:XAUUSD')).toBe(true);
      expect(isValidSymbol('OANDA:XAGUSD')).toBe(true);
      expect(isValidSymbol('BINANCE:BTCUSDT')).toBe(true);
    });

    it('should reject invalid symbols', () => {
      expect(isValidSymbol('INVALID')).toBe(false);
      expect(isValidSymbol('UNKNOWN')).toBe(false);
    });
  });

  describe('CANONICAL_SYMBOL_MAP', () => {
    it('should contain all required PBCEx asset mappings', () => {
      const requiredAssets = [
        'AU',
        'XAU',
        'AG',
        'XAG',
        'PT',
        'XPT',
        'PD',
        'XPD',
        'CU',
        'XCU',
        'BTC',
        'ETH',
        'USD',
        'PAXG',
      ];

      requiredAssets.forEach(asset => {
        expect(CANONICAL_SYMBOL_MAP).toHaveProperty(asset);
        expect(
          typeof CANONICAL_SYMBOL_MAP[
            asset as keyof typeof CANONICAL_SYMBOL_MAP
          ]
        ).toBe('string');
      });
    });

    it('should have valid TradingView symbol format', () => {
      Object.values(CANONICAL_SYMBOL_MAP).forEach(symbol => {
        // Should be either EXCHANGE:SYMBOL or just SYMBOL format
        expect(symbol).toMatch(/^[A-Z]+:?[A-Z0-9!]+$/);
      });
    });
  });
});
