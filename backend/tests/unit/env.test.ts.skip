import { z } from 'zod';

/**
 * Environment Variable Validation Tests
 * Tests the Zod schema validation for environment variables
 */

describe('Environment Schema Validation', () => {
  // Mock environment variables for testing
  const validEnv = {
    NODE_ENV: 'test',
    PORT: '4001',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/pbcex_test',
    JWT_SECRET: 'test-secret-key',
    JWT_EXPIRES_IN: '24h',

    // Phase-3 feature flags
    PHASE: '1',
    ENABLE_VAULT_REDEMPTION: 'false',
    ENABLE_ONCHAIN: 'false',
    FULFILLMENT_STRATEGY: 'JM',
  };

  beforeEach(() => {
    // Reset environment
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('TEST_')) {
        delete process.env[key];
      }
    });
  });

  describe('Required Fields', () => {
    it('should validate valid environment variables', async () => {
      // Mock the environment schema
      const envSchema = z.object({
        NODE_ENV: z.enum(['development', 'production', 'test']),
        PORT: z.string().transform(val => parseInt(val, 10)),
        DATABASE_URL: z.string().url(),
        JWT_SECRET: z.string().min(10),
        JWT_EXPIRES_IN: z.string().default('24h'),
        PHASE: z
          .string()
          .regex(/^[1-3]$/)
          .default('1'),
        ENABLE_VAULT_REDEMPTION: z.string().transform(val => val === 'true'),
        ENABLE_ONCHAIN: z.string().transform(val => val === 'true'),
        FULFILLMENT_STRATEGY: z.enum(['JM', 'BRINKS']),
      });

      const result = envSchema.safeParse(validEnv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PORT).toBe(4001);
        expect(result.data.ENABLE_VAULT_REDEMPTION).toBe(false);
        expect(result.data.FULFILLMENT_STRATEGY).toBe('JM');
      }
    });

    it('should fail validation for missing required fields', () => {
      const invalidEnv = { ...validEnv };
      const { DATABASE_URL, ...invalidEnvWithoutDB } = invalidEnv;

      const envSchema = z.object({
        NODE_ENV: z.enum(['development', 'production', 'test']),
        DATABASE_URL: z.string().url(),
        JWT_SECRET: z.string().min(10),
      });

      const result = envSchema.safeParse(invalidEnvWithoutDB);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code: 'invalid_type',
              path: ['DATABASE_URL'],
            }),
          ])
        );
      }
    });
  });

  describe('Data Type Validation', () => {
    it('should validate PORT as number', () => {
      const envSchema = z.object({
        PORT: z
          .string()
          .transform(val => parseInt(val, 10))
          .pipe(z.number()),
      });

      const validPort = envSchema.safeParse({ PORT: '4001' });
      expect(validPort.success).toBe(true);
      if (validPort.success) {
        expect(validPort.data.PORT).toBe(4001);
      }

      const invalidPort = envSchema.safeParse({ PORT: 'not-a-number' });
      expect(invalidPort.success).toBe(false);
    });

    it('should validate boolean transforms', () => {
      const envSchema = z.object({
        ENABLE_VAULT_REDEMPTION: z.string().transform(val => val === 'true'),
        ENABLE_ONCHAIN: z.string().transform(val => val === 'true'),
      });

      const result = envSchema.safeParse({
        ENABLE_VAULT_REDEMPTION: 'true',
        ENABLE_ONCHAIN: 'false',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ENABLE_VAULT_REDEMPTION).toBe(true);
        expect(result.data.ENABLE_ONCHAIN).toBe(false);
      }
    });

    it('should validate enum values', () => {
      const envSchema = z.object({
        NODE_ENV: z.enum(['development', 'production', 'test']),
        FULFILLMENT_STRATEGY: z.enum(['JM', 'BRINKS']),
      });

      const validEnum = envSchema.safeParse({
        NODE_ENV: 'test',
        FULFILLMENT_STRATEGY: 'JM',
      });
      expect(validEnum.success).toBe(true);

      const invalidEnum = envSchema.safeParse({
        NODE_ENV: 'invalid',
        FULFILLMENT_STRATEGY: 'INVALID',
      });
      expect(invalidEnum.success).toBe(false);
    });
  });

  describe('Default Values', () => {
    it('should apply default values for optional fields', () => {
      const envSchema = z.object({
        PHASE: z.string().default('1'),
        JWT_EXPIRES_IN: z.string().default('24h'),
        ENABLE_ONCHAIN: z
          .string()
          .transform(val => val === 'true')
          .pipe(z.boolean())
          .default('false'),
      });

      const result = envSchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PHASE).toBe('1');
        expect(result.data.JWT_EXPIRES_IN).toBe('24h');
        expect(result.data.ENABLE_ONCHAIN).toBe(false);
      }
    });

    it('should allow overriding default values', () => {
      const envSchema = z.object({
        PHASE: z.string().default('1'),
        FULFILLMENT_STRATEGY: z.enum(['JM', 'BRINKS']).default('JM'),
      });

      const result = envSchema.safeParse({
        PHASE: '3',
        FULFILLMENT_STRATEGY: 'BRINKS',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PHASE).toBe('3');
        expect(result.data.FULFILLMENT_STRATEGY).toBe('BRINKS');
      }
    });
  });

  describe('Phase-3 Feature Flags', () => {
    it('should validate PHASE values', () => {
      const envSchema = z.object({
        PHASE: z.string().regex(/^[1-3]$/, 'PHASE must be 1, 2, or 3'),
      });

      expect(envSchema.safeParse({ PHASE: '1' }).success).toBe(true);
      expect(envSchema.safeParse({ PHASE: '2' }).success).toBe(true);
      expect(envSchema.safeParse({ PHASE: '3' }).success).toBe(true);
      expect(envSchema.safeParse({ PHASE: '0' }).success).toBe(false);
      expect(envSchema.safeParse({ PHASE: '4' }).success).toBe(false);
      expect(envSchema.safeParse({ PHASE: 'invalid' }).success).toBe(false);
    });

    it('should validate feature flag combinations', () => {
      const envSchema = z.object({
        PHASE: z.string().regex(/^[1-3]$/),
        ENABLE_VAULT_REDEMPTION: z.string().transform(val => val === 'true'),
        ENABLE_ONCHAIN: z.string().transform(val => val === 'true'),
        FULFILLMENT_STRATEGY: z.enum(['JM', 'BRINKS']),
      });

      // Valid Phase-3 configuration
      const phase3Config = envSchema.safeParse({
        PHASE: '3',
        ENABLE_VAULT_REDEMPTION: 'true',
        ENABLE_ONCHAIN: 'false',
        FULFILLMENT_STRATEGY: 'JM',
      });
      expect(phase3Config.success).toBe(true);

      // Valid MVP configuration
      const mvpConfig = envSchema.safeParse({
        PHASE: '1',
        ENABLE_VAULT_REDEMPTION: 'false',
        ENABLE_ONCHAIN: 'false',
        FULFILLMENT_STRATEGY: 'JM',
      });
      expect(mvpConfig.success).toBe(true);
    });
  });

  describe('URL Validation', () => {
    it('should validate DATABASE_URL format', () => {
      const envSchema = z.object({
        DATABASE_URL: z.string().url(),
      });

      const validUrls = [
        'postgresql://user:pass@localhost:5432/dbname',
        'postgres://user:pass@host.com:5432/db',
        'postgresql://localhost/dbname',
      ];

      validUrls.forEach(url => {
        expect(envSchema.safeParse({ DATABASE_URL: url }).success).toBe(true);
      });

      const invalidUrls = [
        'not-a-url',
        'postgresql://',
        'http://invalid-db-url',
      ];

      invalidUrls.forEach(url => {
        expect(envSchema.safeParse({ DATABASE_URL: url }).success).toBe(false);
      });
    });

    it('should validate Redis URL format', () => {
      const envSchema = z.object({
        REDIS_URL: z.string().url().optional(),
      });

      expect(
        envSchema.safeParse({ REDIS_URL: 'redis://localhost:6379' }).success
      ).toBe(true);
      expect(
        envSchema.safeParse({ REDIS_URL: 'redis://user:pass@host:6379/0' })
          .success
      ).toBe(true);
      expect(
        envSchema.safeParse({ REDIS_URL: 'invalid-redis-url' }).success
      ).toBe(false);
      expect(envSchema.safeParse({}).success).toBe(true); // Optional field
    });
  });

  describe('Security Validation', () => {
    it('should require minimum JWT secret length', () => {
      const envSchema = z.object({
        JWT_SECRET: z
          .string()
          .min(32, 'JWT secret must be at least 32 characters'),
      });

      expect(
        envSchema.safeParse({
          JWT_SECRET:
            'this-is-a-very-long-and-secure-jwt-secret-key-for-production',
        }).success
      ).toBe(true);

      expect(
        envSchema.safeParse({
          JWT_SECRET: 'short',
        }).success
      ).toBe(false);
    });

    it('should validate environment types', () => {
      const envSchema = z.object({
        NODE_ENV: z.enum(['development', 'production', 'test']),
      });

      ['development', 'production', 'test'].forEach(env => {
        expect(envSchema.safeParse({ NODE_ENV: env }).success).toBe(true);
      });

      ['dev', 'prod', 'staging', 'invalid'].forEach(env => {
        expect(envSchema.safeParse({ NODE_ENV: env }).success).toBe(false);
      });
    });
  });

  describe('Optional vs Required Fields', () => {
    it('should handle optional integration service keys', () => {
      const envSchema = z.object({
        PLAID_CLIENT_ID: z.string().optional(),
        PLAID_SECRET: z.string().optional(),
        STRIPE_SECRET_KEY: z.string().optional(),
        SENDGRID_API_KEY: z.string().optional(),
      });

      // Should succeed with no optional fields
      expect(envSchema.safeParse({}).success).toBe(true);

      // Should succeed with some optional fields
      expect(
        envSchema.safeParse({
          PLAID_CLIENT_ID: 'test_client_id',
          STRIPE_SECRET_KEY: 'sk_test_key',
        }).success
      ).toBe(true);
    });

    it('should require core database and auth fields', () => {
      const envSchema = z.object({
        DATABASE_URL: z.string().url(),
        JWT_SECRET: z.string().min(10),
        NODE_ENV: z.enum(['development', 'production', 'test']),
      });

      // Should fail without required fields
      expect(envSchema.safeParse({}).success).toBe(false);
      expect(
        envSchema.safeParse({ DATABASE_URL: 'postgres://localhost' }).success
      ).toBe(false);

      // Should succeed with all required fields
      expect(
        envSchema.safeParse({
          DATABASE_URL: 'postgresql://localhost/test',
          JWT_SECRET: 'long-enough-secret',
          NODE_ENV: 'test',
        }).success
      ).toBe(true);
    });
  });
});
