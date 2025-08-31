import { Request, Response } from 'express';
import { createError, asyncHandler } from '@/middlewares/errorMiddleware';
import { logInfo, logWarn, logError } from '@/utils/logger';
import { CheckoutService, PriceLockQuoteRequest } from '@/services/CheckoutService';

/**
 * Checkout Controller for PBCEx
 * Handles price-lock quotes and confirmations
 */

interface QuoteRequestBody {
  symbol: string;
  quantity: number;
  side: 'buy' | 'sell';
  userId?: string;
}

interface ConfirmRequestBody {
  quoteId: string;
}

interface QuoteByIdParams {
  id: string;
}

export class CheckoutController {
  /**
   * POST /api/checkout/price-lock/quote
   * Request a price-lock quote
   */
  static requestQuote = asyncHandler(async (req: unknown, res: Response) => {
    const request = req as { requestId?: string; ip?: string; body: QuoteRequestBody };
    const requestId = request.requestId || 'unknown';
    const clientIp = request.ip || 'unknown';

    logInfo('Price-lock quote request', { 
      requestId,
      clientIp,
      symbol: request.body.symbol,
      quantity: request.body.quantity,
      side: request.body.side,
    });

    // Input validation
    const { symbol, quantity, side, userId } = request.body;

    if (!symbol || !quantity || !side) {
      throw createError.badRequest('Missing required fields: symbol, quantity, side');
    }

    if (typeof symbol !== 'string' || typeof quantity !== 'number' || typeof side !== 'string') {
      throw createError.badRequest('Invalid field types');
    }

    if (quantity <= 0) {
      throw createError.badRequest('Quantity must be positive');
    }

    if (quantity > 1000) {
      throw createError.badRequest('Quantity exceeds maximum limit (1000)');
    }

    if (!['buy', 'sell'].includes(side)) {
      throw createError.badRequest('Side must be either "buy" or "sell"');
    }

    // Symbol format validation
    if (!/^[A-Z]{3,5}$/.test(symbol.toUpperCase())) {
      throw createError.badRequest('Invalid symbol format');
    }

    try {
      const result = await CheckoutService.requestQuote({
        symbol: symbol.toUpperCase(),
        quantity,
        side: side as 'buy' | 'sell',
        userId: userId || undefined,
      });

      if (result.success && result.data) {
        logInfo('Price-lock quote created successfully', {
          requestId,
          quoteId: result.data.id,
          symbol: result.data.symbol,
          lockedPrice: result.data.lockedPrice,
          totalAmount: result.data.totalAmount,
          expiresAt: new Date(result.data.expiresAt).toISOString(),
          correlationId: result.correlationId,
        });

        res.status(200).json({
          success: true,
          message: 'Price-lock quote created successfully',
          data: {
            id: result.data.id,
            symbol: result.data.symbol,
            quantity: result.data.quantity,
            side: result.data.side,
            basePrice: result.data.basePrice,
            spreadBps: result.data.spreadBps,
            lockedPrice: result.data.lockedPrice,
            totalAmount: result.data.totalAmount,
            currency: result.data.currency,
            expiresAt: result.data.expiresAt,
            expiresAtISO: new Date(result.data.expiresAt).toISOString(),
            lockWindowSeconds: Math.floor((result.data.expiresAt - result.data.createdAt) / 1000),
            vendor: result.data.vendor,
          },
          meta: {
            correlationId: result.correlationId,
            requestId,
          },
        });
      } else {
        logWarn('Price-lock quote creation failed', {
          requestId,
          error: result.error,
          correlationId: result.correlationId,
        });

        res.status(400).json({
          success: false,
          code: 'QUOTE_FAILED',
          message: result.error || 'Failed to create price-lock quote',
          meta: {
            correlationId: result.correlationId,
            requestId,
          },
        });
      }
    } catch (error) {
      logError('Price-lock quote endpoint error', {
        error: error as Error,
        requestId,
      });

      throw createError.internalServerError('Checkout service error');
    }
  });

