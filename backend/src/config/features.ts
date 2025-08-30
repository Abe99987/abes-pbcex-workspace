/**
 * Feature flags for controlling vendor integrations and Phase-3/4 features
 */

export interface FeatureFlags {
  // Integration flags
  tradingView: boolean;
  plaid: boolean;
  paxos: boolean;
  primetrust: boolean;
  anchorage: boolean;
  jmBullion: boolean;
  dillonGage: boolean;
  fedex: boolean;
  stripe: boolean;
  sendgrid: boolean;
  twilio: boolean;
  intercom: boolean;
  datadog: boolean;
  vanta: boolean;

  // Phase flags
  onchainTrading: boolean;
  vaultRedemption: boolean;
  physicalDelivery: boolean;

  // Development flags
  vendorPlaceholders: boolean;
  mockIntegrations: boolean;
}

export const getFeatureFlags = (): FeatureFlags => {
  const flags: FeatureFlags = {
    // Integration flags - read from environment
    tradingView: process.env.INTEGRATION_TRADINGVIEW === 'true',
    plaid: !!process.env.PLAID_CLIENT_ID,
    paxos: !!process.env.PAXOS_API_KEY,
    primetrust: !!process.env.PRIMETRUST_API_KEY,
    anchorage: !!process.env.ANCHORAGE_API_KEY,
    jmBullion: !!process.env.JM_BULLION_API_KEY,
    dillonGage: !!process.env.DILLON_GAGE_API_KEY,
    fedex: !!process.env.FEDEX_CLIENT_ID,
    stripe: !!process.env.STRIPE_SECRET_KEY,
    sendgrid: !!process.env.SENDGRID_API_KEY,
    twilio: !!process.env.TWILIO_ACCOUNT_SID,
    intercom: !!process.env.INTERCOM_ACCESS_TOKEN,
    datadog: !!process.env.DATADOG_API_KEY,
    vanta: !!process.env.VANTA_API_KEY,

    // Phase flags
    onchainTrading: process.env.ENABLE_ONCHAIN === 'true',
    vaultRedemption: process.env.ENABLE_VAULT_REDEMPTION === 'true',
    physicalDelivery: process.env.FULFILLMENT_STRATEGY !== 'none',

    // Development flags
    vendorPlaceholders: process.env.INTEGRATION_VENDOR_PLACEHOLDERS === 'true',
    mockIntegrations: process.env.NODE_ENV === 'development',
  };

  return flags;
};

export const isIntegrationEnabled = (
  integration: keyof FeatureFlags
): boolean => {
  const flags = getFeatureFlags();
  return flags[integration] === true;
};

export const getMissingIntegrations = (): string[] => {
  const flags = getFeatureFlags();
  const integrations = [
    'plaid',
    'paxos',
    'primetrust',
    'anchorage',
    'jmBullion',
    'dillonGage',
    'fedex',
    'stripe',
    'sendgrid',
    'twilio',
    'intercom',
    'datadog',
    'vanta',
  ] as const;

  return integrations.filter(integration => !flags[integration]);
};

export const shouldWarnAboutMissingIntegrations = (): boolean => {
  const flags = getFeatureFlags();

  // Don't warn in development if vendor placeholders are enabled
  if (flags.mockIntegrations && flags.vendorPlaceholders) {
    return false;
  }

  // Don't warn in production unless explicitly configured
  if (
    process.env.NODE_ENV === 'production' &&
    !process.env.WARN_MISSING_INTEGRATIONS
  ) {
    return false;
  }

  return true;
};

export const getIntegrationStatus = () => {
  const flags = getFeatureFlags();
  const missing = getMissingIntegrations();
  const configured = Object.keys(flags).filter(
    key =>
      flags[key as keyof FeatureFlags] === true &&
      ![
        'onchainTrading',
        'vaultRedemption',
        'physicalDelivery',
        'vendorPlaceholders',
        'mockIntegrations',
      ].includes(key)
  );

  return {
    configured,
    missing,
    shouldWarn: shouldWarnAboutMissingIntegrations(),
    phase: parseInt(process.env.PHASE || '1'),
    totalIntegrations: configured.length + missing.length,
    readyPercentage: Math.round(
      (configured.length / (configured.length + missing.length)) * 100
    ),
  };
};
