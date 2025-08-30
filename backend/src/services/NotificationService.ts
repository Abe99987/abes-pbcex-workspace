import nodemailer from 'nodemailer';
import { Twilio } from 'twilio';
import axios from 'axios';
import { logInfo, logWarn, logError } from '@/utils/logger';
import { env, integrations } from '@/config/env';
import { createError } from '@/middlewares/errorMiddleware';

/**
 * Notification Service for PBCEx
 * Handles email, SMS, and support ticket communications
 */

interface EmailOptions {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  templateData?: Record<string, unknown>;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

interface SMSOptions {
  to: string;
  message: string;
  from?: string;
}

interface IntercomTicketOptions {
  userId: string;
  subject: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
}

interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: 'SENDGRID' | 'TWILIO' | 'INTERCOM' | 'MOCK';
}

export class NotificationService {
  private static emailTransporter: nodemailer.Transporter | null = null;
  private static twilioClient: Twilio | null = null;
  private static isInitialized = false;

  /**
   * Initialize notification service with all providers
   */
  static async initialize(): Promise<void> {
    if (NotificationService.isInitialized) {
      logWarn('NotificationService already initialized');
      return;
    }

    logInfo('Initializing NotificationService');

    try {
      // Initialize email service
      await NotificationService.initializeEmail();

      // Initialize SMS service
      await NotificationService.initializeSMS();

      // Initialize Intercom
      await NotificationService.initializeIntercom();

      NotificationService.isInitialized = true;
      logInfo('NotificationService initialized successfully');

    } catch (error) {
      logError('Failed to initialize NotificationService', error as Error);
      // Don't throw error - continue with mock services
    }
  }

  /**
   * Send email notification
   */
  static async sendEmail(options: EmailOptions): Promise<NotificationResult> {
    logInfo('Sending email', { 
      to: options.to, 
      subject: options.subject,
      template: options.template,
    });

    try {
      if (integrations.sendgrid && NotificationService.emailTransporter) {
        // Send via SendGrid/SMTP
        const mailOptions = {
          from: options.from || '"PBCEx Support" <support@pbcex.com>',
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html || NotificationService.generateHtmlFromTemplate(
            options.template, 
            options.templateData
          ),
          attachments: options.attachments,
        };

        const result = await NotificationService.emailTransporter.sendMail(mailOptions);

        logInfo('Email sent successfully', { 
          messageId: result.messageId,
          to: options.to,
        });

        return {
          success: true,
          messageId: result.messageId,
          provider: 'SENDGRID',
        };

      } else {
        // Mock email sending
        logInfo('Email sent (mock)', { 
          to: options.to,
          subject: options.subject,
        });

        return {
          success: true,
          messageId: `mock_email_${Date.now()}`,
          provider: 'MOCK',
        };
      }

    } catch (error) {
      logError('Failed to send email', error as Error);
      return {
        success: false,
        error: (error as Error).message,
        provider: integrations.sendgrid ? 'SENDGRID' : 'MOCK',
      };
    }
  }

  /**
   * Send SMS notification
   */
  static async sendSMS(options: SMSOptions): Promise<NotificationResult> {
    logInfo('Sending SMS', { 
      to: options.to,
      messageLength: options.message.length,
    });

    try {
      if (integrations.twilio && NotificationService.twilioClient) {
        // Send via Twilio
        const message = await NotificationService.twilioClient.messages.create({
          to: options.to,
          from: options.from || '+15551234567', // Your Twilio phone number
          body: options.message,
        });

        logInfo('SMS sent successfully', { 
          messageSid: message.sid,
          to: options.to,
        });

        return {
          success: true,
          messageId: message.sid,
          provider: 'TWILIO',
        };

      } else {
        // Mock SMS sending
        logInfo('SMS sent (mock)', { 
          to: options.to,
          message: options.message.substring(0, 50) + '...',
        });

        return {
          success: true,
          messageId: `mock_sms_${Date.now()}`,
          provider: 'MOCK',
        };
      }

    } catch (error) {
      logError('Failed to send SMS', error as Error);
      return {
        success: false,
        error: (error as Error).message,
        provider: integrations.twilio ? 'TWILIO' : 'MOCK',
      };
    }
  }

