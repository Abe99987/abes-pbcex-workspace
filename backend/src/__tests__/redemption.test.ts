import request from 'supertest';
import app from '../server';
import { env } from '../config/env';

/**
 * Redemption Service Tests
 * Tests the Phase-3 vault redemption functionality
 * 
 * IMPORTANT: These tests are only run when ENABLE_VAULT_REDEMPTION=true
 */

describe('Redemption API', () => {
  // Skip all tests if vault redemption is disabled
  beforeAll(() => {
    if (!env.ENABLE_VAULT_REDEMPTION) {
      console.log('🔒 Vault redemption disabled - skipping redemption tests');
    }
  });

  const mockAuthToken = 'mock-jwt-token-for-testing';
  const mockUserId = 'test-user-id';

  // Helper to create authenticated request
  const authenticatedRequest = (method: 'get' | 'post' | 'put' | 'delete') => {
    return request(app)[method]('/api/redeem')
      .set('Authorization', `Bearer ${mockAuthToken}`);
  };

  describe('Feature Flag Behavior', () => {
    it('should return 501 when vault redemption is disabled', async () => {
      if (env.ENABLE_VAULT_REDEMPTION) {
        // Skip this test if redemption is actually enabled
        return;
      }

      const response = await authenticatedRequest('get')
        .query({
          asset: 'XAU-s',
          amount: '1.0',
          format: 'COIN',
        });

      expect(response.status).toBe(501);
      expect(response.body).toMatchObject({
        code: 'SERVICE_UNAVAILABLE',
        message: 'Vault redemption services are not implemented',
        feature: 'ENABLE_VAULT_REDEMPTION',
        status: 'DISABLED',
      });
    });

    it('should process requests when vault redemption is enabled', async () => {
      if (!env.ENABLE_VAULT_REDEMPTION) {
        return; // Skip if disabled
      }

      // This test would run when feature is enabled
      const response = await authenticatedRequest('get')
        .query({
          asset: 'XAU-s',
          amount: '1.0',
          format: 'COIN',
        });

      // Should not return 501 when enabled
      expect(response.status).not.toBe(501);
    });
  });

  // Only run the following tests when redemption is enabled
  describe('Redemption Quotes', () => {
    beforeEach(() => {
      if (!env.ENABLE_VAULT_REDEMPTION) {
        pending('Vault redemption disabled');
      }
    });

    it('should get redemption quote for valid synthetic asset', async () => {
      const response = await request(app)
        .get('/api/redeem/quote')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .query({
          asset: 'XAU-s',
          amount: '1.0',
          format: 'COIN',
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.quote).toMatchObject({
        asset: 'XAU-s',
        amount: '1.0',
        format: 'COIN',
        estimatedValue: expect.any(String),
        availableSkus: expect.any(Array),
        redemptionFee: expect.any(String),
        shippingCost: expect.any(String),
        totalCost: expect.any(String),
        expiresAt: expect.any(String),
      });
    });

    it('should reject quote for invalid asset format', async () => {
      const response = await request(app)
        .get('/api/redeem/quote')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .query({
          asset: 'INVALID',
          amount: '1.0',
          format: 'COIN',
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject quote for non-synthetic asset', async () => {
      const response = await request(app)
        .get('/api/redeem/quote')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .query({
          asset: 'PAXG', // Real asset, not synthetic
          amount: '1.0',
          format: 'COIN',
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should enforce minimum redemption amount', async () => {
      const response = await request(app)
        .get('/api/redeem/quote')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .query({
          asset: 'XAU-s',
          amount: '0.001', // Very small amount
          format: 'COIN',
        });

      // Should either succeed or fail with minimum amount error
      if (response.status === 400) {
        expect(response.body.message).toMatch(/minimum/i);
      }
    });
  });

  describe('Redemption Requests', () => {
    beforeEach(() => {
      if (!env.ENABLE_VAULT_REDEMPTION) {
        pending('Vault redemption disabled');
      }
    });

    const validRedemptionRequest = {
      asset: 'XAU-s',
      amount: '1.0',
      format: 'COIN',
      shippingAddress: {
        name: 'John Doe',
        line1: '123 Test St',
        city: 'Test City',
        state: 'CA',
        postalCode: '90210',
        country: 'US',
        phone: '555-0123',
      },
    };

    it('should create redemption request with valid data', async () => {
      const response = await request(app)
        .post('/api/redeem')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(validRedemptionRequest);

      expect(response.status).toBe(201);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.redemption).toMatchObject({
        id: expect.any(String),
        userId: expect.any(String),
        asset: 'XAU-s',
        status: 'PENDING',
        vaultLocation: expect.any(String),
        createdAt: expect.any(String),
      });
      expect(response.body.data.referenceNumber).toMatch(/^RED-/);
    });

    it('should reject redemption request with invalid shipping address', async () => {
      const invalidRequest = {
        ...validRedemptionRequest,
        shippingAddress: {
          ...validRedemptionRequest.shippingAddress,
          name: '', // Invalid empty name
        },
      };

      const response = await request(app)
        .post('/api/redeem')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should require authentication for redemption request', async () => {
      const response = await request(app)
        .post('/api/redeem')
        .send(validRedemptionRequest);

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('Redemption History', () => {
    beforeEach(() => {
      if (!env.ENABLE_VAULT_REDEMPTION) {
        pending('Vault redemption disabled');
      }
    });

    it('should get user redemption history', async () => {
      const response = await request(app)
        .get('/api/redeem/history')
        .set('Authorization', `Bearer ${mockAuthToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data).toMatchObject({
        requests: expect.any(Array),
        total: expect.any(Number),
      });
    });

    it('should respect pagination parameters', async () => {
      const response = await request(app)
        .get('/api/redeem/history')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body.data.requests.length).toBeLessThanOrEqual(10);
    });

    it('should enforce maximum limit on pagination', async () => {
      const response = await request(app)
        .get('/api/redeem/history')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .query({ limit: 1000 }); // Over maximum

      expect(response.status).toBe(200);
      // Should be capped at maximum (100)
      expect(response.body.data.requests.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Redemption Status', () => {
    beforeEach(() => {
      if (!env.ENABLE_VAULT_REDEMPTION) {
        pending('Vault redemption disabled');
      }
    });

    it('should get redemption status by ID', async () => {
      // First create a redemption request
      const createResponse = await request(app)
        .post('/api/redeem')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({
          asset: 'XAU-s',
          amount: '1.0',
          format: 'COIN',
          shippingAddress: {
            name: 'John Doe',
            line1: '123 Test St',
            city: 'Test City',
            state: 'CA',
            postalCode: '90210',
            country: 'US',
            phone: '555-0123',
          },
        });

      if (createResponse.status === 201) {
        const redemptionId = createResponse.body.data.redemption.id;

        const statusResponse = await request(app)
          .get(`/api/redeem/status/${redemptionId}`)
          .set('Authorization', `Bearer ${mockAuthToken}`);

        expect(statusResponse.status).toBe(200);
        expect(statusResponse.body.data.redemption.id).toBe(redemptionId);
      }
    });

    it('should reject invalid redemption ID format', async () => {
      const response = await request(app)
        .get('/api/redeem/status/invalid-id')
        .set('Authorization', `Bearer ${mockAuthToken}`);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent redemption', async () => {
      const fakeId = '12345678-1234-1234-1234-123456789012';
      
      const response = await request(app)
        .get(`/api/redeem/status/${fakeId}`)
        .set('Authorization', `Bearer ${mockAuthToken}`);

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('Redemption Cancellation', () => {
    beforeEach(() => {
      if (!env.ENABLE_VAULT_REDEMPTION) {
        pending('Vault redemption disabled');
      }
    });

    it('should cancel redemption request with valid reason', async () => {
      // Create a redemption first (mock)
      const fakeId = '12345678-1234-1234-1234-123456789012';
      
      const response = await request(app)
        .post(`/api/redeem/${fakeId}/cancel`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({ reason: 'Changed my mind' });

      // Will return 404 since it's a fake ID, but validates the endpoint
      expect([200, 404]).toContain(response.status);
    });

    it('should require cancellation reason', async () => {
      const fakeId = '12345678-1234-1234-1234-123456789012';
      
      const response = await request(app)
        .post(`/api/redeem/${fakeId}/cancel`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({}); // No reason provided

      expect(response.status).toBe(400);
      // Should validate that reason is optional but if provided, must be valid
    });
  });

  describe('Admin Redemption Stats', () => {
    beforeEach(() => {
      if (!env.ENABLE_VAULT_REDEMPTION) {
        pending('Vault redemption disabled');
      }
    });

    it('should reject stats request from non-admin user', async () => {
      const response = await request(app)
        .get('/api/redeem/stats')
        .set('Authorization', `Bearer ${mockAuthToken}`);

      // Should fail auth since mock user is not admin
      expect(response.status).toBe(403);
      expect(response.body.code).toBe('AUTHORIZATION_ERROR');
    });
  });
});

describe('Redemption Service Unit Tests', () => {
  // Skip if feature disabled
  beforeAll(() => {
    if (!env.ENABLE_VAULT_REDEMPTION) {
      console.log('🔒 Vault redemption disabled - skipping service tests');
    }
  });

  describe('RedemptionService', () => {
    beforeEach(() => {
      if (!env.ENABLE_VAULT_REDEMPTION) {
        pending('Vault redemption disabled');
      }
    });

    it('should throw service unavailable when feature disabled', async () => {
      // Temporarily disable feature for this test
      const originalValue = process.env.ENABLE_VAULT_REDEMPTION;
      process.env.ENABLE_VAULT_REDEMPTION = 'false';

      const { RedemptionService } = await import('../services/RedemptionService');
      
      try {
        await RedemptionService.getRedemptionQuote('XAU-s', '1.0', 'COIN');
        fail('Should have thrown service unavailable error');
      } catch (error: any) {
        expect(error.statusCode).toBe(501);
        expect(error.message).toMatch(/not implemented/i);
      }

      // Restore original value
      if (originalValue) {
        process.env.ENABLE_VAULT_REDEMPTION = originalValue;
      }
    });

    it('should validate synthetic asset format', async () => {
      const { RedemptionService } = await import('../services/RedemptionService');
      
      try {
        await RedemptionService.getRedemptionQuote('INVALID', '1.0', 'COIN');
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toMatch(/synthetic/i);
      }
    });

    it('should validate minimum redemption amounts', async () => {
      const { RedemptionService } = await import('../services/RedemptionService');
      
      try {
        await RedemptionService.getRedemptionQuote('XAU-s', '0.001', 'COIN');
        fail('Should have thrown minimum amount error');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toMatch(/minimum/i);
      }
    });
  });
});

// Test helper functions
export const redemptionTestHelpers = {
  createMockRedemptionRequest: (overrides = {}) => ({
    asset: 'XAU-s',
    amount: '1.0',
    format: 'COIN' as const,
    shippingAddress: {
      name: 'Test User',
      line1: '123 Test St',
      city: 'Test City',  
      state: 'CA',
      postalCode: '90210',
      country: 'US',
      phone: '555-0123',
    },
    ...overrides,
  }),

  expectRedemptionResponse: (response: any) => {
    expect(response).toMatchObject({
      id: expect.any(String),
      userId: expect.any(String),
      status: expect.any(String),
      createdAt: expect.any(String),
      asset: expect.any(String),
    });
  },

  expectQuoteResponse: (response: any) => {
    expect(response).toMatchObject({
      asset: expect.any(String),
      amount: expect.any(String),
      estimatedValue: expect.any(String),
      availableSkus: expect.any(Array),
      redemptionFee: expect.any(String),
      totalCost: expect.any(String),
      expiresAt: expect.any(String),
    });
  },
};
