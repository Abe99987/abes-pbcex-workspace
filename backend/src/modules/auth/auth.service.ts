import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { logError, logInfo } from '@/utils/logger';
import { createError } from '@/middlewares/errorMiddleware';

export interface JWTPayload {
  sub: string; // user ID
  email: string;
  roles: string[];
  attributes: Record<string, any>;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
  attributes: Record<string, any>;
}

export interface StepUpContext {
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  deviceId?: string;
  ipAddress?: string;
}

/**
 * Admin Terminal Authentication Service
 * Handles JWT verification, step-up authentication, and user context
 */
export class AuthService {
  private static readonly JWT_ALGORITHM = 'HS256';
  private static stepUpSessions = new Map<string, StepUpContext>();

  /**
   * Verify JWT token and extract user information
   */
  static async verifyToken(token: string): Promise<AuthUser> {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET, {
        algorithms: [AuthService.JWT_ALGORITHM],
        audience: 'pbcex-api',
        issuer: 'pbcex.com',
      }) as JWTPayload;

      // Validate required claims
      if (!payload.sub || !payload.email || !payload.roles) {
        throw createError.authentication('Invalid token: missing required claims');
      }

      // Validate roles format
      if (!Array.isArray(payload.roles) || payload.roles.length === 0) {
        throw createError.authentication('Invalid token: invalid roles claim');
      }

      return {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles,
        attributes: payload.attributes || {},
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw createError.authentication('Token expired');
      }
      if (error instanceof jwt.NotBeforeError) {
        throw createError.authentication('Token not active');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        logError('JWT verification failed', error);
        throw createError.authentication('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Validate JWT audience and issuer
   */
  static validateAudienceAndIssuer(token: string): boolean {
    try {
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || typeof decoded === 'string') {
        return false;
      }

      const payload = decoded.payload as JWTPayload;
      return payload.aud === 'pbcex-api' && payload.iss === 'pbcex.com';
    } catch {
      return false;
    }
  }

  /**
   * Check if token contains required claims
   */
  static hasRequiredClaims(token: string, requiredClaims: string[]): boolean {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (!decoded) return false;

      return requiredClaims.every(claim => {
        switch (claim) {
          case 'sub':
            return !!decoded.sub;
          case 'email':
            return !!decoded.email;
          case 'roles':
            return Array.isArray(decoded.roles) && decoded.roles.length > 0;
          case 'attributes':
            return typeof decoded.attributes === 'object';
          default:
            return !!decoded[claim as keyof JWTPayload];
        }
      });
    } catch {
      return false;
    }
  }

  /**
   * Initiate step-up authentication for sensitive operations
   */
  static async initiateStepUp(context: StepUpContext): Promise<string> {
    const stepUpId = `stepup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store step-up context with expiration
    AuthService.stepUpSessions.set(stepUpId, {
      ...context,
      timestamp: new Date(),
    });

    // Clean up expired sessions
    setTimeout(() => {
      AuthService.stepUpSessions.delete(stepUpId);
    }, 300000); // 5 minutes

    logInfo('Step-up authentication initiated', {
      stepUpId,
      userId: context.userId,
      action: context.action,
      resource: context.resource,
    });

    return stepUpId;
  }

  /**
   * Verify step-up authentication completion
   */
  static async verifyStepUp(stepUpId: string, userId: string): Promise<boolean> {
    const context = AuthService.stepUpSessions.get(stepUpId);
    
    if (!context) {
      logError('Step-up session not found', { stepUpId, userId });
      return false;
    }

    if (context.userId !== userId) {
      logError('Step-up user mismatch', { 
        stepUpId, 
        expectedUserId: context.userId, 
        providedUserId: userId 
      });
      return false;
    }

    // Check if step-up is still valid (within 5 minutes)
    const now = new Date();
    const elapsed = now.getTime() - context.timestamp.getTime();
    if (elapsed > 300000) { // 5 minutes
      logError('Step-up session expired', { stepUpId, userId, elapsed });
      AuthService.stepUpSessions.delete(stepUpId);
      return false;
    }

    logInfo('Step-up authentication verified', { stepUpId, userId });
    return true;
  }

  /**
   * Clear step-up session after successful verification
   */
  static clearStepUp(stepUpId: string): void {
    AuthService.stepUpSessions.delete(stepUpId);
    logInfo('Step-up session cleared', { stepUpId });
  }

  /**
   * Get step-up context for audit logging
   */
  static getStepUpContext(stepUpId: string): StepUpContext | undefined {
    return AuthService.stepUpSessions.get(stepUpId);
  }

  /**
   * List active devices for a user (placeholder for future device tracking)
   */
  static async getUserDevices(userId: string): Promise<Array<{
    deviceId: string;
    lastSeen: Date;
    deviceType: string;
    ipAddress: string;
  }>> {
    // TODO: Implement device tracking when database is ready
    logInfo('Device list requested', { userId });
    
    return [
      {
        deviceId: 'device_placeholder_1',
        lastSeen: new Date(),
        deviceType: 'desktop',
        ipAddress: '127.0.0.1',
      },
    ];
  }

  /**
   * Cleanup expired step-up sessions (housekeeping)
   */
  static cleanupExpiredSessions(): number {
    const now = new Date();
    let cleaned = 0;

    for (const [sessionId, context] of AuthService.stepUpSessions.entries()) {
      const elapsed = now.getTime() - context.timestamp.getTime();
      if (elapsed > 300000) { // 5 minutes
        AuthService.stepUpSessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logInfo('Cleaned up expired step-up sessions', { count: cleaned });
    }

    return cleaned;
  }
}
