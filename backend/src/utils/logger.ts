import winston from 'winston';
import { env } from '@/config/env';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Colors for different log levels
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Redaction patterns for sensitive data
const REDACTION_PATTERNS = [
  /("password":\s*")[^"]*(")/gi,
  /("token":\s*")[^"]*(")/gi,
  /("secret":\s*")[^"]*(")/gi,
  /("authorization":\s*")[^"]*(")/gi,
  /("api_key":\s*")[^"]*(")/gi,
  /("ssn":\s*")[^"]*(")/gi,
  /("ein":\s*")[^"]*(")/gi,
  /(Bearer\s+)[^\s]+/gi,
  /(sk_[a-zA-Z0-9_]+)/gi, // Stripe secret keys
  /(\b\d{3}-\d{2}-\d{4}\b)/g, // SSN format
  /(\b\d{2}-\d{7}\b)/g, // EIN format
];

/**
 * Redact sensitive information from log messages
 */
function redactSensitiveInfo(message: string): string {
  let redacted = message;
  REDACTION_PATTERNS.forEach(pattern => {
    redacted = redacted.replace(pattern, (match, p1, p2) => {
      if (p1 && p2) {
        return `${p1}[REDACTED]${p2}`;
      }
      return '[REDACTED]';
    });
  });
  return redacted;
}

// Custom format that redacts sensitive information
const redactFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  const redactedMessage = typeof message === 'string' ? redactSensitiveInfo(message) : message;
  const redactedMeta = JSON.parse(redactSensitiveInfo(JSON.stringify(meta)));
  
  const metaString = Object.keys(redactedMeta).length > 0 ? ` ${JSON.stringify(redactedMeta)}` : '';
  return `${timestamp} [${level.toUpperCase()}]: ${redactedMessage}${metaString}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'pbcex-api',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        redactFormat
      ),
    }),
    // Combined logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        redactFormat
      ),
    }),
  ],
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// Add console transport for development
if (env.NODE_ENV === 'development') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const redactedMessage = typeof message === 'string' ? redactSensitiveInfo(message) : message;
          const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} ${level}: ${redactedMessage}${metaString}`;
        })
      ),
    })
  );
}

// Add Datadog transport in production (if configured)
if (env.NODE_ENV === 'production' && env.DATADOG_API_KEY) {
  // This would require a Datadog Winston transport
  // For now, we'll just log that it would be configured
  logger.info('Datadog logging would be configured in production', {
    integration: 'datadog',
    configured: !!env.DATADOG_API_KEY
  });
}

/**
 * Create child logger with additional context
 */
export function createChildLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * Middleware-friendly logging functions
 */
export const logHttp = (message: string, meta?: Record<string, any>) => {
  logger.http(message, meta);
};

export const logInfo = (message: string, meta?: Record<string, any>) => {
  logger.info(message, meta);
};

export const logWarn = (message: string, meta?: Record<string, any>) => {
  logger.warn(message, meta);
};

export const logError = (message: string, error?: Error | Record<string, any>) => {
  if (error instanceof Error) {
    logger.error(message, {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
    });
  } else {
    logger.error(message, error);
  }
};

export default logger;
