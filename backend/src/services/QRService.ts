import { db } from '@/db';
import { logInfo, logError } from '@/utils/logger';
import { createError } from '@/middlewares/errorMiddleware';
import { ValidationService } from './ValidationService';
import { OutboxService } from './OutboxService';
import { AuditService } from './AuditService';
import { MoneyMovementUtils } from '@/models/MoneyMovement';
import { v4 as uuidv4 } from 'uuid';

export interface QRTokenRequest {
  asset: string;
  amount?: string;
  memo?: string;
}

export interface QRTokenResponse {
  token: string;
  uri: string;
  expiresAt: string;
  deepLink: string;
}

export interface QRTokenPayload {
  asset: string;
  amount?: string;
  memo?: string;
  callbackHint?: string;
}

export class QRService {
  private static readonly TOKEN_EXPIRY_HOURS = 24; // 24 hours
  private static readonly BASE_URL =
    process.env.FRONTEND_URL || 'https://pbcex.com';

  /**
   * Create QR token for payment
   */
  static async createPayToken(
    userId: string,
    request: QRTokenRequest
  ): Promise<QRTokenResponse> {
    try {
      // Validate request
      const validation = ValidationService.validateQRToken(
        request.asset,
        request.amount,
        request.memo
      );
      ValidationService.throwIfInvalid(
        validation,
        'QR payment token validation failed'
      );

      // Generate token
      const token = uuidv4();
      const expiresAt = new Date(
        Date.now() + QRService.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
      );

      // Create payload
      const payload: QRTokenPayload = {
        asset: request.asset.toUpperCase(),
        amount: request.amount,
        memo: request.memo,
        callbackHint: `pay_${userId}_${Date.now()}`,
      };

      // Store token in database
      const query = `
        INSERT INTO qr_tokens (
          id, user_id, direction, payload, expires_at, status
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, expires_at
      `;

      const result = await db.query(query, [
        token,
        userId,
        'pay',
        JSON.stringify(payload),
        expiresAt,
        'active',
      ]);

      const qrToken = result.rows[0];

      // Generate QR URI and deep link
      const uri = QRService.generateQRUri(token, payload);
      const deepLink = `${QRService.BASE_URL}/qr/pay/${token}`;

      // Emit domain event
      await OutboxService.emitEvent('qr.pay.created', {
        tokenId: qrToken.id,
        userId,
        asset: request.asset.toUpperCase(),
        amount: request.amount,
        expiresAt: qrToken.expires_at.toISOString(),
      });

      // Audit log
      await AuditService.logOperation({
        userId,
        operation: 'qr_pay_token_created',
        resourceType: 'qr_token',
        resourceId: qrToken.id,
        changes: {
          direction: 'pay',
          asset: request.asset.toUpperCase(),
          amount: request.amount,
          expiresAt: qrToken.expires_at.toISOString(),
        },
      });

      logInfo('QR pay token created', {
        tokenId: qrToken.id,
        userId,
        asset: request.asset.toUpperCase(),
        amount: request.amount,
        expiresAt: qrToken.expires_at.toISOString(),
      });

      return {
        token,
        uri,
        expiresAt: qrToken.expires_at.toISOString(),
        deepLink,
      };
    } catch (error) {
      logError('Error creating QR pay token', {
        error: error as Error,
        userId,
        asset: request.asset,
        amount: request.amount,
      });
      throw error;
    }
  }

  /**
   * Create QR token for receiving
   */
  static async createReceiveToken(
    userId: string,
    request: QRTokenRequest
  ): Promise<QRTokenResponse> {
    try {
      // Validate request
      const validation = ValidationService.validateQRToken(
        request.asset,
        request.amount,
        request.memo
      );
      ValidationService.throwIfInvalid(
        validation,
        'QR receive token validation failed'
      );

      // Generate token
      const token = uuidv4();
      const expiresAt = new Date(
        Date.now() + QRService.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
      );

      // Create payload
      const payload: QRTokenPayload = {
        asset: request.asset.toUpperCase(),
        amount: request.amount,
        memo: request.memo,
        callbackHint: `receive_${userId}_${Date.now()}`,
      };

      // Store token in database
      const query = `
        INSERT INTO qr_tokens (
          id, user_id, direction, payload, expires_at, status
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, expires_at
      `;

      const result = await db.query(query, [
        token,
        userId,
        'receive',
        JSON.stringify(payload),
        expiresAt,
        'active',
      ]);

      const qrToken = result.rows[0];

      // Generate QR URI and deep link
      const uri = QRService.generateQRUri(token, payload);
      const deepLink = `${QRService.BASE_URL}/qr/receive/${token}`;

      // Emit domain event
      await OutboxService.emitEvent('qr.receive.created', {
        tokenId: qrToken.id,
        userId,
        asset: request.asset.toUpperCase(),
        amount: request.amount,
        expiresAt: qrToken.expires_at.toISOString(),
      });

      // Audit log
      await AuditService.logOperation({
        userId,
        operation: 'qr_receive_token_created',
        resourceType: 'qr_token',
        resourceId: qrToken.id,
        changes: {
          direction: 'receive',
          asset: request.asset.toUpperCase(),
          amount: request.amount,
          expiresAt: qrToken.expires_at.toISOString(),
        },
      });

      logInfo('QR receive token created', {
        tokenId: qrToken.id,
        userId,
        asset: request.asset.toUpperCase(),
        amount: request.amount,
        expiresAt: qrToken.expires_at.toISOString(),
      });

      return {
        token,
        uri,
        expiresAt: qrToken.expires_at.toISOString(),
        deepLink,
      };
    } catch (error) {
      logError('Error creating QR receive token', {
        error: error as Error,
        userId,
        asset: request.asset,
        amount: request.amount,
      });
      throw error;
    }
  }

