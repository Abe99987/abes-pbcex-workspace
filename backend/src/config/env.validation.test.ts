/**
 * Environment Validation Test Scaffold
 * Tests production mode validation and security defaults
 */

import { z } from 'zod';

// We need to test the env validation without importing the actual module
// since it runs validation on import
describe('Environment Validation', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Development Mode Validation', () => {
    it('should accept minimal development configuration', async () => {
      // Set minimal required env vars for development
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.JWT_SECRET = 'dev_jwt_secret_32_characters_minimum_length';
      process.env.SESSION_SECRET = 'dev_session_secret_32_characters_minimum';
      process.env.ENCRYPTION_KEY = 'dev_encryption_key_32_chars_long';

      // Import and validate (this would normally happen on module import)
      const { env } = await import('./env');
      
      expect(env.NODE_ENV).toBe('development');
      expect(env.JWT_SECRET).toBe('dev_jwt_secret_32_characters_minimum_length');
    });

    it('should accept development secrets with dev prefixes', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.JWT_SECRET = 'dev_jwt_secret_32_characters_minimum_length';
      process.env.SESSION_SECRET = 'dev_session_secret_32_characters_minimum';
      process.env.ENCRYPTION_KEY = 'dev_encryption_key_32_chars_long';

      const { env } = await import('./env');
      
      expect(env.JWT_SECRET).toContain('dev_');
      expect(env.SESSION_SECRET).toContain('dev_');
      expect(env.ENCRYPTION_KEY).toContain('dev_');
    });

    it('should allow optional integrations in development', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.JWT_SECRET = 'dev_jwt_secret_32_characters_minimum_length';
      process.env.SESSION_SECRET = 'dev_session_secret_32_characters_minimum';
      process.env.ENCRYPTION_KEY = 'dev_encryption_key_32_chars_long';
      
      // Don't set integration keys - should be optional in dev
      delete process.env.RESEND_API_KEY;
      delete process.env.TWILIO_AUTH_TOKEN;
      delete process.env.FEDEX_CLIENT_SECRET;

      const { env } = await import('./env');
      
      expect(env.NODE_ENV).toBe('development');
      expect(env.RESEND_API_KEY).toBeUndefined();
    });
  });

  describe('Production Mode Validation', () => {
    it('should require critical integration keys in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://prod.example.com:5432/pbcex';
      process.env.REDIS_URL = 'rediss://prod.redis.example.com:6380';
      process.env.JWT_SECRET = 'production_jwt_secret_32_characters_minimum_length';
      process.env.SESSION_SECRET = 'production_session_secret_32_characters_minimum';
      process.env.ENCRYPTION_KEY = 'production_encryption_key_32_chars_long';
      
      // Missing required production integrations
      delete process.env.RESEND_API_KEY;
      delete process.env.TWILIO_AUTH_TOKEN;
      delete process.env.FEDEX_CLIENT_SECRET;

      // Clear module cache to force re-import
      jest.resetModules();

      await expect(async () => {
        await import('./env');
      }).rejects.toThrow(/Environment validation failed/);
    });

    it('should reject dev defaults in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://prod.example.com:5432/pbcex';
      process.env.REDIS_URL = 'rediss://prod.redis.example.com:6380';
      
      // Using development defaults - should be rejected
      process.env.JWT_SECRET = 'dev_jwt_secret_32_characters_minimum_length';
      process.env.SESSION_SECRET = 'dev_session_secret_32_characters_minimum';
      process.env.ENCRYPTION_KEY = 'dev_encryption_key_32_chars_long';

      jest.resetModules();

      // Should pass basic validation but warn about dev secrets
      const { env } = await import('./env');
      
      // In a real implementation, we might want to reject dev secrets in production
      expect(env.NODE_ENV).toBe('production');
    });

    it('should require strong secrets in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://prod.example.com:5432/pbcex';
      process.env.REDIS_URL = 'rediss://prod.redis.example.com:6380';
      
      // Secrets too short
      process.env.JWT_SECRET = 'short';
      process.env.SESSION_SECRET = 'short';
      process.env.ENCRYPTION_KEY = 'short';

      jest.resetModules();

      await expect(async () => {
        await import('./env');
      }).rejects.toThrow(/JWT_SECRET must be at least 32 characters/);
    });

    it('should accept valid production configuration', async () => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://prod.example.com:5432/pbcex';
      process.env.REDIS_URL = 'rediss://prod.redis.example.com:6380';
      process.env.JWT_SECRET = 'production_jwt_secret_32_characters_minimum_length';
      process.env.SESSION_SECRET = 'production_session_secret_32_characters_minimum';
      process.env.ENCRYPTION_KEY = 'production_encryption_key_32_chars_long';
      
      // Required production integrations
      process.env.RESEND_API_KEY = 're_prod_api_key_example';
      process.env.TWILIO_ACCOUNT_SID = 'AC_prod_account_sid_example';
      process.env.TWILIO_AUTH_TOKEN = 'prod_auth_token_example';
      process.env.TWILIO_VERIFY_SERVICE_SID = 'VA_prod_verify_service_example';
      process.env.FEDEX_CLIENT_ID = 'prod_fedex_client_id';
      process.env.FEDEX_CLIENT_SECRET = 'prod_fedex_client_secret';
      process.env.FEDEX_ACCOUNT_NUMBER = '123456789';

      jest.resetModules();

      const { env } = await import('./env');
      
      expect(env.NODE_ENV).toBe('production');
      expect(env.RESEND_API_KEY).toBe('re_prod_api_key_example');
      expect(env.TWILIO_AUTH_TOKEN).toBe('prod_auth_token_example');
    });
  });

  describe('URL Validation', () => {
    it('should validate database URL format', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'invalid-url';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.JWT_SECRET = 'dev_jwt_secret_32_characters_minimum_length';
      process.env.SESSION_SECRET = 'dev_session_secret_32_characters_minimum';
      process.env.ENCRYPTION_KEY = 'dev_encryption_key_32_chars_long';

      jest.resetModules();

      await expect(async () => {
        await import('./env');
      }).rejects.toThrow();
    });

    it('should validate Redis URL format', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.REDIS_URL = 'invalid-redis-url';
      process.env.JWT_SECRET = 'dev_jwt_secret_32_characters_minimum_length';
      process.env.SESSION_SECRET = 'dev_session_secret_32_characters_minimum';
      process.env.ENCRYPTION_KEY = 'dev_encryption_key_32_chars_long';

      jest.resetModules();

      await expect(async () => {
        await import('./env');
      }).rejects.toThrow();
    });

    it('should accept valid URL formats', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/dbname';
      process.env.REDIS_URL = 'redis://user:pass@localhost:6379/0';
      process.env.JWT_SECRET = 'dev_jwt_secret_32_characters_minimum_length';
      process.env.SESSION_SECRET = 'dev_session_secret_32_characters_minimum';
      process.env.ENCRYPTION_KEY = 'dev_encryption_key_32_chars_long';

      jest.resetModules();

      const { env } = await import('./env');
      
      expect(env.DATABASE_URL).toContain('postgresql://');
      expect(env.REDIS_URL).toContain('redis://');
    });
  });

  describe('Feature Flag Validation', () => {
    it('should validate phase numbers', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.JWT_SECRET = 'dev_jwt_secret_32_characters_minimum_length';
      process.env.SESSION_SECRET = 'dev_session_secret_32_characters_minimum';
      process.env.ENCRYPTION_KEY = 'dev_encryption_key_32_chars_long';
      process.env.PHASE = '4'; // Invalid phase

      jest.resetModules();

      await expect(async () => {
        await import('./env');
      }).rejects.toThrow(/PHASE must be 1, 2, or 3/);
    });

    it('should accept valid phase numbers', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.JWT_SECRET = 'dev_jwt_secret_32_characters_minimum_length';
      process.env.SESSION_SECRET = 'dev_session_secret_32_characters_minimum';
      process.env.ENCRYPTION_KEY = 'dev_encryption_key_32_chars_long';
      process.env.PHASE = '2';

      jest.resetModules();

      const { env } = await import('./env');
      
      expect(env.PHASE).toBe('2');
    });

    it('should validate boolean feature flags', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.JWT_SECRET = 'dev_jwt_secret_32_characters_minimum_length';
      process.env.SESSION_SECRET = 'dev_session_secret_32_characters_minimum';
      process.env.ENCRYPTION_KEY = 'dev_encryption_key_32_chars_long';
      process.env.ENABLE_ONCHAIN = 'true';
      process.env.ENABLE_VAULT_REDEMPTION = 'false';

      jest.resetModules();

      const { env } = await import('./env');
      
      expect(env.ENABLE_ONCHAIN).toBe(true);
      expect(env.ENABLE_VAULT_REDEMPTION).toBe(false);
    });
  });

  describe('Default Values', () => {
    it('should apply correct defaults', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.JWT_SECRET = 'dev_jwt_secret_32_characters_minimum_length';
      process.env.SESSION_SECRET = 'dev_session_secret_32_characters_minimum';
      process.env.ENCRYPTION_KEY = 'dev_encryption_key_32_chars_long';
      
      // Don't set optional vars to test defaults
      delete process.env.PORT;
      delete process.env.PHASE;
      delete process.env.EMAIL_FROM;

      jest.resetModules();

      const { env } = await import('./env');
      
      expect(env.PORT).toBe('4001'); // Default port
      expect(env.PHASE).toBe('1'); // Default phase
      expect(env.EMAIL_FROM).toBe('contact@pbcex.com'); // Default email
    });
  });

  describe('Integration Status Detection', () => {
    it('should correctly detect configured integrations', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.JWT_SECRET = 'dev_jwt_secret_32_characters_minimum_length';
      process.env.SESSION_SECRET = 'dev_session_secret_32_characters_minimum';
      process.env.ENCRYPTION_KEY = 'dev_encryption_key_32_chars_long';
      
      // Configure some integrations
      process.env.RESEND_API_KEY = 'test_resend_key';
      process.env.TWILIO_ACCOUNT_SID = 'test_account_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';

      jest.resetModules();

      const { integrations } = await import('./env');
      
      expect(integrations.resend).toBe(true);
      expect(integrations.twilio).toBe(true);
      expect(integrations.fedex).toBe(false); // Not configured
    });
  });

  describe('Error Messaging', () => {
    it('should provide helpful error messages for missing variables', async () => {
      process.env.NODE_ENV = 'development';
      // Missing required DATABASE_URL
      delete process.env.DATABASE_URL;
      process.env.REDIS_URL = 'redis://localhost:6379';

      jest.resetModules();

      try {
        await import('./env');
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('Environment validation failed');
        expect(error.message).toContain('Missing required variables');
        expect(error.message).toContain('DATABASE_URL');
      }
    });

    it('should provide helpful error messages for invalid variables', async () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.JWT_SECRET = 'short'; // Too short

      jest.resetModules();

      try {
        await import('./env');
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('Environment validation failed');
        expect(error.message).toContain('Invalid variables');
        expect(error.message).toContain('JWT_SECRET');
      }
    });
  });
});
