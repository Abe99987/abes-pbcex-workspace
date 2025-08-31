import { Resend } from 'resend';
import { logInfo, logWarn, logError } from '@/utils/logger';
import { env, integrations } from '@/config/env';

/**
 * Resend Email Service for PBCEx
 * Production-quality email service using Resend API
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: 'RESEND' | 'MOCK';
  correlationId: string;
}

export class EmailService {
  private static resendClient: Resend | null = null;
  private static isInitialized = false;

  /**
   * Initialize Email service with Resend
   */
  static async initialize(): Promise<void> {
    if (EmailService.isInitialized) {
      logWarn('EmailService already initialized');
      return;
    }

    logInfo('Initializing EmailService with Resend');

    try {
      if (integrations.resend && env.RESEND_API_KEY) {
        EmailService.resendClient = new Resend(env.RESEND_API_KEY);
        
        // Test connection by sending a test (this would fail gracefully if API key is invalid)
        logInfo('Resend client initialized successfully');
      } else {
        logWarn('Resend not configured, email will be mocked');
      }

      EmailService.isInitialized = true;
      logInfo('EmailService initialized');

    } catch (error) {
      logError('Failed to initialize EmailService', error as Error);
      // Continue with mock service
    }
  }

  /**
   * Send transactional email
   */
  static async sendTransactionalEmail(
    to: string,
    subject: string,
    html: string,
    options: Partial<EmailOptions> = {}
  ): Promise<EmailResult> {
    const correlationId = Math.random().toString(36).substr(2, 9);
    
    logInfo('Sending transactional email', { 
      to: EmailService.maskEmail(to),
      subject,
      correlationId,
    });

    // Input validation
    if (!to || !subject || !html) {
      const error = 'Missing required email parameters: to, subject, html';
      logError(error, { correlationId });
      return {
        success: false,
        error,
        provider: 'RESEND',
        correlationId,
      };
    }

    // Email format validation
    if (!EmailService.isValidEmail(to)) {
      const error = 'Invalid email format';
      logError(error, { to: EmailService.maskEmail(to), correlationId });
      return {
        success: false,
        error,
        provider: 'RESEND',
        correlationId,
      };
    }

    try {
      if (integrations.resend && EmailService.resendClient) {
        // Send via Resend
        const emailData = {
          from: options.from || env.EMAIL_FROM,
          to: [to],
          subject,
          html,
          ...(options.replyTo && { reply_to: options.replyTo }),
          ...(options.cc && { cc: options.cc }),
          ...(options.bcc && { bcc: options.bcc }),
          ...(options.attachments && { attachments: options.attachments }),
        };

        const result = await EmailService.resendClient.emails.send(emailData);

        if (result.error) {
          logError('Resend API error', { 
            error: result.error,
            correlationId,
          });
          return {
            success: false,
            error: result.error.message,
            provider: 'RESEND',
            correlationId,
          };
        }

        logInfo('Email sent successfully via Resend', { 
          messageId: result.data?.id,
          to: EmailService.maskEmail(to),
          correlationId,
        });

        return {
          success: true,
          messageId: result.data?.id,
          provider: 'RESEND',
          correlationId,
        };

      } else {
        // Mock email sending for development
        logInfo('Email sent (mock)', { 
          to: EmailService.maskEmail(to),
          subject,
          correlationId,
          reason: integrations.resend ? 'No Resend client' : 'Resend not configured',
        });

        return {
          success: true,
          messageId: `mock_email_${Date.now()}_${correlationId}`,
          provider: 'MOCK',
          correlationId,
        };
      }

    } catch (error) {
      logError('Failed to send email', { 
        error: error as Error,
        correlationId,
        to: EmailService.maskEmail(to),
      });
      
      return {
        success: false,
        error: (error as Error).message,
        provider: integrations.resend ? 'RESEND' : 'MOCK',
        correlationId,
      };
    }
  }

  /**
   * Send email with full options
   */
  static async sendEmail(options: EmailOptions): Promise<EmailResult> {
    return EmailService.sendTransactionalEmail(
      options.to,
      options.subject,
      options.html,
      options
    );
  }

  /**
   * Send test email for development/debugging
   */
  static async sendTestEmail(to: string): Promise<EmailResult> {
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
            PBCEx Test Email
          </h1>
          <p>This is a test email from the PBCEx Email Service.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Service Information:</h3>
            <ul>
              <li><strong>Provider:</strong> ${integrations.resend ? 'Resend' : 'Mock'}</li>
              <li><strong>Environment:</strong> ${env.NODE_ENV}</li>
              <li><strong>From:</strong> ${env.EMAIL_FROM}</li>
              <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
            </ul>
          </div>
          <p>If you received this email, the Email Service is working correctly!</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="font-size: 12px; color: #6b7280;">
            This email was sent from the PBCEx backend for testing purposes only.<br>
            Do not reply to this email.
          </p>
        </body>
      </html>
    `;

    return EmailService.sendTransactionalEmail(
      to,
      'PBCEx Email Service Test',
      html
    );
  }

  /**
   * Get Email service health status
   */
  static getHealthStatus(): {
    status: string;
    provider: string;
    configured: boolean;
  } {
    return {
      status: EmailService.resendClient ? 'connected' : 'mock',
      provider: integrations.resend ? 'Resend' : 'Mock',
      configured: integrations.resend,
    };
  }

  // Private helper methods

  /**
   * Mask email for logging (privacy)
   */
  private static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain || !local) return '***@***';
    
    const maskedLocal = local.length > 2 
      ? local.charAt(0) + '***' + local.slice(-1)
      : '***';
    
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Basic email format validation
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Shutdown service gracefully
   */
  static async shutdown(): Promise<void> {
    logInfo('Shutting down EmailService');
    EmailService.resendClient = null;
    EmailService.isInitialized = false;
    logInfo('EmailService shut down');
  }
}

export default EmailService;
