import { jest, describe, it, expect, beforeEach } from '@jest/globals';
// Explicitly mock auth middleware for this test to ensure mock tokens are honored
jest.mock('../../../src/middlewares/authMiddleware', () => {
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers?.authorization?.replace('Bearer ', '');
    const users: Record<string, any> = {
      'mock-admin-jwt-token': { id: 'admin-user-id', email: 'admin@pbcex.com', role: 'ADMIN', kycStatus: 'APPROVED' },
      'mock-user-jwt-token': { id: 'regular-user-id', email: 'user@example.com', role: 'USER', kycStatus: 'APPROVED' },
    };
    const user = token ? users[token] : undefined;
    if (user) {
      (req as any).user = user;
      next();
    } else {
      res.status(401).json({ code: 'AUTHENTICATION_ERROR', message: 'Authentication required' });
    }
  };
  const requireAdmin = (req: any, res: any, next: any) => {
    const user = (req as any).user;
    if (user?.role === 'ADMIN') {
      next();
    } else {
      res.status(403).json({ code: 'AUTHORIZATION_ERROR', message: 'Admin access required', userRole: user?.role });
    }
  };
  return { __esModule: true, authenticate, requireAdmin };
});
jest.mock('@/middlewares/authMiddleware', () => {
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers?.authorization?.replace('Bearer ', '');
    const users: Record<string, any> = {
      'mock-admin-jwt-token': { id: 'admin-user-id', email: 'admin@pbcex.com', role: 'ADMIN', kycStatus: 'APPROVED' },
      'mock-user-jwt-token': { id: 'regular-user-id', email: 'user@example.com', role: 'USER', kycStatus: 'APPROVED' },
    };
    const user = token ? users[token] : undefined;
    if (user) {
      (req as any).user = user;
      next();
    } else {
      res.status(401).json({ code: 'AUTHENTICATION_ERROR', message: 'Authentication required' });
    }
  };
  const requireAdmin = (req: any, res: any, next: any) => {
    const user = (req as any).user;
    if (user?.role === 'ADMIN') {
      next();
    } else {
      res.status(403).json({ code: 'AUTHORIZATION_ERROR', message: 'Admin access required', userRole: user?.role });
    }
  };
  return { __esModule: true, authenticate, requireAdmin };
});
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
    // No DB cleanup needed for these auth/permission checks; use mock tokens
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
