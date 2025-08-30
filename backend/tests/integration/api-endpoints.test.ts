import request from 'supertest';
import app from '@/server';
import { AuthController } from '@/controllers/AuthController';
import { WalletController } from '@/controllers/WalletController';
import seedDevData from '@/scripts/seed-dev';

/**
 * Integration tests for key API endpoints
 * Tests the dashboard data loading functionality
 */

describe('API Endpoints Integration', () => {
  beforeAll(async () => {
    // Set up dev environment for testing
    process.env.NODE_ENV = 'development';
    process.env.DEV_FAKE_LOGIN = 'true';

    // Seed test data
    await seedDevData();
  });

  afterAll(async () => {
    // Clean up
    AuthController.clearUsers();
  });

  describe('Health Endpoint', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.environment).toBe('development');
      expect(response.body.services).toBeDefined();
      expect(response.body.services.database).toEqual({ status: 'mock' });
      expect(response.body.services.redis).toEqual({ status: 'mock' });
    });
  });

  describe('Prices Endpoint', () => {
    it('should return prices for all assets', async () => {
      const response = await request(app).get('/api/trade/prices').expect(200);

      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data).toBeDefined();
      expect(response.body.timestamp).toBeDefined();

      // Check that main precious metals are included
      const prices = response.body.data;
      expect(prices.AU).toBeDefined();
      expect(prices.AG).toBeDefined();
      expect(prices.PT).toBeDefined();
      expect(prices.PD).toBeDefined();
      expect(prices.CU).toBeDefined();

      // Verify price structure
      expect(prices.AU.price).toBeDefined();
      expect(prices.AU.change24h).toBeDefined();
      expect(prices.AU.lastUpdated).toBeDefined();
    });

    it('should return specific asset price when requested', async () => {
      const response = await request(app)
        .get('/api/trade/prices?asset=AU')
        .expect(200);

      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.AU).toBeDefined();
      expect(response.body.data.AU.price).toBeDefined();
    });
  });

  describe('Balances Endpoint', () => {
    it('should return user balances with seeded data', async () => {
      const response = await request(app)
        .get('/api/wallet/balances')
        .expect(200);

      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data).toBeDefined();

      const { funding, trading, combined } = response.body.data;

      // Check funding account
      expect(funding).toBeDefined();
      expect(funding.type).toBe('FUNDING');
      expect(funding.balances).toBeInstanceOf(Array);
      expect(funding.totalUsdValue).toBeDefined();

      // Check trading account
      expect(trading).toBeDefined();
      expect(trading.type).toBe('TRADING');
      expect(trading.balances).toBeInstanceOf(Array);
      expect(trading.totalUsdValue).toBeDefined();

      // Check combined totals
      expect(combined).toBeDefined();
      expect(combined.totalUsdValue).toBeDefined();

      // Verify we have seeded balances
      expect(funding.balances.length).toBeGreaterThan(0);
      expect(trading.balances.length).toBeGreaterThan(0);

      // Check balance structure
      const firstBalance = funding.balances[0];
      expect(firstBalance.asset).toBeDefined();
      expect(firstBalance.amount).toBeDefined();
      expect(firstBalance.usdValue).toBeDefined();
    });
  });

  describe('Transactions Endpoint', () => {
    it('should return user transaction history', async () => {
      const response = await request(app)
        .get('/api/wallet/transactions?limit=10')
        .expect(200);

      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.transactions).toBeInstanceOf(Array);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.limit).toBe(10);
      expect(response.body.data.offset).toBe(0);

      // Verify we have seeded transactions
      expect(response.body.data.transactions.length).toBeGreaterThan(0);

      // Check transaction structure
      const firstTransaction = response.body.data.transactions[0];
      expect(firstTransaction.id).toBeDefined();
      expect(firstTransaction.type).toBeDefined();
      expect(firstTransaction.asset).toBeDefined();
      expect(firstTransaction.amount).toBeDefined();
      expect(firstTransaction.description).toBeDefined();
      expect(firstTransaction.createdAt).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/wallet/transactions?limit=5&offset=2')
        .expect(200);

      expect(response.body.data.limit).toBe(5);
      expect(response.body.data.offset).toBe(2);
    });

    it('should support filtering by type', async () => {
      const response = await request(app)
        .get('/api/wallet/transactions?type=CREDIT')
        .expect(200);

      expect(response.body.code).toBe('SUCCESS');
      // If there are transactions, they should all be CREDIT type
      if (response.body.data.transactions.length > 0) {
        response.body.data.transactions.forEach((tx: { type: string }) => {
          expect(tx.type).toBe('CREDIT');
        });
      }
    });
  });

  describe('Authentication with DEV_FAKE_LOGIN', () => {
    it('should bypass authentication in development mode', async () => {
      // Prices endpoint requires authentication
      const response = await request(app).get('/api/trade/prices').expect(200);

      expect(response.body.code).toBe('SUCCESS');
    });

    it('should provide dev user context', async () => {
      // Balances endpoint should return data for the dev user
      const response = await request(app)
        .get('/api/wallet/balances')
        .expect(200);

      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.funding).toBeDefined();
      expect(response.body.data.trading).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app).get('/api/non-existent').expect(404);

      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should handle invalid query parameters gracefully', async () => {
      const response = await request(app)
        .get('/api/trade/prices?asset=INVALID')
        .expect(200);

      expect(response.body.code).toBe('SUCCESS');
      // Should return empty data or handle gracefully
    });
  });

  describe('CORS Headers', () => {
    it('should include correct CORS headers', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle OPTIONS requests', async () => {
      await request(app).options('/api/trade/prices').expect(204);
    });
  });
});
