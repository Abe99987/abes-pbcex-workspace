/****
 * Test Setup for PBCEx Backend
 * - Strongly-typed Jest/Express mocks
 * - Safe global helpers typing
 * - No real external calls
 */

import { jest, expect } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';

// -----------------------------
// Environment & Feature Flags
// -----------------------------
process.env.NODE_ENV = 'test';
process.env.PORT = '4001';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/pbcex_test';

process.env.PHASE = '3';
process.env.ENABLE_VAULT_REDEMPTION = 'true';
process.env.ENABLE_ONCHAIN = 'false';
process.env.FULFILLMENT_STRATEGY = 'JM';

// Vendor/API placeholders (prevent real calls)
process.env.PLAID_CLIENT_ID = 'test_plaid_client_id';
process.env.PLAID_SECRET = 'test_plaid_secret';
process.env.PAXOS_API_KEY = 'test_paxos_key';
process.env.PRIMETRUST_API_KEY = 'test_primetrust_key';
process.env.SENDGRID_API_KEY = 'test_sendgrid_key';
process.env.TWILIO_ACCOUNT_SID = 'test_twilio_sid';
process.env.TWILIO_AUTH_TOKEN = 'test_twilio_token';

process.env.DB_CONNECT_TIMEOUT = '5000';
process.env.DB_POOL_SIZE = '5';

if (!process.env.ENABLE_TEST_LOGS) {
  process.env.LOG_LEVEL = 'silent';
}

// -----------------------------
// Local Types for Test Mocks
// -----------------------------
type Role = 'ADMIN' | 'SUPPORT' | 'TELLER' | 'USER';
type KycStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  kycStatus: KycStatus;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  createdAt?: Date;
}

interface MockPriceQuote {
  price: string;
  timestamp: Date;
  source: string;
}

interface MockPriceMap {
  [symbol: string]: {
    price: string;
    change24h: string;
  };
}

interface MockSendResult {
  success: boolean;
  messageId: string;
}

interface MockQueryResult {
  rows: unknown[];
  rowCount: number;
}

// -----------------------------
// Auth Middleware Mock
// -----------------------------
jest.mock('../middlewares/authMiddleware', () => {
  // Use explicit express types for req/res/next
  const authenticate = jest.fn(
    (req: Request, res: Response, next: NextFunction) => {
      const token = req.headers.authorization?.replace('Bearer ', '');

      const mockUsers: Record<string, MockUser> = {
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

      const found = token ? mockUsers[token] : undefined;
      if (found) {
        // attach typed user onto req
        (req as unknown as { user: MockUser }).user = found;
        next();
      } else {
        res.status(401).json({
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication required',
        });
      }
    }
  );

  const requireKyc = jest.fn((allowedStatuses: KycStatus[] = ['APPROVED']) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as unknown as { user?: MockUser }).user;
      if (user && allowedStatuses.includes(user.kycStatus)) {
        next();
      } else {
        res.status(403).json({
          code: 'KYC_REQUIRED',
          message: 'KYC approval required',
          requiredStatuses: allowedStatuses,
          userStatus: user?.kycStatus,
        });
      }
    };
  });

  const requireAdmin = jest.fn(
    (req: Request, res: Response, next: NextFunction) => {
      const user = (req as unknown as { user?: MockUser }).user;
      if (user?.role === 'ADMIN') {
        next();
      } else {
        res.status(403).json({
          code: 'AUTHORIZATION_ERROR',
          message: 'Admin access required',
          userRole: user?.role,
        });
      }
    }
  );

  const authorize = jest.fn((requiredRole: Role | Role[]) => {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as unknown as { user?: MockUser }).user;
      if (user?.role === 'ADMIN' || (user && roles.includes(user.role))) {
        next();
      } else {
        res.status(403).json({
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions',
          requiredRoles: roles,
          userRole: user?.role,
        });
      }
    };
  });

  return {
    __esModule: true,
    authenticate,
    requireKyc,
    requireAdmin,
    authorize,
  };
});

// -----------------------------
// External Services Mocks
// -----------------------------
jest.mock('../services/PriceFeedService', () => ({
  __esModule: true,
  default: {
    getPrice: jest.fn(),
    getPrices: jest.fn(),
  },
}));

jest.mock('../services/NotificationService', () => ({
  __esModule: true,
  default: {
    sendEmail: jest.fn(),
    sendSMS: jest.fn(),
    sendPush: jest.fn(),
  },
}));

// -----------------------------
// DB/Redis/File mocks
// -----------------------------
jest.mock('../db/index', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    transaction: jest.fn(),
    end: jest.fn(),
  },
}));

jest.mock('ioredis', () => {
  const mockRedis = jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    flushall: jest.fn(),
    quit: jest.fn(),
  }));
  
  return mockRedis;
});

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  access: jest.fn(),
  mkdir: jest.fn(),
}));

// -----------------------------
// Global helpers (typed)
// -----------------------------
declare global {
  // augment the NodeJS globalThis with a typed helper (Jest runtime)
   
  var testHelpers: {
    createMockUser: (role?: Role) => MockUser;
    createAuthHeaders: (role?: Role) => Record<string, string>;
    expectApiError: (
      response: { body: unknown; status: number },
      code: string
    ) => void;
    expectApiSuccess: (response: { body: unknown; status: number }) => void;
    withFeatureFlag: (
      flag: string,
      value: string,
      testFn: () => Promise<void>
    ) => Promise<void>;
  };
}

global.testHelpers = {
  createMockUser: (role: Role = 'USER'): MockUser => ({
    id: `${role.toLowerCase()}-user-id`,
    email: `${role.toLowerCase()}@pbcex.com`,
    firstName: 'Test',
    lastName: 'User',
    role,
    kycStatus: 'APPROVED',
    emailVerified: true,
    phoneVerified: false,
    twoFactorEnabled: false,
    createdAt: new Date(),
  }),

  createAuthHeaders: (role: Role = 'USER') => ({
    Authorization: `Bearer mock-${role.toLowerCase()}-jwt-token`,
    'Content-Type': 'application/json',
  }),

  expectApiError: (
    response: { body: unknown; status: number },
    code: string
  ) => {
    expect(response.body).toMatchObject({
      code,
      message: expect.any(String),
    });
    expect(response.status).toBeGreaterThanOrEqual(400);
  },

  expectApiSuccess: (response: { body: unknown; status: number }) => {
    expect(response.body).toMatchObject({
      code: 'SUCCESS',
    });
    expect(response.status).toBeLessThan(400);
  },

  withFeatureFlag: async (
    flag: string,
    value: string,
    testFn: () => Promise<void>
  ) => {
    const original = process.env[flag];
    process.env[flag] = value;
    try {
      await testFn();
    } finally {
      if (typeof original !== 'undefined') {
        process.env[flag] = original!;
      } else {
        delete process.env[flag];
      }
    }
  },
};

// -----------------------------
// Jest lifecycle
// -----------------------------
beforeAll(async () => {
  // Global test setup
  // Intentionally quiet unless ENABLE_TEST_LOGS is set
});

afterAll(async () => {
  // Global test cleanup
});

jest.setTimeout(30_000);

// Simple test to make Jest happy (setup.ts needs a test)
describe('Test Setup', () => {
  it('should initialize test helpers correctly', () => {
    expect(globalThis.testHelpers).toBeDefined();
    expect(typeof globalThis.testHelpers.createMockUser).toBe('function');
  });
});

export { jest };
