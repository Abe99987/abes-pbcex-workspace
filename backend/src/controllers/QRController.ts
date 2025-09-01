import { Request, Response } from 'express';
import { asyncHandler, asyncHandlerAuth } from '@/utils/asyncHandler';
import { createError } from '@/middlewares/errorMiddleware';
import { logError, logInfo } from '@/utils/logger';
import { AuthenticatedRequest } from '@/middlewares/auth';
import { idempotencyMiddleware } from '@/middlewares/idempotency';
import { rateLimitMiddleware } from '@/middlewares/rateLimit';
import {
  requireAuth,
  requireMoneyMovement,
  requireFeature,
} from '@/middlewares/auth';
import { QRService } from '@/services/QRService';
import { ValidationService } from '@/services/ValidationService';
import { AuditService } from '@/services/AuditService';
import { qrTokenSchema } from '@/models/MoneyMovement';

export class QRController {
  /**
   * Create QR pay token
   * POST /api/qr/pay
   */
  static createPayToken = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const validation = qrTokenSchema.safeParse(req.body);

        if (!validation.success) {
          throw createError.validation(
            'Invalid request body',
            validation.error.errors
          );
        }

        const qrData = validation.data;

        // Validate QR token data
        const validationResult = ValidationService.validateQRToken(
          qrData.asset,
          qrData.amount,
          qrData.memo
        );

        if (!validationResult.valid) {
          throw createError.validation(
            (validationResult as any).message || 'QR token validation failed'
          );
        }

