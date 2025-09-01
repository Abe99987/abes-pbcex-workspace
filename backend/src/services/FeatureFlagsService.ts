import { env } from '@/config/env';
import { logInfo, logError } from '@/utils/logger';

export interface FeatureFlags {
  moneyMovement: {
    internalTransfers: boolean;
    cryptoWithdrawals: boolean;
    bankTransfers: boolean;
    qrPayments: boolean;
    paymentRequests: boolean;
    billPay: boolean;
    recurringTransfers: boolean;
    cardFunding: boolean;
  };
  dca: {
    enabled: boolean;
    backtesting: boolean;
  };
  shop: {
    enabled: boolean;
    physicalOrders: boolean;
    sellConvert: boolean;
  };
  trading: {
    enabled: boolean;
    spotTrading: boolean;
    marginTrading: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    kycRequired: boolean;
    advancedSecurity: boolean;
  };
}

export class FeatureFlagsService {
  private static readonly DEFAULT_FLAGS: FeatureFlags = {
    moneyMovement: {
      internalTransfers: true,
      cryptoWithdrawals: true,
      bankTransfers: true,
      qrPayments: true,
      paymentRequests: true,
      billPay: true,
      recurringTransfers: true,
      cardFunding: true,
    },
    dca: {
      enabled: true,
      backtesting: true,
    },
    shop: {
      enabled: true,
      physicalOrders: true,
      sellConvert: true,
    },
    trading: {
      enabled: true,
      spotTrading: true,
      marginTrading: false,
    },
    security: {
      twoFactorAuth: true,
      kycRequired: true,
      advancedSecurity: false,
    },
  };

  /**
   * Get all feature flags
   */
  static getFeatureFlags(): FeatureFlags {
    try {
      const flags = { ...FeatureFlagsService.DEFAULT_FLAGS };

      // Override with environment variables
      if (!env.MONEY_MOVEMENT_ENABLED) {
        flags.moneyMovement = {
          internalTransfers: false,
          cryptoWithdrawals: false,
          bankTransfers: false,
          qrPayments: false,
          paymentRequests: false,
          billPay: false,
          recurringTransfers: false,
          cardFunding: false,
        };
      }

      if (!env.DCA_ENABLED) {
        flags.dca = {
          enabled: false,
          backtesting: false,
        };
      }

      if (!env.SHOP_ENABLED) {
        flags.shop = {
          enabled: false,
          physicalOrders: false,
          sellConvert: false,
        };
      }

      if (!env.TRADING_ENABLED) {
        flags.trading = {
          enabled: false,
          spotTrading: false,
          marginTrading: false,
        };
      }

      // Individual feature overrides
      if (!env.INTERNAL_TRANSFERS_ENABLED) {
        flags.moneyMovement.internalTransfers = false;
      }

      if (!env.CRYPTO_WITHDRAWALS_ENABLED) {
        flags.moneyMovement.cryptoWithdrawals = false;
      }

      if (!env.BANK_TRANSFERS_ENABLED) {
        flags.moneyMovement.bankTransfers = false;
      }

      if (!env.QR_PAYMENTS_ENABLED) {
        flags.moneyMovement.qrPayments = false;
      }

      if (!env.PAYMENT_REQUESTS_ENABLED) {
        flags.moneyMovement.paymentRequests = false;
      }

      if (!env.BILL_PAY_ENABLED) {
        flags.moneyMovement.billPay = false;
      }

      if (!env.RECURRING_TRANSFERS_ENABLED) {
        flags.moneyMovement.recurringTransfers = false;
      }

      if (!env.CARD_FUNDING_ENABLED) {
        flags.moneyMovement.cardFunding = false;
      }

      if (!env.DCA_BACKTESTING_ENABLED) {
        flags.dca.backtesting = false;
      }

      if (!env.PHYSICAL_ORDERS_ENABLED) {
        flags.shop.physicalOrders = false;
      }

      if (!env.SELL_CONVERT_ENABLED) {
        flags.shop.sellConvert = false;
      }

      if (!env.SPOT_TRADING_ENABLED) {
        flags.trading.spotTrading = false;
      }

      if (env.MARGIN_TRADING_ENABLED) {
        flags.trading.marginTrading = true;
      }

      if (!env.TWO_FACTOR_AUTH_ENABLED) {
        flags.security.twoFactorAuth = false;
      }

      if (!env.KYC_REQUIRED) {
        flags.security.kycRequired = false;
      }

      if (env.ADVANCED_SECURITY_ENABLED) {
        flags.security.advancedSecurity = true;
      }

      logInfo('Feature flags loaded', { flags });
      return flags;
    } catch (error) {
      logError('Error loading feature flags', error as Error);
      return FeatureFlagsService.DEFAULT_FLAGS;
    }
  }

