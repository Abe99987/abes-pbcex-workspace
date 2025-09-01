import { Request, Response } from 'express';
import { asyncHandlerAuth } from '@/utils/asyncHandler';
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
import { PaymentRequestService } from '@/services/PaymentRequestService';
import { ValidationService } from '@/services/ValidationService';
import { AuditService } from '@/services/AuditService';
import { paymentRequestSchema } from '@/models/MoneyMovement';

export class PaymentRequestsController {
  /**
   * Create payment request
   * POST /api/payment-requests
   */
  static createPaymentRequest = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const validation = paymentRequestSchema.safeParse(req.body);

        if (!validation.success) {
          throw createError.validation(
            'Invalid request body',
            validation.error.errors
          );
        }

        const requestData = validation.data;

        // Validate payment request data
        const validationResult = ValidationService.validatePaymentRequest(
          requestData.mode,
          requestData.target,
          requestData.asset,
          requestData.amount,
          requestData.memoOptional,
          requestData.allowPartial
        );

        if (!validationResult.valid) {
          throw createError.validation(
            (validationResult as any).message ||
              'Payment request validation failed'
          );
        }

        // Create the payment request
        const paymentRequest = await PaymentRequestService.createPaymentRequest(
          userId,
          requestData
        );

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'payment_request_created',
          resourceType: 'payment_request',
          resourceId: paymentRequest.requestId,
          changes: {
            mode: requestData.mode,
            target: requestData.target,
            asset: requestData.asset,
            amount: requestData.amount,
            memoOptional: requestData.memoOptional,
            allowPartial: requestData.allowPartial,
            expiresAt: requestData.expiresAt,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('Payment request created', {
          userId,
          requestId: paymentRequest.requestId,
          mode: requestData.mode,
          asset: requestData.asset,
          amount: requestData.amount,
        });

        res.status(201).json({
          success: true,
          data: paymentRequest,
        });
      } catch (error) {
        logError('Failed to create payment request', {
          error: error as Error,
          userId: req.user?.id,
          body: req.body,
        });
        throw error;
      }
    }
  );

  /**
   * Get payment request details
   * GET /api/payment-requests/:id
   */
  static getPaymentRequest = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const requestId = req.params.id;

        if (!requestId) {
          throw createError.validation('Request ID is required');
        }

        const paymentRequest = await PaymentRequestService.getPaymentRequest(
          requestId,
          userId
        );

        if (!paymentRequest) {
          throw createError.notFound('Payment request not found');
        }

        res.json({
          success: true,
          data: paymentRequest,
        });
      } catch (error) {
        logError('Failed to get payment request', {
          error: error as Error,
          userId: req.user?.id,
          requestId: req.params.id,
        });
        throw error;
      }
    }
  );

  /**
   * Get payment request by link token (public endpoint)
   * GET /api/payment-requests/link/:token
   */
  static getPaymentRequestByToken = asyncHandlerAuth(
    async (req: Request, res: Response) => {
      try {
        const linkToken = req.params.token;

        if (!linkToken) {
          throw createError.validation('Link token is required');
        }

        const paymentRequest =
          await PaymentRequestService.getPaymentRequestByToken(linkToken);

        if (!paymentRequest) {
          throw createError.notFound('Payment request not found or expired');
        }

        res.json({
          success: true,
          data: paymentRequest,
        });
      } catch (error) {
        logError('Failed to get payment request by token', {
          error: error as Error,
          linkToken: req.params.token,
        });
        throw error;
      }
    }
  );

  /**
   * Cancel payment request
   * POST /api/payment-requests/:id/cancel
   */
  static cancelPaymentRequest = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const requestId = req.params.id;

        if (!requestId) {
          throw createError.validation('Request ID is required');
        }

        const cancelled = await PaymentRequestService.cancelPaymentRequest(
          requestId,
          userId
        );

        if (!cancelled) {
          throw createError.validation(
            'Payment request cannot be cancelled or not found'
          );
        }

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'payment_request_cancelled',
          resourceType: 'payment_request',
          resourceId: requestId,
          changes: {
            status: 'cancelled',
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('Payment request cancelled', {
          userId,
          requestId,
        });

        res.json({
          success: true,
          data: {
            requestId,
            status: 'cancelled',
          },
        });
      } catch (error) {
        logError('Failed to cancel payment request', {
          error: error as Error,
          userId: req.user?.id,
          requestId: req.params.id,
        });
        throw error;
      }
    }
  );

  /**
   * Get user's payment requests
   * GET /api/payment-requests
   */
  static getPaymentRequests = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;
        const status = req.query.status as string; // 'draft' | 'active' | 'expired' | 'paid' | 'cancelled'
        const mode = req.query.mode as string; // 'internal_user' | 'external_link'

        // TODO: Implement payment requests list retrieval
        // This would query the payment_requests table for the user's requests
        const requests = {
          requests: [],
          total: 0,
          limit,
          offset,
        };

        res.json({
          success: true,
          data: requests,
        });
      } catch (error) {
        logError('Failed to get payment requests', {
          error: error as Error,
          userId: req.user?.id,
          query: req.query,
        });
        throw error;
      }
    }
  );

  /**
   * Pay a payment request
   * POST /api/payment-requests/:id/pay
   */
  static payPaymentRequest = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;
        const requestId = req.params.id;
        const { amount, memo } = req.body;

        if (!requestId) {
          throw createError.validation('Request ID is required');
        }

        // TODO: Implement payment request payment
        // This would:
        // 1. Get the payment request
        // 2. Validate the payment amount
        // 3. Create a transfer (internal or external)
        // 4. Mark the request as paid
        // 5. Update the request status

        const paymentResult = {
          requestId,
          paymentId: 'temp-payment-id',
          status: 'completed',
          amount,
          memo,
        };

        // Log audit trail
        await AuditService.logOperation({
          userId,
          operation: 'payment_request_paid',
          resourceType: 'payment_request',
          resourceId: requestId,
          changes: {
            paidBy: userId,
            amount,
            memo,
            paidAt: new Date().toISOString(),
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        logInfo('Payment request paid', {
          userId,
          requestId,
          amount,
        });

        res.json({
          success: true,
          data: paymentResult,
        });
      } catch (error) {
        logError('Failed to pay payment request', {
          error: error as Error,
          userId: req.user?.id,
          requestId: req.params.id,
          body: req.body,
        });
        throw error;
      }
    }
  );

  /**
   * Get payment request statistics
   * GET /api/payment-requests/stats
   */
  static getPaymentRequestStats = asyncHandlerAuth(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user!.id;

        // TODO: Implement payment request statistics
        // This would provide counts of created, paid, expired, cancelled requests
        const stats = {
          totalCreated: 0,
          totalPaid: 0,
          totalExpired: 0,
          totalCancelled: 0,
          activeRequests: 0,
          internalRequests: 0,
          externalRequests: 0,
          totalAmount: '0',
          paidAmount: '0',
        };

        res.json({
          success: true,
          data: stats,
        });
      } catch (error) {
        logError('Failed to get payment request stats', {
          error: error as Error,
          userId: req.user?.id,
        });
        throw error;
      }
    }
  );
}

// Export middleware chains for routes
export const paymentRequestsMiddleware = {
  // Write operations (create, cancel, pay)
  write: [
    requireAuth,
    requireMoneyMovement,
    requireFeature('moneyMovement.paymentRequests'),
    rateLimitMiddleware.moderate,
    idempotencyMiddleware,
  ],

  // Read operations (get request, list requests, stats)
  read: [
    requireAuth,
    requireMoneyMovement,
    requireFeature('moneyMovement.paymentRequests'),
    rateLimitMiddleware.moderate,
  ],

  // Public read operations (get request by token)
  publicRead: [rateLimitMiddleware.generous],
};
