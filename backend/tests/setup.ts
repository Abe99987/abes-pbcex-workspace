/**
 * Jest Setup - runs before each test file
 * Ensures clean state for each test
 */

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toMatchBalanceFormat(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeValidUUID(received: any) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = typeof received === 'string' && uuidRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },

  toMatchBalanceFormat(received: any) {
    const balanceRegex = /^\d+\.\d{1,8}$/;
    const pass = typeof received === 'string' && balanceRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to match balance format`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to match balance format (0.00000000)`,
        pass: false,
      };
    }
  },
});

// Setup before each test file
beforeAll(async () => {
  // Load test environment variables
  require('dotenv').config({ path: '.env.test' });

  // Set test environment flag to bypass validation
  process.env.NODE_ENV = 'test';
  process.env.SKIP_ENV_VALIDATION = 'true';
});

// Clean up after each test file
afterAll(async () => {
  // Note: Database cleanup is handled by individual test files
  // to avoid importing problematic modules at setup time
});

// Silence console logs in tests unless explicitly enabled
if (!process.env.ENABLE_TEST_LOGS) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Test timeout configuration
jest.setTimeout(30000);

// Mock external services by default
jest.mock('../src/services/PriceFeedService');
jest.mock('../src/services/NotificationService');

// Common test utilities
export const TestUtils = {
  // Wait for async operations
  wait: (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate test email
  generateTestEmail: () => `test-${Date.now()}@example.com`,

  // Generate random string
  randomString: (length: number = 10) =>
    Math.random()
      .toString(36)
      .substring(2, length + 2),

  // Mock date to fixed value
  mockDate: (date: string | Date) => {
    const mockDate = new Date(date);
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  },

  // Restore real timers
  restoreDate: () => {
    jest.useRealTimers();
  },

  // Clean object for comparison (remove undefined, null)
  cleanObject: (obj: any) => {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null)
    );
  },

  // Format currency for tests
  formatCurrency: (amount: number, decimals: number = 2) => {
    return amount.toFixed(decimals);
  },

  // Check if string is valid decimal
  isValidDecimal: (value: string, decimals: number = 8) => {
    const regex = new RegExp(`^\\d+\\.\\d{1,${decimals}}$`);
    return regex.test(value);
  },

  // Assert API error response format
  expectApiError: (response: any, code: string) => {
    expect(response.body).toMatchObject({
      code,
      message: expect.any(String),
    });
    expect(response.status).toBeGreaterThanOrEqual(400);
  },

  // Assert API success response format
  expectApiSuccess: (response: any) => {
    expect(response.body).toMatchObject({
      code: 'SUCCESS',
    });
    expect(response.status).toBeLessThan(400);
  },

  // Assert pagination format
  expectPaginatedResponse: (response: any) => {
    expect(response.body.data).toMatchObject({
      total: expect.any(Number),
      results: expect.any(Array),
    });
  },

  // Assert timestamp format
  expectValidTimestamp: (timestamp: any) => {
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(new Date(timestamp).getTime()).toBeGreaterThan(0);
  },

  // Mock environment variable
  withEnvVar: async <T>(
    name: string,
    value: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    const original = process.env[name];
    process.env[name] = value;
    try {
      return await fn();
    } finally {
      if (original) {
        process.env[name] = original;
      } else {
        delete process.env[name];
      }
    }
  },

  // Mock feature flag
  withFeatureFlag: async <T>(
    flag: string,
    enabled: boolean,
    fn: () => Promise<T>
  ): Promise<T> => {
    return TestUtils.withEnvVar(flag, enabled.toString(), fn);
  },
};

console.log('🧪 Test environment initialized');