  /**
   * POST /api/checkout/confirm
   * Confirm a price-lock quote
   */
  static confirmQuote = asyncHandler(async (req: unknown, res: Response) => {
    const request = req as { requestId?: string; body: ConfirmRequestBody };
    const requestId = request.requestId || 'unknown';
    const { quoteId } = request.body;

    logInfo('Price-lock confirmation request', { 
      requestId,
      quoteId,
    });

    // Input validation
    if (!quoteId || typeof quoteId !== 'string') {
      throw createError.badRequest('Quote ID is required');
    }

    // UUID format validation (basic)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(quoteId)) {
      throw createError.badRequest('Invalid quote ID format');
    }

    try {
      // In a real implementation, you'd extract userId from authentication
      const userId = undefined; // TODO: Extract from JWT token

      const result = await CheckoutService.confirmQuote(quoteId, userId);

      if (result.success && result.data) {
        logInfo('Price-lock confirmed successfully', {
          requestId,
          quoteId,
          confirmationId: result.data.id,
          totalAmount: result.data.totalAmount,
          status: result.data.status,
          correlationId: result.correlationId,
        });

        res.status(200).json({
          success: true,
          message: 'Price-lock confirmed successfully',
          data: {
            confirmationId: result.data.id,
            quoteId: result.data.quoteId,
            confirmed: result.data.confirmed,
            confirmedAt: result.data.confirmedAt,
            confirmedAtISO: new Date(result.data.confirmedAt).toISOString(),
            finalPrice: result.data.finalPrice,
            totalAmount: result.data.totalAmount,
            status: result.data.status,
          },
          meta: {
            correlationId: result.correlationId,
            requestId,
            note: 'Order processing will begin shortly',
          },
        });
      } else {
        logWarn('Price-lock confirmation failed', {
          requestId,
          quoteId,
          error: result.error,
          correlationId: result.correlationId,
        });

        const statusCode = result.error?.includes('not found') || result.error?.includes('expired') ? 404 : 400;

        res.status(statusCode).json({
          success: false,
          code: result.error?.includes('expired') ? 'QUOTE_EXPIRED' : 'CONFIRMATION_FAILED',
          message: result.error || 'Failed to confirm price-lock',
          meta: {
            correlationId: result.correlationId,
            requestId,
          },
        });
      }
    } catch (error) {
      logError('Price-lock confirmation endpoint error', {
        error: error as Error,
        requestId,
        quoteId,
      });

      throw createError.internalServerError('Checkout service error');
    }
  });

  /**
   * GET /api/checkout/quote/:id
   * Get quote details by ID
   */
  static getQuote = asyncHandler(async (req: unknown, res: Response) => {
    const request = req as { requestId?: string; params: QuoteByIdParams };
    const { id } = request.params;
    const requestId = request.requestId || 'unknown';

    logInfo('Get quote request', { 
      requestId,
      quoteId: id,
    });

    // Input validation
    if (!id || typeof id !== 'string') {
      throw createError.badRequest('Quote ID is required');
    }

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      throw createError.badRequest('Invalid quote ID format');
    }

    try {
      const result = await CheckoutService.getQuoteById(id);

      if (result.success) {
        if (result.data) {
          const quote = result.data;
          const isExpired = Date.now() > quote.expiresAt;
          const timeToExpiry = Math.max(0, quote.expiresAt - Date.now());

          logInfo('Quote retrieved successfully', {
            requestId,
            quoteId: id,
            symbol: quote.symbol,
            isExpired,
            correlationId: result.correlationId,
          });

          res.status(200).json({
            success: true,
            data: {
              id: quote.id,
              symbol: quote.symbol,
              quantity: quote.quantity,
              side: quote.side,
              basePrice: quote.basePrice,
              spreadBps: quote.spreadBps,
              lockedPrice: quote.lockedPrice,
              totalAmount: quote.totalAmount,
              currency: quote.currency,
              createdAt: quote.createdAt,
              createdAtISO: new Date(quote.createdAt).toISOString(),
              expiresAt: quote.expiresAt,
              expiresAtISO: new Date(quote.expiresAt).toISOString(),
              timeToExpiryMs: timeToExpiry,
              timeToExpirySeconds: Math.floor(timeToExpiry / 1000),
              isExpired,
              vendor: quote.vendor,
            },
            meta: {
              correlationId: result.correlationId,
              requestId,
            },
          });
        } else {
          res.status(404).json({
            success: false,
            code: 'QUOTE_NOT_FOUND',
            message: 'Quote not found or has expired',
            meta: {
              correlationId: result.correlationId,
              requestId,
            },
          });
        }
      } else {
        logError('Failed to retrieve quote', {
          requestId,
          quoteId: id,
          error: result.error,
          correlationId: result.correlationId,
        });

        res.status(500).json({
          success: false,
          code: 'QUOTE_RETRIEVAL_FAILED',
          message: result.error || 'Failed to retrieve quote',
          meta: {
            correlationId: result.correlationId,
            requestId,
          },
        });
      }
    } catch (error) {
      logError('Get quote endpoint error', {
        error: error as Error,
        requestId,
        quoteId: id,
      });

      throw createError.internalServerError('Checkout service error');
    }
  });

  /**
   * GET /api/checkout/health
   * Get checkout service health status
   */
  static getHealthStatus = asyncHandler(async (req: Request, res: Response) => {
    const requestId = (req as { requestId?: string }).requestId || 'unknown';

    logInfo('Checkout service health check', { requestId });

    try {
      const healthStatus = CheckoutService.getHealthStatus();

      res.status(200).json({
        success: true,
        service: 'CheckoutService',
        status: healthStatus,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logError('Checkout service health check error', {
        error: error as Error,
        requestId,
      });

      res.status(500).json({
        success: false,
        service: 'CheckoutService',
        status: 'error',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  });
}

export default CheckoutController;