  /**
   * Create support ticket via Intercom
   */
  static async createSupportTicket(options: IntercomTicketOptions): Promise<NotificationResult> {
    logInfo('Creating support ticket', { 
      userId: options.userId,
      subject: options.subject,
      priority: options.priority,
    });

    try {
      if (integrations.intercom && env.INTERCOM_ACCESS_TOKEN) {
        // Create ticket via Intercom API
        const ticketData = {
          type: 'ticket',
          subject: options.subject,
          body: options.message,
          priority: options.priority || 'medium',
          user_id: options.userId,
          tags: options.tags || [],
        };

        const response = await axios.post(
          'https://api.intercom.io/tickets',
          ticketData,
          {
            headers: {
              'Authorization': `Bearer ${env.INTERCOM_ACCESS_TOKEN}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );

        logInfo('Support ticket created successfully', { 
          ticketId: response.data.id,
          userId: options.userId,
        });

        return {
          success: true,
          messageId: response.data.id,
          provider: 'INTERCOM',
        };

      } else {
        // Mock ticket creation
        logInfo('Support ticket created (mock)', { 
          userId: options.userId,
          subject: options.subject,
        });

        return {
          success: true,
          messageId: `mock_ticket_${Date.now()}`,
          provider: 'MOCK',
        };
      }

    } catch (error) {
      logError('Failed to create support ticket', error as Error);
      return {
        success: false,
        error: (error as Error).message,
        provider: integrations.intercom ? 'INTERCOM' : 'MOCK',
      };
    }
  }

  // Email templates and shortcuts

  /**
   * Send welcome email to new users
   */
  static async sendWelcomeEmail(
    userEmail: string, 
    userName: string
  ): Promise<NotificationResult> {
    return NotificationService.sendEmail({
      to: userEmail,
      subject: 'Welcome to PBCEx - Your Precious Metals Trading Platform',
      template: 'welcome',
      templateData: {
        name: userName,
        loginUrl: `${env.NEXT_PUBLIC_APP_URL}/account/login`,
        supportEmail: 'support@pbcex.com',
      },
    });
  }

  /**
   * Send KYC status update email
   */
  static async sendKycStatusEmail(
    userEmail: string,
    userName: string,
    status: string,
    notes?: string
  ): Promise<NotificationResult> {
    const statusMessages = {
      'APPROVED': 'Your identity verification has been approved! You can now start trading.',
      'REJECTED': 'Your identity verification requires additional information. Please check your account.',
      'PENDING_REVIEW': 'Your identity verification is being reviewed. We\'ll update you soon.',
    };

    return NotificationService.sendEmail({
      to: userEmail,
      subject: `PBCEx KYC Status Update - ${status}`,
      template: 'kyc_status',
      templateData: {
        name: userName,
        status,
        statusMessage: statusMessages[status as keyof typeof statusMessages] || 'Status updated',
        notes,
        dashboardUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
      },
    });
  }

  /**
   * Send trade confirmation email
   */
  static async sendTradeConfirmationEmail(
    userEmail: string,
    userName: string,
    tradeDetails: {
      tradeId: string;
      fromAsset: string;
      toAsset: string;
      amount: string;
      price: string;
      fee: string;
      executedAt: Date;
    }
  ): Promise<NotificationResult> {
    return NotificationService.sendEmail({
      to: userEmail,
      subject: `Trade Confirmation - ${tradeDetails.fromAsset} → ${tradeDetails.toAsset}`,
      template: 'trade_confirmation',
      templateData: {
        name: userName,
        ...tradeDetails,
        historyUrl: `${env.NEXT_PUBLIC_APP_URL}/trade/history`,
      },
    });
  }

  /**
   * Send order status update email
   */
  static async sendOrderStatusEmail(
    userEmail: string,
    userName: string,
    orderDetails: {
      orderId: string;
      productName: string;
      status: string;
      trackingNumber?: string;
      estimatedDelivery?: Date;
    }
  ): Promise<NotificationResult> {
    return NotificationService.sendEmail({
      to: userEmail,
      subject: `Order Update - ${orderDetails.productName}`,
      template: 'order_status',
      templateData: {
        name: userName,
        ...orderDetails,
        orderUrl: `${env.NEXT_PUBLIC_APP_URL}/shop/orders/${orderDetails.orderId}`,
      },
    });
  }

  /**
   * Send security alert email
   */
  static async sendSecurityAlert(
    userEmail: string,
    userName: string,
    alertType: string,
    details: Record<string, any>
  ): Promise<NotificationResult> {
    return NotificationService.sendEmail({
      to: userEmail,
      subject: 'Security Alert - PBCEx Account',
      template: 'security_alert',
      templateData: {
        name: userName,
        alertType,
        ...details,
        securityUrl: `${env.NEXT_PUBLIC_APP_URL}/account/security`,
      },
    });
  }

  /**
   * Send SMS verification code
   */
  static async sendVerificationCode(
    phoneNumber: string,
    code: string
  ): Promise<NotificationResult> {
    return NotificationService.sendSMS({
      to: phoneNumber,
      message: `Your PBCEx verification code is: ${code}. Valid for 10 minutes. Do not share this code.`,
    });
  }

  /**
   * Send SMS for high-value trade alert
   */
  static async sendTradeAlertSMS(
    phoneNumber: string,
    tradeAmount: string,
    asset: string
  ): Promise<NotificationResult> {
    return NotificationService.sendSMS({
      to: phoneNumber,
      message: `PBCEx Alert: Large trade executed - ${tradeAmount} ${asset}. If this wasn't you, contact support immediately.`,
    });
  }

  // Private initialization methods

  private static async initializeEmail(): Promise<void> {
    if (integrations.sendgrid && env.SENDGRID_API_KEY) {
      // Use SendGrid SMTP
      NotificationService.emailTransporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: env.SENDGRID_API_KEY,
        },
      });

      // Verify connection
      await NotificationService.emailTransporter.verify();
      logInfo('SendGrid email service initialized');

    } else {
      // Use local SMTP for development (MailDev)
      NotificationService.emailTransporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025,
        secure: false,
      });

