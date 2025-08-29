/**
 * Test Setup for PBCEx Backend
 * Configures Jest test environment and mocks for Phase-3 features
 */

import { jest } from '@jest/globals';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '4001'; // Different port for testing
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/pbcex_test';

// Phase-3 Feature flags for testing
process.env.PHASE = '3';
process.env.ENABLE_VAULT_REDEMPTION = 'true';
process.env.ENABLE_ONCHAIN = 'false';
process.env.FULFILLMENT_STRATEGY = 'JM';

// Mock integration services (prevent real API calls during tests)
process.env.PLAID_CLIENT_ID = 'test_plaid_client_id';
process.env.PLAID_SECRET = 'test_plaid_secret';
process.env.PAXOS_API_KEY = 'test_paxos_key';
process.env.PRIMETRUST_API_KEY = 'test_primetrust_key';

// Mock notification services
process.env.SENDGRID_API_KEY = 'test_sendgrid_key';
process.env.TWILIO_ACCOUNT_SID = 'test_twilio_sid';
process.env.TWILIO_AUTH_TOKEN = 'test_twilio_token';

// Database connection timeout for tests
process.env.DB_CONNECT_TIMEOUT = '5000';
process.env.DB_POOL_SIZE = '5';

// Disable logging in tests unless explicitly enabled
if (!process.env.ENABLE_TEST_LOGS) {
  process.env.LOG_LEVEL = 'silent';
}

// Mock JWT authentication for testing
jest.mock('../middlewares/authMiddleware', () => {
  const originalModule = jest.requireActual('../middlewares/authMiddleware');
  
  return {
    ...originalModule,
    authenticate: jest.fn((req: any, res: any, next: any) => {
      // Mock user based on Authorization header
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      const mockUsers: Record<string, any> = {
        'mock-admin-jwt-token': {
          id: 'admin-user-id',
          email: 'admin@pbcex.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
          kycStatus: 'APPROVED',
        },
        'mock-support-jwt-token': {
          id: 'support-user-id', 
          email: 'support@pbcex.com',
          firstName: 'Support',
          lastName: 'Agent',
          role: 'SUPPORT',
          kycStatus: 'APPROVED',
        },
        'mock-teller-jwt-token': {
          id: 'teller-user-id',
          email: 'teller@pbcex.com', 
          firstName: 'Bank',
          lastName: 'Teller',
          role: 'TELLER',
          kycStatus: 'APPROVED',
        },
        'mock-user-jwt-token': {
          id: 'regular-user-id',
          email: 'user@example.com',
          firstName: 'Regular',
          lastName: 'User', 
          role: 'USER',
          kycStatus: 'APPROVED',
        },
        'mock-jwt-token-for-testing': {
          id: 'test-user-id',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'USER',
          kycStatus: 'APPROVED',
        },
      };
      
      if (token && mockUsers[token]) {
        req.user = mockUsers[token];
        next();
      } else {
        res.status(401).json({
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication required',
        });
      }
    }),
    
    requireKyc: jest.fn((allowedStatuses = ['APPROVED']) => {
      return (req: any, res: any, next: any) => {
        if (req.user && allowedStatuses.includes(req.user.kycStatus)) {
          next();
        } else {
          res.status(403).json({
            code: 'KYC_REQUIRED',
            message: 'KYC approval required',
            requiredStatuses: allowedStatuses,
            userStatus: req.user?.kycStatus,
          });
        }
      };
    }),

    requireAdmin: jest.fn((req: any, res: any, next: any) => {
      if (req.user?.role === 'ADMIN') {
        next();
      } else {
        res.status(403).json({
          code: 'AUTHORIZATION_ERROR',
          message: 'Admin access required',
          userRole: req.user?.role,
        });
      }
    }),

    authorize: jest.fn((requiredRole: string | string[]) => {
      return (req: any, res: any, next: any) => {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        
        if (req.user?.role === 'ADMIN' || roles.includes(req.user?.role)) {
          next();
        } else {
          res.status(403).json({
            code: 'AUTHORIZATION_ERROR', 
            message: 'Insufficient permissions',
            requiredRoles: roles,
            userRole: req.user?.role,
          });
        }
      };
    }),
  };
});

// Mock external services to prevent real API calls
jest.mock('../services/PriceFeedService', () => ({
  __esModule: true,
  default: {
    getPrice: jest.fn().mockResolvedValue({
      price: '2150.00',
      timestamp: new Date(),
      source: 'mock',
    }),
    getPrices: jest.fn().mockResolvedValue({
      'PAXG': { price: '2150.00', change24h: '1.2%' },
      'XAU-s': { price: '2150.00', change24h: '1.2%' },
      'XAG-s': { price: '32.50', change24h: '0.8%' },
    }),
  },
}));

jest.mock('../services/NotificationService', () => ({
  __esModule: true,
  default: {
    sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-email-id' }),
    sendSMS: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-sms-id' }),
    sendPush: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-push-id' }),
  },
}));

// Mock database connections (if using a real DB, consider using test database)
jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    transaction: jest.fn((callback) => callback({
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      rollback: jest.fn(),
      commit: jest.fn(),
    })),
    end: jest.fn(),
  },
}));

