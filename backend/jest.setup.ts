/**
 * Jest Setup File
 * Ensures Jest types and globals are properly loaded
 */

// Mock auth middleware for integration tests
jest.mock('./src/middlewares/authMiddleware', () => {
  const authenticate = jest.fn((req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

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
      req.user = found;
      next();
    } else {
      res.status(401).json({
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication required',
      });
    }
  });

  const requireKyc = jest.fn((allowedStatuses: string[] = ['APPROVED']) => {
    return (req: any, res: any, next: any) => {
      const user = req.user;
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
  });

  const requireAdmin = jest.fn((req: any, res: any, next: any) => {
    const user = req.user;
    if (user?.role === 'ADMIN') {
      next();
    } else {
      res.status(403).json({
        code: 'AUTHORIZATION_ERROR',
        message: 'Admin access required',
        userRole: user?.role,
      });
    }
  });

  const authorize = jest.fn((requiredRole: string | string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.user) {
        res.status(401).json({
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication required',
        });
        return;
      }

      // Admin can access everything
      if (req.user.role === 'ADMIN') {
        next();
        return;
      }

      // Check if user role matches required role(s)
      const requiredRoles = Array.isArray(requiredRole)
        ? requiredRole
        : [requiredRole];
      if (!requiredRoles.includes(req.user.role)) {
        res.status(403).json({
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions',
          requiredRoles,
          userRole: req.user.role,
        });
        return;
      }

      next();
    };
  });

  return {
    authenticate,
    requireKyc,
    requireAdmin,
    authorize,
  };
});

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toMatchBalanceFormat(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeValidUUID(received: any) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = typeof received === 'string' && uuidRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },

  toMatchBalanceFormat(received: any) {
    const balanceRegex = /^\d+\.\d{1,8}$/;
    const pass = typeof received === 'string' && balanceRegex.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to match balance format`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to match balance format (0.00000000)`,
        pass: false,
      };
    }
  },
});

// Test timeout configuration
jest.setTimeout(30000);

export {};
