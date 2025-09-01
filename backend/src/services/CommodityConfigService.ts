import { cache } from '@/cache/redis';
import { logInfo, logError } from '@/utils/logger';

/**
 * Commodity Configuration Service
 * Single source of truth for asset configs, formats, minimums, and rules
 */

export interface CommodityFormat {
  key: string;
  label: string;
  description: string;
  minOverride?: number; // Format-specific minimum override
  step?: number; // Format-specific step size override
  requiresLicense?: boolean;
  enabled?: boolean;
}

export interface CommodityConfig {
  symbol: string;
  displayName: string;
  unitLabel: string;
  step: number; // Default step size
  minOrder: number; // Default minimum order
  formats: CommodityFormat[];
  logisticsNotices: string[];
  requiresLicense: boolean;
  enabled: boolean;
  metadata?: Record<string, any>;
}

export interface CommodityConfigWithAdmin extends CommodityConfig {
  adminOverrides?: {
    enabledFormats?: string[]; // Override which formats are enabled
    minOrderOverride?: number;
    stepOverride?: number;
  };
}

export class CommodityConfigService {
  private static isInitialized = false;
  private static readonly CACHE_KEY = 'commodity_config';
  private static readonly CACHE_TTL = 300; // 5 minutes

  // Static configuration data - could be moved to database or external config file
  private static readonly BASE_CONFIG: CommodityConfig[] = [
    {
      symbol: 'AU',
      displayName: 'Gold',
      unitLabel: 'oz',
      step: 0.1,
      minOrder: 0.1,
      formats: [
        {
          key: 'coins',
          label: 'Coins',
          description: 'Gold Eagles, Maple Leafs, and other sovereign coins',
          enabled: true,
        },
        {
          key: 'bars',
          label: 'Bars',
          description: 'Gold bars from certified refiners',
          enabled: true,
        },
        {
          key: 'rounds',
          label: 'Rounds',
          description: 'Private mint gold rounds',
          enabled: true,
        },
      ],
      logisticsNotices: [
        'Secure shipping with insurance included',
        'Delivery requires adult signature',
      ],
      requiresLicense: false,
      enabled: true,
    },
    {
      symbol: 'AG',
      displayName: 'Silver',
      unitLabel: 'oz',
      step: 1,
      minOrder: 1,
      formats: [
        {
          key: 'coins',
          label: 'Coins',
          description: 'Silver Eagles, Maple Leafs, and other sovereign coins',
          enabled: true,
        },
        {
          key: 'bars',
          label: 'Bars',
          description: 'Silver bars from certified refiners',
          enabled: true,
        },
        {
          key: 'rounds',
          label: 'Rounds',
          description: 'Private mint silver rounds',
          enabled: true,
        },
      ],
      logisticsNotices: [
        'Standard insured shipping',
        'Delivery requires adult signature for orders over $1000',
      ],
      requiresLicense: false,
      enabled: true,
    },
    {
      symbol: 'PT',
      displayName: 'Platinum',
      unitLabel: 'oz',
      step: 0.1,
      minOrder: 0.1,
      formats: [
        {
          key: 'coins',
          label: 'Coins',
          description: 'Platinum Eagles and other sovereign platinum coins',
          enabled: true,
        },
        {
          key: 'bars',
          label: 'Bars',
          description: 'Platinum bars from certified refiners',
          enabled: true,
        },
      ],
      logisticsNotices: [
        'Secure shipping with insurance included',
        'Delivery requires adult signature',
      ],
      requiresLicense: false,
      enabled: true,
    },
    {
      symbol: 'PD',
      displayName: 'Palladium',
      unitLabel: 'oz',
      step: 0.1,
      minOrder: 0.1,
      formats: [
        {
          key: 'bars',
          label: 'Bars',
          description: 'Palladium bars from certified refiners',
          enabled: true,
        },
      ],
      logisticsNotices: [
        'Secure shipping with insurance included',
        'Delivery requires adult signature',
        'Limited availability - contact for large orders',
      ],
      requiresLicense: false,
      enabled: true,
    },
    {
      symbol: 'CU',
      displayName: 'Copper',
      unitLabel: 'lbs',
      step: 1,
      minOrder: 1,
      formats: [
        {
          key: 'ingots',
          label: 'Ingots',
          description: 'Copper ingots for industrial use',
          minOverride: 100, // 100 lbs minimum for ingots
          enabled: true,
        },
        {
          key: 'coils',
          label: 'Coils',
          description: 'Copper coils for electrical applications',
          minOverride: 2000, // 1 ton minimum for coils
          step: 100,
          enabled: true,
        },
        {
          key: 'cathodes',
          label: 'Cathodes',
          description: 'High-grade copper cathodes',
          minOverride: 2000, // 1 ton minimum for cathodes
          step: 100,
          enabled: true,
        },
        {
          key: 'sheets',
          label: 'Sheets',
          description: 'Copper sheets for construction',
          minOverride: 500, // 500 lbs minimum for sheets
          step: 50,
          enabled: true,
        },
      ],
      logisticsNotices: [
        'Freight shipping for large orders',
        'Contact for custom dimensions',
        'Industrial delivery available',
      ],
      requiresLicense: false,
      enabled: true,
    },
    {
      symbol: 'CL',
      displayName: 'Crude Oil',
      unitLabel: 'bbls',
      step: 1,
      minOrder: 100,
      formats: [
        {
          key: 'physical_delivery',
          label: 'Physical Delivery',
          description: 'Physical crude oil delivery to specified location',
          requiresLicense: true,
          enabled: true,
        },
      ],
      logisticsNotices: [
        'Requires special licensing for physical delivery',
        'Minimum order quantities apply',
        'Delivery coordination required',
        'Environmental regulations apply',
      ],
      requiresLicense: true,
      enabled: true,
    },
  ];