        // Create the QR pay token
        const qrToken = await QRService.createPayToken(userId, qrData);

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'qr_pay_token_created',
          resourceType: 'qr_token',
          resourceId: qrToken.token,
          changes: {
            direction: 'pay',
            asset: qrData.asset,
            amount: qrData.amount,
            memo: qrData.memo,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('QR pay token created', {
          userId,
          token: qrToken.token,
          asset: qrData.asset,
          amount: qrData.amount,
        });

        res.status(201).json({
          success: true,
          data: qrToken,
        });
      } catch (error) {
        logError('Failed to create QR pay token', {
          error: error as Error,
          userId: req.user?.id,
          body: req.body,
        });
        throw error;
      }
    }
  );

  /**
   * Create QR receive token
   * POST /api/qr/receive
   */
  static createReceiveToken = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const validation = qrTokenSchema.safeParse(req.body);

        if (!validation.success) {
          throw createError.validation(
            'Invalid request body',
            validation.error.errors
          );
        }

        const qrData = validation.data;

        // Validate QR token data
        const validationResult = ValidationService.validateQRToken(
          qrData.asset,
          qrData.amount,
          qrData.memo
        );

        if (!validationResult.valid) {
          throw createError.validation(
            (validationResult as any).message || 'QR token validation failed'
          );
        }

        // Create the QR receive token
        const qrToken = await QRService.createReceiveToken(userId, qrData);

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'qr_receive_token_created',
          resourceType: 'qr_token',
          resourceId: qrToken.token,
          changes: {
            direction: 'receive',
            asset: qrData.asset,
            amount: qrData.amount,
            memo: qrData.memo,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('QR receive token created', {
          userId,
          token: qrToken.token,
          asset: qrData.asset,
          amount: qrData.amount,
        });

        res.status(201).json({
          success: true,
          data: qrToken,
        });
      } catch (error) {
        logError('Failed to create QR receive token', {
          error: error as Error,
          userId: req.user?.id,
          body: req.body,
        });
        throw error;
      }
    }
  );

  /**
   * Get QR token (public endpoint)
   * GET /api/qr/:token
   */
  static getQRToken = asyncHandler(async (req: Request, res: Response) => {
    try {
      const token = req.params.token;

      if (!token) {
        throw createError.validation('Token is required');
      }

      // Get the QR token (this returns sanitized data for public access)
      const qrToken = await QRService.getQRToken(token);

      if (!qrToken) {
        throw createError.notFound('QR token not found or expired');
      }

      res.json({
        success: true,
        data: qrToken,
      });
    } catch (error) {
      logError('Failed to get QR token', {
        error: error as Error,
        token: req.params.token,
      });
      throw error;
    }
  });

  /**
   * Mark QR token as used
   * POST /api/qr/:token/use
   */
  static useQRToken = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const token = req.params.token;

        if (!token) {
          throw createError.validation('Token is required');
        }

        // Mark the token as used
        await QRService.markTokenUsed(token, userId);

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'qr_token_used',
          resourceType: 'qr_token',
          resourceId: token,
          changes: {
            usedByUserId: userId,
            usedAt: new Date().toISOString(),
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('QR token used', {
          userId,
          token,
        });

        res.json({
          success: true,
          data: {
            token,
            used: true,
            usedBy: userId,
          },
        });
      } catch (error) {
        logError('Failed to use QR token', {
          error: error as Error,
          userId: req.user?.id,
          token: req.params.token,
        });
        throw error;
      }
    }
  );

  /**
   * Get user's QR token history
   * GET /api/qr/history
   */
  static getQRHistory = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const direction = req.query.direction as string; // 'pay' | 'receive' | 'all'
        const status = req.query.status as string; // 'active' | 'used' | 'expired' | 'all'

        // TODO: Implement QR history retrieval
        // This would query the qr_tokens table for the user's tokens
        const history = {
          tokens: [],
          total: 0,
          limit,
          offset,
        };

        res.json({
          success: true,
          data: history,
        });
      } catch (error) {
        logError('Failed to get QR history', {
          error: error as Error,
          userId: req.user?.id,
          query: req.query,
        });
        throw error;
      }
    }
  );

  /**
   * Cancel QR token
   * POST /api/qr/:token/cancel
   */
  static cancelQRToken = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const token = req.params.token;

        if (!token) {
          throw createError.validation('Token is required');
        }

        // TODO: Implement QR token cancellation
        // This would mark the token as cancelled or expired
        const cancelled = true; // Placeholder

        if (!cancelled) {
          throw createError.validation(
            'QR token cannot be cancelled or not found'
          );
        }

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'qr_token_cancelled',
          resourceType: 'qr_token',
          resourceId: token,
          changes: {
            status: 'cancelled',
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('QR token cancelled', {
          userId,
          token,
        });

        res.json({
          success: true,
          data: {
            token,
            cancelled: true,
          },
        });
      } catch (error) {
        logError('Failed to cancel QR token', {
          error: error as Error,
          userId: req.user?.id,
          token: req.params.token,
        });
        throw error;
      }
    }
  );

  /**
   * Get QR token statistics
   * GET /api/qr/stats
   */
  static getQRStats = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;

        // TODO: Implement QR statistics
        // This would provide counts of created, used, expired tokens
        const stats = {
          totalCreated: 0,
          totalUsed: 0,
          totalExpired: 0,
          activeTokens: 0,
          payTokens: 0,
          receiveTokens: 0,
        };

        res.json({
          success: true,
          data: stats,
        });
      } catch (error) {
        logError('Failed to get QR stats', {
          error: error as Error,
          userId: req.user?.id,
        });
        throw error;
      }
    }
  );
}

// Export middleware chains for routes
export const qrMiddleware = {
  // Write operations (create tokens, use tokens)
  write: [
    requireAuth,
    requireMoneyMovement,
    requireFeature('moneyMovement.qrPayments'),
    rateLimitMiddleware.moderate,
    idempotencyMiddleware,
  ],

  // Read operations (get token, history, stats)
  read: [
    requireAuth,
    requireMoneyMovement,
    requireFeature('moneyMovement.qrPayments'),
    rateLimitMiddleware.moderate,
  ],

  // Public read operations (get token by token)
  publicRead: [rateLimitMiddleware.generous],
};
