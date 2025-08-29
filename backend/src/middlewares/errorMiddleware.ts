import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { env } from '@/config/env';
import { API_CODES } from '@/utils/constants';
import { logError } from '@/utils/logger';

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = API_CODES.INTERNAL_ERROR,
    isOperational: boolean = true,
    details?: Record<string, any>
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error factories
 */
export const createError = {
  validation: (message: string, details?: Record<string, any>) => 
    new AppError(message, 400, API_CODES.VALIDATION_ERROR, true, details),

  authentication: (message: string = 'Authentication required') =>
    new AppError(message, 401, API_CODES.AUTHENTICATION_ERROR, true),

  authorization: (message: string = 'Insufficient permissions') =>
    new AppError(message, 403, API_CODES.AUTHORIZATION_ERROR, true),

  notFound: (resource: string = 'Resource') =>
    new AppError(`${resource} not found`, 404, API_CODES.NOT_FOUND, true),

  conflict: (message: string, details?: Record<string, any>) =>
    new AppError(message, 409, API_CODES.CONFLICT, true, details),

  rateLimited: (message: string = 'Too many requests') =>
    new AppError(message, 429, API_CODES.RATE_LIMITED, true),

  serviceUnavailable: (service: string, message?: string) =>
    new AppError(
      message || `${service} service is currently unavailable`,
      503,
      API_CODES.SERVICE_UNAVAILABLE,
      true,
      { service }
    ),

  internal: (message: string = 'Internal server error', details?: Record<string, any>) =>
    new AppError(message, 500, API_CODES.INTERNAL_ERROR, false, details),
};

/**
 * Handle Zod validation errors
 */
function handleZodError(error: ZodError): AppError {
  const details = {
    validationErrors: error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
      code: err.code,
    })),
  };

  return createError.validation('Request validation failed', details);
}

/**
 * Handle database errors
 */
function handleDatabaseError(error: any): AppError {
  // PostgreSQL error codes
  switch (error.code) {
    case '23505': // Unique violation
      return createError.conflict('Resource already exists', {
        constraint: error.constraint,
        detail: error.detail,
      });

    case '23503': // Foreign key violation
      return createError.validation('Referenced resource does not exist', {
        constraint: error.constraint,
        detail: error.detail,
      });

    case '23502': // Not null violation
      return createError.validation('Required field is missing', {
        column: error.column,
      });

    case '42P01': // Undefined table
      return createError.internal('Database schema error', {
        table: error.table,
      });

    case '28P01': // Invalid password
    case '28000': // Invalid authorization
      return createError.internal('Database connection error');

    case '08006': // Connection failure
    case '08001': // Unable to connect
      return createError.serviceUnavailable('Database', 'Database connection failed');

    default:
      // Log unknown database errors for investigation
      logError('Unknown database error', error);
      return createError.internal('Database operation failed');
  }
}

/**
 * Handle JWT errors
 */
function handleJwtError(error: any): AppError {
  switch (error.name) {
    case 'JsonWebTokenError':
      return createError.authentication('Invalid token');
    
    case 'TokenExpiredError':
      return createError.authentication('Token expired');
    
    case 'NotBeforeError':
      return createError.authentication('Token not active');
    
    default:
      return createError.authentication('Token verification failed');
  }
}

/**
 * Handle multer (file upload) errors
 */
function handleMulterError(error: any): AppError {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return createError.validation('File size too large', {
        maxSize: error.limit,
        fieldname: error.field,
      });

    case 'LIMIT_FILE_COUNT':
      return createError.validation('Too many files', {
        maxCount: error.limit,
        fieldname: error.field,
      });

    case 'LIMIT_UNEXPECTED_FILE':
      return createError.validation('Unexpected file field', {
        fieldname: error.field,
      });

    case 'MISSING_FIELD_NAME':
      return createError.validation('File field name is required');

    default:
      return createError.validation('File upload error', {
        code: error.code,
      });
  }
}

/**
 * Main error handling middleware
 */
export const errorHandler: ErrorRequestHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let appError: AppError;

  // Handle known error types
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof ZodError) {
    appError = handleZodError(error);
  } else if (error.name && error.name.includes('JsonWebToken')) {
    appError = handleJwtError(error);
  } else if (error.code && typeof error.code === 'string' && error.code.startsWith('23')) {
    appError = handleDatabaseError(error);
  } else if (error.code && error.code.startsWith('LIMIT_')) {
    appError = handleMulterError(error);
  } else if (error.code === 'ECONNREFUSED') {
    appError = createError.serviceUnavailable('External service', 'Connection refused');
  } else if (error.code === 'ETIMEDOUT') {
    appError = createError.serviceUnavailable('External service', 'Request timeout');
  } else {
    // Unknown error - log for investigation
    logError('Unhandled error', error);
    appError = createError.internal('An unexpected error occurred');
  }

  // Log operational errors as warnings, programming errors as errors
  if (appError.isOperational) {
    logError(`Operational error: ${appError.message}`, {
      statusCode: appError.statusCode,
      code: appError.code,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      details: appError.details,
    });
  } else {
    logError(`Programming error: ${appError.message}`, {
      error: {
        message: appError.message,
        stack: appError.stack,
        statusCode: appError.statusCode,
        code: appError.code,
      },
      request: {
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body,
        params: req.params,
        query: req.query,
      },
      user: req.user,
    });
  }

  // Send error response
  const response: any = {
    code: appError.code,
    message: appError.message,
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  // Include details in development or for validation errors
  if (env.NODE_ENV === 'development' || appError.code === API_CODES.VALIDATION_ERROR) {
    if (appError.details) {
      response.details = appError.details;
    }

    // Include stack trace in development
    if (env.NODE_ENV === 'development') {
      response.stack = appError.stack;
    }
  }

  res.status(appError.statusCode).json(response);
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const error = createError.notFound(`Route ${req.method} ${req.path}`);
  
  res.status(error.statusCode).json({
    code: error.code,
    message: error.message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  });
};

/**
 * Async error wrapper - catches async errors and passes to error handler
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Process uncaught exceptions and unhandled rejections
 */
export function setupGlobalErrorHandling(): void {
  process.on('uncaughtException', (error: Error) => {
    logError('Uncaught Exception', error);
    
    // Give time for logs to flush before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logError('Unhandled Rejection', {
      reason,
      promise: promise.toString(),
    });
    
    // Don't exit on unhandled rejection in development
    if (env.NODE_ENV === 'production') {
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    }
  });
}

/**
 * Graceful shutdown helper
 */
export function gracefulShutdown(server: any, signal: string): void {
  logError(`Received ${signal}. Graceful shutdown initiated.`);
  
  server.close(() => {
    logError('HTTP server closed.');
    
    // Close database connections, redis, etc.
    // Add cleanup logic here
    
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logError('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}
