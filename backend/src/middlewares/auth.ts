import { Request, Response, NextFunction } from 'express';
import { AppError, createError } from '@/middlewares/errorMiddleware';
import { logError, logInfo } from '@/utils/logger';
import { FeatureFlagsService } from '@/services/FeatureFlagsService';

export type AuthenticatedRequest = Request<any, any, any, any> & {
  user?: {
    id: string;
    email: string;
    role: string;
    kycStatus: string;
    twoFactorEnabled: boolean;
    accountNumber?: string;
  };
};

/**
 * Middleware to require authentication
 */
export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = createError.authentication('Authentication required');
    return next(error);
  }

  const token = authHeader.substring(7);

  // TODO: Implement actual JWT verification with Supabase
  // For now, use a placeholder implementation
  Promise.resolve().then(async () => {
    try {
      const user = await verifyJWTToken(token);

      if (!user) {
        const error = createError.authentication('Invalid or expired token');
        return next(error);
      }

      req.user = user;
      logInfo('User authenticated', { userId: user.id, email: user.email });

      next();
    } catch (error) {
      logError('Authentication failed', error as Error);
      next(error);
    }
  });
};

/**
 * Middleware to require specific KYC tier
 */
export const requireKycTier = (requiredTier: 'tier1' | 'tier2') => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      const error = createError.authentication('Authentication required');
      return next(error);
    }

    const userStatus = req.user.kycStatus;
    const statusLevels = {
      NOT_STARTED: 0,
      IN_PROGRESS: 0,
      PENDING_REVIEW: 0,
      APPROVED: 1,
      REJECTED: 0,
      EXPIRED: 0,
    };

    const requiredLevel = requiredTier === 'tier1' ? 1 : 2;
    const userLevel =
      statusLevels[userStatus as keyof typeof statusLevels] || 0;

    if (userLevel < requiredLevel) {
      const error = createError.forbidden(
        `KYC tier ${requiredTier} required. Current status: ${userStatus}`
      );
      return next(error);
    }

    logInfo('KYC tier check passed', {
      userId: req.user.id,
      requiredTier,
      userStatus,
    });

    next();
  };
};

/**
 * Middleware to require 2FA (optional per operation)
 */
export const require2FA = (operation?: string) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      const error = createError.authentication('Authentication required');
      return next(error);
    }

    // Check if 2FA is enabled globally
    if (!FeatureFlagsService.isFeatureEnabled('security.twoFactorAuth')) {
      logInfo('2FA check skipped - feature disabled', {
        userId: req.user.id,
        operation,
      });
      return next();
    }

    // Check if user has 2FA enabled
    if (!req.user.twoFactorEnabled) {
      const error = createError.forbidden(
        'Two-factor authentication required for this operation'
      );
      return next(error);
    }

    // TODO: Implement actual 2FA verification
    // For now, just check if 2FA code is provided in headers
    const twoFactorCode = req.headers['x-2fa-code'] as string;

    if (!twoFactorCode) {
      const error = createError.forbidden(
        'Two-factor authentication code required'
      );
      return next(error);
    }

    // TODO: Verify 2FA code
    // const isValid = await verify2FACode(req.user.id, twoFactorCode);
    // if (!isValid) {
    //   throw createError.forbidden('Invalid two-factor authentication code');
    // }

    logInfo('2FA check passed', {
      userId: req.user.id,
      operation,
    });

    next();
  };
};

/**
 * Middleware to check feature flags
 */
export const requireFeature = (featurePath: string) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!FeatureFlagsService.isFeatureEnabled(featurePath)) {
      const error = createError.forbidden(
        `Feature ${featurePath} is not enabled`
      );
      return next(error);
    }

    logInfo('Feature check passed', {
      userId: req.user?.id,
      featurePath,
    });

    next();
  };
};

/**
 * Middleware to require money movement features
 */
export const requireMoneyMovement = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!FeatureFlagsService.isMoneyMovementEnabled()) {
    const error = createError.forbidden(
      'Money movement features are not enabled'
    );
    return next(error);
  }

  logInfo('Money movement feature check passed', {
    userId: req.user?.id,
  });

  next();
};

/**
 * Middleware to require DCA features
 */
export const requireDCA = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!FeatureFlagsService.isDCAEnabled()) {
    const error = createError.forbidden('DCA features are not enabled');
    return next(error);
  }

  logInfo('DCA feature check passed', {
    userId: req.user?.id,
  });

  next();
};

/**
 * Placeholder JWT verification function
 * TODO: Implement actual Supabase JWT verification
 */
async function verifyJWTToken(
  token: string
): Promise<AuthenticatedRequest['user'] | null> {
  try {
    // TODO: Replace with actual Supabase JWT verification
    // const { data: { user }, error } = await supabase.auth.getUser(token);
    // if (error || !user) return null;

    // For now, return a mock user for development
    if (token === 'mock-token') {
      return {
        id: 'mock-user-id',
        email: 'mock@example.com',
        role: 'USER',
        kycStatus: 'APPROVED',
        twoFactorEnabled: false,
        accountNumber: '1234567890',
      };
    }

    // TODO: Implement actual token verification
    // This is a placeholder that should be replaced with real Supabase integration
    return null;
  } catch (error) {
    logError('JWT verification failed', error as Error);
    return null;
  }
}

/**
 * Placeholder 2FA verification function
 * TODO: Implement actual 2FA verification
 */
async function verify2FACode(userId: string, code: string): Promise<boolean> {
  try {
    // TODO: Implement actual 2FA verification
    // This is a placeholder that should be replaced with real 2FA integration
    return code === '123456'; // Mock code for development
  } catch (error) {
    logError('2FA verification failed', error as Error);
    return false;
  }
}
