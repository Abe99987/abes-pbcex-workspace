import { Request, Response } from 'express';
import { createError, asyncHandler } from '@/middlewares/errorMiddleware';
import { logInfo, logWarn, logError } from '@/utils/logger';
import { PricesService } from '@/services/PricesService';

/**
 * Prices Controller for PBCEx
 * Handles price feed operations using CoinGecko with Redis caching
 */

interface PricesBySymbolRequest extends Request {
  params: {
    symbol: string;
  };
}

interface MultiplePricesRequest extends Request {
  body: {
    symbols: string[];
  };
}

export class PricesController {
  /**
   * GET /api/prices/:symbol
   * Get price for a specific symbol
   */
  static getPrice = asyncHandler(async (req: PricesBySymbolRequest, res: Response) => {
    const { symbol } = req.params;
    const requestId = (req as { requestId?: string }).requestId || 'unknown';

    logInfo('Price request', { 
      symbol,
      requestId,
    });

    // Input validation
    if (!symbol || typeof symbol !== 'string') {
      throw createError.badRequest('Symbol is required');
    }

    const upperSymbol = symbol.toUpperCase();

    // Validate symbol format (basic)
    if (!/^[A-Z]{3,5}$/.test(upperSymbol)) {
      throw createError.badRequest('Invalid symbol format');
    }

    try {
      const result = await PricesService.getTicker(upperSymbol);

      if (result.success && result.data) {
        logInfo('Price retrieved successfully', {
          symbol: upperSymbol,
          price: result.data.usd,
          source: result.data.source,
          correlationId: result.correlationId,
          requestId,
        });

        res.status(200).json({
          success: true,
          data: {
            symbol: result.data.symbol,
            usd: result.data.usd,
            ts: result.data.ts,
            source: result.data.source,
            lastUpdated: new Date(result.data.ts).toISOString(),
          },
          meta: {
            correlationId: result.correlationId,
            cached: result.data.source === 'CACHE',
            requestId,
          },
        });
      } else {
        logWarn('Price retrieval failed', {
          symbol: upperSymbol,
          error: result.error,
          correlationId: result.correlationId,
          requestId,
        });

        // Check if it's an unsupported symbol
        if (result.error?.includes('Unsupported symbol')) {
          throw createError.badRequest(result.error);
        }

        res.status(503).json({
          success: false,
          code: 'PRICE_UNAVAILABLE',
          message: result.error || 'Price data temporarily unavailable',
          meta: {
            correlationId: result.correlationId,
            requestId,
          },
        });
      }
    } catch (error) {
      logError('Price endpoint error', {
        symbol: upperSymbol,
        error: error as Error,
        requestId,
      });

      // Re-throw validation errors
      if ((error as any).status && (error as any).status < 500) {
        throw error;
      }

      throw createError.internalServerError('Price service error');
    }
  });

