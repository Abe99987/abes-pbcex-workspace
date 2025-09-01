/**
 * Structured error creation utilities
 */
export interface AppError {
  error_code: string;
  message: string;
  details?: any;
}

export const createError = {
  validation: (message: string, details?: any): AppError => ({
    error_code: 'VALIDATION_ERROR',
    message,
    details,
  }),

  authentication: (message: string = 'Authentication required'): AppError => ({
    error_code: 'AUTHENTICATION_ERROR',
    message,
  }),

  authorization: (message: string = 'Insufficient permissions'): AppError => ({
    error_code: 'AUTHORIZATION_ERROR',
    message,
  }),

  forbidden: (message: string = 'Access forbidden'): AppError => ({
    error_code: 'FORBIDDEN',
    message,
  }),

  notFound: (message: string = 'Resource not found'): AppError => ({
    error_code: 'NOT_FOUND',
    message,
  }),

  conflict: (message: string = 'Resource conflict'): AppError => ({
    error_code: 'CONFLICT',
    message,
  }),

  tooManyRequests: (message: string = 'Rate limit exceeded'): AppError => ({
    error_code: 'RATE_LIMIT_EXCEEDED',
    message,
  }),

  internal: (message: string = 'Internal server error'): AppError => ({
    error_code: 'INTERNAL_ERROR',
    message,
  }),

  serviceUnavailable: (
    message: string = 'Service temporarily unavailable'
  ): AppError => ({
    error_code: 'SERVICE_UNAVAILABLE',
    message,
  }),
};
