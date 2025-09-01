import { db } from '@/db';
import { logInfo, logError } from '@/utils/logger';
import { createError } from '@/middlewares/errorMiddleware';
import { ValidationService } from './ValidationService';
import { OutboxService } from './OutboxService';
import { AuditService } from './AuditService';
import { MoneyMovementUtils } from '@/models/MoneyMovement';
import { v4 as uuidv4 } from 'uuid';

export interface PaymentRequestCreateRequest {
  mode: 'internal_user' | 'external_link';
  target: Record<string, any>;
  asset: string;
  amount: string;
  memoOptional: boolean;
  allowPartial: boolean;
  expiresAt?: string;
}

export interface PaymentRequestResponse {
  requestId: string;
  link?: string;
  status: 'draft' | 'active' | 'expired' | 'paid' | 'cancelled';
  createdAt: string;
  expiresAt?: string;
}

export interface PaymentRequestDetails {
  id: string;
  mode: 'internal_user' | 'external_link';
  target: Record<string, any>;
  asset: string;
  amount: string;
  memoOptional: boolean;
  allowPartial: boolean;
  status: 'draft' | 'active' | 'expired' | 'paid' | 'cancelled';
  linkToken?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export class PaymentRequestService {
  private static readonly BASE_URL =
    process.env.FRONTEND_URL || 'https://pbcex.com';
  private static readonly DEFAULT_EXPIRY_DAYS = 30;

  /**
   * Create payment request
   */
  static async createPaymentRequest(
    userId: string,
    request: PaymentRequestCreateRequest
  ): Promise<PaymentRequestResponse> {
    try {
      // Validate request
      const validation = ValidationService.validatePaymentRequest(
        request.mode,
        request.target,
        request.asset,
        request.amount,
        request.memoOptional,
        request.allowPartial
      );
      ValidationService.throwIfInvalid(
        validation,
        'Payment request validation failed'
      );

      // Generate request ID and link token
      const requestId = uuidv4();
      const linkToken =
        request.mode === 'external_link'
          ? MoneyMovementUtils.generateLinkToken()
          : null;

      // Calculate expiry date
      const expiresAt = request.expiresAt
        ? new Date(request.expiresAt)
        : new Date(
            Date.now() +
              PaymentRequestService.DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000
          );

      // Create payment request record
      const query = `
        INSERT INTO payment_requests (
          id, user_id, mode, target, asset, amount, memo_optional, allow_partial, 
          expires_at, status, link_token
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, status, created_at, expires_at
      `;

      const result = await db.query(query, [
        requestId,
        userId,
        request.mode,
        JSON.stringify(request.target),
        request.asset.toUpperCase(),
        request.amount,
        request.memoOptional,
        request.allowPartial,
        expiresAt,
        'active',
        linkToken,
      ]);

      const paymentRequest = result.rows[0];

      // Generate shareable link for external requests
      let link: string | undefined;
      if (request.mode === 'external_link' && linkToken) {
        link = `${PaymentRequestService.BASE_URL}/pay/${linkToken}`;
      }

      // Emit domain event
      await OutboxService.emitEvent('payment_request.created', {
        requestId: paymentRequest.id,
        userId,
        mode: request.mode,
        asset: request.asset.toUpperCase(),
        amount: request.amount,
        linkToken,
        status: paymentRequest.status,
      });

      // Audit log
      await AuditService.logOperation({
        userId,
        operation: 'payment_request_created',
        resourceType: 'payment_request',
        resourceId: paymentRequest.id,
        changes: {
          mode: request.mode,
          target:
            request.mode === 'internal_user'
              ? {
                  accountNumber: MoneyMovementUtils.maskAccountNumber(
                    request.target.accountNumber
                  ),
                }
              : { email: request.target.email },
          asset: request.asset.toUpperCase(),
          amount: request.amount,
          memoOptional: request.memoOptional,
          allowPartial: request.allowPartial,
          expiresAt: paymentRequest.expires_at?.toISOString(),
        },
      });

      logInfo('Payment request created', {
        requestId: paymentRequest.id,
        userId,
        mode: request.mode,
        asset: request.asset.toUpperCase(),
        amount: request.amount,
        linkToken,
      });

      return {
        requestId: paymentRequest.id,
        link,
        status: paymentRequest.status,
        createdAt: paymentRequest.created_at.toISOString(),
        expiresAt: paymentRequest.expires_at?.toISOString(),
      };
    } catch (error) {
      logError('Error creating payment request', {
        error: error as Error,
        userId,
        mode: request.mode,
        asset: request.asset,
        amount: request.amount,
      });
      throw error;
    }
  }

  /**
   * Get payment request details
   */
  static async getPaymentRequest(
    requestId: string,
    userId?: string
  ): Promise<PaymentRequestDetails> {
    try {
      let query = `
        SELECT 
          id, user_id, mode, target, asset, amount, memo_optional, allow_partial,
          expires_at, status, link_token, created_at, updated_at
        FROM payment_requests
        WHERE id = $1
      `;

      const params: any[] = [requestId];

      // If userId provided, ensure user owns the request
      if (userId) {
        query += ' AND user_id = $2';
        params.push(userId);
      }

      const result = await db.query(query, params);

      if (result.rows.length === 0) {
        throw createError.notFound('Payment request not found');
      }

      const paymentRequest = result.rows[0];

      // Check if request is expired
      if (paymentRequest.expires_at && new Date() > paymentRequest.expires_at) {
        if (paymentRequest.status === 'active') {
          // Update status to expired
          await PaymentRequestService.updateRequestStatus(requestId, 'expired');
          paymentRequest.status = 'expired';
        }
      }

      return {
        id: paymentRequest.id,
        mode: paymentRequest.mode,
        target: JSON.parse(paymentRequest.target),
        asset: paymentRequest.asset,
        amount: paymentRequest.amount,
        memoOptional: paymentRequest.memo_optional,
        allowPartial: paymentRequest.allow_partial,
        status: paymentRequest.status,
        linkToken: paymentRequest.link_token,
        createdAt: paymentRequest.created_at.toISOString(),
        updatedAt: paymentRequest.updated_at.toISOString(),
        expiresAt: paymentRequest.expires_at?.toISOString(),
      };
    } catch (error) {
      logError('Error getting payment request', {
        error: error as Error,
        requestId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get payment request by link token (public endpoint)
   */
  static async getPaymentRequestByToken(linkToken: string): Promise<any> {
    try {
      const query = `
        SELECT 
          id, mode, target, asset, amount, memo_optional, allow_partial,
          expires_at, status, created_at
        FROM payment_requests
        WHERE link_token = $1
      `;

      const result = await db.query(query, [linkToken]);

      if (result.rows.length === 0) {
        throw createError.notFound('Payment request not found');
      }

      const paymentRequest = result.rows[0];

      // Check if request is expired
      if (paymentRequest.expires_at && new Date() > paymentRequest.expires_at) {
        if (paymentRequest.status === 'active') {
          await PaymentRequestService.updateRequestStatus(
            paymentRequest.id,
            'expired'
          );
          paymentRequest.status = 'expired';
        }
      }

      // Return sanitized data for public access
      const target = JSON.parse(paymentRequest.target);
      return {
        id: paymentRequest.id,
        mode: paymentRequest.mode,
        target:
          paymentRequest.mode === 'internal_user'
            ? { displayName: target.displayName }
            : { email: target.email },
        asset: paymentRequest.asset,
        amount: paymentRequest.amount,
        memoOptional: paymentRequest.memo_optional,
        allowPartial: paymentRequest.allow_partial,
        status: paymentRequest.status,
        createdAt: paymentRequest.created_at.toISOString(),
        expiresAt: paymentRequest.expires_at?.toISOString(),
      };
    } catch (error) {
      logError('Error getting payment request by token', {
        error: error as Error,
        linkToken,
      });
      throw error;
    }
  }

  /**
   * Cancel payment request
   */
  static async cancelPaymentRequest(
    requestId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Check if request exists and belongs to user
      const checkQuery = `
        SELECT id, status
        FROM payment_requests
        WHERE id = $1 AND user_id = $2
      `;

      const checkResult = await db.query(checkQuery, [requestId, userId]);

      if (checkResult.rows.length === 0) {
        throw createError.notFound('Payment request not found');
      }

      const paymentRequest = checkResult.rows[0];

      // Only allow cancellation if still active
      if (paymentRequest.status !== 'active') {
        throw createError.validation(
          `Cannot cancel payment request in status: ${paymentRequest.status}`
        );
      }

      // Update status to cancelled
      const updateQuery = `
        UPDATE payment_requests
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = $1 AND user_id = $2
      `;

      const updateResult = await db.query(updateQuery, [requestId, userId]);

      if (updateResult.rowCount === 0) {
        return false;
      }

      // Emit domain event
      await OutboxService.emitEvent('payment_request.cancelled', {
        requestId: paymentRequest.id,
        userId,
      });

      // Audit log
      await AuditService.logOperation({
        userId,
        operation: 'payment_request_cancelled',
        resourceType: 'payment_request',
        resourceId: paymentRequest.id,
        changes: {
          previousStatus: 'active',
          newStatus: 'cancelled',
        },
      });

      logInfo('Payment request cancelled', {
        requestId: paymentRequest.id,
        userId,
      });

      return true;
    } catch (error) {
      logError('Error cancelling payment request', {
        error: error as Error,
        requestId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get user's payment request history
   */
  static async getUserPaymentRequests(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const query = `
        SELECT 
          id, mode, target, asset, amount, memo_optional, allow_partial,
          expires_at, status, link_token, created_at, updated_at
        FROM payment_requests
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await db.query(query, [userId, limit, offset]);

      return result.rows.map(row => ({
        ...row,
        target: JSON.parse(row.target),
        link: row.link_token
          ? `${PaymentRequestService.BASE_URL}/pay/${row.link_token}`
          : null,
      }));
    } catch (error) {
      logError('Error getting user payment requests', {
        error: error as Error,
        userId,
      });
      return [];
    }
  }

  /**
   * Update request status (internal method)
   */
  private static async updateRequestStatus(
    requestId: string,
    status: string
  ): Promise<void> {
    try {
      const query = `
        UPDATE payment_requests
        SET status = $2, updated_at = NOW()
        WHERE id = $1
      `;

      await db.query(query, [requestId, status]);
      logInfo('Payment request status updated', { requestId, status });
    } catch (error) {
      logError('Error updating payment request status', {
        error: error as Error,
        requestId,
        status,
      });
    }
  }

  /**
   * Clean up expired payment requests
   */
  static async cleanupExpiredRequests(): Promise<void> {
    try {
      const query = `
        UPDATE payment_requests
        SET status = 'expired', updated_at = NOW()
        WHERE expires_at < NOW() AND status = 'active'
      `;

      const result = await db.query(query);

      if (result.rowCount && result.rowCount > 0) {
        logInfo('Expired payment requests cleaned up', {
          count: result.rowCount,
        });
      }
    } catch (error) {
      logError('Error cleaning up expired payment requests', error as Error);
    }
  }
}