  /**
   * POST /api/prices/batch
   * Get prices for multiple symbols
   */
  static getMultiplePrices = asyncHandler(async (req: MultiplePricesRequest, res: Response) => {
    const { symbols } = req.body;
    const requestId = (req as { requestId?: string }).requestId || 'unknown';

    logInfo('Batch price request', { 
      symbolCount: symbols?.length || 0,
      requestId,
    });

    // Input validation
    if (!symbols || !Array.isArray(symbols)) {
      throw createError.badRequest('Symbols array is required');
    }

    if (symbols.length === 0) {
      throw createError.badRequest('At least one symbol is required');
    }

    if (symbols.length > 10) {
      throw createError.badRequest('Maximum 10 symbols per request');
    }

    // Validate each symbol
    const validatedSymbols = symbols.map(symbol => {
      if (typeof symbol !== 'string') {
        throw createError.badRequest('All symbols must be strings');
      }

      const upperSymbol = symbol.toUpperCase();
      if (!/^[A-Z]{3,5}$/.test(upperSymbol)) {
        throw createError.badRequest(`Invalid symbol format: ${symbol}`);
      }

      return upperSymbol;
    });

    try {
      const results = await PricesService.getMultipleTickers(validatedSymbols);
      
      const responseData: { [symbol: string]: unknown } = {};
      const metadata: { 
        successful: string[];
        failed: string[];
        totalRequested: number;
      } = {
        successful: [],
        failed: [],
        totalRequested: validatedSymbols.length,
      };

      // Process results
      for (const [symbol, result] of Object.entries(results)) {
        if (result.success && result.data) {
          responseData[symbol] = {
            symbol: result.data.symbol,
            usd: result.data.usd,
            ts: result.data.ts,
            source: result.data.source,
            lastUpdated: new Date(result.data.ts).toISOString(),
            correlationId: result.correlationId,
          };
          metadata.successful.push(symbol);
        } else {
          responseData[symbol] = {
            error: result.error || 'Price unavailable',
            correlationId: result.correlationId,
          };
          metadata.failed.push(symbol);
        }
      }

      logInfo('Batch prices retrieved', {
        successful: metadata.successful.length,
        failed: metadata.failed.length,
        requestId,
      });

      res.status(200).json({
        success: true,
        data: responseData,
        meta: {
          ...metadata,
          requestId,
          allSuccessful: metadata.failed.length === 0,
        },
      });

    } catch (error) {
      logError('Batch price endpoint error', {
        symbolCount: validatedSymbols.length,
        error: error as Error,
        requestId,
      });

      throw createError.internalServerError('Price service error');
    }
  });

  /**
   * GET /api/prices/health
   * Get price service health status
   */
  static getHealthStatus = asyncHandler(async (req: Request, res: Response) => {
    const requestId = (req as { requestId?: string }).requestId || 'unknown';

    logInfo('Price service health check', { requestId });

    try {
      const healthStatus = PricesService.getHealthStatus();

      // Test cache connectivity by attempting a simple operation
      let cacheStatus = 'unknown';
      try {
        const testResult = await PricesService.getTicker('PAXG');
        cacheStatus = testResult.success ? 'operational' : 'degraded';
      } catch (error) {
        cacheStatus = 'error';
      }

      res.status(200).json({
        success: true,
        service: 'PricesService',
        status: {
          ...healthStatus,
          cacheStatus,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logError('Price service health check error', {
        error: error as Error,
        requestId,
      });

      res.status(500).json({
        success: false,
        service: 'PricesService',
        status: 'error',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /api/prices/symbols
   * Get list of supported symbols
   */
  static getSupportedSymbols = asyncHandler(async (req: Request, res: Response) => {
    const requestId = (req as { requestId?: string }).requestId || 'unknown';

    logInfo('Supported symbols request', { requestId });

    try {
      const healthStatus = PricesService.getHealthStatus();

      res.status(200).json({
        success: true,
        data: {
          symbols: healthStatus.supportedSymbols,
          count: healthStatus.supportedSymbols.length,
        },
        meta: {
          requestId,
          configured: healthStatus.configured,
          baseUrl: healthStatus.baseUrl,
        },
      });
    } catch (error) {
      logError('Supported symbols endpoint error', {
        error: error as Error,
        requestId,
      });

      throw createError.internalServerError('Price service error');
    }
  });

  /**
   * DELETE /api/prices/cache/:symbol
   * Clear cache for a specific symbol (dev/admin only)
   */
  static clearCache = asyncHandler(async (req: PricesBySymbolRequest, res: Response) => {
    const { symbol } = req.params;
    const requestId = (req as { requestId?: string }).requestId || 'unknown';

    logInfo('Cache clear request', { 
      symbol,
      requestId,
    });

    // This would typically require admin authentication
    // For now, just log the request

    const upperSymbol = symbol.toUpperCase();

    // In a real implementation, we'd clear the specific cache key
    // For now, just respond success
    logInfo('Cache clear requested (not implemented)', { 
      symbol: upperSymbol,
      requestId,
    });

    res.status(200).json({
      success: true,
      message: `Cache clear requested for ${upperSymbol}`,
      data: {
        symbol: upperSymbol,
        action: 'cache_clear_requested',
      },
      meta: {
        requestId,
        note: 'Cache clearing not fully implemented - prices will refresh automatically',
      },
    });
  });
}

export default PricesController;
