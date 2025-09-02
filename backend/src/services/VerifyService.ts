import { Twilio } from 'twilio';
import { logInfo, logWarn, logError } from '@/utils/logger';
import { env, integrations } from '@/config/env';

/**
 * Twilio Verify Service for PBCEx
 * Production-quality 2FA verification service using Twilio Verify API
 */

export interface VerificationStartOptions {
  phone: string;
  channel?: 'sms' | 'call';
  locale?: string;
}

export interface VerificationCheckOptions {
  phone: string;
  code: string;
}

export interface VerificationResult {
  success: boolean;
  status?: string;
  sid?: string;
  error?: string;
  provider: 'TWILIO' | 'MOCK';
  correlationId: string;
}

export class VerifyService {
  private static twilioClient: Twilio | null = null;
  private static isInitialized = false;
  private static rateLimitStore = new Map<
    string,
    { attempts: number; lastAttempt: Date }
  >();

  // Rate limiting constants
  private static readonly MAX_ATTEMPTS_PER_PHONE = 5;
  private static readonly RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private static readonly MAX_ATTEMPTS_PER_IP = 10;

  /**
   * Initialize Verify service with Twilio
   */
  static async initialize(): Promise<void> {
    if (VerifyService.isInitialized) {
      logWarn('VerifyService already initialized');
      return;
    }

    logInfo('Initializing VerifyService with Twilio Verify');

    try {
      if (
        integrations.twilioVerify &&
        env.TWILIO_ACCOUNT_SID &&
        env.TWILIO_AUTH_TOKEN
      ) {
        VerifyService.twilioClient = new Twilio(
          env.TWILIO_ACCOUNT_SID,
          env.TWILIO_AUTH_TOKEN
        );

        // Test connection by fetching service
        if (env.TWILIO_VERIFY_SERVICE_SID) {
          await VerifyService.twilioClient.verify.v2
            .services(env.TWILIO_VERIFY_SERVICE_SID)
            .fetch();
          logInfo('Twilio Verify service initialized successfully');
        } else {
          logWarn('TWILIO_VERIFY_SERVICE_SID not configured');
        }
      } else {
        logWarn(
          'Twilio Verify not fully configured, verification will be mocked'
        );
      }

      VerifyService.isInitialized = true;
      logInfo('VerifyService initialized');
    } catch (error) {
      logError('Failed to initialize VerifyService', error as Error);
      // Continue with mock service
    }
  }

  /**
   * Start phone number verification
   */
  static async startVerification(
    phone: string,
    options: Partial<VerificationStartOptions> = {}
  ): Promise<VerificationResult> {
    const correlationId = Math.random().toString(36).substr(2, 9);

    logInfo('Starting phone verification', {
      phone: VerifyService.maskPhone(phone),
      channel: options.channel || 'sms',
      correlationId,
    });

    // Input validation
    if (!phone) {
      const error = 'Phone number is required';
      logError(error, { correlationId });
      return {
        success: false,
        error,
        provider: 'TWILIO',
        correlationId,
      };
    }

    // Phone format validation and normalization
    const normalizedPhone = VerifyService.normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      const error = 'Invalid phone number format';
      logError(error, {
        phone: VerifyService.maskPhone(phone),
        correlationId,
      });
      return {
        success: false,
        error,
        provider: 'TWILIO',
        correlationId,
      };
    }

    // Rate limiting check
    const rateLimitResult = VerifyService.checkRateLimit(normalizedPhone);
    if (!rateLimitResult.allowed) {
      logWarn('Verification rate limit exceeded', {
        phone: VerifyService.maskPhone(normalizedPhone),
        remainingTime: rateLimitResult.remainingTime,
        correlationId,
      });
      return {
        success: false,
        error: `Rate limit exceeded. Try again in ${Math.ceil(rateLimitResult.remainingTime! / 60000)} minutes`,
        provider: 'TWILIO',
        correlationId,
      };
    }