// Mock Redis for caching (if used)
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(true),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
  })),
}));

// Mock file system operations
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  access: jest.fn(),
  mkdir: jest.fn(),
}));

// Global test utilities
declare global {
  namespace NodeJS {
    interface Global {
      testHelpers: {
        createMockUser: (role?: string) => any;
        createAuthHeaders: (role?: string) => Record<string, string>;
        expectApiError: (response: any, code: string) => void;
        expectApiSuccess: (response: any) => void;
        withFeatureFlag: (flag: string, value: string, testFn: () => Promise<void>) => Promise<void>;
      };
    }
  }
}

// Global test helper functions
global.testHelpers = {
  createMockUser: (role: string = 'USER') => ({
    id: `${role.toLowerCase()}-user-id`,
    email: `${role.toLowerCase()}@pbcex.com`,
    firstName: 'Test',
    lastName: 'User',
    role: role,
    kycStatus: 'APPROVED',
    emailVerified: true,
    phoneVerified: false,
    twoFactorEnabled: false,
    createdAt: new Date(),
  }),

  createAuthHeaders: (role: string = 'USER') => ({
    'Authorization': `Bearer mock-${role.toLowerCase()}-jwt-token`,
    'Content-Type': 'application/json',
  }),

  expectApiError: (response: any, code: string) => {
    expect(response.body).toMatchObject({
      code,
      message: expect.any(String),
    });
    expect(response.status).toBeGreaterThanOrEqual(400);
  },

  expectApiSuccess: (response: any) => {
    expect(response.body).toMatchObject({
      code: 'SUCCESS',
    });
    expect(response.status).toBeLessThan(400);
  },

  withFeatureFlag: async (flag: string, value: string, testFn: () => Promise<void>) => {
    const original = process.env[flag];
    process.env[flag] = value;
    
    try {
      await testFn();
    } finally {
      if (original) {
        process.env[flag] = original;
      } else {
        delete process.env[flag];
      }
    }
  },
};

// Test data factories
export const TestDataFactory = {
  user: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER',
    kycStatus: 'APPROVED',
    emailVerified: true,
    createdAt: new Date(),
    ...overrides,
  }),

  account: (overrides = {}) => ({
    id: 'test-account-id',
    userId: 'test-user-id',
    type: 'FUNDING',
    isActive: true,
    createdAt: new Date(),
    ...overrides,
  }),

  balance: (overrides = {}) => ({
    accountId: 'test-account-id',
    asset: 'USD',
    amount: '1000.00',
    lockedAmount: '0.00',
    lastUpdated: new Date(),
    ...overrides,
  }),

  trade: (overrides = {}) => ({
    id: 'test-trade-id',
    userId: 'test-user-id',
    fromAsset: 'USD',
    toAsset: 'PAXG',
    fromAmount: '2150.00',
    toAmount: '1.00000000',
    status: 'COMPLETED',
    executedAt: new Date(),
    createdAt: new Date(),
    ...overrides,
  }),

  order: (overrides = {}) => ({
    id: 'test-order-id',
    userId: 'test-user-id',
    productId: 'AU-EAGLE-1OZ',
    quantity: 1,
    unitPrice: '2150.00',
    totalPrice: '2150.00',
    status: 'PROCESSING',
    createdAt: new Date(),
    ...overrides,
  }),

  redemptionRequest: (overrides = {}) => ({
    id: 'test-redemption-id',
    userId: 'test-user-id',
    asset: 'XAU-s',
    assetAmount: '1.00000000',
    vaultSku: 'AU-EAGLE-1OZ',
    requestedQty: 1,
    status: 'PENDING',
    estimatedValue: '2150.00',
    shippingAddress: {
      name: 'Test User',
      line1: '123 Test St',
      city: 'Test City',
      state: 'CA',
      postalCode: '90210',
      country: 'US',
      phone: '555-0123',
    },
    createdAt: new Date(),
    ...overrides,
  }),

  vaultInventory: (overrides = {}) => ({
    id: 'test-inventory-id',
    metal: 'AU',
    sku: 'AU-EAGLE-1OZ',
    format: 'COIN',
    weight: '1.0000',
    purity: '0.9167',
    vaultLocation: 'VAULT-MAIN',
    qtyAvailable: 100,
    qtyReserved: 5,
    unitCost: '2150.00',
    isActive: true,
    createdAt: new Date(),
    ...overrides,
  }),

  supportNote: (overrides = {}) => ({
    id: 'test-note-id',
    userId: 'test-user-id',
    note: 'Test support note content',
    category: 'GENERAL',
    priority: 'MEDIUM',
    addedBy: 'support-user-id',
    createdAt: new Date(),
    ...overrides,
  }),
};

// Setup and teardown
beforeAll(async () => {
  // Global test setup
  console.log('🧪 Starting PBCEx test suite...');
});

afterAll(async () => {
  // Global test cleanup
  console.log('✅ PBCEx test suite completed');
});

// Increase timeout for integration tests
jest.setTimeout(30000);

export { jest };
