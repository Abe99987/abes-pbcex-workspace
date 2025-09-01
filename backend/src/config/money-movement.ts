import { env } from './env';

/**
 * Money Movement Configuration Registry
 * Central configuration for all money movement features
 */

export interface NetworkConfig {
  network: string;
  name: string;
  enabled: boolean;
  minWithdrawal: number;
  maxWithdrawal: number;
  feeEstimate: number;
  addressFormat: 'legacy' | 'segwit' | 'bech32' | 'ethereum' | 'custom';
  addressRegex?: string;
  confirmations: number;
}

export interface AssetConfig {
  symbol: string;
  name: string;
  enabled: boolean;
  minTransfer: number;
  stepSize: number;
  decimals: number;
  networks: NetworkConfig[];
  requiresKyc: boolean;
  kycTier: 'none' | 'tier1' | 'tier2';
}

export interface BankRailsConfig {
  rails: 'swift' | 'wise';
  enabled: boolean;
  supportedCurrencies: string[];
  minAmount: number;
  maxAmount: number;
  feeTemplate: {
    fixed: number;
    percentage: number;
    minFee: number;
    maxFee: number;
  };
  kycTierRequired: 'tier1' | 'tier2';
  processingTime: string; // e.g., "1-3 business days"
}

export interface MoneyMovementConfig {
  assets: AssetConfig[];
  bankRails: BankRailsConfig[];
  features: {
    internalTransfers: boolean;
    cryptoWithdrawals: boolean;
    bankTransfers: boolean;
    qrPayments: boolean;
    paymentRequests: boolean;
    billPay: boolean;
    recurringTransfers: boolean;
    cardFunding: boolean;
    dca: boolean;
  };
  limits: {
    maxInternalTransfer: number;
    maxCryptoWithdrawal: number;
    maxBankTransfer: number;
    maxPaymentRequest: number;
    maxRecurringAmount: number;
    maxDcaContribution: number;
  };
  rateLimits: {
    internalTransfer: { windowMs: number; max: number };
    cryptoWithdrawal: { windowMs: number; max: number };
    bankTransfer: { windowMs: number; max: number };
    paymentRequest: { windowMs: number; max: number };
    qrGeneration: { windowMs: number; max: number };
  };
}

