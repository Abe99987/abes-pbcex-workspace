import { Request, Response, NextFunction } from 'express';
import { createError } from '@/middlewares/errorMiddleware';
import { logError, logInfo, logWarn } from '@/utils/logger';
import { AuthenticatedRequest } from './auth';
import { db } from '@/db/connection';
import { createHash } from 'crypto';

export interface IdempotencyRequest extends AuthenticatedRequest {
  idempotencyKey?: string;
  idempotencyHash?: string;
}

/**
 * Middleware to handle idempotency for write operations
 */
export const idempotencyMiddleware = (
  req: IdempotencyRequest,
  res: Response,
  next: NextFunction
): void => {
  // Only apply to write operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'] as string;

  if (!idempotencyKey) {
    logWarn('No idempotency key provided for write operation', {
      method: req.method,
      path: req.path,
      userId: req.user?.id,
    });
    return next();
  }

  // Validate idempotency key format
  if (!isValidIdempotencyKey(idempotencyKey)) {
    const error = createError.validation(
      'Invalid idempotency key format. Must be a valid UUID or alphanumeric string (32-128 chars)'
    );
    return next(error);
  }

  req.idempotencyKey = idempotencyKey;

  // Create hash of request body for idempotency
  const requestHash = createRequestHash(req);
  req.idempotencyHash = requestHash;

  // Use Promise.resolve().then() to handle async operations
  Promise.resolve().then(async () => {
    try {
      // Check if we've seen this exact request before
      const existingResponse = await checkIdempotency(
        req.user?.id || 'anonymous',
        req.path,
        idempotencyKey,
        requestHash
      );

      if (existingResponse) {
        logInfo('Idempotency hit - returning cached response', {
          userId: req.user?.id,
          path: req.path,
          idempotencyKey,
        });

        // Return the cached response
        res
          .status(existingResponse.status_code)
          .json(existingResponse.response_body);
        return;
      }

      // Store the request for future idempotency checks
      await storeIdempotencyRequest(
        req.user?.id || 'anonymous',
        req.path,
        idempotencyKey,
        requestHash,
        req.body
      );

      // Override res.json to capture the response for idempotency
      const originalJson = res.json;
      res.json = function (data: any) {
        // Store the response for future idempotency checks
        storeIdempotencyResponse(
          req.user?.id || 'anonymous',
          req.path,
          idempotencyKey,
          requestHash,
          res.statusCode,
          data
        ).catch(error => {
          logError('Failed to store idempotency response', error as Error);
        });

        // Call the original json method
        return originalJson.call(this, data);
      };

      logInfo('Idempotency middleware applied', {
        userId: req.user?.id,
        path: req.path,
        idempotencyKey,
      });

      next();
    } catch (error) {
      logError('Idempotency middleware error', error as Error);
      next(error);
    }
  });
};

/**
 * Validate idempotency key format
 */
function isValidIdempotencyKey(key: string): boolean {
  // UUID format or alphanumeric string (32-128 chars)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const alphanumericRegex = /^[a-zA-Z0-9]{32,128}$/;

  return uuidRegex.test(key) || alphanumericRegex.test(key);
}

/**
 * Create a hash of the request for idempotency
 */
function createRequestHash(req: IdempotencyRequest): string {
  const dataToHash = {
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query,
    // Don't include headers that might change between requests
    // (like timestamps, user agent, etc.)
  };

  const hash = createHash('sha256');
  hash.update(JSON.stringify(dataToHash));
  return hash.digest('hex');
}

/**
 * Check if we've seen this exact request before
 */
async function checkIdempotency(
  userId: string,
  path: string,
  idempotencyKey: string,
  requestHash: string
): Promise<any | null> {
  try {
    const result = await db.query(
      `SELECT response_body, status_code, created_at 
       FROM idempotency_keys 
       WHERE user_id = $1 
         AND route_path = $2 
         AND idempotency_key = $3 
         AND request_hash = $4
         AND created_at > NOW() - INTERVAL '24 hours'`,
      [userId, path, idempotencyKey, requestHash]
    );

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    return null;
  } catch (error) {
    logError('Error checking idempotency', error as Error);
    return null;
  }
}

/**
 * Store the request for future idempotency checks
 */
async function storeIdempotencyRequest(
  userId: string,
  path: string,
  idempotencyKey: string,
  requestHash: string,
  requestBody: any
): Promise<void> {
  try {
    await db.query(
      `INSERT INTO idempotency_keys 
       (user_id, route_path, idempotency_key, request_hash, request_body, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id, route_path, idempotency_key) 
       DO UPDATE SET 
         request_hash = EXCLUDED.request_hash,
         request_body = EXCLUDED.request_body,
         updated_at = NOW()`,
      [userId, path, idempotencyKey, requestHash, JSON.stringify(requestBody)]
    );
  } catch (error) {
    logError('Error storing idempotency request', error as Error);
    // Don't throw - we don't want to break the main request flow
  }
}

/**
 * Store the response for future idempotency checks
 */
async function storeIdempotencyResponse(
  userId: string,
  path: string,
  idempotencyKey: string,
  requestHash: string,
  statusCode: number,
  responseBody: any
): Promise<void> {
  try {
    await db.query(
      `UPDATE idempotency_keys 
       SET response_body = $1, 
           status_code = $2, 
           updated_at = NOW() 
       WHERE user_id = $3 
         AND route_path = $4 
         AND idempotency_key = $5 
         AND request_hash = $6`,
      [
        JSON.stringify(responseBody),
        statusCode,
        userId,
        path,
        idempotencyKey,
        requestHash,
      ]
    );
  } catch (error) {
    logError('Error storing idempotency response', error as Error);
    // Don't throw - we don't want to break the main request flow
  }
}

/**
 * Clean up old idempotency keys
 */
export async function cleanupOldIdempotencyKeys(): Promise<void> {
  try {
    const result = await db.query(
      `DELETE FROM idempotency_keys 
       WHERE created_at < NOW() - INTERVAL '24 hours'`
    );

    logInfo('Cleaned up old idempotency keys', {
      deletedCount: result.rowCount,
    });
  } catch (error) {
    logError('Error cleaning up old idempotency keys', error as Error);
  }
}

/**
 * Get idempotency statistics
 */
export async function getIdempotencyStats(): Promise<{
  totalKeys: number;
  recentKeys: number;
  oldestKey: Date | null;
}> {
  try {
    const [totalResult, recentResult, oldestResult] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM idempotency_keys'),
      db.query(
        "SELECT COUNT(*) as count FROM idempotency_keys WHERE created_at > NOW() - INTERVAL '1 hour'"
      ),
      db.query('SELECT MIN(created_at) as oldest FROM idempotency_keys'),
    ]);

    return {
      totalKeys: parseInt(totalResult.rows[0]?.count || '0'),
      recentKeys: parseInt(recentResult.rows[0]?.count || '0'),
      oldestKey: oldestResult.rows[0]?.oldest || null,
    };
  } catch (error) {
    logError('Error getting idempotency stats', error as Error);
    return {
      totalKeys: 0,
      recentKeys: 0,
      oldestKey: null,
    };
  }
}
