import { CommodityConfigService } from '@/services/CommodityConfigService';
import { cache } from '@/cache/redis';

// Mock the cache
jest.mock('@/cache/redis');
const mockCache = cache as jest.Mocked<typeof cache>;

describe('CommodityConfigService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the service state before each test
    CommodityConfigService['isInitialized'] = false;
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      mockCache.setJson.mockResolvedValue(true);

      await CommodityConfigService.initialize();

      expect(mockCache.setJson).toHaveBeenCalledWith(
        'commodity_config',
        expect.any(Array),
        300
      );
    });

    it('should not reinitialize if already initialized', async () => {
      mockCache.setJson.mockResolvedValue(true);

      await CommodityConfigService.initialize();
      await CommodityConfigService.initialize();

      expect(mockCache.setJson).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllConfigs', () => {
    it('should return cached configs when available', async () => {
      const mockConfigs = [
        {
          symbol: 'AU',
          displayName: 'Gold',
          unitLabel: 'oz',
          step: 0.1,
          minOrder: 0.1,
          formats: [],
          logisticsNotices: [],
          requiresLicense: false,
          enabled: true,
        },
      ];
      mockCache.getJson.mockResolvedValue(mockConfigs);

      const result = await CommodityConfigService.getAllConfigs();

      expect(result).toEqual(mockConfigs);
      expect(mockCache.getJson).toHaveBeenCalledWith('commodity_config');
    });

    it('should return base config when cache is empty', async () => {
      mockCache.getJson.mockResolvedValue(null);
      mockCache.setJson.mockResolvedValue(true);

      const result = await CommodityConfigService.getAllConfigs();

      expect(result).toHaveLength(6); // AU, AG, PT, PD, CU, CL
      expect(result[0]?.symbol).toBe('AU');
      expect(result[1]?.symbol).toBe('AG');
    });

    it('should handle cache errors gracefully', async () => {
      mockCache.getJson.mockRejectedValue(new Error('Cache error'));

      const result = await CommodityConfigService.getAllConfigs();

      expect(result).toHaveLength(6); // Should return base config
    });
  });

  describe('getConfig', () => {
    beforeEach(() => {
      mockCache.getJson.mockResolvedValue(null);
      mockCache.setJson.mockResolvedValue(true);
    });

    it('should return config for valid symbol', async () => {
      const result = await CommodityConfigService.getConfig('AU');

      expect(result).toBeDefined();
      expect(result?.symbol).toBe('AU');
      expect(result?.displayName).toBe('Gold');
    });

    it('should return null for invalid symbol', async () => {
      const result = await CommodityConfigService.getConfig('INVALID');

      expect(result).toBeNull();
    });
  });

  describe('getEnabledConfigs', () => {
    beforeEach(() => {
      mockCache.getJson.mockResolvedValue(null);
      mockCache.setJson.mockResolvedValue(true);
    });

    it('should return only enabled configs', async () => {
      const result = await CommodityConfigService.getEnabledConfigs();

      expect(result).toHaveLength(6); // All base configs are enabled
      expect(result.every(config => config.enabled)).toBe(true);
    });
  });

  describe('getAvailableFormats', () => {
    beforeEach(() => {
      mockCache.getJson.mockResolvedValue(null);
      mockCache.setJson.mockResolvedValue(true);
    });

    it('should return formats for gold', async () => {
      const result = await CommodityConfigService.getAvailableFormats('AU');

      expect(result).toHaveLength(3); // coins, bars, rounds
      expect(result.map(f => f.key)).toEqual(['coins', 'bars', 'rounds']);
    });

    it('should return formats for copper', async () => {
      const result = await CommodityConfigService.getAvailableFormats('CU');

      expect(result).toHaveLength(4); // ingots, coils, cathodes, sheets
      expect(result.map(f => f.key)).toEqual([
        'ingots',
        'coils',
        'cathodes',
        'sheets',
      ]);
    });

    it('should return empty array for invalid symbol', async () => {
      const result =
        await CommodityConfigService.getAvailableFormats('INVALID');

      expect(result).toEqual([]);
    });
  });

  describe('getMinimumOrder', () => {
    beforeEach(() => {
      mockCache.getJson.mockResolvedValue(null);
      mockCache.setJson.mockResolvedValue(true);
    });

    it('should return base minimum for gold without format', async () => {
      const result = await CommodityConfigService.getMinimumOrder('AU');

      expect(result).toBe(0.1);
    });

    it('should return format override for copper coils', async () => {
      const result = await CommodityConfigService.getMinimumOrder(
        'CU',
        'coils'
      );

      expect(result).toBe(2000); // Format override
    });

    it('should return base minimum for format without override', async () => {
      const result = await CommodityConfigService.getMinimumOrder(
        'AU',
        'coins'
      );

      expect(result).toBe(0.1); // No override, use base
    });

    it('should return null for invalid symbol', async () => {
      const result = await CommodityConfigService.getMinimumOrder('INVALID');

      expect(result).toBeNull();
    });
  });

  describe('getStepSize', () => {
    beforeEach(() => {
      mockCache.getJson.mockResolvedValue(null);
      mockCache.setJson.mockResolvedValue(true);
    });

    it('should return base step size for gold', async () => {
      const result = await CommodityConfigService.getStepSize('AU');

      expect(result).toBe(0.1);
    });

    it('should return format override for copper coils', async () => {
      const result = await CommodityConfigService.getStepSize('CU', 'coils');

      expect(result).toBe(100); // Format override
    });
  });

  describe('isValidFormat', () => {
    beforeEach(() => {
      mockCache.getJson.mockResolvedValue(null);
      mockCache.setJson.mockResolvedValue(true);
    });

    it('should return true for valid gold format', async () => {
      const result = await CommodityConfigService.isValidFormat('AU', 'coins');

      expect(result).toBe(true);
    });

    it('should return false for invalid format', async () => {
      const result = await CommodityConfigService.isValidFormat(
        'AU',
        'invalid'
      );

      expect(result).toBe(false);
    });

    it('should return false for invalid symbol', async () => {
      const result = await CommodityConfigService.isValidFormat(
        'INVALID',
        'coins'
      );

      expect(result).toBe(false);
    });
  });

  describe('requiresLicense', () => {
    beforeEach(() => {
      mockCache.getJson.mockResolvedValue(null);
      mockCache.setJson.mockResolvedValue(true);
    });

    it('should return false for gold', async () => {
      const result = await CommodityConfigService.requiresLicense('AU');

      expect(result).toBe(false);
    });

    it('should return true for crude oil', async () => {
      const result = await CommodityConfigService.requiresLicense('CL');

      expect(result).toBe(true);
    });

    it('should return true for crude oil physical delivery format', async () => {
      const result = await CommodityConfigService.requiresLicense(
        'CL',
        'physical_delivery'
      );

      expect(result).toBe(true);
    });
  });

  describe('validateAmount', () => {
    beforeEach(() => {
      mockCache.getJson.mockResolvedValue(null);
      mockCache.setJson.mockResolvedValue(true);
    });

    it('should validate correct amount for gold', async () => {
      const result = await CommodityConfigService.validateAmount('AU', 1.0);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject amount below minimum', async () => {
      const result = await CommodityConfigService.validateAmount('AU', 0.05);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Minimum order is 0.1 oz');
    });

    it('should reject amount not aligned to step size', async () => {
      const result = await CommodityConfigService.validateAmount('AU', 0.15);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Amount must be in increments of 0.1 oz');
    });

    it('should validate large copper order with format', async () => {
      const result = await CommodityConfigService.validateAmount(
        'CU',
        2000,
        'coils'
      );

      expect(result.valid).toBe(true);
    });

    it('should reject copper coil order below format minimum', async () => {
      const result = await CommodityConfigService.validateAmount(
        'CU',
        500,
        'coils'
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Minimum order is 2000 lbs for coils');
    });

    it('should handle unknown commodity', async () => {
      const result = await CommodityConfigService.validateAmount(
        'INVALID',
        1.0
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unknown commodity');
    });
  });

  describe('refreshCache', () => {
    it('should refresh cache successfully', async () => {
      mockCache.setJson.mockResolvedValue(true);

      await CommodityConfigService.refreshCache();

      expect(mockCache.setJson).toHaveBeenCalledWith(
        'commodity_config',
        expect.any(Array),
        300
      );
    });

    it('should handle cache errors gracefully', async () => {
      mockCache.setJson.mockRejectedValue(new Error('Cache error'));

      await expect(
        CommodityConfigService.refreshCache()
      ).resolves.toBeUndefined();
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy status when initialized', async () => {
      mockCache.setJson.mockResolvedValue(true);
      await CommodityConfigService.initialize();

      const status = CommodityConfigService.getHealthStatus();

      expect(status.status).toBe('healthy');
      expect(status.details).toContain('Configs for 6 commodities');
    });

    it('should return initializing status when not initialized', () => {
      const status = CommodityConfigService.getHealthStatus();

      expect(status.status).toBe('initializing');
    });
  });
});