  /**
   * Get QR token payload (public endpoint)
   */
  static async getQRToken(token: string): Promise<any> {
    try {
      const query = `
        SELECT 
          id, user_id, direction, payload, expires_at, status, created_at
        FROM qr_tokens
        WHERE id = $1
      `;

      const result = await db.query(query, [token]);

      if (result.rows.length === 0) {
        throw createError.notFound('QR token not found');
      }

      const qrToken = result.rows[0];

      // Check if token is expired
      if (new Date() > qrToken.expires_at) {
        // Update status to expired
        await QRService.markTokenExpired(token);
        throw createError.validation('QR token has expired');
      }

      // Check if token is still active
      if (qrToken.status !== 'active') {
        throw createError.validation('QR token is no longer active');
      }

      const payload = JSON.parse(qrToken.payload);

      // Return sanitized payload (no sensitive information)
      return {
        token: qrToken.id,
        direction: qrToken.direction,
        asset: payload.asset,
        amount: payload.amount,
        memo: payload.memo,
        expiresAt: qrToken.expires_at.toISOString(),
        createdAt: qrToken.created_at.toISOString(),
      };
    } catch (error) {
      logError('Error getting QR token', {
        error: error as Error,
        token,
      });
      throw error;
    }
  }

  /**
   * Mark token as used
   */
  static async markTokenUsed(
    token: string,
    usedByUserId?: string
  ): Promise<void> {
    try {
      const query = `
        UPDATE qr_tokens
        SET status = 'used', updated_at = NOW()
        WHERE id = $1 AND status = 'active'
      `;

      const result = await db.query(query, [token]);

      if (result.rowCount && result.rowCount > 0) {
        logInfo('QR token marked as used', { token, usedByUserId });
      }
    } catch (error) {
      logError('Error marking QR token as used', {
        error: error as Error,
        token,
        usedByUserId,
      });
    }
  }

  /**
   * Mark token as expired
   */
  static async markTokenExpired(token: string): Promise<void> {
    try {
      const query = `
        UPDATE qr_tokens
        SET status = 'expired', updated_at = NOW()
        WHERE id = $1 AND status = 'active'
      `;

      const result = await db.query(query, [token]);

      if (result.rowCount && result.rowCount > 0) {
        logInfo('QR token marked as expired', { token });
      }
    } catch (error) {
      logError('Error marking QR token as expired', {
        error: error as Error,
        token,
      });
    }
  }

  /**
   * Clean up expired tokens
   */
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      const query = `
        UPDATE qr_tokens
        SET status = 'expired', updated_at = NOW()
        WHERE expires_at < NOW() AND status = 'active'
      `;

      const result = await db.query(query);

      if (result.rowCount && result.rowCount > 0) {
        logInfo('Expired QR tokens cleaned up', { count: result.rowCount });
      }
    } catch (error) {
      logError('Error cleaning up expired QR tokens', error as Error);
    }
  }

  /**
   * Get user's QR token history
   */
  static async getUserQRHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const query = `
        SELECT 
          id, direction, payload, expires_at, status, created_at, updated_at
        FROM qr_tokens
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await db.query(query, [userId, limit, offset]);

      return result.rows.map(row => ({
        ...row,
        payload: JSON.parse(row.payload),
      }));
    } catch (error) {
      logError('Error getting user QR history', {
        error: error as Error,
        userId,
      });
      return [];
    }
  }

  /**
   * Generate QR URI
   */
  private static generateQRUri(token: string, payload: QRTokenPayload): string {
    // Generate a structured URI for QR code generation
    // This could be a custom scheme or a web URL
    const baseUrl = `${QRService.BASE_URL}/qr`;

    const params = new URLSearchParams({
      token,
      asset: payload.asset,
    });

    if (payload.amount) {
      params.append('amount', payload.amount);
    }

    if (payload.memo) {
      params.append('memo', payload.memo);
    }

    return `${baseUrl}?${params.toString()}`;
  }
}