  /**
   * Initialize the service
   */
  static async initialize(): Promise<void> {
    if (CommodityConfigService.isInitialized) {
      return;
    }

    try {
      await CommodityConfigService.refreshCache();

      // Warm up commonly used cache entries
      await CommodityConfigService.warmUpCache();

      CommodityConfigService.isInitialized = true;
      logInfo('CommodityConfigService initialized');
    } catch (error) {
      logError('Failed to initialize CommodityConfigService', error as Error);
      throw error;
    }
  }

  /**
   * Get all commodity configurations
   */
  static async getAllConfigs(): Promise<CommodityConfig[]> {
    try {
      // Try to get from cache first
      const cached = await cache.getJson<CommodityConfig[]>(
        CommodityConfigService.CACHE_KEY
      );

      if (cached) {
        return cached;
      }

      // Fallback to base config and cache it
      await CommodityConfigService.refreshCache();
      return CommodityConfigService.BASE_CONFIG;
    } catch (error) {
      logError('Failed to get commodity configs', error as Error);
      // Return base config as fallback
      return CommodityConfigService.BASE_CONFIG;
    }
  }

  /**
   * Get configuration for a specific commodity
   */
  static async getConfig(symbol: string): Promise<CommodityConfig | null> {
    const configs = await CommodityConfigService.getAllConfigs();
    return configs.find(config => config.symbol === symbol) || null;
  }

  /**
   * Get enabled configurations only
   */
  static async getEnabledConfigs(): Promise<CommodityConfig[]> {
    const configs = await CommodityConfigService.getAllConfigs();
    return configs.filter(config => config.enabled);
  }

  /**
   * Get available formats for a commodity
   */
  static async getAvailableFormats(symbol: string): Promise<CommodityFormat[]> {
    const config = await CommodityConfigService.getConfig(symbol);
    if (!config) {
      return [];
    }

    return config.formats.filter(format => format.enabled !== false);
  }

  /**
   * Get minimum order for commodity/format combination
   */
  static async getMinimumOrder(
    symbol: string,
    format?: string
  ): Promise<number | null> {
    const config = await CommodityConfigService.getConfig(symbol);
    if (!config) {
      return null;
    }

    if (format) {
      const formatConfig = config.formats.find(f => f.key === format);
      if (formatConfig && formatConfig.minOverride !== undefined) {
        return formatConfig.minOverride;
      }
    }

    return config.minOrder;
  }

  /**
   * Get step size for commodity/format combination
   */
  static async getStepSize(
    symbol: string,
    format?: string
  ): Promise<number | null> {
    const config = await CommodityConfigService.getConfig(symbol);
    if (!config) {
      return null;
    }

    if (format) {
      const formatConfig = config.formats.find(f => f.key === format);
      if (formatConfig && formatConfig.step !== undefined) {
        return formatConfig.step;
      }
    }

    return config.step;
  }

