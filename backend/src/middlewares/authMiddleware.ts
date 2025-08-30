import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { USER_ROLES, API_CODES } from '@/utils/constants';
import { logError, logWarn } from '@/utils/logger';

// Extend Express Request type to include user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        kycStatus: string;
      };
    }
  }
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  kycStatus: string;
  iat: number;
  exp: number;
}

/**
 * Extract JWT token from Authorization header
 */
function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Verify JWT token and extract user information
 */
function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logWarn('Invalid JWT token', { error: error.message });
    } else if (error instanceof jwt.TokenExpiredError) {
      logWarn('JWT token expired', { error: error.message });
    } else {
      logError('JWT verification error', error as Error);
    }
    return null;
  }
}

/**
 * Authentication middleware - validates JWT token
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // DEV_FAKE_LOGIN: Bypass authentication in development mode
  if (env.NODE_ENV === 'development' && process.env.DEV_FAKE_LOGIN === 'true') {
    // Use a fake dev user for development
    req.user = {
      id: 'dev-user-id', // This should match the seeded user ID
      email: 'dev@local.test',
      role: USER_ROLES.USER,
      kycStatus: 'APPROVED',
    };
    next();
    return;
  }

  const token = extractToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({
      code: API_CODES.AUTHENTICATION_ERROR,
      message: 'Authentication token required',
    });
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({
      code: API_CODES.AUTHENTICATION_ERROR,
      message: 'Invalid or expired token',
    });
    return;
  }

  // Attach user information to request
  req.user = {
    id: payload.userId,
    email: payload.email,
    role: payload.role,
    kycStatus: payload.kycStatus,
  };

  next();
}

/**
 * Optional authentication middleware - validates token if present
 */
export function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req.headers.authorization);

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        kycStatus: payload.kycStatus,
      };
    }
  }

  next();
}

/**
 * Authorization middleware - checks user role
 */
export function authorize(requiredRole: string | string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        code: API_CODES.AUTHENTICATION_ERROR,
        message: 'Authentication required',
      });
      return;
    }

    // Admin can access everything
    if (req.user.role === USER_ROLES.ADMIN) {
      next();
      return;
    }

    // Check if user role matches required role(s)
    const requiredRoles = Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole];
    if (!requiredRoles.includes(req.user.role)) {
      res.status(403).json({
        code: API_CODES.AUTHORIZATION_ERROR,
        message: 'Insufficient permissions',
        requiredRoles,
        userRole: req.user.role,
      });
      return;
    }

    next();
  };
}

/**
 * KYC status middleware - checks if user has completed KYC
 */
export function requireKyc(allowedStatuses: string[] = ['APPROVED']) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        code: API_CODES.AUTHENTICATION_ERROR,
        message: 'Authentication required',
      });
      return;
    }

    // Admin bypass
    if (req.user.role === USER_ROLES.ADMIN) {
      next();
      return;
    }

    if (!allowedStatuses.includes(req.user.kycStatus)) {
      res.status(403).json({
        code: API_CODES.AUTHORIZATION_ERROR,
        message: 'KYC verification required',
        kycStatus: req.user.kycStatus,
        requiredStatuses: allowedStatuses,
      });
      return;
    }

    next();
  };
}

/**
 * Admin-only middleware
 */
export const requireAdmin = authorize(USER_ROLES.ADMIN);

/**
 * Generate JWT token for user
 */
export function generateToken(user: {
  id: string;
  email: string;
  role: string;
  kycStatus: string;
}): string {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    role: user.role,
    kycStatus: user.kycStatus,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'pbcex-api',
    audience: 'pbcex-users',
  });
}

/**
 * Generate refresh token (longer lived, for token refresh)
 */
export function generateRefreshToken(userId: string): string {
  const payload = {
    userId,
    type: 'refresh',
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '30d',
    issuer: 'pbcex-api',
    audience: 'pbcex-refresh',
  });
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;

    if (decoded.type !== 'refresh') {
      logWarn('Invalid refresh token type', { type: decoded.type });
      return null;
    }

    return { userId: decoded.userId };
  } catch (error) {
    logError('Refresh token verification error', error as Error);
    return null;
  }
}

/**
 * Rate limiting helper for sensitive operations
 */
export function createRateLimitKey(req: Request, operation: string): string {
  const identifier = req.user?.id || req.ip || 'anonymous';
  return `rate_limit:${operation}:${identifier}`;
}

/**
 * Check if user owns resource (for user-specific endpoints)
 */
export function requireOwnership(getUserId: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        code: API_CODES.AUTHENTICATION_ERROR,
        message: 'Authentication required',
      });
      return;
    }

    // Admin can access any resource
    if (req.user.role === USER_ROLES.ADMIN) {
      next();
      return;
    }

    const resourceUserId = getUserId(req);
    if (req.user.id !== resourceUserId) {
      res.status(403).json({
        code: API_CODES.AUTHORIZATION_ERROR,
        message: 'Access denied',
      });
      return;
    }

    next();
  };
}
