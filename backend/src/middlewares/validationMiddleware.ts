import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Validation middleware for request validation using Zod schemas
 */

interface ValidatedRequest<T = unknown> extends Request {
  validatedData?: T;
}

/**
 * Validates request body against a Zod schema
 */
export function validateRequest<T>(schema: ZodSchema<T>) {
  return (req: ValidatedRequest<T>, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }
      next(error);
    }
  };
}

/**
 * Validates request query parameters against a Zod schema
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: ValidatedRequest<T>, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Query validation failed',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }
      next(error);
    }
  };
}

/**
 * Validates request parameters against a Zod schema
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: ValidatedRequest<T>, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.params);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Parameter validation failed',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }
      next(error);
    }
  };
}

/**
 * Combined validation for body, query, and params
 */
export function validateRequestFull<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
>(options: {
  body?: ZodSchema<TBody>;
  query?: ZodSchema<TQuery>;
  params?: ZodSchema<TParams>;
}) {
  return (req: ValidatedRequest, res: Response, next: NextFunction) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const validatedData: any = {};

      if (options.body) {
        validatedData.body = options.body.parse(req.body);
      }

      if (options.query) {
        validatedData.query = options.query.parse(req.query);
      }

      if (options.params) {
        validatedData.params = options.params.parse(req.params);
      }

      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }
      next(error);
    }
  };
}

export default {
  validateRequest,
  validateQuery,
  validateParams,
  validateRequestFull,
};
