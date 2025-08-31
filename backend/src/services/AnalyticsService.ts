import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { env } from '../config/env';

/**
 * Analytics Service for PBCEx
 * 
 * Handles:
 * - A/B experiment event logging
 * - User behavior tracking (non-PII)
 * - Performance metrics
 * - Business event logging
 * - Data privacy compliance
 * 
 * Features:
 * - Automatic PII redaction
 * - Structured event logging
 * - Batch processing support
 * - Multiple output destinations
 */

// Event schema for validation
const AnalyticsEventSchema = z.object({
  eventType: z.string(),
  userId: z.string().optional(), // Optional for anonymous events
  sessionId: z.string().optional(),
  timestamp: z.string(),
  properties: z.record(z.any()).default({}),
  context: z.object({
    userAgent: z.string().optional(),
    ip: z.string().optional(),
    platform: z.string().optional(),
    version: z.string().optional()
  }).optional(),
  experimentData: z.object({
    experimentKey: z.string(),
    variant: z.string(),
    bucketHash: z.string().optional()
  }).optional()
});

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;

// Pre-defined event types for consistency
export const EventTypes = {
  // User lifecycle
  USER_REGISTERED: 'user_registered',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  
  // KYC events
  KYC_STARTED: 'kyc_started',
  KYC_SUBMITTED: 'kyc_submitted',
  KYC_APPROVED: 'kyc_approved',
  KYC_REJECTED: 'kyc_rejected',
  
  // Trading events
  TRADE_INITIATED: 'trade_initiated',
  TRADE_COMPLETED: 'trade_completed',
  TRADE_FAILED: 'trade_failed',
  PRICE_CHECKED: 'price_checked',
  
  // Shop events
  PRODUCT_VIEWED: 'product_viewed',
  QUOTE_LOCKED: 'quote_locked',
  CHECKOUT_INITIATED: 'checkout_initiated',
  ORDER_PLACED: 'order_placed',
  
  // Phase-3 events
  REDEMPTION_REQUESTED: 'redemption_requested',
  REDEMPTION_APPROVED: 'redemption_approved',
  SUPPORT_TICKET_CREATED: 'support_ticket_created',
  
  // A/B experiment events
  EXPERIMENT_ASSIGNMENT: 'experiment_assignment',
  EXPERIMENT_CONVERSION: 'experiment_conversion',
  EXPERIMENT_VIEW: 'experiment_view',
  
  // Performance events
  PAGE_LOAD: 'page_load',
  API_CALL: 'api_call',
  ERROR_OCCURRED: 'error_occurred',
  
  // Business metrics
  BALANCE_CHECKED: 'balance_checked',
  WITHDRAWAL_REQUESTED: 'withdrawal_requested',
  DEPOSIT_COMPLETED: 'deposit_completed'
} as const;

// PII fields that should be redacted
const PII_FIELDS = [
  'email', 'phone', 'ssn', 'passport', 'address', 'firstName', 'lastName',
  'fullName', 'dateOfBirth', 'bankAccount', 'creditCard', 'driversLicense'
];

// Sensitive fields that should be redacted
const SENSITIVE_FIELDS = [
  'password', 'token', 'secret', 'key', 'authorization', 'cookie',
  'session', 'pin', 'otp', 'signature'
];

export class AnalyticsService {
  private static logFilePath = path.join(process.cwd(), 'logs', 'analytics.log');
  private static errorLogPath = path.join(process.cwd(), 'logs', 'analytics-errors.log');
  private static batchQueue: AnalyticsEvent[] = [];
  private static batchTimer: NodeJS.Timeout | null = null;
  private static readonly BATCH_SIZE = 100;
  private static readonly BATCH_TIMEOUT = 5000; // 5 seconds

  /**
   * Initialize analytics service
   */
  static initialize(): void {
    // Ensure log directory exists
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    if (env.NODE_ENV === 'development') {
      console.log('📊 AnalyticsService initialized');
      console.log(`  📁 Log file: ${this.logFilePath}`);
    }
  }

  /**
   * Log an analytics event
   */
  static async logEvent(event: Partial<AnalyticsEvent>): Promise<void> {
    try {
      // Ensure timestamp is set
      const eventWithTimestamp = {
        ...event,
        timestamp: event.timestamp || new Date().toISOString()
      };

      // Validate event structure
      const validatedEvent = AnalyticsEventSchema.parse(eventWithTimestamp);

      // Redact PII and sensitive data
      const sanitizedEvent = this.sanitizeEvent(validatedEvent);

      // Add to batch queue
      this.batchQueue.push(sanitizedEvent);

      // Process batch if size limit reached
      if (this.batchQueue.length >= this.BATCH_SIZE) {
        await this.processBatch();
      } else if (!this.batchTimer) {
        // Set timer for batch processing
        this.batchTimer = setTimeout(() => {
          this.processBatch();
        }, this.BATCH_TIMEOUT);
      }

    } catch (error) {
      this.logError('Failed to log analytics event', { 
        event, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Log user action with context
   */
  static async logUserAction(
    userId: string,
    action: string,
    properties?: Record<string, any>,
    context?: AnalyticsEvent['context']
  ): Promise<void> {
    await this.logEvent({
      eventType: action,
      userId,
      properties: properties || {},
      context
    });
  }

  /**
   * Log A/B experiment event
   */
  static async logExperimentEvent(
    userId: string,
    experimentKey: string,
    variant: string,
    eventType: 'assignment' | 'view' | 'conversion',
    properties?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      eventType: `experiment_${eventType}`,
      userId,
      properties: properties || {},
      experimentData: {
        experimentKey,
        variant
      }
    });
  }

  /**
   * Log business metric
   */
  static async logBusinessMetric(
    metricName: string,
    value: number,
    unit?: string,
    userId?: string,
    additionalProperties?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      eventType: 'business_metric',
      userId,
      properties: {
        metricName,
        value,
        unit,
        ...additionalProperties
      }
    });
  }

