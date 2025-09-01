import { ValidationService } from '@/services/ValidationService';
import { CommodityConfigService } from '@/services/CommodityConfigService';

// Mock the CommodityConfigService
jest.mock('@/services/CommodityConfigService');
const mockCommodityConfigService = CommodityConfigService as jest.Mocked<
  typeof CommodityConfigService
>;

describe('ValidationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateOrder', () => {
    beforeEach(() => {
      // Setup default mocks
      mockCommodityConfigService.getConfig.mockResolvedValue({
        symbol: 'AU',
        displayName: 'Gold',
        unitLabel: 'oz',
        step: 0.1,
        minOrder: 0.1,
        formats: [],
        logisticsNotices: [],
        requiresLicense: false,
        enabled: true,
      });
      mockCommodityConfigService.isValidFormat.mockResolvedValue(true);
      mockCommodityConfigService.validateAmount.mockResolvedValue({
        valid: true,
      });
      mockCommodityConfigService.requiresLicense.mockResolvedValue(false);
    });

    it('should validate a valid buy order', async () => {
      const result = await ValidationService.validateOrder({
        symbol: 'AU',
        amount: 1.0,
        format: 'coins',
        side: 'buy',
        userId: 'user123',
        paymentMethod: 'BALANCE',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject order with missing symbol', async () => {
      const result = await ValidationService.validateOrder({
        symbol: '',
        amount: 1.0,
        side: 'buy',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Symbol is required');
    });

    it('should reject order with zero amount', async () => {
      const result = await ValidationService.validateOrder({
        symbol: 'AU',
        amount: 0,
        side: 'buy',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Amount must be positive');
    });

    it('should reject order with invalid side', async () => {
      const result = await ValidationService.validateOrder({
        symbol: 'AU',
        amount: 1.0,
        side: 'invalid' as any,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Side must be "buy" or "sell"');
    });

    it('should reject order for disabled commodity', async () => {
      mockCommodityConfigService.getConfig.mockResolvedValue({
        symbol: 'AU',
        displayName: 'Gold',
        unitLabel: 'oz',
        step: 0.1,
        minOrder: 0.1,
        formats: [],
        logisticsNotices: [],
        requiresLicense: false,
        enabled: false,
      });

      const result = await ValidationService.validateOrder({
        symbol: 'AU',
        amount: 1.0,
        side: 'buy',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Commodity AU is currently unavailable');
    });

    it('should reject order with invalid format', async () => {
      mockCommodityConfigService.isValidFormat.mockResolvedValue(false);

      const result = await ValidationService.validateOrder({
        symbol: 'AU',
        amount: 1.0,
        format: 'invalid_format',
        side: 'buy',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Format "invalid_format" is not available for Gold'
      );
    });

    it('should reject order with invalid amount', async () => {
      mockCommodityConfigService.validateAmount.mockResolvedValue({
        valid: false,
        error: 'Minimum order is 1 oz',
      });

      const result = await ValidationService.validateOrder({
        symbol: 'AU',
        amount: 0.05,
        side: 'buy',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Minimum order is 1 oz');
    });

    it('should reject order requiring license without verification', async () => {
      mockCommodityConfigService.requiresLicense.mockResolvedValue(true);

      const result = await ValidationService.validateOrder({
        symbol: 'CL',
        amount: 100,
        side: 'buy',
        licenseVerified: false,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Gold requires special licensing. Please contact support to verify your license.'
      );
    });

    it('should accept order requiring license with verification', async () => {
      mockCommodityConfigService.requiresLicense.mockResolvedValue(true);

      const result = await ValidationService.validateOrder({
        symbol: 'CL',
        amount: 100,
        side: 'buy',
        licenseVerified: true,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should add warning for large orders', async () => {
      mockCommodityConfigService.getMinimumOrder.mockResolvedValue(0.1);

      const result = await ValidationService.validateOrder({
        symbol: 'AU',
        amount: 50, // 500x minimum order
        side: 'buy',
      });

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        'Large order detected. Orders over 10 oz may require additional processing time.'
      );
    });
  });

  describe('validateIdempotencyKey', () => {
    it('should validate a valid idempotency key', () => {
      const result = ValidationService.validateIdempotencyKey(
        'user123_order_20240101_001'
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty idempotency key', () => {
      const result = ValidationService.validateIdempotencyKey('');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Idempotency key is required');
    });

    it('should reject short idempotency key', () => {
      const result = ValidationService.validateIdempotencyKey('short');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Idempotency key must be at least 16 characters'
      );
    });

    it('should reject idempotency key with invalid characters', () => {
      const result = ValidationService.validateIdempotencyKey(
        'invalid@key#with$special%chars'
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Idempotency key must contain only alphanumeric characters, hyphens, and underscores'
      );
    });
  });

  describe('validateClientId', () => {
    it('should validate a valid client ID', () => {
      const result = ValidationService.validateClientId('client123abc');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty client ID', () => {
      const result = ValidationService.validateClientId('');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Client ID is required');
    });

    it('should reject short client ID', () => {
      const result = ValidationService.validateClientId('short');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid client ID format');
    });
  });

  describe('validatePayoutMethod', () => {
    it('should validate USD payout', () => {
      const result = ValidationService.validatePayoutMethod('USD');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate USDC payout', () => {
      const result = ValidationService.validatePayoutMethod('USDC');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid payout method', () => {
      const result = ValidationService.validatePayoutMethod('INVALID');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Invalid payout method. Must be one of: USD, USDC, USDT, TOKEN'
      );
    });

    it('should reject empty payout method', () => {
      const result = ValidationService.validatePayoutMethod('');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Payout method is required');
    });
  });

  describe('combineValidationResults', () => {
    it('should combine valid results', () => {
      const result1 = { valid: true, errors: [] };
      const result2 = { valid: true, errors: [] };

      const combined = ValidationService.combineValidationResults(
        result1,
        result2
      );

      expect(combined.valid).toBe(true);
      expect(combined.errors).toHaveLength(0);
    });

    it('should combine invalid results', () => {
      const result1 = { valid: false, errors: ['Error 1'] };
      const result2 = { valid: false, errors: ['Error 2'] };

      const combined = ValidationService.combineValidationResults(
        result1,
        result2
      );

      expect(combined.valid).toBe(false);
      expect(combined.errors).toEqual(['Error 1', 'Error 2']);
    });

    it('should combine warnings', () => {
      const result1 = { valid: true, errors: [], warnings: ['Warning 1'] };
      const result2 = { valid: true, errors: [], warnings: ['Warning 2'] };

      const combined = ValidationService.combineValidationResults(
        result1,
        result2
      );

      expect(combined.valid).toBe(true);
      expect(combined.warnings).toEqual(['Warning 1', 'Warning 2']);
    });
  });

  describe('throwIfInvalid', () => {
    it('should not throw for valid result', () => {
      const result = { valid: true, errors: [] };

      expect(() => {
        ValidationService.throwIfInvalid(result);
      }).not.toThrow();
    });

    it('should throw for invalid result', () => {
      const result = { valid: false, errors: ['Test error'] };

      expect(() => {
        ValidationService.throwIfInvalid(result);
      }).toThrow('Test error');
    });

    it('should throw with context', () => {
      const result = { valid: false, errors: ['Test error'] };

      expect(() => {
        ValidationService.throwIfInvalid(result, 'Order validation');
      }).toThrow('Order validation: Test error');
    });
  });
});
