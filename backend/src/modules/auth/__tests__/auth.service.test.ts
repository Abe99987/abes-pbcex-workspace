import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { AuthService, JWTPayload } from '../auth.service';

// Mock dependencies
jest.mock('@/config/env');
jest.mock('@/utils/logger');

describe('AuthService', () => {
  const mockSecret = 'test-secret-32-characters-long-key';
  const validPayload: JWTPayload = {
    sub: 'user123',
    email: 'admin@pbcex.com',
    roles: ['admin'],
    attributes: { org_id: 'org1', clearance_level: 'l3' },
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    aud: 'pbcex-api',
    iss: 'pbcex.com',
  };

  // Mock env module
  require('@/config/env').env = {
    JWT_SECRET: mockSecret,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear step-up sessions
    (AuthService as any).stepUpSessions?.clear();
  });

  describe('verifyToken', () => {
    it('should verify valid token and return user', async () => {
      const token = jwt.sign(validPayload, mockSecret);

      const user = await AuthService.verifyToken(token);

      expect(user).toEqual({
        id: 'user123',
        email: 'admin@pbcex.com',
        roles: ['admin'],
        attributes: { org_id: 'org1', clearance_level: 'l3' },
      });
    });

    it('should throw error for token missing required claims', async () => {
      const invalidPayload = { ...validPayload };
      delete (invalidPayload as any).sub;
      const token = jwt.sign(invalidPayload, mockSecret);

      await expect(AuthService.verifyToken(token)).rejects.toThrow(
        'Invalid token: missing required claims'
      );
    });

    it('should throw error for token with invalid roles', async () => {
      const invalidPayload = { ...validPayload, roles: 'not-array' };
      const token = jwt.sign(invalidPayload, mockSecret);

      await expect(AuthService.verifyToken(token)).rejects.toThrow(
        'Invalid token: invalid roles claim'
      );
    });

    it('should throw error for expired token', async () => {
      const expiredPayload = { ...validPayload, exp: Math.floor(Date.now() / 1000) - 3600 };
      const token = jwt.sign(expiredPayload, mockSecret);

      await expect(AuthService.verifyToken(token)).rejects.toThrow(
        'Token expired'
      );
    });

    it('should throw error for invalid signature', async () => {
      const token = jwt.sign(validPayload, 'wrong-secret');

      await expect(AuthService.verifyToken(token)).rejects.toThrow(
        'Invalid token'
      );
    });
  });

  describe('validateAudienceAndIssuer', () => {
    it('should return true for valid audience and issuer', () => {
      const token = jwt.sign(validPayload, mockSecret);

      const result = AuthService.validateAudienceAndIssuer(token);

      expect(result).toBe(true);
    });

    it('should return false for invalid audience', () => {
      const invalidPayload = { ...validPayload, aud: 'wrong-audience' };
      const token = jwt.sign(invalidPayload, mockSecret);

      const result = AuthService.validateAudienceAndIssuer(token);

      expect(result).toBe(false);
    });

    it('should return false for invalid issuer', () => {
      const invalidPayload = { ...validPayload, iss: 'wrong-issuer' };
      const token = jwt.sign(invalidPayload, mockSecret);

      const result = AuthService.validateAudienceAndIssuer(token);

      expect(result).toBe(false);
    });

    it('should return false for malformed token', () => {
      const result = AuthService.validateAudienceAndIssuer('invalid-token');

      expect(result).toBe(false);
    });
  });

  describe('hasRequiredClaims', () => {
    it('should return true when all required claims present', () => {
      const token = jwt.sign(validPayload, mockSecret);

      const result = AuthService.hasRequiredClaims(token, ['sub', 'email', 'roles']);

      expect(result).toBe(true);
    });

    it('should return false when required claim missing', () => {
      const incompletePayload = { ...validPayload };
      delete (incompletePayload as any).email;
      const token = jwt.sign(incompletePayload, mockSecret);

      const result = AuthService.hasRequiredClaims(token, ['sub', 'email', 'roles']);

      expect(result).toBe(false);
    });

    it('should return false for invalid token', () => {
      const result = AuthService.hasRequiredClaims('invalid-token', ['sub']);

      expect(result).toBe(false);
    });

    it('should validate roles as array', () => {
      const invalidRolesPayload = { ...validPayload, roles: 'not-array' };
      const token = jwt.sign(invalidRolesPayload, mockSecret);

      const result = AuthService.hasRequiredClaims(token, ['roles']);

      expect(result).toBe(false);
    });
  });

  describe('Step-up Authentication', () => {
    it('should initiate step-up and return session ID', async () => {
      const context = {
        userId: 'user123',
        action: 'hedge:write',
        resource: 'hedging',
        timestamp: new Date(),
        deviceId: 'device1',
        ipAddress: '127.0.0.1',
      };

      const stepUpId = await AuthService.initiateStepUp(context);

      expect(stepUpId).toMatch(/^stepup_/);
      expect(AuthService.getStepUpContext(stepUpId)).toBeDefined();
    });

    it('should verify valid step-up session', async () => {
      const context = {
        userId: 'user123',
        action: 'hedge:write',
        resource: 'hedging',
        timestamp: new Date(),
      };

      const stepUpId = await AuthService.initiateStepUp(context);
      const isValid = await AuthService.verifyStepUp(stepUpId, 'user123');

      expect(isValid).toBe(true);
    });

    it('should reject step-up for wrong user', async () => {
      const context = {
        userId: 'user123',
        action: 'hedge:write',
        resource: 'hedging',
        timestamp: new Date(),
      };

      const stepUpId = await AuthService.initiateStepUp(context);
      const isValid = await AuthService.verifyStepUp(stepUpId, 'user456');

      expect(isValid).toBe(false);
    });

    it('should reject expired step-up session', async () => {
      const context = {
        userId: 'user123',
        action: 'hedge:write',
        resource: 'hedging',
        timestamp: new Date(Date.now() - 400000), // 6+ minutes ago
      };

      const stepUpId = await AuthService.initiateStepUp(context);
      
      // Manually set old timestamp to simulate expiration
      const stepUpSessions = (AuthService as any).stepUpSessions;
      stepUpSessions.set(stepUpId, context);

      const isValid = await AuthService.verifyStepUp(stepUpId, 'user123');

      expect(isValid).toBe(false);
    });

    it('should clear step-up session', async () => {
      const context = {
        userId: 'user123',
        action: 'hedge:write',
        resource: 'hedging',
        timestamp: new Date(),
      };

      const stepUpId = await AuthService.initiateStepUp(context);
      AuthService.clearStepUp(stepUpId);

      expect(AuthService.getStepUpContext(stepUpId)).toBeUndefined();
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should cleanup expired sessions', () => {
      // Add some mock sessions
      const stepUpSessions = (AuthService as any).stepUpSessions;
      stepUpSessions.set('expired1', {
        userId: 'user1',
        timestamp: new Date(Date.now() - 400000), // Expired
      });
      stepUpSessions.set('active1', {
        userId: 'user2',
        timestamp: new Date(), // Active
      });

      const cleaned = AuthService.cleanupExpiredSessions();

      expect(cleaned).toBe(1);
      expect(stepUpSessions.size).toBe(1);
      expect(stepUpSessions.has('active1')).toBe(true);
    });
  });
});
