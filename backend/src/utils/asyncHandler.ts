import { Request, Response, NextFunction } from 'express';

/**
 * Wrapper for async route handlers to catch errors
 */
export const asyncHandler = <T extends Request = Request>(
  fn: (req: T, res: Response) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as T, res)).catch(next);
  };
};

/**
 * Wrapper for async route handlers with authenticated requests
 */
export const asyncHandlerAuth = (
  fn: (req: any, res: Response) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
};
