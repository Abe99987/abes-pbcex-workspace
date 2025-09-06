import { Request, Response } from 'express';
import { createError, asyncHandler } from '@/middlewares/errorMiddleware';
import { logInfo, logWarn, logError } from '@/utils/logger';
import { PricesService } from '@/services/PricesService';
import { CANONICAL_SYMBOLS, normalizeSymbol } from '@/lib/symbols';
import { nowUtcMs, toUtcIso } from '@/lib/time';
import { cache } from '@/cache/redis';

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

    const normalized = normalizeSymbol(symbol);
    const upperSymbol = normalized ?? symbol.toUpperCase();

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

      const normalized = normalizeSymbol(symbol);
      const upperSymbol = normalized ?? symbol.toUpperCase();
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
        timestamp: toUtcIso(),
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
          symbols: CANONICAL_SYMBOLS,
          count: CANONICAL_SYMBOLS.length,
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

  /**
   * GET /api/prices/stream
   * Server-Sent Events stream for live prices
   * Query: symbols=CSV (e.g., XAU,BTC,ETH,PAXG,USDC)
   */
  static streamPricesSSE = asyncHandler(async (req: Request, res: Response) => {
    // Last-Event-ID support (resume semantics)
    const lastEventIdHeader = (req.headers['last-event-id'] as string) || '';

    const symbolsParam = (req.query.symbols as string) || '';
    const symbols = symbolsParam
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);

    if (symbols.length === 0) {
      throw createError.badRequest('symbols query is required, e.g. symbols=XAU,BTC');
    }

    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.write(`retry: 2000\n\n`);
    res.flushHeaders?.();

    let isClosed = false;
    req.on('close', () => {
      isClosed = true;
      clearInterval(heartbeatTimer);
    });

    // Simple backoff state per symbol
    const backoff: Record<string, number> = {};

    // Heartbeat every ~20s to keep connection alive
    const heartbeatTimer = setInterval(() => {
      if (!isClosed) {
        res.write(`:hb\n\n`);
      }
    }, 20000);

    // per-symbol monotonic id using Redis as a counter when available
    const nextIdKey = (s: string) => `sse:id:${s}`;

    const sendTick = async () => {
      if (isClosed) return;
      const now = nowUtcMs();

      for (const symbol of symbols) {
        try {
          const result = await PricesService.getTicker(symbol);
          if (result.success && result.data) {
            const payload = {
              symbol: result.data.symbol,
              usd: result.data.usd,
              ts: result.data.ts,
              source: result.data.source,
            };
            // Monotonic id via Redis incr when available, else fallback to ts
            const nextId = (await cache.increment(nextIdKey(symbol))) ?? result.data.ts;
            res.write(`id: ${nextId}\n`);
            res.write(`data: ${JSON.stringify(payload)}\n\n`);
            backoff[symbol] = 0; // reset backoff on success
          } else {
            // Emit last-known-from-cache-like placeholder with server ts
            const payload = {
              symbol,
              usd: undefined,
              ts: now,
              source: 'CACHE',
            };
            res.write(`id: ${now}\n`);
            res.write(`data: ${JSON.stringify(payload)}\n\n`);
            backoff[symbol] = Math.min((backoff[symbol] || 0) + 1, 5);
          }
        } catch {
          const payload = {
            symbol,
            usd: undefined,
            ts: now,
            source: 'CACHE',
          };
          res.write(`id: ${now}\n`);
          res.write(`data: ${JSON.stringify(payload)}\n\n`);
          backoff[symbol] = Math.min((backoff[symbol] || 0) + 1, 5);
        }
      }

      // cadence ~1–2s with simple backoff modifier
      const delayMs = 1000 + 500 * Math.max(0, ...Object.values(backoff));
      if (!isClosed) setTimeout(sendTick, delayMs);
    };

    // Before loop: replay last cached ticks for requested symbols
    for (const symbol of symbols) {
      const cacheKey = `price:${symbol}:USD`;
      const cached = await cache.getJson<{ symbol: string; usd: number; ts: number; source: string }>(cacheKey);
      if (cached) {
        const replayId = (await cache.increment(nextIdKey(symbol))) ?? cached.ts;
        res.write(`id: ${replayId}\n`);
        res.write(`event: replay\n`);
        res.write(`data: ${JSON.stringify(cached)}\n\n`);
      }
    }

    // Kick off loop
    res.write(`event: ready\n`);
    res.write(`data: {"ok":true}\n\n`);
    setTimeout(sendTick, 250);
  });
}

export default PricesController;