    try {
      if (
        integrations.twilioVerify &&
        VerifyService.twilioClient &&
        env.TWILIO_VERIFY_SERVICE_SID
      ) {
        // Send via Twilio Verify
        const verification = await VerifyService.twilioClient.verify.v2
          .services(env.TWILIO_VERIFY_SERVICE_SID)
          .verifications.create({
            to: normalizedPhone,
            channel: options.channel || 'sms',
            ...(options.locale && { locale: options.locale }),
          });

        // Track rate limiting
        VerifyService.updateRateLimit(normalizedPhone);

        logInfo('Verification started via Twilio', {
          phone: VerifyService.maskPhone(normalizedPhone),
          status: verification.status,
          sid: verification.sid,
          correlationId,
        });

        return {
          success: true,
          status: verification.status,
          sid: verification.sid,
          provider: 'TWILIO',
          correlationId,
        };
      } else {
        // Mock verification for development
        logInfo('Verification started (mock)', {
          phone: VerifyService.maskPhone(normalizedPhone),
          channel: options.channel || 'sms',
          correlationId,
          reason: integrations.twilioVerify
            ? 'Missing service configuration'
            : 'Twilio Verify not configured',
        });

        // Track rate limiting even in mock mode
        VerifyService.updateRateLimit(normalizedPhone);

        return {
          success: true,
          status: 'pending',
          sid: `mock_verification_${Date.now()}_${correlationId}`,
          provider: 'MOCK',
          correlationId,
        };
      }
    } catch (error) {
      logError('Failed to start verification', {
        error: error as Error,
        phone: VerifyService.maskPhone(normalizedPhone),
        correlationId,
      });

      return {
        success: false,
        error: (error as Error).message,
        provider: integrations.twilioVerify ? 'TWILIO' : 'MOCK',
        correlationId,
      };
    }
  }

  /**
   * Check verification code
   */
  static async checkVerification(
    phone: string,
    code: string
  ): Promise<VerificationResult> {
    const correlationId = Math.random().toString(36).substr(2, 9);

    logInfo('Checking verification code', {
      phone: VerifyService.maskPhone(phone),
      codeLength: code?.length,
      correlationId,
    });

    // Input validation
    if (!phone || !code) {
      const error = 'Phone number and verification code are required';
      logError(error, { correlationId });
      return {
        success: false,
        error,
        provider: 'TWILIO',
        correlationId,
      };
    }

    // Phone format validation and normalization
    const normalizedPhone = VerifyService.normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      const error = 'Invalid phone number format';
      logError(error, {
        phone: VerifyService.maskPhone(phone),
        correlationId,
      });
      return {
        success: false,
        error,
        provider: 'TWILIO',
        correlationId,
      };
    }

    // Code format validation
    if (!/^\d{4,8}$/.test(code)) {
      const error = 'Invalid verification code format';
      logError(error, { correlationId });
      return {
        success: false,
        error,
        provider: 'TWILIO',
        correlationId,
      };
    }

    try {
      if (
        integrations.twilioVerify &&
        VerifyService.twilioClient &&
        env.TWILIO_VERIFY_SERVICE_SID
      ) {
        // Check via Twilio Verify
        const verificationCheck = await VerifyService.twilioClient.verify.v2
          .services(env.TWILIO_VERIFY_SERVICE_SID)
          .verificationChecks.create({
            to: normalizedPhone,
            code: code,
          });

        const isApproved = verificationCheck.status === 'approved';

        logInfo('Verification check completed via Twilio', {
          phone: VerifyService.maskPhone(normalizedPhone),
          status: verificationCheck.status,
          approved: isApproved,
          correlationId,
        });

        return {
          success: isApproved,
          status: verificationCheck.status,
          sid: verificationCheck.sid,
          provider: 'TWILIO',
          correlationId,
        };
      } else {
        // Mock verification check
        const isApproved = VerifyService.shouldApproveMockVerification(code);

        logInfo('Verification check completed (mock)', {
          phone: VerifyService.maskPhone(normalizedPhone),
          approved: isApproved,
          correlationId,
          reason: integrations.twilioVerify
            ? 'Missing service configuration'
            : 'Twilio Verify not configured',
        });

        return {
          success: isApproved,
          status: isApproved ? 'approved' : 'pending',
          sid: `mock_check_${Date.now()}_${correlationId}`,
          provider: 'MOCK',
          correlationId,
        };
      }
    } catch (error) {
      logError('Failed to check verification', {
        error: error as Error,
        phone: VerifyService.maskPhone(normalizedPhone),
        correlationId,
      });

      return {
        success: false,
        error: (error as Error).message,
        provider: integrations.twilioVerify ? 'TWILIO' : 'MOCK',
        correlationId,
      };
    }
  }

  /**
   * Get Verify service health status
   */
  static getHealthStatus(): {
    status: string;
    provider: string;
    configured: boolean;
    serviceConfigured: boolean;
  } {
    return {
      status: VerifyService.twilioClient ? 'connected' : 'mock',
      provider: integrations.twilioVerify ? 'Twilio Verify' : 'Mock',
      configured: integrations.twilioVerify,
      serviceConfigured: !!env.TWILIO_VERIFY_SERVICE_SID,
    };
  }

  // Private helper methods

  /**
   * Normalize phone number to E.164 format
   */
  private static normalizePhoneNumber(phone: string): string | null {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Handle US numbers (add +1 if missing)
    if (digits.length === 10 && digits[0] !== '1') {
      return `+1${digits}`;
    }

    // Handle international numbers (add + if missing)
    if (digits.length >= 10 && digits.length <= 15) {
      return digits.startsWith('1') || digits.startsWith('+')
        ? `+${digits}`
        : `+${digits}`;
    }

    // If already in E.164 format
    if (phone.startsWith('+') && /^\+\d{10,15}$/.test(phone)) {
      return phone;
    }

    return null;
  }

  /**
   * Mask phone number for logging (privacy)
   */
  private static maskPhone(phone: string): string {
    if (!phone) return '***';

    // Show only first 3 and last 2 digits
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 6) {
      return `+***${digits.slice(-2)}`;
    }
    return '+***';
  }

  /**
   * Check if request is within rate limits
   */
  private static checkRateLimit(phone: string): {
    allowed: boolean;
    remainingTime?: number;
  } {
    const now = new Date();
    const key = phone;
    const record = VerifyService.rateLimitStore.get(key);

    if (!record) {
      return { allowed: true };
    }

    const timeSinceLastAttempt = now.getTime() - record.lastAttempt.getTime();

    // Reset if outside window
    if (timeSinceLastAttempt > VerifyService.RATE_LIMIT_WINDOW_MS) {
      VerifyService.rateLimitStore.delete(key);
      return { allowed: true };
    }

    // Check if exceeded max attempts
    if (record.attempts >= VerifyService.MAX_ATTEMPTS_PER_PHONE) {
      const remainingTime =
        VerifyService.RATE_LIMIT_WINDOW_MS - timeSinceLastAttempt;
      return {
        allowed: false,
        remainingTime,
      };
    }

    return { allowed: true };
  }

  /**
   * Update rate limit tracking
   */
  private static updateRateLimit(phone: string): void {
    const now = new Date();
    const key = phone;
    const record = VerifyService.rateLimitStore.get(key);

    if (record) {
      record.attempts += 1;
      record.lastAttempt = now;
    } else {
      VerifyService.rateLimitStore.set(key, {
        attempts: 1,
        lastAttempt: now,
      });
    }
  }

  /**
   * Mock verification approval logic for development
   */
  private static shouldApproveMockVerification(code: string): boolean {
    // In mock mode, approve specific test codes or codes ending in certain digits
    const testCodes = ['123456', '000000', '111111'];
    return testCodes.includes(code) || code.endsWith('00');
  }

  /**
   * Clean up expired rate limit entries
   */
  private static cleanupRateLimits(): void {
    const now = new Date();
    for (const [key, record] of VerifyService.rateLimitStore.entries()) {
      const age = now.getTime() - record.lastAttempt.getTime();
      if (age > VerifyService.RATE_LIMIT_WINDOW_MS * 2) {
        VerifyService.rateLimitStore.delete(key);
      }
    }
  }

  /**
   * Shutdown service gracefully
   */
  static async shutdown(): Promise<void> {
    logInfo('Shutting down VerifyService');

    // Clean up rate limiting store
    VerifyService.rateLimitStore.clear();

    VerifyService.twilioClient = null;
    VerifyService.isInitialized = false;
    logInfo('VerifyService shut down');
  }

  // Lifecycle management for cleanup timer
  private static cleanupTimer: NodeJS.Timeout | null = null;

  static start(): void {
    if (this.cleanupTimer || process.env.NODE_ENV === 'test') return;
    this.cleanupTimer = setInterval(
      () => {
        VerifyService.cleanupRateLimits();
      },
      5 * 60 * 1000
    ); // Every 5 minutes
  }

  static stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

export default VerifyService;
