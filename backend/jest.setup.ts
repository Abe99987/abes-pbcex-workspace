// Jest setup for Admin Terminal backend tests

// Set up test environment variables to prevent env validation errors
process.env.SKIP_ENV_VALIDATION = 'true';

// Set minimal required env vars for tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379/test';
process.env.JWT_SECRET = 'test-jwt-secret-32-characters-long';
process.env.SESSION_SECRET = 'test-session-secret-32-characters-long';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters-long';

export {};