  /**
   * Log performance metric
   */
  static async logPerformanceMetric(
    operation: string,
    duration: number,
    success: boolean,
    additionalProperties?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      eventType: 'performance_metric',
      properties: {
        operation,
        duration,
        success,
        ...additionalProperties
      }
    });
  }

  /**
   * Log API call metrics
   */
  static async logApiCall(
    method: string,
    endpoint: string,
    statusCode: number,
    responseTime: number,
    userId?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: EventTypes.API_CALL,
      userId,
      properties: {
        method,
        endpoint: this.sanitizeEndpoint(endpoint),
        statusCode,
        responseTime,
        success: statusCode >= 200 && statusCode < 400
      }
    });
  }

  /**
   * Log error event
   */
  static async logErrorEvent(
    errorType: string,
    errorData: Record<string, any>,
    userId?: string
  ): Promise<void> {
    // Sanitize error data to remove sensitive information
    const sanitizedData = this.sanitizeObject(errorData);

    await this.logEvent({
      eventType: EventTypes.ERROR_OCCURRED,
      userId,
      properties: {
        errorType,
        ...sanitizedData
      }
    });
  }

  /**
   * Get analytics summary for a time period
   */
  static async getAnalyticsSummary(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    experimentStats: Record<string, any>;
    performanceMetrics: Record<string, any>;
  }> {
    // In a real implementation, this would query a proper analytics database
    // For now, return stub data
    return {
      totalEvents: 0,
      eventsByType: {},
      experimentStats: {},
      performanceMetrics: {}
    };
  }

  /**
   * Flush all pending events
   */
  static async flush(): Promise<void> {
    if (this.batchQueue.length > 0) {
      await this.processBatch();
    }
  }

  // Private methods

  private static async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const batch = [...this.batchQueue];
    this.batchQueue = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    try {
      // Write batch to log file
      await this.writeBatchToLog(batch);

      // In production, you might also send to external analytics service
      // await this.sendToExternalService(batch);

    } catch (error) {
      this.logError('Failed to process analytics batch', { 
        batchSize: batch.length, 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private static async writeBatchToLog(events: AnalyticsEvent[]): Promise<void> {
    const logEntries = events.map(event => JSON.stringify(event)).join('\n') + '\n';
    
    return new Promise((resolve, reject) => {
      fs.appendFile(this.logFilePath, logEntries, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private static sanitizeEvent(event: AnalyticsEvent): AnalyticsEvent {
    return {
      ...event,
      properties: this.sanitizeObject(event.properties || {}),
      context: event.context ? this.sanitizeObject(event.context) : undefined
    };
  }

  private static sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    Object.entries(obj).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      
      // Check if field contains PII or sensitive data
      const isPII = PII_FIELDS.some(field => lowerKey.includes(field.toLowerCase()));
      const isSensitive = SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()));
      
      if (isPII || isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }

  private static sanitizeEndpoint(endpoint: string): string {
    // Replace UUIDs and other identifiers with placeholders
    return endpoint
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/{uuid}')
      .replace(/\/\d+/g, '/{id}')
      .replace(/\/[a-zA-Z0-9]{20,}/g, '/{token}');
  }

  private static logError(message: string, data: Record<string, any>): void {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      ...this.sanitizeObject(data)
    };

    // Write to error log
    fs.appendFile(
      this.errorLogPath,
      JSON.stringify(errorEntry) + '\n',
      (err) => {
        if (err) {
          console.error('Failed to write analytics error log:', err);
        }
      }
    );

    // Also log to console in development
    if (env.NODE_ENV === 'development') {
      console.error('📊 Analytics Error:', message, data);
    }
  }

  /**
   * Helper method to generate standard context from request
   */
  static contextFromRequest(req: any): AnalyticsEvent['context'] {
    return {
      userAgent: req.headers?.['user-agent'],
      ip: this.sanitizeIP(req.ip || req.connection?.remoteAddress),
      platform: this.detectPlatform(req.headers?.['user-agent']),
      version: env.API_VERSION || '1.0.0'
    };
  }

  private static sanitizeIP(ip?: string): string | undefined {
    if (!ip) return undefined;
    
    // In production, you might want to hash IPs or remove last octet for privacy
    // For now, just return the IP (but this should be configured based on privacy requirements)
    return ip.includes('::') ? 'ipv6' : 'ipv4';
  }

  private static detectPlatform(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile')) return 'mobile';
    if (ua.includes('tablet')) return 'tablet';
    return 'desktop';
  }
}

// Initialize the service
AnalyticsService.initialize();

// Graceful shutdown - flush pending events
process.on('SIGTERM', async () => {
  await AnalyticsService.flush();
});

process.on('SIGINT', async () => {
  await AnalyticsService.flush();
});