// Default configuration
const DEFAULT_CONFIG: MoneyMovementConfig = {
  assets: [
    {
      symbol: 'USD',
      name: 'US Dollar',
      enabled: true,
      minTransfer: 1,
      stepSize: 0.01,
      decimals: 2,
      networks: [],
      requiresKyc: false,
      kycTier: 'none',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      enabled: true,
      minTransfer: 1,
      stepSize: 0.01,
      decimals: 6,
      networks: [
        {
          network: 'ethereum',
          name: 'Ethereum',
          enabled: true,
          minWithdrawal: 10,
          maxWithdrawal: 100000,
          feeEstimate: 5,
          addressFormat: 'ethereum',
          addressRegex: '^0x[a-fA-F0-9]{40}$',
          confirmations: 12,
        },
        {
          network: 'polygon',
          name: 'Polygon',
          enabled: true,
          minWithdrawal: 1,
          maxWithdrawal: 100000,
          feeEstimate: 0.01,
          addressFormat: 'ethereum',
          addressRegex: '^0x[a-fA-F0-9]{40}$',
          confirmations: 256,
        },
      ],
      requiresKyc: false,
      kycTier: 'none',
    },
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      enabled: true,
      minTransfer: 0.001,
      stepSize: 0.000001,
      decimals: 8,
      networks: [
        {
          network: 'bitcoin',
          name: 'Bitcoin',
          enabled: true,
          minWithdrawal: 0.001,
          maxWithdrawal: 10,
          feeEstimate: 0.0001,
          addressFormat: 'bech32',
          addressRegex: '^bc1[a-z0-9]{39,59}$',
          confirmations: 6,
        },
        {
          network: 'lightning',
          name: 'Lightning Network',
          enabled: true,
          minWithdrawal: 0.000001,
          maxWithdrawal: 0.1,
          feeEstimate: 0.000001,
          addressFormat: 'custom',
          addressRegex: '^lnbc[a-z0-9]+$',
          confirmations: 1,
        },
      ],
      requiresKyc: true,
      kycTier: 'tier1',
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      enabled: true,
      minTransfer: 0.01,
      stepSize: 0.001,
      decimals: 18,
      networks: [
        {
          network: 'ethereum',
          name: 'Ethereum',
          enabled: true,
          minWithdrawal: 0.01,
          maxWithdrawal: 100,
          feeEstimate: 0.005,
          addressFormat: 'ethereum',
          addressRegex: '^0x[a-fA-F0-9]{40}$',
          confirmations: 12,
        },
      ],
      requiresKyc: true,
      kycTier: 'tier1',
    },
    {
      symbol: 'AU',
      name: 'Gold',
      enabled: true,
      minTransfer: 0.1,
      stepSize: 0.1,
      decimals: 4,
      networks: [],
      requiresKyc: false,
      kycTier: 'none',
    },
    {
      symbol: 'AG',
      name: 'Silver',
      enabled: true,
      minTransfer: 1,
      stepSize: 1,
      decimals: 4,
      networks: [],
      requiresKyc: false,
      kycTier: 'none',
    },
  ],
  bankRails: [
    {
      rails: 'swift',
      enabled: true,
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY'],
      minAmount: 100,
      maxAmount: 1000000,
      feeTemplate: {
        fixed: 25,
        percentage: 0.001,
        minFee: 25,
        maxFee: 500,
      },
      kycTierRequired: 'tier2',
      processingTime: '1-3 business days',
    },
    {
      rails: 'wise',
      enabled: true,
      supportedCurrencies: [
        'USD',
        'EUR',
        'GBP',
        'CAD',
        'AUD',
        'CHF',
        'JPY',
        'SGD',
        'HKD',
      ],
      minAmount: 1,
      maxAmount: 100000,
      feeTemplate: {
        fixed: 5,
        percentage: 0.005,
        minFee: 5,
        maxFee: 100,
      },
      kycTierRequired: 'tier1',
      processingTime: '1-2 business days',
    },
  ],
  features: {
    internalTransfers: true,
    cryptoWithdrawals: true,
    bankTransfers: true,
    qrPayments: true,
    paymentRequests: true,
    billPay: true,
    recurringTransfers: true,
    cardFunding: true,
    dca: true,
  },
  limits: {
    maxInternalTransfer: 100000,
    maxCryptoWithdrawal: 10000,
    maxBankTransfer: 1000000,
    maxPaymentRequest: 50000,
    maxRecurringAmount: 10000,
    maxDcaContribution: 5000,
  },
  rateLimits: {
    internalTransfer: { windowMs: 15 * 60 * 1000, max: 10 }, // 10 per 15 minutes
    cryptoWithdrawal: { windowMs: 60 * 60 * 1000, max: 5 }, // 5 per hour
    bankTransfer: { windowMs: 24 * 60 * 60 * 1000, max: 3 }, // 3 per day
    paymentRequest: { windowMs: 15 * 60 * 1000, max: 20 }, // 20 per 15 minutes
    qrGeneration: { windowMs: 60 * 1000, max: 30 }, // 30 per minute
  },
};

// Environment-based feature flags
const getFeatureFlags = () => ({
  internalTransfers: env.MONEY_MOVEMENT_ENABLED,
  cryptoWithdrawals: env.MONEY_MOVEMENT_ENABLED,
  bankTransfers: env.MONEY_MOVEMENT_ENABLED,
  qrPayments: env.MONEY_MOVEMENT_ENABLED,
  paymentRequests: env.MONEY_MOVEMENT_ENABLED,
  billPay: env.MONEY_MOVEMENT_ENABLED,
  recurringTransfers: env.MONEY_MOVEMENT_ENABLED,
  cardFunding: env.MONEY_MOVEMENT_ENABLED,
  dca: env.DCA_ENABLED,
});

// Merge environment flags with default config
export const getMoneyMovementConfig = (): MoneyMovementConfig => {
  const featureFlags = getFeatureFlags();

  return {
    ...DEFAULT_CONFIG,
    features: {
      ...DEFAULT_CONFIG.features,
      ...featureFlags,
    },
  };
};

// Helper functions
export const getAssetConfig = (symbol: string): AssetConfig | undefined => {
  const config = getMoneyMovementConfig();
  return config.assets.find(asset => asset.symbol === symbol.toUpperCase());
};

export const getNetworkConfig = (
  asset: string,
  network: string
): NetworkConfig | undefined => {
  const assetConfig = getAssetConfig(asset);
  return assetConfig?.networks.find(n => n.network === network.toLowerCase());
};

export const getBankRailsConfig = (
  rails: 'swift' | 'wise'
): BankRailsConfig | undefined => {
  const config = getMoneyMovementConfig();
  return config.bankRails.find(r => r.rails === rails);
};

export const isFeatureEnabled = (
  feature: keyof MoneyMovementConfig['features']
): boolean => {
  const config = getMoneyMovementConfig();
  return config.features[feature];
};

export const getRateLimit = (
  operation: keyof MoneyMovementConfig['rateLimits']
) => {
  const config = getMoneyMovementConfig();
  return config.rateLimits[operation];
};

export const getLimit = (limit: keyof MoneyMovementConfig['limits']) => {
  const config = getMoneyMovementConfig();
  return config.limits[limit];
};