  /**
   * Check if a specific feature is enabled
   */
  static isFeatureEnabled(featurePath: string): boolean {
    try {
      const flags = FeatureFlagsService.getFeatureFlags();
      const pathParts = featurePath.split('.');

      let current: any = flags;
      for (const part of pathParts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          return false;
        }
      }

      return Boolean(current);
    } catch (error) {
      logError('Error checking feature flag', {
        error: error as Error,
        featurePath,
      });
      return false;
    }
  }

  /**
   * Check if money movement features are enabled
   */
  static isMoneyMovementEnabled(): boolean {
    return (
      FeatureFlagsService.isFeatureEnabled('moneyMovement.internalTransfers') ||
      FeatureFlagsService.isFeatureEnabled('moneyMovement.cryptoWithdrawals') ||
      FeatureFlagsService.isFeatureEnabled('moneyMovement.bankTransfers') ||
      FeatureFlagsService.isFeatureEnabled('moneyMovement.qrPayments') ||
      FeatureFlagsService.isFeatureEnabled('moneyMovement.paymentRequests') ||
      FeatureFlagsService.isFeatureEnabled('moneyMovement.billPay') ||
      FeatureFlagsService.isFeatureEnabled(
        'moneyMovement.recurringTransfers'
      ) ||
      FeatureFlagsService.isFeatureEnabled('moneyMovement.cardFunding')
    );
  }

  /**
   * Check if DCA features are enabled
   */
  static isDCAEnabled(): boolean {
    return FeatureFlagsService.isFeatureEnabled('dca.enabled');
  }

  /**
   * Check if shop features are enabled
   */
  static isShopEnabled(): boolean {
    return FeatureFlagsService.isFeatureEnabled('shop.enabled');
  }

  /**
   * Check if trading features are enabled
   */
  static isTradingEnabled(): boolean {
    return FeatureFlagsService.isFeatureEnabled('trading.enabled');
  }

  /**
   * Check if security features are enabled
   */
  static isSecurityEnabled(): boolean {
    return (
      FeatureFlagsService.isFeatureEnabled('security.twoFactorAuth') ||
      FeatureFlagsService.isFeatureEnabled('security.kycRequired') ||
      FeatureFlagsService.isFeatureEnabled('security.advancedSecurity')
    );
  }

  /**
   * Get enabled features for a specific category
   */
  static getEnabledFeatures(category: keyof FeatureFlags): string[] {
    try {
      const flags = FeatureFlagsService.getFeatureFlags();
      const categoryFlags = flags[category];

      if (!categoryFlags || typeof categoryFlags !== 'object') {
        return [];
      }

      return Object.entries(categoryFlags)
        .filter(([_, enabled]) => Boolean(enabled))
        .map(([feature, _]) => feature);
    } catch (error) {
      logError('Error getting enabled features', {
        error: error as Error,
        category,
      });
      return [];
    }
  }

  /**
   * Get disabled features for a specific category
   */
  static getDisabledFeatures(category: keyof FeatureFlags): string[] {
    try {
      const flags = FeatureFlagsService.getFeatureFlags();
      const categoryFlags = flags[category];

      if (!categoryFlags || typeof categoryFlags !== 'object') {
        return [];
      }

      return Object.entries(categoryFlags)
        .filter(([_, enabled]) => !enabled)
        .map(([feature, _]) => feature);
    } catch (error) {
      logError('Error getting disabled features', {
        error: error as Error,
        category,
      });
      return [];
    }
  }

  /**
   * Validate feature flag configuration
   */
  static validateFeatureFlags(): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const flags = FeatureFlagsService.getFeatureFlags();

      // Check for conflicting flags
      if (flags.moneyMovement.bankTransfers && !flags.security.kycRequired) {
        warnings.push('Bank transfers enabled without KYC requirement');
      }

      if (flags.trading.marginTrading && !flags.security.advancedSecurity) {
        warnings.push('Margin trading enabled without advanced security');
      }

      if (flags.dca.enabled && !flags.trading.enabled) {
        warnings.push('DCA enabled without trading features');
      }

      // Check for required dependencies
      if (
        flags.moneyMovement.recurringTransfers &&
        !flags.moneyMovement.internalTransfers
      ) {
        errors.push(
          'Recurring transfers require internal transfers to be enabled'
        );
      }

      if (
        flags.moneyMovement.cardFunding &&
        !flags.moneyMovement.internalTransfers
      ) {
        errors.push('Card funding requires internal transfers to be enabled');
      }

      // Validate environment-specific flags
      if (env.NODE_ENV === 'production') {
        if (!flags.security.twoFactorAuth) {
          warnings.push('2FA disabled in production environment');
        }

        if (!flags.security.kycRequired) {
          warnings.push('KYC requirement disabled in production environment');
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      logError('Error validating feature flags', error as Error);
      return {
        valid: false,
        errors: ['Failed to validate feature flags'],
        warnings: [],
      };
    }
  }

  /**
   * Get feature flag summary for API responses
   */
  static getFeatureFlagSummary(): {
    enabled: string[];
    disabled: string[];
    categories: Record<string, boolean>;
  } {
    try {
      const flags = FeatureFlagsService.getFeatureFlags();
      const enabled: string[] = [];
      const disabled: string[] = [];
      const categories: Record<string, boolean> = {};

      // Process each category
      Object.entries(flags).forEach(([category, categoryFlags]) => {
        if (typeof categoryFlags === 'object' && categoryFlags !== null) {
          const categoryEnabled = Object.values(categoryFlags).some(Boolean);
          categories[category] = categoryEnabled;

          Object.entries(categoryFlags).forEach(([feature, enabled]) => {
            const featurePath = `${category}.${feature}`;
            if (enabled) {
              (enabled as string[]).push(featurePath);
            } else {
              disabled.push(featurePath);
            }
          });
        }
      });

      return { enabled, disabled, categories };
    } catch (error) {
      logError('Error getting feature flag summary', error as Error);
      return { enabled: [], disabled: [], categories: {} };
    }
  }
}