  /**
   * Check if format is valid for commodity
   */
  static async isValidFormat(symbol: string, format: string): Promise<boolean> {
    const availableFormats =
      await CommodityConfigService.getAvailableFormats(symbol);
    return availableFormats.some(f => f.key === format);
  }

  /**
   * Check if license is required for commodity/format
   */
  static async requiresLicense(
    symbol: string,
    format?: string
  ): Promise<boolean> {
    const config = await CommodityConfigService.getConfig(symbol);
    if (!config) {
      return false;
    }

    // Check commodity-level license requirement
    if (config.requiresLicense) {
      return true;
    }

    // Check format-level license requirement
    if (format) {
      const formatConfig = config.formats.find(f => f.key === format);
      return formatConfig?.requiresLicense || false;
    }

    return false;
  }

  /**
   * Validate amount against minimum and step size
   */
  static async validateAmount(
    symbol: string,
    amount: number,
    format?: string
  ): Promise<{ valid: boolean; error?: string }> {
    const config = await CommodityConfigService.getConfig(symbol);
    if (!config) {
      return { valid: false, error: 'Unknown commodity' };
    }

    const minOrder = await CommodityConfigService.getMinimumOrder(
      symbol,
      format
    );
    const stepSize = await CommodityConfigService.getStepSize(symbol, format);

    if (minOrder && amount < minOrder) {
      const formatSuffix = format ? ` for ${format}` : '';
      return {
        valid: false,
        error: `Minimum order is ${minOrder} ${config.unitLabel}${formatSuffix}`,
      };
    }

    if (stepSize && amount % stepSize !== 0) {
      return {
        valid: false,
        error: `Amount must be in increments of ${stepSize} ${config.unitLabel}`,
      };
    }

    return { valid: true };
  }

  /**
   * Refresh the cache with current configuration
   */
  static async refreshCache(): Promise<void> {
    try {
      await cache.setJson(
        CommodityConfigService.CACHE_KEY,
        CommodityConfigService.BASE_CONFIG,
        CommodityConfigService.CACHE_TTL
      );
      logInfo('Commodity config cache refreshed');
    } catch (error) {
      logError('Failed to refresh commodity config cache', error as Error);
    }
  }

  /**
   * Warm up cache with commonly accessed data
   */
  private static async warmUpCache(): Promise<void> {
    try {
      // Pre-cache common queries for performance
      const popularSymbols = ['AU', 'AG', 'PT', 'PD'];
      const popularFormats = ['coins', 'bars', 'coils'];

      const warmUpPromises = [];

      // Warm up config lookups
      for (const symbol of popularSymbols) {
        warmUpPromises.push(CommodityConfigService.getConfig(symbol));
        warmUpPromises.push(CommodityConfigService.getAvailableFormats(symbol));

        // Warm up format validations
        for (const format of popularFormats) {
          warmUpPromises.push(
            CommodityConfigService.isValidFormat(symbol, format)
          );
          warmUpPromises.push(
            CommodityConfigService.getMinimumOrder(symbol, format)
          );
          warmUpPromises.push(
            CommodityConfigService.getStepSize(symbol, format)
          );
        }
      }

      await Promise.allSettled(warmUpPromises);
      logInfo('Cache warmed up for commodity configurations');
    } catch (error) {
      logError('Failed to warm up cache', error as Error);
      // Don't throw - warming up cache is not critical
    }
  }

  /**
   * Admin method to override format availability
   * This would be used by feature flags or admin panel
   */
  static async setFormatEnabled(
    symbol: string,
    format: string,
    enabled: boolean
  ): Promise<void> {
    // In a real implementation, this would update the database
    // For now, we'll just invalidate the cache
    await cache.del(CommodityConfigService.CACHE_KEY);
    logInfo(
      `Format ${format} for ${symbol} ${enabled ? 'enabled' : 'disabled'}`
    );
  }

  /**
   * Get health status
   */
  static getHealthStatus(): { status: string; details?: string } {
    return {
      status: CommodityConfigService.isInitialized ? 'healthy' : 'initializing',
      details: `Configs for ${CommodityConfigService.BASE_CONFIG.length} commodities`,
    };
  }

  /**
   * Shutdown method
   */
  static async shutdown(): Promise<void> {
    CommodityConfigService.isInitialized = false;
    logInfo('CommodityConfigService shut down');
  }
}
