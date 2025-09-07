// Jest setup for Admin Terminal backend tests

// Set up test environment variables to prevent env validation errors
process.env.SKIP_ENV_VALIDATION = 'true';

// Set minimal required env vars for tests
process.env.NODE_ENV = 'test';
process.env.DEV_FAKE_LOGIN = 'true';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.SESSION_SECRET = 'test-session-secret-32-characters-long';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters-long';

export {};

// Ensure auth middleware is mocked for all tests so mock tokens work DB-less
// This mirrors the mocks defined in src/__tests__/setup.ts but applies globally
// to avoid ordering issues between test files.
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

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

    // Fallback: accept real signed JWTs used by tests/helpers/auth.generateToken
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
        // fall through to 401 below
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
    generateToken: (user: { id: string; email: string; role: string; kycStatus: string }) => {
      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        kycStatus: user.kycStatus,
      } as const;
      return jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: '1h',
        issuer: 'pbcex-api',
        audience: 'pbcex-users',
      });
    },
    generateRefreshToken: (userId: string) => {
      const payload = { userId, type: 'refresh' } as const;
      return jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: '30d',
        issuer: 'pbcex-api',
        audience: 'pbcex-refresh',
      });
    },
  };
};

// Mock via alias path used throughout src
jest.mock('@/middlewares/authMiddleware', () => buildAuthMock());
// Also mock via direct relative path to ensure resolution matches in all cases
jest.mock('./src/middlewares/authMiddleware', () => buildAuthMock());
