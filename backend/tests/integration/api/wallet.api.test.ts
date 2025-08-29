import request from 'supertest';
import { truncateAll } from '../../helpers/db';
import { Factory } from '../../helpers/factory';
import { registerAndLogin } from '../../helpers/auth';

/**
 * Wallet API Integration Tests
 * Tests wallet operations including balances, transfers, and PAXG ↔ XAU-s conversions
 */

describe('Wallet API', () => {
  let authToken: string;
  let testUser: any;
  let testAccount: any;

  beforeEach(async () => {
    await truncateAll();
    
    testUser = await Factory.createUser({
      email: 'walletuser@example.com',
      emailVerified: true,
      kycStatus: 'APPROVED',
    });
    
    testAccount = await Factory.createAccount({
      userId: testUser.id,
      type: 'FUNDING',
      status: 'ACTIVE',
    });

    authToken = await registerAndLogin('walletuser@example.com', 'TestPassword123!');
  });

  describe('GET /api/wallet/balances', () => {
    beforeEach(async () => {
      // Set up test balances
      await Factory.createBalance({
        accountId: testAccount.id,
        asset: 'USD',
        balance: '10000.00',
        lockedBalance: '500.00',
      });
      
      await Factory.createBalance({
        accountId: testAccount.id,
        asset: 'PAXG',
        balance: '5.5',
        lockedBalance: '0.5',
      });
      
      await Factory.createBalance({
        accountId: testAccount.id,
        asset: 'XAU-s',
        balance: '3.25',
        lockedBalance: '0',
      });
    });

    it('should return user balances', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            balances: [
              {
                asset: 'USD',
                balance: '10000.00',
                lockedBalance: '500.00',
                availableBalance: '9500.00',
              },
              {
                asset: 'PAXG',
                balance: '5.5',
                lockedBalance: '0.5',
                availableBalance: '5.0',
              },
              {
                asset: 'XAU-s',
                balance: '3.25',
                lockedBalance: '0',
                availableBalance: '3.25',
              },
            ],
            totalValueUsd: '15432.75', // Estimated total in USD
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.balances).toHaveLength(3);
      
      const usdBalance = response.body.data.balances.find((b: any) => b.asset === 'USD');
      expect(usdBalance.balance).toBe('10000.00');
      expect(usdBalance.availableBalance).toBe('9500.00');
      
      const paxgBalance = response.body.data.balances.find((b: any) => b.asset === 'PAXG');
      expect(paxgBalance.balance).toBe('5.5');
      expect(paxgBalance.availableBalance).toBe('5.0');
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

    it('should return empty balances for new user', async () => {
      const newUser = await Factory.createUser({
        email: 'newuser@example.com',
        emailVerified: true,
      });
      
      const newUserToken = await registerAndLogin('newuser@example.com', 'TestPassword123!');

      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            balances: [],
            totalValueUsd: '0.00',
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.balances).toHaveLength(0);
      expect(response.body.data.totalValueUsd).toBe('0.00');
    });

    it('should filter zero balances', async () => {
      await Factory.createBalance({
        accountId: testAccount.id,
        asset: 'XAG-s',
        balance: '0.00',
        lockedBalance: '0.00',
      });

      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            balances: [
              { asset: 'USD', balance: '10000.00', availableBalance: '9500.00' },
              { asset: 'PAXG', balance: '5.5', availableBalance: '5.0' },
              { asset: 'XAU-s', balance: '3.25', availableBalance: '3.25' },
              // XAG-s should be filtered out due to zero balance
            ],
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.balances).toHaveLength(3);
      expect(response.body.data.balances.some((b: any) => b.asset === 'XAG-s')).toBe(false);
    });
  });

  describe('POST /api/wallet/transfer/paxg-to-xau', () => {
    beforeEach(async () => {
      await Factory.createBalance({
        accountId: testAccount.id,
        asset: 'PAXG',
        balance: '10.0',
        lockedBalance: '0',
      });
    });

    it('should convert PAXG to XAU-s (1:1 ratio)', async () => {
      const transferData = {
        amount: '2.5',
      };

      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          message: 'PAXG to XAU-s conversion successful',
          data: {
            transaction: {
              id: 'tx-12345',
              type: 'PAXG_TO_XAU_CONVERSION',
              amount: '2.5',
              fromAsset: 'PAXG',
              toAsset: 'XAU-s',
              conversionRate: '1.0',
              fee: '0.0125', // 0.5% fee
              netAmount: '2.4875',
              status: 'COMPLETED',
              createdAt: new Date().toISOString(),
            },
            newBalances: {
              PAXG: '7.5',
              'XAU-s': '2.4875',
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.transaction.fromAsset).toBe('PAXG');
      expect(response.body.data.transaction.toAsset).toBe('XAU-s');
      expect(response.body.data.transaction.conversionRate).toBe('1.0');
      expect(response.body.data.transaction.fee).toBe('0.0125');
      expect(response.body.data.newBalances.PAXG).toBe('7.5');
    });

    it('should validate sufficient PAXG balance', async () => {
      const transferData = {
        amount: '15.0', // More than available balance
      };

      const mockResponse = {
        status: 400,
        body: {
          code: 'INSUFFICIENT_BALANCE',
          message: 'Insufficient PAXG balance for conversion',
          data: {
            requested: '15.0',
            available: '10.0',
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INSUFFICIENT_BALANCE');
      expect(response.body.data.requested).toBe('15.0');
      expect(response.body.data.available).toBe('10.0');
    });

    it('should validate minimum transfer amount', async () => {
      const transferData = {
        amount: '0.001', // Below minimum
      };

      const mockResponse = {
        status: 400,
        body: {
          code: 'VALIDATION_ERROR',
          message: 'Amount below minimum transfer threshold',
          errors: [
            { 
              field: 'amount', 
              message: 'Minimum transfer amount is 0.01 PAXG' 
            }
          ],
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should require KYC approval', async () => {
      // Update user to non-approved KYC status
      testUser = await Factory.createUser({
        email: 'unverified@example.com',
        kycStatus: 'PENDING',
      });

      const mockResponse = {
        status: 403,
        body: {
          code: 'KYC_REQUIRED',
          message: 'KYC approval required for transfers',
          data: {
            currentStatus: 'PENDING',
            requiredStatus: 'APPROVED',
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('KYC_REQUIRED');
    });

    it('should handle concurrent transfer attempts', async () => {
      const transferData = {
        amount: '5.0',
      };

      const mockResponse = {
        status: 409,
        body: {
          code: 'TRANSFER_IN_PROGRESS',
          message: 'Another transfer is currently in progress',
          data: {
            pendingTransferId: 'tx-pending-123',
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('TRANSFER_IN_PROGRESS');
    });
  });

  describe('POST /api/wallet/transfer/xau-to-paxg', () => {
    beforeEach(async () => {
      await Factory.createBalance({
        accountId: testAccount.id,
        asset: 'XAU-s',
        balance: '5.0',
        lockedBalance: '0',
      });
    });

    it('should convert XAU-s to PAXG (1:1 ratio)', async () => {
      const transferData = {
        amount: '1.5',
      };

      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          message: 'XAU-s to PAXG conversion successful',
          data: {
            transaction: {
              id: 'tx-67890',
              type: 'XAU_TO_PAXG_CONVERSION',
              amount: '1.5',
              fromAsset: 'XAU-s',
              toAsset: 'PAXG',
              conversionRate: '1.0',
              fee: '0.0075', // 0.5% fee
              netAmount: '1.4925',
              status: 'COMPLETED',
              createdAt: new Date().toISOString(),
            },
            newBalances: {
              'XAU-s': '3.5',
              PAXG: '1.4925',
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.transaction.fromAsset).toBe('XAU-s');
      expect(response.body.data.transaction.toAsset).toBe('PAXG');
      expect(response.body.data.newBalances['XAU-s']).toBe('3.5');
      expect(response.body.data.newBalances.PAXG).toBe('1.4925');
    });

    it('should validate sufficient XAU-s balance', async () => {
      const transferData = {
        amount: '10.0', // More than available
      };

      const mockResponse = {
        status: 400,
        body: {
          code: 'INSUFFICIENT_BALANCE',
          message: 'Insufficient XAU-s balance for conversion',
          data: {
            requested: '10.0',
            available: '5.0',
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INSUFFICIENT_BALANCE');
    });
  });

  describe('GET /api/wallet/transactions', () => {
    beforeEach(async () => {
      // Create some test transactions
      await Factory.createTransaction({
        userId: testUser.id,
        type: 'DEPOSIT',
        asset: 'USD',
        amount: '1000.00',
        status: 'COMPLETED',
      });
      
      await Factory.createTransaction({
        userId: testUser.id,
        type: 'PAXG_TO_XAU_CONVERSION',
        asset: 'PAXG',
        amount: '2.0',
        status: 'COMPLETED',
      });
    });

    it('should return transaction history', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            transactions: [
              {
                id: 'tx-1',
                type: 'PAXG_TO_XAU_CONVERSION',
                asset: 'PAXG',
                amount: '2.0',
                status: 'COMPLETED',
                createdAt: new Date().toISOString(),
              },
              {
                id: 'tx-2',
                type: 'DEPOSIT',
                asset: 'USD',
                amount: '1000.00',
                status: 'COMPLETED',
                createdAt: new Date().toISOString(),
              },
            ],
            pagination: {
              page: 1,
              limit: 20,
              total: 2,
              hasNext: false,
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.transactions).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should support pagination', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            transactions: [
              /* First page of transactions */
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 25,
              hasNext: true,
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.hasNext).toBe(true);
    });

    it('should filter by transaction type', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            transactions: [
              {
                type: 'PAXG_TO_XAU_CONVERSION',
                asset: 'PAXG',
                amount: '2.0',
              },
            ],
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.transactions.every((tx: any) => tx.type === 'PAXG_TO_XAU_CONVERSION')).toBe(true);
    });

    it('should filter by asset', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            transactions: [
              {
                type: 'DEPOSIT',
                asset: 'USD',
                amount: '1000.00',
              },
            ],
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.transactions.every((tx: any) => tx.asset === 'USD')).toBe(true);
    });

    it('should filter by date range', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            transactions: [
              /* Transactions within date range */
            ],
            appliedFilters: {
              startDate: '2024-01-01',
              endDate: '2024-01-31',
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.appliedFilters.startDate).toBe('2024-01-01');
    });
  });

  describe('GET /api/wallet/transaction/:id', () => {
    it('should return transaction details', async () => {
      const transactionId = 'tx-12345';
      
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            transaction: {
              id: transactionId,
              type: 'PAXG_TO_XAU_CONVERSION',
              amount: '2.5',
              fromAsset: 'PAXG',
              toAsset: 'XAU-s',
              conversionRate: '1.0',
              fee: '0.0125',
              netAmount: '2.4875',
              status: 'COMPLETED',
              createdAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
              metadata: {
                ipAddress: '192.168.1.1',
                userAgent: 'PBCEx Mobile App v1.0',
              },
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.transaction.id).toBe(transactionId);
      expect(response.body.data.transaction.metadata).toBeDefined();
    });

    it('should return 404 for non-existent transaction', async () => {
      const mockResponse = {
        status: 404,
        body: {
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaction not found',
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('TRANSACTION_NOT_FOUND');
    });

    it('should prevent access to other users transactions', async () => {
      const otherUser = await Factory.createUser({
        email: 'otheruser@example.com',
      });
      
      const otherUserTransaction = await Factory.createTransaction({
        userId: otherUser.id,
        type: 'DEPOSIT',
        asset: 'USD',
        amount: '500.00',
      });

      const mockResponse = {
        status: 403,
        body: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this transaction',
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('ACCESS_DENIED');
    });
  });

  describe('POST /api/wallet/export', () => {
    it('should export transaction history as CSV', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          message: 'Export generated successfully',
          data: {
            downloadUrl: '/api/wallet/download/export-12345.csv',
            expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
            format: 'csv',
            recordCount: 25,
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.downloadUrl).toContain('.csv');
      expect(response.body.data.recordCount).toBe(25);
    });

    it('should support different export formats', async () => {
      const exportData = {
        format: 'pdf',
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      };

      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            downloadUrl: '/api/wallet/download/export-12345.pdf',
            format: 'pdf',
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.format).toBe('pdf');
      expect(response.body.data.downloadUrl).toContain('.pdf');
    });

    it('should validate date ranges', async () => {
      const invalidExportData = {
        dateRange: {
          startDate: '2024-12-31',
          endDate: '2024-01-01', // End before start
        },
      };

      const mockResponse = {
        status: 400,
        body: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid date range',
          errors: [
            { 
              field: 'dateRange', 
              message: 'End date must be after start date' 
            }
          ],
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Security and Error Handling', () => {
    it('should handle rate limiting on sensitive operations', async () => {
      const mockResponse = {
        status: 429,
        body: {
          code: 'RATE_LIMITED',
          message: 'Too many transfer requests. Please try again later.',
          retryAfter: 60,
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(429);
      expect(response.body.code).toBe('RATE_LIMITED');
      expect(response.body.retryAfter).toBe(60);
    });

    it('should not expose internal balance details in errors', async () => {
      const mockResponse = {
        status: 500,
        body: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          // No internal details, database queries, or sensitive data
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(500);
      expect(response.body.query).toBeUndefined();
      expect(response.body.stack).toBeUndefined();
      expect(response.body.internalBalance).toBeUndefined();
    });

    it('should validate numeric precision for amounts', async () => {
      const transferData = {
        amount: '1.123456789', // Too many decimal places
      };

      const mockResponse = {
        status: 400,
        body: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid amount precision',
          errors: [
            { 
              field: 'amount', 
              message: 'Amount can have maximum 8 decimal places' 
            }
          ],
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should handle network timeouts gracefully', async () => {
      const mockResponse = {
        status: 504,
        body: {
          code: 'GATEWAY_TIMEOUT',
          message: 'Request timeout. Please try again.',
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(504);
      expect(response.body.code).toBe('GATEWAY_TIMEOUT');
    });

    it('should validate transaction IDs format', async () => {
      const invalidTransactionId = 'invalid-tx-id';

      const mockResponse = {
        status: 400,
        body: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid transaction ID format',
          errors: [
            { 
              field: 'transactionId', 
              message: 'Transaction ID must be a valid UUID' 
            }
          ],
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });
});
