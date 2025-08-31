import { Request, Response } from 'express';
import { createError, asyncHandler } from '@/middlewares/errorMiddleware';
import { logInfo, logWarn, logError } from '@/utils/logger';
import { VerifyService } from '@/services/VerifyService';
import { env } from '@/config/env';

/**
 * Verify Controller for PBCEx
 * Handles 2FA phone verification using Twilio Verify
 */

interface VerifyStartRequest extends Request {
  body: {
    phone: string;
    channel?: 'sms' | 'call';
  };
}

interface VerifyCheckRequest extends Request {
  body: {
    phone: string;
    code: string;
  };
}

export class VerifyController {
  /**
   * POST /api/auth/verify/start
   * Start phone number verification
   */
  static startVerification = asyncHandler(async (req: VerifyStartRequest, res: Response) => {
    const { phone, channel } = req.body;
    const requestId = (req as { requestId?: string }).requestId || 'unknown';
    const clientIp = req.ip || 'unknown';

    logInfo('Verification start request', { 
      phone: VerifyService['maskPhone']?.(phone) || '***',
      channel: channel || 'sms',
      clientIp,
      requestId,
    });

    // Input validation
    if (!phone) {
      throw createError.badRequest('Missing required field: phone');
    }

    if (typeof phone !== 'string') {
      throw createError.badRequest('Field "phone" must be a string');
    }

    if (channel && !['sms', 'call'].includes(channel)) {
      throw createError.badRequest('Field "channel" must be either "sms" or "call"');
    }

    // Phone format pre-validation
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      throw createError.badRequest('Invalid phone number length');
    }

    // Additional security: Block obviously fake numbers in production
    if (env.NODE_ENV === 'production') {
      const suspiciousPatterns = [
        /^(\+1)?5555555555$/, // Classic test number
        /^(\+1)?1234567890$/, // Sequential digits
        /^(\+1)?(123|111|000)/, // Suspicious patterns
      ];
      
      if (suspiciousPatterns.some(pattern => pattern.test(phone))) {
        throw createError.badRequest('Invalid phone number');
      }
    }

    try {
      // Start verification
      const result = await VerifyService.startVerification(phone, { channel });

      if (result.success) {
        logInfo('Verification started successfully', {
          phone: VerifyService['maskPhone']?.(phone) || '***',
          provider: result.provider,
          status: result.status,
          correlationId: result.correlationId,
          requestId,
        });

        // Return success response without sensitive data
        res.status(200).json({
          success: true,
          message: 'Verification code sent successfully',
          data: {
            status: result.status,
            provider: result.provider,
            correlationId: result.correlationId,
            ...(env.NODE_ENV === 'development' && { 
              sid: result.sid,
              mockHint: result.provider === 'MOCK' ? 'Use code ending in 00 or 123456/000000/111111' : undefined,
            }),
          },
        });
      } else {
        logWarn('Verification start failed', {
          error: result.error,
          phone: VerifyService['maskPhone']?.(phone) || '***',
          provider: result.provider,
          correlationId: result.correlationId,
          requestId,
        });

        // Handle rate limiting specifically
        if (result.error?.includes('Rate limit')) {
          res.status(429).json({
            success: false,
            code: 'RATE_LIMITED',
            message: result.error,
            correlationId: result.correlationId,
          });
        } else {
          res.status(400).json({
            success: false,
            code: 'VERIFICATION_FAILED',
            message: result.error || 'Failed to start verification',
            correlationId: result.correlationId,
          });
        }
      }
    } catch (error) {
      logError('Verification start endpoint error', {
        error: error as Error,
        phone: VerifyService['maskPhone']?.(phone) || '***',
        requestId,
      });

      throw createError.internalServerError('Verification service error');
    }
  });

  /**
   * POST /api/auth/verify/check
   * Check verification code
   */
  static checkVerification = asyncHandler(async (req: VerifyCheckRequest, res: Response) => {
    const { phone, code } = req.body;
    const requestId = (req as { requestId?: string }).requestId || 'unknown';
    const clientIp = req.ip || 'unknown';

    logInfo('Verification check request', { 
      phone: VerifyService['maskPhone']?.(phone) || '***',
      codeLength: code?.length || 0,
      clientIp,
      requestId,
    });

    // Input validation
    if (!phone || !code) {
      throw createError.badRequest('Missing required fields: phone, code');
    }

    if (typeof phone !== 'string' || typeof code !== 'string') {
      throw createError.badRequest('Fields must be strings');
    }

    // Code format validation
    if (!/^\d{4,8}$/.test(code)) {
      throw createError.badRequest('Verification code must be 4-8 digits');
    }

    // Phone format pre-validation
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      throw createError.badRequest('Invalid phone number length');
    }

    try {
      // Check verification
      const result = await VerifyService.checkVerification(phone, code);

      if (result.success) {
        logInfo('Verification check successful', {
          phone: VerifyService['maskPhone']?.(phone) || '***',
          provider: result.provider,
          status: result.status,
          correlationId: result.correlationId,
          requestId,
        });

        res.status(200).json({
          success: true,
          verified: true,
          message: 'Phone number verified successfully',
          data: {
            status: result.status,
            provider: result.provider,
            correlationId: result.correlationId,
            ...(env.NODE_ENV === 'development' && { sid: result.sid }),
          },
        });
      } else {
        // Handle different failure cases
        const isInvalidCode = result.error?.includes('Invalid') || result.status === 'pending';
        
        logWarn('Verification check failed', {
          error: result.error,
          phone: VerifyService['maskPhone']?.(phone) || '***',
          provider: result.provider,
          status: result.status,
          correlationId: result.correlationId,
          requestId,
        });

        res.status(isInvalidCode ? 400 : 500).json({
          success: false,
          verified: false,
          code: isInvalidCode ? 'INVALID_CODE' : 'VERIFICATION_ERROR',
          message: result.error || 'Verification failed',
          data: {
            status: result.status,
            correlationId: result.correlationId,
          },
        });
      }
    } catch (error) {
      logError('Verification check endpoint error', {
        error: error as Error,
        phone: VerifyService['maskPhone']?.(phone) || '***',
        requestId,
      });

      throw createError.internalServerError('Verification service error');
    }
  });

  /**
   * GET /api/auth/verify/status
   * Get verification service status
   */
  static getVerificationStatus = asyncHandler(async (req: Request, res: Response) => {
    const requestId = (req as { requestId?: string }).requestId || 'unknown';

    logInfo('Verification status check', { requestId });

    try {
      const healthStatus = VerifyService.getHealthStatus();

      res.status(200).json({
        success: true,
        service: 'VerifyService',
        status: healthStatus,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logError('Verification status check error', {
        error: error as Error,
        requestId,
      });

      res.status(500).json({
        success: false,
        service: 'VerifyService',
        status: 'error',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * POST /api/auth/verify/test
   * Send a test verification (development only)
   */
  static sendTestVerification = asyncHandler(async (req: Request, res: Response) => {
    // Guard: Only allow in non-production environments
    if (env.NODE_ENV === 'production') {
      throw createError.forbidden('Test verification endpoint is disabled in production');
    }

    const { phone } = req.body;
    const requestId = (req as { requestId?: string }).requestId || 'unknown';

    logInfo('Test verification request', { 
      phone: VerifyService['maskPhone']?.(phone) || '***',
      requestId,
    });

    // Use default test numbers in development
    const testPhone = phone || '+15555551234';

    try {
      const result = await VerifyService.startVerification(testPhone, { channel: 'sms' });

      res.status(200).json({
        success: true,
        message: 'Test verification initiated',
        data: {
          phone: VerifyService['maskPhone']?.(testPhone) || '***',
          ...result,
          testHint: 'In mock mode, use codes ending in 00 or: 123456, 000000, 111111',
        },
      });
    } catch (error) {
      logError('Test verification error', {
        error: error as Error,
        phone: VerifyService['maskPhone']?.(testPhone) || '***',
        requestId,
      });

      throw createError.internalServerError('Test verification failed');
    }
  });
}

export default VerifyController;
