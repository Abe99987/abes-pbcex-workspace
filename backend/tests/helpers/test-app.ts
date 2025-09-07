/**
 * Test App Helper
 * Provides the Express app instance for integration tests
 */

// Ensure auth middleware is mocked within this helper so tokens used in tests work reliably
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

const buildAuthMock = () => {
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers?.authorization?.replace('Bearer ', '');

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

    const found = token ? mockUsers[token] : undefined;
    if (found) {
      (req as any).user = found;
      next();
      return;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string, {
          audience: 'pbcex-users',
          issuer: 'pbcex-api',
          algorithms: ['HS256'],
        }) as any;
        (req as any).user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          kycStatus: decoded.kycStatus ?? 'APPROVED',
        };
        next();
        return;
      } catch {
        // fall through
      }
    }

    res.status(401).json({
      code: 'AUTHENTICATION_ERROR',
      message: 'Authentication required',
    });
  };

  const requireKyc = (allowedStatuses: string[] = ['APPROVED']) => {
    return (req: any, res: any, next: any) => {
      const user = (req as any).user;
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
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    const user = (req as any).user;
    if (user?.role === 'ADMIN') {
      next();
    } else {
      res.status(403).json({
        code: 'AUTHORIZATION_ERROR',
        message: 'Admin access required',
        userRole: user?.role,
      });
    }
  };

  const authorize = (requiredRole: any) => {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return (req: any, res: any, next: any) => {
      const user = (req as any).user;
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
  };

  return {
    __esModule: true,
    authenticate,
    requireKyc,
    requireAdmin,
    authorize,
    // Token helpers for controllers that call generateToken/refresh
    generateToken: () => 'mock-user-jwt-token',
    generateRefreshToken: () => 'mock-refresh-token',
  };
};

jest.mock('../../src/middlewares/authMiddleware', () => buildAuthMock());
jest.mock('@/middlewares/authMiddleware', () => buildAuthMock());

import app from '../../src/server';

// Note: Auth middleware is already mocked in __tests__/setup.ts
// The mock expects these specific token formats:
// - 'mock-admin-jwt-token' for admin users
// - 'mock-user-jwt-token' for regular users
// - 'mock-support-jwt-token' for support users
// - 'mock-teller-jwt-token' for teller users

export { app };

// Re-export for convenience
export default app;
