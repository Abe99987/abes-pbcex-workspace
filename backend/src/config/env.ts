import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Core Application
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z
    .string()
    .transform(val => parseInt(val, 10))
    .pipe(z.number().min(1000).max(65535))
    .default('4001'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  // Authentication & Security
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters'),
  ENCRYPTION_KEY: z
    .string()
    .min(32, 'ENCRYPTION_KEY must be at least 32 characters'),
  DEV_FAKE_LOGIN: z
    .string()
    .transform(val => val === 'true')
    .pipe(z.boolean())
    .default('false'),

  // Market Data
  TRADINGVIEW_API_KEY: z.string().optional(),

  // KYC & Identity Verification
  PLAID_CLIENT_ID: z.string().optional(),
  PLAID_SECRET: z.string().optional(),
  PLAID_ENV: z
    .enum(['sandbox', 'development', 'production'])
    .default('sandbox'),

  // Custody Partners
  PAXOS_API_KEY: z.string().optional(),
  PAXOS_API_SECRET: z.string().optional(),
  PRIMETRUST_API_KEY: z.string().optional(),
  PRIMETRUST_API_SECRET: z.string().optional(),
  ANCHORAGE_API_KEY: z.string().optional(),

  // Fulfillment & Logistics
  JM_BULLION_API_KEY: z.string().optional(),
  JM_BULLION_API_SECRET: z.string().optional(),
  DILLON_GAGE_API_KEY: z.string().optional(),
  DILLON_GAGE_API_SECRET: z.string().optional(),
  FEDEX_CLIENT_ID: z.string().optional(),
  FEDEX_CLIENT_SECRET: z.string().optional(),

  // Payments
  STRIPE_SECRET_KEY: z.string().optional(),

  // Messaging & Communication
  SENDGRID_API_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  INTERCOM_ACCESS_TOKEN: z.string().optional(),

  // Monitoring & Compliance
  DATADOG_API_KEY: z.string().optional(),
  VANTA_API_KEY: z.string().optional(),

  // Phase-3 Feature Flags
  PHASE: z
    .string()
    .regex(/^[1-3]$/, 'PHASE must be 1, 2, or 3')
    .default('1'),
  ENABLE_ONCHAIN: z
    .string()
    .transform(val => val === 'true')
    .pipe(z.boolean())
    .default('false'),
  ENABLE_VAULT_REDEMPTION: z
    .string()
    .transform(val => val === 'true')
    .pipe(z.boolean())
    .default('false'),
  FULFILLMENT_STRATEGY: z.enum(['JM', 'BRINKS']).default('JM'),

  // A/B Testing Configuration
  EXPERIMENTS_JSON: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates and parses environment variables
 * Throws an error if validation fails
 */
function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter(
          err => err.code === 'invalid_type' && err.received === 'undefined'
        )
        .map(err => err.path.join('.'));

      const invalidVars = error.errors
        .filter(
          err => err.code !== 'invalid_type' || err.received !== 'undefined'
        )
        .map(err => `${err.path.join('.')}: ${err.message}`);

      let message = '❌ Environment validation failed:\n';

      if (missingVars.length > 0) {
        message += `\nMissing required variables:\n${missingVars.map(v => `  - ${v}`).join('\n')}`;
      }

      if (invalidVars.length > 0) {
        message += `\nInvalid variables:\n${invalidVars.map(v => `  - ${v}`).join('\n')}`;
      }

      message +=
        '\n\n💡 Copy env-template to .env and fill in the required values.';

      throw new Error(message);
    }
    throw error;
  }
}

// Export validated configuration
export const env = validateEnv();

/**
 * Check if required integrations are configured
 */
export const integrations = {
  plaid: !!(env.PLAID_CLIENT_ID && env.PLAID_SECRET),
  paxos: !!(env.PAXOS_API_KEY && env.PAXOS_API_SECRET),
  primetrust: !!(env.PRIMETRUST_API_KEY && env.PRIMETRUST_API_SECRET),
  anchorage: !!env.ANCHORAGE_API_KEY,
  jmBullion: !!(env.JM_BULLION_API_KEY && env.JM_BULLION_API_SECRET),
  dillonGage: !!(env.DILLON_GAGE_API_KEY && env.DILLON_GAGE_API_SECRET),
  fedex: !!(env.FEDEX_CLIENT_ID && env.FEDEX_CLIENT_SECRET),
  stripe: !!env.STRIPE_SECRET_KEY,
  sendgrid: !!env.SENDGRID_API_KEY,
  twilio: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN),
  intercom: !!env.INTERCOM_ACCESS_TOKEN,
  datadog: !!env.DATADOG_API_KEY,
  vanta: !!env.VANTA_API_KEY,
  tradingView: !!env.TRADINGVIEW_API_KEY,
} as const;

// Log integration status in development
if (env.NODE_ENV === 'development') {
  const configuredIntegrations = Object.entries(integrations)
    .filter(([_, configured]) => configured)
    .map(([name]) => name);

  const unconfiguredIntegrations = Object.entries(integrations)
    .filter(([_, configured]) => !configured)
    .map(([name]) => name);

  // Check if vendor placeholders are enabled
  const vendorPlaceholdersEnabled =
    env.INTEGRATION_VENDOR_PLACEHOLDERS === 'true';

  console.log('🔧 Integration Status:');
  console.log(
    '  ✅ Configured:',
    configuredIntegrations.length > 0
      ? configuredIntegrations.join(', ')
      : 'none'
  );

  if (vendorPlaceholdersEnabled) {
    console.log(
      '  🔧 Missing integrations: SUPPRESSED (vendor placeholders enabled)'
    );
    console.log('  📝 Note: Using mock implementations for development');
  } else {
    console.log(
      '  ❌ Missing:',
      unconfiguredIntegrations.length > 0
        ? unconfiguredIntegrations.join(', ')
        : 'none'
    );
  }

  console.log('🚀 Phase-3 Features:');
  console.log(`  📊 Phase: ${env.PHASE}`);
  console.log(`  ⛓️  Onchain: ${env.ENABLE_ONCHAIN ? 'ENABLED' : 'DISABLED'}`);
  console.log(
    `  🏛️  Vault Redemption: ${env.ENABLE_VAULT_REDEMPTION ? 'ENABLED' : 'DISABLED'}`
  );
  console.log(`  📦 Fulfillment: ${env.FULFILLMENT_STRATEGY}`);

  if (vendorPlaceholdersEnabled) {
    console.log('  🛠️  Development Mode: Vendor placeholders enabled');
  }
}
