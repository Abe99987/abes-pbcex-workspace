import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../../helpers/test-app';

/**
 * Admin API Integration Tests
 * Tests administrative operations requiring ADMIN role
 */

describe('Admin API', () => {
  let adminToken: string;
  let regularUserToken: string;

  beforeEach(() => {
    // No DB cleanup needed for these auth/permission checks
    adminToken = 'mock-admin-jwt-token';
    regularUserToken = 'mock-user-jwt-token';
  });

  describe('GET /api/admin/dashboard', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .expect(401);

      expect(response.body.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should require ADMIN role', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      expect(response.body.code).toBe('AUTHORIZATION_ERROR');
    });
  });

  describe('GET /api/admin/users', () => {
    it('should require ADMIN role', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      expect(response.body.code).toBe('AUTHORIZATION_ERROR');
    });
  });

  describe('GET /api/admin/system/health', () => {
    it('should require ADMIN role', async () => {
      const response = await request(app)
        .get('/api/admin/system/health')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      expect(response.body.code).toBe('AUTHORIZATION_ERROR');
    });
  });
});
