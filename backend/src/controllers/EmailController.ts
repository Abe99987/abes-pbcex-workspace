import { Request, Response } from 'express';
import { createError, asyncHandler } from '@/middlewares/errorMiddleware';
import { logInfo, logWarn, logError } from '@/utils/logger';
import { EmailService } from '@/services/EmailService';
import { env } from '@/config/env';

/**
 * Email Controller for PBCEx
 * Handles email operations using Resend service
 */

interface TestEmailRequest extends Request {
  body: {
    to: string;
  };
}

export class EmailController {
  /**
   * POST /api/email/test
   * Send a test email (development only)
   */
  static sendTestEmail = asyncHandler(async (req: TestEmailRequest, res: Response) => {
    // Guard: Only allow in non-production environments
    if (env.NODE_ENV === 'production') {
      throw createError.forbidden('Test email endpoint is disabled in production');
    }

    const { to } = req.body;
    const requestId = (req as { requestId?: string }).requestId || 'unknown';

    logInfo('Test email request', { 
      to: EmailService['maskEmail']?.(to) || to,
      requestId,
    });

    // Input validation
    if (!to) {
      throw createError.badRequest('Missing required field: to');
    }

    if (typeof to !== 'string') {
      throw createError.badRequest('Field "to" must be a string');
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      throw createError.badRequest('Invalid email format');
    }

    // Additional security: Limit to reasonable domains in development
    if (env.NODE_ENV === 'development') {
      const allowedDomains = [
        'gmail.com', 
        'outlook.com', 
        'hotmail.com', 
        'yahoo.com',
        'pbcex.com',
        'test.com',
        'example.com',
        'mailinator.com',
        'ethereal.email'
      ];
      
      const domain = to.split('@')[1];
      if (!allowedDomains.includes(domain)) {
        logWarn('Test email to non-standard domain', { 
          domain,
          to: EmailService['maskEmail']?.(to) || to,
          requestId,
        });
      }
    }

    try {
      // Send test email
      const result = await EmailService.sendTestEmail(to);

      if (result.success) {
        logInfo('Test email sent successfully', {
          messageId: result.messageId,
          provider: result.provider,
          to: EmailService['maskEmail']?.(to) || to,
          correlationId: result.correlationId,
          requestId,
        });

        res.status(200).json({
          success: true,
          message: 'Test email sent successfully',
          data: {
            messageId: result.messageId,
            provider: result.provider,
            correlationId: result.correlationId,
          },
        });
      } else {
        logError('Test email failed', {
          error: result.error,
          provider: result.provider,
          to: EmailService['maskEmail']?.(to) || to,
          correlationId: result.correlationId,
          requestId,
        });

        res.status(500).json({
          success: false,
          message: 'Failed to send test email',
          error: result.error,
          correlationId: result.correlationId,
        });
      }
    } catch (error) {
      logError('Test email endpoint error', {
        error: error as Error,
        to: EmailService['maskEmail']?.(to) || to,
        requestId,
      });

      throw createError.internalServerError('Email service error');
    }
  });

  /**
   * GET /api/email/health
   * Check email service health status
   */
  static getHealthStatus = asyncHandler(async (req: Request, res: Response) => {
    const requestId = (req as { requestId?: string }).requestId || 'unknown';

    logInfo('Email health check', { requestId });

    try {
      const healthStatus = EmailService.getHealthStatus();

      res.status(200).json({
        success: true,
        service: 'EmailService',
        status: healthStatus,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logError('Email health check error', {
        error: error as Error,
        requestId,
      });

      res.status(500).json({
        success: false,
        service: 'EmailService',
        status: 'error',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * POST /api/email/send
   * Send a custom email (development only, admin users)
   * NOTE: This is for internal testing and should be heavily restricted
   */
  static sendCustomEmail = asyncHandler(async (req: Request, res: Response) => {
    // Guard: Only allow in non-production environments
    if (env.NODE_ENV === 'production') {
      throw createError.forbidden('Custom email endpoint is disabled in production');
    }

    const { to, subject, html, from, replyTo } = req.body;
    const requestId = (req as { requestId?: string }).requestId || 'unknown';

    logInfo('Custom email request', { 
      to: EmailService['maskEmail']?.(to) || to,
      subject,
      requestId,
    });

    // Input validation
    if (!to || !subject || !html) {
      throw createError.badRequest('Missing required fields: to, subject, html');
    }

    if (typeof to !== 'string' || typeof subject !== 'string' || typeof html !== 'string') {
      throw createError.badRequest('Fields must be strings');
    }

    // Security limits
    if (subject.length > 200) {
      throw createError.badRequest('Subject too long (max 200 characters)');
    }

    if (html.length > 50000) {
      throw createError.badRequest('HTML content too long (max 50KB)');
    }

    try {
      const result = await EmailService.sendTransactionalEmail(to, subject, html, {
        from: from || undefined,
        replyTo: replyTo || undefined,
      });

      if (result.success) {
        logInfo('Custom email sent successfully', {
          messageId: result.messageId,
          provider: result.provider,
          to: EmailService['maskEmail']?.(to) || to,
          correlationId: result.correlationId,
          requestId,
        });

        res.status(200).json({
          success: true,
          message: 'Email sent successfully',
          data: {
            messageId: result.messageId,
            provider: result.provider,
            correlationId: result.correlationId,
          },
        });
      } else {
        logError('Custom email failed', {
          error: result.error,
          provider: result.provider,
          to: EmailService['maskEmail']?.(to) || to,
          correlationId: result.correlationId,
          requestId,
        });

        res.status(500).json({
          success: false,
          message: 'Failed to send email',
          error: result.error,
          correlationId: result.correlationId,
        });
      }
    } catch (error) {
      logError('Custom email endpoint error', {
        error: error as Error,
        to: EmailService['maskEmail']?.(to) || to,
        requestId,
      });

      throw createError.internalServerError('Email service error');
    }
  });
}

export default EmailController;
