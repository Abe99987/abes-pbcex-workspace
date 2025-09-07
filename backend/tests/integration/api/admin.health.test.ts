import request from 'supertest';
import app from '@/server';
import { WalletController } from '@/controllers/WalletController';
import AlertService from '@/services/AlertService';
import * as AuthHelpers from '../../helpers/auth';

describe('Admin Health API', () => {
  let adminToken: string;
  let regularUserToken: string;

  beforeAll(async () => {
    // Create admin user and get token using proper helper
    const adminResult = await AuthHelpers.registerUser({
      email: 'admin@pbcex.com',
      password: 'AdminPass123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      kycStatus: 'APPROVED',
    });
    adminToken = adminResult.accessToken;

    // Create regular user and get token  
    const userResult = await AuthHelpers.registerUser({
      email: 'user@pbcex.com', 
      password: 'UserPass123!',
      firstName: 'Regular',
      lastName: 'User',
      role: 'USER',
      kycStatus: 'APPROVED',
    });
    regularUserToken = userResult.accessToken;
  });

  beforeEach(() => {
    // Reset alert metrics before each test
    AlertService.resetMetrics();
  });

  describe('GET /api/admin/health/ledger-drift', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/admin/health/ledger-drift');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .get('/api/admin/health/ledger-drift')
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('AUTHORIZATION_ERROR');
    });

    it('should return health status for admin user', async () => {
      const response = await request(app)
        .get('/api/admin/health/ledger-drift')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data).toHaveProperty('ok');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('driftThreshold', 0.01);
      expect(response.body.data).toHaveProperty('totalAccountsChecked');
      expect(response.body.data).toHaveProperty('driftsDetected');
      expect(response.body.data).toHaveProperty('drifts');
    });

    it('should return ok=true when no drift detected', async () => {
      const response = await request(app)
        .get('/api/admin/health/ledger-drift')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.ok).toBe(true);
      expect(response.body.data.driftsDetected).toBe(0);
      expect(response.body.data.drifts).toEqual([]);
      expect(response.body.message).toBe('No ledger drift detected');
    });

    it('should include timestamp in ISO format', async () => {
      const response = await request(app)
        .get('/api/admin/health/ledger-drift')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
      
      // Verify timestamp is recent (within last minute)
      const timestampDate = new Date(response.body.data.timestamp);
      const now = new Date();
      const timeDiff = now.getTime() - timestampDate.getTime();
      expect(timeDiff).toBeLessThan(60000); // Less than 1 minute ago
    });

    it('should count total accounts checked', async () => {
      // Get current balance count
      const allBalances = WalletController.getAllBalances();
      
      const response = await request(app)
        .get('/api/admin/health/ledger-drift')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.totalAccountsChecked).toBe(allBalances.length);
    });

    it('should handle empty balance state gracefully', async () => {
      // Note: In the current mock system, balances exist from user creation
      // This test verifies the endpoint handles whatever balance state exists
      
      const response = await request(app)
        .get('/api/admin/health/ledger-drift')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.totalAccountsChecked).toBeGreaterThanOrEqual(0);
      expect(response.body.data.driftsDetected).toBe(0); // Mock system should have no drift
    });

    it('should return proper response structure', async () => {
      const response = await request(app)
        .get('/api/admin/health/ledger-drift')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        code: 'SUCCESS',
        message: expect.any(String),
        data: {
          ok: expect.any(Boolean),
          timestamp: expect.any(String),
          driftThreshold: 0.01,
          totalAccountsChecked: expect.any(Number),
          driftsDetected: expect.any(Number),
          drifts: expect.any(Array),
        },
      });
    });
  });
});
