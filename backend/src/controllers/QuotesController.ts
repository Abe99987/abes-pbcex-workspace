import { Request, Response } from 'express';
import { createError, asyncHandler } from '@/middlewares/errorMiddleware';
import { logInfo, logError } from '@/utils/logger';
import { QuotesService } from '@/services/QuotesService';
import { ValidationService } from '@/services/ValidationService';

/**
 * Quotes Controller for PBCEx
 * Handles price estimation and quote management for buy/sell operations
 */

export class QuotesController {
  /**
   * GET /api/quotes/estimate
   * Get price estimate for buy/sell operation
   */
  static getEstimate = asyncHandler(async (req: Request, res: Response) => {
    const { symbol, side, amount, format, payout } = req.query;

    logInfo('Quote estimate requested', {
      symbol,
      side,
      amount,
      format,
      payout,
    });

    // Validate required parameters
    if (!symbol || typeof symbol !== 'string') {
      throw createError.validation('Symbol is required');
    }

    if (!side || !['buy', 'sell'].includes(side as string)) {
      throw createError.validation('Side must be "buy" or "sell"');
    }

    if (!amount || isNaN(Number(amount))) {
      throw createError.validation('Amount must be a valid number');
    }

    const amountNum = parseFloat(amount as string);
    if (amountNum <= 0) {
      throw createError.validation('Amount must be positive');
    }

    // Validate payout method for sell orders
    if (side === 'sell' && payout) {
      const payoutValidation = ValidationService.validatePayoutMethod(
        payout as string
      );
      ValidationService.throwIfInvalid(
        payoutValidation,
        'Invalid payout method'
      );
    }

    try {
      const quote = await QuotesService.getEstimate({
        symbol: symbol.toUpperCase(),
        side: side as 'buy' | 'sell',
        amount: amountNum,
        format: format as string | undefined,
        payout: payout as 'USD' | 'USDC' | 'USDT' | 'TOKEN' | undefined,
      });

      res.json({
        code: 'SUCCESS',
        data: quote,
      });
    } catch (error) {
      logError('Quote estimation failed', error as Error);

      // Return a graceful error response instead of throwing
      res.json({
        code: 'SUCCESS',
        data: {
          symbol: symbol.toUpperCase(),
          side,
          amount: amountNum,
          format,
          payout,

          quotedPrice: 0,

          fees: {
            makerFee: 0,
            takerFee: 0,
            spreadInfo: {
              spread: 0,
              spreadPercentage: 0,
            },
          },

          validation: {
            minOrder: 0,
            stepSize: 1,
            unitLabel: '',
            isValidAmount: false,
            validationError: 'Quote service temporarily unavailable',
          },

          notices: [],
          requiresLicense: false,

          available: false,
          unavailableReason: 'Pricing temporarily unavailable',

          timestamp: Date.now(),
          expiresAt: Date.now() + 30000,
          quoteId: `quote_error_${Date.now()}`,
        },
      });
    }
  });

  /**
   * GET /api/quotes/:quoteId
   * Get cached quote by ID
   */
  static getQuote = asyncHandler(async (req: Request, res: Response) => {
    const { quoteId } = req.params;

    if (!quoteId) {
      throw createError.validation('Quote ID is required');
    }

    logInfo('Cached quote requested', { quoteId });

    try {
      const quote = await QuotesService.getCachedQuote(quoteId);

      if (!quote) {
        throw createError.notFound('Quote not found or expired');
      }

      res.json({
        code: 'SUCCESS',
        data: quote,
      });
    } catch (error) {
      logError('Failed to get cached quote', error as Error);
      throw error;
    }
  });
}