      logInfo('Local SMTP email service initialized (MailDev)');
    }
  }

  private static async initializeSMS(): Promise<void> {
    if (integrations.twilio && env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
      NotificationService.twilioClient = new Twilio(
        env.TWILIO_ACCOUNT_SID,
        env.TWILIO_AUTH_TOKEN
      );

      // Test connection by fetching account info
      await NotificationService.twilioClient.api.accounts(env.TWILIO_ACCOUNT_SID).fetch();
      logInfo('Twilio SMS service initialized');

    } else {
      logWarn('Twilio not configured, SMS will be mocked');
    }
  }

  private static async initializeIntercom(): Promise<void> {
    if (integrations.intercom && env.INTERCOM_ACCESS_TOKEN) {
      // Test Intercom connection
      try {
        await axios.get('https://api.intercom.io/me', {
          headers: {
            'Authorization': `Bearer ${env.INTERCOM_ACCESS_TOKEN}`,
            'Accept': 'application/json',
          },
        });
        logInfo('Intercom service initialized');
      } catch (error) {
        logWarn('Intercom connection test failed, will mock tickets');
      }
    } else {
      logWarn('Intercom not configured, support tickets will be mocked');
    }
  }

  private static generateHtmlFromTemplate(
    templateName?: string, 
    data?: Record<string, any>
  ): string {
    if (!templateName || !data) {
      return '<html><body>No template content</body></html>';
    }

    // Simple template engine - in production, use a proper template engine
    const templates: Record<string, string> = {
      welcome: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b;">Welcome to PBCEx, {{name}}!</h1>
            <p>Thank you for joining the People's Bank & Commodities Exchange.</p>
            <p>Your account is ready to use. You can start trading precious metals right away:</p>
            <ul>
              <li>Gold (PAXG) - Real custody-backed gold</li>
              <li>Silver, Platinum, Palladium, Copper - Synthetic trading assets</li>
              <li>Physical delivery through our shop</li>
            </ul>
            <p><a href="{{loginUrl}}" style="background-color: #f59e0b; color: white; padding: 10px 20px; text-decoration: none;">Login to Your Account</a></p>
            <p>If you have any questions, please contact us at {{supportEmail}}.</p>
            <p>Best regards,<br>The PBCEx Team</p>
          </body>
        </html>
      `,
      kyc_status: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b;">KYC Status Update</h1>
            <p>Hi {{name}},</p>
            <p>Your KYC verification status has been updated to: <strong>{{status}}</strong></p>
            <p>{{statusMessage}}</p>
            {{#notes}}<p><em>Additional notes: {{notes}}</em></p>{{/notes}}
            <p><a href="{{dashboardUrl}}" style="background-color: #f59e0b; color: white; padding: 10px 20px; text-decoration: none;">View Dashboard</a></p>
            <p>Best regards,<br>The PBCEx Team</p>
          </body>
        </html>
      `,
      trade_confirmation: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b;">Trade Confirmation</h1>
            <p>Hi {{name}},</p>
            <p>Your trade has been executed successfully:</p>
            <table border="1" style="border-collapse: collapse; width: 100%;">
              <tr><td><strong>Trade ID:</strong></td><td>{{tradeId}}</td></tr>
              <tr><td><strong>From:</strong></td><td>{{amount}} {{fromAsset}}</td></tr>
              <tr><td><strong>To:</strong></td><td>{{toAsset}}</td></tr>
              <tr><td><strong>Price:</strong></td><td>{{price}}</td></tr>
              <tr><td><strong>Fee:</strong></td><td>{{fee}}</td></tr>
              <tr><td><strong>Executed:</strong></td><td>{{executedAt}}</td></tr>
            </table>
            <p><a href="{{historyUrl}}" style="background-color: #f59e0b; color: white; padding: 10px 20px; text-decoration: none;">View Trade History</a></p>
            <p>Best regards,<br>The PBCEx Team</p>
          </body>
        </html>
      `,
    };

    let template = templates[templateName] || '<html><body>Template not found</body></html>';

    // Simple variable substitution
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, String(value));
    });

    return template;
  }

  /**
   * Get notification service health status
   */
  static getHealthStatus(): {
    email: { status: string; provider: string };
    sms: { status: string; provider: string };
    support: { status: string; provider: string };
  } {
    return {
      email: {
        status: NotificationService.emailTransporter ? 'connected' : 'mock',
        provider: integrations.sendgrid ? 'SendGrid' : 'Local SMTP',
      },
      sms: {
        status: NotificationService.twilioClient ? 'connected' : 'mock',
        provider: integrations.twilio ? 'Twilio' : 'Mock',
      },
      support: {
        status: integrations.intercom ? 'connected' : 'mock',
        provider: integrations.intercom ? 'Intercom' : 'Mock',
      },
    };
  }

  /**
   * Send bulk notifications (for admin alerts, etc.)
   */
  static async sendBulkNotification(
    type: 'email' | 'sms',
    recipients: string[],
    content: EmailOptions | SMSOptions
  ): Promise<NotificationResult[]> {
    logInfo('Sending bulk notification', { 
      type, 
      recipientCount: recipients.length 
    });

    const results: NotificationResult[] = [];
    const batchSize = 10; // Process in batches to avoid rate limits

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipient) => {
        try {
          if (type === 'email') {
            return await NotificationService.sendEmail({
              ...content as EmailOptions,
              to: recipient,
            });
          } else {
            return await NotificationService.sendSMS({
              ...content as SMSOptions,
              to: recipient,
            });
          }
        } catch (error) {
          return {
            success: false,
            error: (error as Error).message,
            provider: 'MOCK' as const,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to respect rate limits
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    logInfo('Bulk notification completed', { 
      total: results.length,
      successful: successCount,
      failed: results.length - successCount,
    });

    return results;
  }
}

export default NotificationService;
