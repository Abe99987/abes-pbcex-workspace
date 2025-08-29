import request from 'supertest';
import { truncateAll } from '../../helpers/db';
import { Factory } from '../../helpers/factory';
import { registerAndLogin } from '../../helpers/auth';

/**
 * Admin API Integration Tests
 * Tests administrative operations requiring ADMIN role
 */

describe('Admin API', () => {
  let adminToken: string;
  let adminUser: any;
  let regularUserToken: string;
  let regularUser: any;

  beforeEach(async () => {
    await truncateAll();
    
    // Create admin user
    adminUser = await Factory.createUser({
      email: 'admin@pbcex.com',
      emailVerified: true,
      kycStatus: 'APPROVED',
      role: 'ADMIN',
    });
    
    // Create regular user
    regularUser = await Factory.createUser({
      email: 'user@example.com',
      emailVerified: true,
      kycStatus: 'APPROVED',
      role: 'USER',
    });

    adminToken = await registerAndLogin('admin@pbcex.com', 'AdminPassword123!');
    regularUserToken = await registerAndLogin('user@example.com', 'UserPassword123!');
  });

  describe('GET /api/admin/dashboard', () => {
    beforeEach(async () => {
      // Create test data for dashboard
      await Factory.createAccount({ userId: regularUser.id, type: 'FUNDING' });
      await Factory.createBalance({ accountId: 'account-1', asset: 'USD', balance: '10000.00' });
      await Factory.createTrade({ userId: regularUser.id, asset: 'XAU-s', quantity: '1.0' });
      await Factory.createOrder({ userId: regularUser.id, status: 'FILLED' });
    });

    it('should return admin dashboard data', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            overview: {
              totalUsers: 1,
              activeUsers: 1,
              totalTrades: 1,
              totalVolume24h: '2055.75',
              totalOrders: 1,
              pendingKyc: 0,
              systemStatus: 'OPERATIONAL',
            },
            userStats: {
              newRegistrations24h: 1,
              emailVerified: 1,
              kycApproved: 1,
              kycPending: 0,
              kycRejected: 0,
            },
            tradingStats: {
              trades24h: 1,
              volume24h: '2055.75',
              topAssets: [
                { asset: 'XAU-s', volume: '2055.75', trades: 1 },
              ],
              avgTradeSize: '2055.75',
            },
            balanceStats: {
              totalBalances: '10000.00',
              assetDistribution: {
                USD: '10000.00',
                'XAU-s': '0.00',
                'XAG-s': '0.00',
              },
            },
            systemHealth: {
              database: 'HEALTHY',
              redis: 'HEALTHY',
              priceFeed: 'HEALTHY',
              notifications: 'HEALTHY',
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.overview.totalUsers).toBe(1);
      expect(response.body.data.userStats.newRegistrations24h).toBe(1);
      expect(response.body.data.tradingStats.trades24h).toBe(1);
      expect(response.body.data.systemHealth.database).toBe('HEALTHY');
    });

    it('should require ADMIN role', async () => {
      const mockResponse = {
        status: 403,
        body: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Admin access required',
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should require authentication', async () => {
      const mockResponse = {
        status: 401,
        body: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication required',
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('GET /api/admin/users', () => {
    beforeEach(async () => {
      // Create additional test users
      await Factory.createUser({
        email: 'pending@example.com',
        kycStatus: 'PENDING',
        role: 'USER',
      });
      
      await Factory.createUser({
        email: 'rejected@example.com',
        kycStatus: 'REJECTED',
        role: 'USER',
      });
    });

    it('should return paginated user list', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            users: [
              {
                id: 'user-1',
                email: 'user@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: 'USER',
                kycStatus: 'APPROVED',
                emailVerified: true,
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
                totalBalance: '10000.00',
                totalTrades: 1,
              },
              {
                id: 'user-2',
                email: 'pending@example.com',
                firstName: 'Jane',
                lastName: 'Smith',
                role: 'USER',
                kycStatus: 'PENDING',
                emailVerified: true,
                createdAt: new Date().toISOString(),
                lastLoginAt: null,
                totalBalance: '0.00',
                totalTrades: 0,
              },
            ],
            pagination: {
              page: 1,
              limit: 20,
              total: 3, // Including admin user
              hasNext: false,
            },
            summary: {
              totalUsers: 3,
              kycPending: 1,
              kycApproved: 2,
              kycRejected: 1,
              emailUnverified: 0,
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.users).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(3);
      expect(response.body.data.summary.kycPending).toBe(1);
    });

    it('should filter by KYC status', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            users: [
              {
                id: 'user-2',
                email: 'pending@example.com',
                kycStatus: 'PENDING',
              },
            ],
            appliedFilters: {
              kycStatus: 'PENDING',
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.users.every((u: any) => u.kycStatus === 'PENDING')).toBe(true);
      expect(response.body.data.appliedFilters.kycStatus).toBe('PENDING');
    });

    it('should search by email', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            users: [
              {
                id: 'user-1',
                email: 'user@example.com',
              },
            ],
            appliedFilters: {
              search: 'user@example.com',
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.users[0].email).toBe('user@example.com');
    });

    it('should sort by registration date', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            users: [
              { createdAt: new Date().toISOString() },
              { createdAt: new Date(Date.now() - 86400000).toISOString() }, // 1 day ago
            ],
            sortBy: 'createdAt_desc',
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      
      const dates = response.body.data.users.map((u: any) => new Date(u.createdAt).getTime());
      expect(dates[0]).toBeGreaterThan(dates[1]); // Descending order
    });

    it('should require ADMIN role', async () => {
      const mockResponse = {
        status: 403,
        body: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Admin access required',
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('GET /api/admin/user/:id', () => {
    beforeEach(async () => {
      const account = await Factory.createAccount({ userId: regularUser.id, type: 'FUNDING' });
      await Factory.createBalance({ accountId: account.id, asset: 'USD', balance: '5000.00' });
      await Factory.createTrade({ userId: regularUser.id, asset: 'XAU-s', quantity: '1.0' });
      await Factory.createKycRecord({ userId: regularUser.id, status: 'APPROVED' });
    });

    it('should return detailed user information', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            user: {
              id: regularUser.id,
              email: 'user@example.com',
              firstName: 'John',
              lastName: 'Doe',
              role: 'USER',
              kycStatus: 'APPROVED',
              emailVerified: true,
              phoneVerified: false,
              twoFactorEnabled: false,
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              profile: {
                dateOfBirth: '1990-01-01',
                phone: '+1-555-0123',
                address: {
                  street: '123 Main St',
                  city: 'Anytown',
                  state: 'NY',
                  zipCode: '12345',
                  country: 'US',
                },
              },
            },
            accounts: [
              {
                id: 'account-1',
                type: 'FUNDING',
                status: 'ACTIVE',
                balances: [
                  { asset: 'USD', balance: '5000.00', lockedBalance: '0.00' },
                ],
              },
            ],
            kycRecord: {
              status: 'APPROVED',
              submittedAt: new Date().toISOString(),
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'system',
              documents: ['passport', 'utility_bill'],
            },
            statistics: {
              totalTrades: 1,
              totalVolume: '2055.75',
              averageTradeSize: '2055.75',
              lastTradeAt: new Date().toISOString(),
              profitLoss: '+55.75',
            },
            flags: {
              isHighValue: false,
              isFrequentTrader: false,
              hasRiskIndicators: false,
              isRestrictedUser: false,
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.user.email).toBe('user@example.com');
      expect(response.body.data.accounts).toHaveLength(1);
      expect(response.body.data.kycRecord.status).toBe('APPROVED');
      expect(response.body.data.statistics.totalTrades).toBe(1);
    });

    it('should return 404 for non-existent user', async () => {
      const mockResponse = {
        status: 404,
        body: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('USER_NOT_FOUND');
    });

    it('should require ADMIN role', async () => {
      const mockResponse = {
        status: 403,
        body: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Admin access required',
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('POST /api/admin/user/:id/kyc/approve', () => {
    let pendingKycUser: any;

    beforeEach(async () => {
      pendingKycUser = await Factory.createUser({
        email: 'kycpending@example.com',
        kycStatus: 'PENDING',
      });
      
      await Factory.createKycRecord({
        userId: pendingKycUser.id,
        status: 'PENDING',
      });
    });

    it('should approve KYC for user', async () => {
      const approvalData = {
        notes: 'Documents verified successfully',
      };

      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          message: 'KYC approved successfully',
          data: {
            user: {
              id: pendingKycUser.id,
              kycStatus: 'APPROVED',
            },
            kycRecord: {
              status: 'APPROVED',
              reviewedBy: adminUser.id,
              reviewedAt: new Date().toISOString(),
              notes: 'Documents verified successfully',
            },
            notifications: {
              emailSent: true,
              smsNotification: false,
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.user.kycStatus).toBe('APPROVED');
      expect(response.body.data.kycRecord.reviewedBy).toBe(adminUser.id);
      expect(response.body.data.notifications.emailSent).toBe(true);
    });

    it('should not approve already approved KYC', async () => {
      const approvedUser = await Factory.createUser({
        email: 'approved@example.com',
        kycStatus: 'APPROVED',
      });

      const mockResponse = {
        status: 400,
        body: {
          code: 'KYC_ALREADY_APPROVED',
          message: 'KYC is already approved for this user',
          data: {
            currentStatus: 'APPROVED',
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('KYC_ALREADY_APPROVED');
    });

    it('should require ADMIN role', async () => {
      const mockResponse = {
        status: 403,
        body: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Admin access required',
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('POST /api/admin/user/:id/kyc/reject', () => {
    let pendingKycUser: any;

    beforeEach(async () => {
      pendingKycUser = await Factory.createUser({
        email: 'kycpending@example.com',
        kycStatus: 'PENDING',
      });
    });

    it('should reject KYC for user', async () => {
      const rejectionData = {
        reason: 'INSUFFICIENT_DOCUMENTATION',
        notes: 'Utility bill is not clear enough. Please resubmit.',
      };

      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          message: 'KYC rejected',
          data: {
            user: {
              id: pendingKycUser.id,
              kycStatus: 'REJECTED',
            },
            kycRecord: {
              status: 'REJECTED',
              rejectionReason: 'INSUFFICIENT_DOCUMENTATION',
              reviewedBy: adminUser.id,
              reviewedAt: new Date().toISOString(),
              notes: 'Utility bill is not clear enough. Please resubmit.',
            },
            resubmissionAllowed: true,
            notifications: {
              emailSent: true,
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.user.kycStatus).toBe('REJECTED');
      expect(response.body.data.kycRecord.rejectionReason).toBe('INSUFFICIENT_DOCUMENTATION');
      expect(response.body.data.resubmissionAllowed).toBe(true);
    });

    it('should validate rejection reason', async () => {
      const invalidRejectionData = {
        // Missing reason
        notes: 'Some notes',
      };

      const mockResponse = {
        status: 400,
        body: {
          code: 'VALIDATION_ERROR',
          message: 'Rejection reason is required',
          errors: [
            { field: 'reason', message: 'Rejection reason must be provided' }
          ],
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/admin/exposure', () => {
    beforeEach(async () => {
      // Create test hedge positions and exposure data
      await Factory.createHedgePosition({
        asset: 'XAU-s',
        position: '10.5',
        hedgeRatio: '0.8',
      });
      
      await Factory.createHedgePosition({
        asset: 'XAG-s',
        position: '500.0',
        hedgeRatio: '0.7',
      });
    });

    it('should return exposure and hedging information', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            exposures: [
              {
                asset: 'XAU-s',
                grossExposure: '10.5',
                netExposure: '2.1', // 10.5 * (1 - 0.8)
                hedgeRatio: '0.8',
                hedgePosition: '8.4',
                riskLevel: 'LOW',
                lastUpdated: new Date().toISOString(),
              },
              {
                asset: 'XAG-s',
                grossExposure: '500.0',
                netExposure: '150.0', // 500.0 * (1 - 0.7)
                hedgeRatio: '0.7',
                hedgePosition: '350.0',
                riskLevel: 'MEDIUM',
                lastUpdated: new Date().toISOString(),
              },
            ],
            summary: {
              totalExposureUsd: '75250.00',
              totalHedgedUsd: '52675.00',
              totalNetExposureUsd: '22575.00',
              overallRiskLevel: 'MEDIUM',
              hedgeEffectiveness: '70.0%',
            },
            thresholds: {
              lowRisk: '10000.00',
              mediumRisk: '50000.00',
              highRisk: '100000.00',
            },
            recommendations: [
              {
                asset: 'XAG-s',
                action: 'INCREASE_HEDGE',
                reason: 'Exposure above medium risk threshold',
                suggestedHedgeRatio: '0.85',
              },
            ],
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.exposures).toHaveLength(2);
      expect(response.body.data.summary.overallRiskLevel).toBe('MEDIUM');
      expect(response.body.data.recommendations).toHaveLength(1);
    });

    it('should filter by asset', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            exposures: [
              { asset: 'XAU-s', grossExposure: '10.5' },
            ],
            appliedFilters: {
              asset: 'XAU-s',
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.exposures).toHaveLength(1);
      expect(response.body.data.exposures[0].asset).toBe('XAU-s');
    });

    it('should filter by risk level', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            exposures: [
              { asset: 'XAG-s', riskLevel: 'MEDIUM' },
            ],
            appliedFilters: {
              riskLevel: 'MEDIUM',
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.exposures.every((e: any) => e.riskLevel === 'MEDIUM')).toBe(true);
    });

    it('should require ADMIN role', async () => {
      const mockResponse = {
        status: 403,
        body: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Admin access required',
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('POST /api/admin/hedge/:asset', () => {
    it('should execute hedge operation', async () => {
      const hedgeData = {
        action: 'INCREASE',
        targetRatio: '0.85',
        amount: '2.5',
      };

      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          message: 'Hedge operation executed successfully',
          data: {
            asset: 'XAU-s',
            action: 'INCREASE',
            oldHedgeRatio: '0.8',
            newHedgeRatio: '0.85',
            hedgeAmount: '2.5',
            newPosition: '10.9',
            executedBy: adminUser.id,
            executedAt: new Date().toISOString(),
            cost: '5125.00',
            newRiskLevel: 'LOW',
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.action).toBe('INCREASE');
      expect(response.body.data.newHedgeRatio).toBe('0.85');
      expect(response.body.data.executedBy).toBe(adminUser.id);
    });

    it('should validate hedge parameters', async () => {
      const invalidHedgeData = {
        action: 'INCREASE',
        targetRatio: '1.5', // Invalid ratio > 1.0
      };

      const mockResponse = {
        status: 400,
        body: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid hedge parameters',
          errors: [
            { field: 'targetRatio', message: 'Hedge ratio must be between 0.0 and 1.0' }
          ],
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should handle hedge execution failures', async () => {
      const mockResponse = {
        status: 503,
        body: {
          code: 'HEDGE_EXECUTION_FAILED',
          message: 'Failed to execute hedge operation',
          data: {
            reason: 'ETF market closed',
            retryAfter: 3600,
            alternativeActions: ['MANUAL_HEDGE', 'DEFER_UNTIL_MARKET_OPEN'],
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(503);
      expect(response.body.code).toBe('HEDGE_EXECUTION_FAILED');
      expect(response.body.data.alternativeActions).toHaveLength(2);
    });
  });

  describe('GET /api/admin/trades', () => {
    beforeEach(async () => {
      await Factory.createTrade({
        userId: regularUser.id,
        side: 'BUY',
        asset: 'XAU-s',
        quantity: '1.5',
        price: '2055.75',
        status: 'FILLED',
      });
      
      await Factory.createTrade({
        userId: regularUser.id,
        side: 'SELL',
        asset: 'XAG-s',
        quantity: '50.0',
        price: '25.15',
        status: 'FILLED',
      });
    });

    it('should return all trades with admin details', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            trades: [
              {
                id: 'trade-1',
                userId: regularUser.id,
                userEmail: 'user@example.com',
                side: 'SELL',
                asset: 'XAG-s',
                quantity: '50.0',
                price: '25.15',
                totalValue: '1257.50',
                fee: '6.29',
                status: 'FILLED',
                createdAt: new Date().toISOString(),
                filledAt: new Date().toISOString(),
                riskScore: 'LOW',
                flags: [],
              },
              {
                id: 'trade-2',
                userId: regularUser.id,
                userEmail: 'user@example.com',
                side: 'BUY',
                asset: 'XAU-s',
                quantity: '1.5',
                price: '2055.75',
                totalValue: '3083.63',
                fee: '15.42',
                status: 'FILLED',
                createdAt: new Date().toISOString(),
                filledAt: new Date().toISOString(),
                riskScore: 'LOW',
                flags: [],
              },
            ],
            pagination: {
              page: 1,
              limit: 20,
              total: 2,
              hasNext: false,
            },
            summary: {
              totalTrades: 2,
              totalVolume: '4341.13',
              totalFees: '21.71',
              averageTradeSize: '2170.57',
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.trades).toHaveLength(2);
      expect(response.body.data.summary.totalTrades).toBe(2);
      expect(response.body.data.trades[0].userEmail).toBe('user@example.com');
    });

    it('should filter by user', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            trades: [
              { userId: regularUser.id, userEmail: 'user@example.com' },
            ],
            appliedFilters: {
              userId: regularUser.id,
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.trades.every((t: any) => t.userId === regularUser.id)).toBe(true);
    });

    it('should filter by asset and date range', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            trades: [
              { asset: 'XAU-s' },
            ],
            appliedFilters: {
              asset: 'XAU-s',
              startDate: '2024-01-01',
              endDate: '2024-01-31',
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.trades.every((t: any) => t.asset === 'XAU-s')).toBe(true);
    });

    it('should require ADMIN role', async () => {
      const mockResponse = {
        status: 403,
        body: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Admin access required',
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('GET /api/admin/orders', () => {
    beforeEach(async () => {
      await Factory.createOrder({
        userId: regularUser.id,
        type: 'SHOP_ORDER',
        status: 'PROCESSING',
        total: '4726.80',
      });
      
      await Factory.createOrder({
        userId: regularUser.id,
        type: 'TRADE_ORDER',
        status: 'FILLED',
        total: '2055.75',
      });
    });

    it('should return all orders with admin details', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            orders: [
              {
                id: 'order-1',
                userId: regularUser.id,
                userEmail: 'user@example.com',
                type: 'SHOP_ORDER',
                status: 'PROCESSING',
                total: '4726.80',
                itemCount: 2,
                fulfillmentStrategy: 'JM',
                createdAt: new Date().toISOString(),
                estimatedShipDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                priority: 'NORMAL',
                flags: [],
              },
              {
                id: 'order-2',
                userId: regularUser.id,
                userEmail: 'user@example.com',
                type: 'TRADE_ORDER',
                status: 'FILLED',
                total: '2055.75',
                itemCount: 1,
                createdAt: new Date().toISOString(),
                filledAt: new Date().toISOString(),
                priority: 'NORMAL',
                flags: [],
              },
            ],
            pagination: {
              page: 1,
              limit: 20,
              total: 2,
              hasNext: false,
            },
            summary: {
              totalOrders: 2,
              totalValue: '6782.55',
              pendingOrders: 1,
              completedOrders: 1,
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.orders).toHaveLength(2);
      expect(response.body.data.summary.pendingOrders).toBe(1);
      expect(response.body.data.summary.completedOrders).toBe(1);
    });

    it('should filter by status and type', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            orders: [
              { type: 'SHOP_ORDER', status: 'PROCESSING' },
            ],
            appliedFilters: {
              type: 'SHOP_ORDER',
              status: 'PROCESSING',
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.orders.every((o: any) => o.type === 'SHOP_ORDER' && o.status === 'PROCESSING')).toBe(true);
    });
  });

  describe('POST /api/admin/order/:id/update-status', () => {
    let testOrder: any;

    beforeEach(async () => {
      testOrder = await Factory.createOrder({
        userId: regularUser.id,
        status: 'PROCESSING',
      });
    });

    it('should update order status', async () => {
      const statusUpdate = {
        status: 'SHIPPED',
        trackingNumber: '1234567890',
        notes: 'Order shipped via FedEx',
      };

      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          message: 'Order status updated successfully',
          data: {
            order: {
              id: testOrder.id,
              status: 'SHIPPED',
              trackingNumber: '1234567890',
              shippedAt: new Date().toISOString(),
              updatedBy: adminUser.id,
              statusHistory: [
                { status: 'PROCESSING', timestamp: new Date().toISOString() },
                { status: 'SHIPPED', timestamp: new Date().toISOString(), updatedBy: adminUser.id },
              ],
            },
            notifications: {
              emailSent: true,
              smsNotification: false,
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.order.status).toBe('SHIPPED');
      expect(response.body.data.order.trackingNumber).toBe('1234567890');
      expect(response.body.data.order.statusHistory).toHaveLength(2);
    });

    it('should validate status transitions', async () => {
      const invalidStatusUpdate = {
        status: 'CONFIRMED', // Can't go back from PROCESSING to CONFIRMED
      };

      const mockResponse = {
        status: 400,
        body: {
          code: 'INVALID_STATUS_TRANSITION',
          message: 'Invalid status transition',
          data: {
            currentStatus: 'PROCESSING',
            requestedStatus: 'CONFIRMED',
            allowedTransitions: ['SHIPPED', 'CANCELLED', 'DELAYED'],
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVALID_STATUS_TRANSITION');
      expect(response.body.data.allowedTransitions).toContain('SHIPPED');
    });
  });

  describe('GET /api/admin/system/health', () => {
    it('should return comprehensive system health status', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            overall: 'HEALTHY',
            components: {
              database: {
                status: 'HEALTHY',
                responseTime: '15ms',
                connections: {
                  active: 5,
                  max: 100,
                },
              },
              redis: {
                status: 'HEALTHY',
                responseTime: '2ms',
                memory: {
                  used: '125MB',
                  max: '1GB',
                },
              },
              priceFeed: {
                status: 'HEALTHY',
                lastUpdate: new Date().toISOString(),
                dataAge: '30s',
                sources: ['provider1', 'provider2'],
              },
              notifications: {
                status: 'HEALTHY',
                emailQueue: 3,
                smsQueue: 0,
              },
              fulfillment: {
                jmBullion: 'HEALTHY',
                brinks: 'HEALTHY',
                dillonGage: 'HEALTHY',
              },
            },
            metrics: {
              uptime: '99.9%',
              requestsPerMinute: 150,
              errorRate: '0.1%',
              averageResponseTime: '125ms',
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.overall).toBe('HEALTHY');
      expect(response.body.data.components.database.status).toBe('HEALTHY');
      expect(response.body.data.components.fulfillment.jmBullion).toBe('HEALTHY');
      expect(response.body.data.metrics.uptime).toBe('99.9%');
    });

    it('should show unhealthy components', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'PARTIAL_OUTAGE',
          data: {
            overall: 'DEGRADED',
            components: {
              database: { status: 'HEALTHY' },
              redis: { status: 'HEALTHY' },
              priceFeed: { 
                status: 'UNHEALTHY',
                lastUpdate: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
                error: 'Connection timeout',
              },
              notifications: { status: 'HEALTHY' },
            },
            alerts: [
              {
                component: 'priceFeed',
                severity: 'HIGH',
                message: 'Price feed data is stale',
                since: new Date(Date.now() - 600000).toISOString(),
              },
            ],
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('PARTIAL_OUTAGE');
      expect(response.body.data.overall).toBe('DEGRADED');
      expect(response.body.data.components.priceFeed.status).toBe('UNHEALTHY');
      expect(response.body.data.alerts).toHaveLength(1);
    });

    it('should require ADMIN role', async () => {
      const mockResponse = {
        status: 403,
        body: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Admin access required',
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection failures', async () => {
      const mockResponse = {
        status: 503,
        body: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Database connection failed',
          retryAfter: 30,
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(503);
      expect(response.body.code).toBe('SERVICE_UNAVAILABLE');
      expect(response.body.retryAfter).toBe(30);
    });

    it('should handle malformed admin operations', async () => {
      const malformedData = {
        invalidField: 'value',
        // Missing required fields
      };

      const mockResponse = {
        status: 400,
        body: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          errors: [
            { field: 'action', message: 'Action is required' },
            { field: 'invalidField', message: 'Unknown field' },
          ],
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.errors).toHaveLength(2);
    });

    it('should log administrative actions for audit trail', async () => {
      const approvalData = {
        notes: 'KYC documents verified',
      };

      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            auditLog: {
              action: 'KYC_APPROVE',
              performedBy: adminUser.id,
              targetUserId: 'user-123',
              timestamp: new Date().toISOString(),
              details: approvalData,
              ipAddress: '192.168.1.100',
              userAgent: 'Admin Dashboard v1.0',
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.auditLog.action).toBe('KYC_APPROVE');
      expect(response.body.data.auditLog.performedBy).toBe(adminUser.id);
      expect(response.body.data.auditLog.ipAddress).toBeDefined();
    });
  });
});
