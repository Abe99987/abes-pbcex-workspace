import { cache } from '@/cache/redis';
import { logInfo, logError, logWarn } from '@/utils/logger';
import { CommodityConfigService } from './CommodityConfigService';
import { PricesService } from './PricesService';
import { createError } from '@/middlewares/errorMiddleware';

/**
 * Quotes Service
 * Handles price estimates for buy/sell operations with proper validation
 */

export interface QuoteRequest {
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  format?: string;
  payout?: 'USD' | 'USDC' | 'USDT' | 'TOKEN';
}

export interface QuoteResponse {
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  format?: string;
  payout?: string;

  // Pricing
  spotPrice?: number;
  quotedPrice: number;
  estimatedTotal?: number; // For buy orders
  estimatedProceeds?: number; // For sell orders

  // Fees
  fees: {
    makerFee?: number;
    takerFee?: number;
    spreadInfo?: {
      spread: number;
      spreadPercentage: number;
    };
  };

  // Validation hints
  validation: {
    minOrder: number;
    stepSize: number;
    unitLabel: string;
    isValidAmount: boolean;
    validationError?: string;
  };

  // Notices and requirements
  notices: string[];
  requiresLicense: boolean;
  licenseVerified?: boolean;

  // Status
  available: boolean;
  unavailableReason?: string;

  // Metadata
  timestamp: number;
  expiresAt: number;
  quoteId: string;
}

export class QuotesService {
  private static isInitialized = false;
  private static readonly QUOTE_CACHE_TTL = 30; // 30 seconds
  private static readonly PRICE_TIMEOUT = 5000; // 5 second timeout for price lookups
  private static readonly PRICE_CACHE = new Map<
    string,
    { price: number; timestamp: number }
  >();
  private static readonly PRICE_CACHE_TTL = 10 * 1000; // 10 seconds

  // Fee configuration (can be made configurable later)
  private static readonly FEES = {
    BUY_MAKER_FEE: 0.005, // 0.5%
    BUY_TAKER_FEE: 0.01, // 1%
    SELL_MAKER_FEE: 0.005, // 0.5%
    SELL_TAKER_FEE: 0.01, // 1%
    SPREAD_BUY: 0.01, // 1% spread on buy side
    SPREAD_SELL: 0.01, // 1% spread on sell side
  };

  /**
   * Initialize the service
   */
  static async initialize(): Promise<void> {
    if (QuotesService.isInitialized) {
      return;
    }

    try {
      QuotesService.isInitialized = true;
      logInfo('QuotesService initialized');
    } catch (error) {
      logError('Failed to initialize QuotesService', error as Error);
      throw error;
    }
  }

  /**
   * Get price estimate for buy/sell operation
   */
  static async getEstimate(request: QuoteRequest): Promise<QuoteResponse> {
    const quoteId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();
    const expiresAt = timestamp + 30 * 1000; // 30 seconds

    logInfo('Quote estimate requested', {
      quoteId,
      symbol: request.symbol,
      side: request.side,
      amount: request.amount,
      format: request.format,
    });

    try {
      // Get commodity configuration
      const config = await CommodityConfigService.getConfig(request.symbol);
      if (!config || !config.enabled) {
        return QuotesService.createUnavailableQuote(
          request,
          quoteId,
          timestamp,
          expiresAt,
          'Commodity not available'
        );
      }

      // Validate format if specified
      if (
        request.format &&
        !(await CommodityConfigService.isValidFormat(
          request.symbol,
          request.format
        ))
      ) {
        return QuotesService.createUnavailableQuote(
          request,
          quoteId,
          timestamp,
          expiresAt,
          'Format not available for this commodity'
        );
      }

      // Get minimum order and step size
      const minOrder = await CommodityConfigService.getMinimumOrder(
        request.symbol,
        request.format
      );
      const stepSize = await CommodityConfigService.getStepSize(
        request.symbol,
        request.format
      );

      // Validate amount
      const validation = await CommodityConfigService.validateAmount(
        request.symbol,
        request.amount,
        request.format
      );

      // Check license requirements
      const requiresLicense = await CommodityConfigService.requiresLicense(
        request.symbol,
        request.format
      );

      // Get current spot price
      let spotPrice: number | undefined;
      let quotedPrice: number;
      let available = true;
      let unavailableReason: string | undefined;

      try {
        spotPrice = await QuotesService.getSpotPrice(request.symbol);
        quotedPrice = QuotesService.calculateQuotedPrice(
          spotPrice,
          request.side
        );
      } catch (error) {
        logWarn('Price lookup failed, using fallback', {
          symbol: request.symbol,
          error,
        });
        available = false;
        unavailableReason = 'Pricing temporarily unavailable';
        quotedPrice = 0; // Will be handled by unavailable status
      }

      // Calculate fees
      const fees = QuotesService.calculateFees(
        quotedPrice,
        request.amount,
        request.side
      );

      // Calculate estimated totals
      let estimatedTotal: number | undefined;
      let estimatedProceeds: number | undefined;

      if (available && spotPrice) {
        if (request.side === 'buy') {
          estimatedTotal = quotedPrice * request.amount + (fees.takerFee || 0);
        } else {
          estimatedProceeds =
            quotedPrice * request.amount - (fees.takerFee || 0);
        }
      }

      // Get logistics notices
      const notices = config.logisticsNotices || [];

      // Add license notice if required
      if (requiresLicense) {
        notices.push(
          'This commodity requires special licensing for physical delivery'
        );
      }

      const quote: QuoteResponse = {
        symbol: request.symbol,
        side: request.side,
        amount: request.amount,
        format: request.format,
        payout: request.payout,

        spotPrice,
        quotedPrice,
        estimatedTotal,
        estimatedProceeds,

        fees,

        validation: {
          minOrder: minOrder || 0,
          stepSize: stepSize || 1,
          unitLabel: config.unitLabel,
          isValidAmount: validation.valid,
          validationError: validation.error,
        },

        notices,
        requiresLicense,

        available,
        unavailableReason,

        timestamp,
        expiresAt,
        quoteId,
      };

      // Cache the quote for a short time
      await QuotesService.cacheQuote(quote);

      logInfo('Quote estimate generated', {
        quoteId,
        available,
        quotedPrice,
        estimatedTotal,
        estimatedProceeds,
      });

      return quote;
    } catch (error) {
      logError('Failed to generate quote estimate', error as Error);

      return QuotesService.createUnavailableQuote(
        request,
        quoteId,
        timestamp,
        expiresAt,
        'Quote generation failed'
      );
    }
  }

  /**
   * Get cached quote by ID
   */
  static async getCachedQuote(quoteId: string): Promise<QuoteResponse | null> {
    try {
      const cached = await cache.getJson<QuoteResponse>(`quote:${quoteId}`);
      if (cached && cached.expiresAt > Date.now()) {
        return cached;
      }
      return null;
    } catch (error) {
      logError('Failed to get cached quote', error as Error);
      return null;
    }
  }

  /**
   * Get spot price for commodity symbol with caching
   */
  private static async getSpotPrice(symbol: string): Promise<number> {
    // Check in-memory cache first
    const cached = QuotesService.PRICE_CACHE.get(symbol);
    if (
      cached &&
      Date.now() - cached.timestamp < QuotesService.PRICE_CACHE_TTL
    ) {
      return cached.price;
    }

    // Map commodity symbols to price feed symbols
    const priceSymbolMap: Record<string, string> = {
      AU: 'XAU',
      AG: 'XAG',
      PT: 'XPT',
      PD: 'XPD',
      CU: 'XCU',
      CL: 'CL', // Crude oil
    };

    const priceSymbol = priceSymbolMap[symbol];
    if (!priceSymbol) {
      throw new Error(`No price feed available for ${symbol}`);
    }

    // For now, return mock prices since we don't have real commodity price feeds
    // In production, this would integrate with TradingView, Bloomberg, or commodity APIs
    const mockPrices: Record<string, number> = {
      XAU: 2050.0, // Gold per oz
      XAG: 25.5, // Silver per oz
      XPT: 980.0, // Platinum per oz
      XPD: 1150.0, // Palladium per oz
      XCU: 4.5, // Copper per lb
      CL: 75.0, // Crude oil per barrel
    };

    const basePrice = mockPrices[priceSymbol];
    if (!basePrice) {
      throw new Error(`Price not available for ${priceSymbol}`);
    }

    // Add small random variance (±2%) to simulate real pricing
    const variance = (Math.random() - 0.5) * 0.04; // ±2%
    const price = basePrice * (1 + variance);

    // Cache the price
    QuotesService.PRICE_CACHE.set(symbol, {
      price,
      timestamp: Date.now(),
    });

    return price;
  }

  /**
   * Calculate quoted price with spread
   */
  private static calculateQuotedPrice(
    spotPrice: number,
    side: 'buy' | 'sell'
  ): number {
    const spread =
      side === 'buy'
        ? QuotesService.FEES.SPREAD_BUY
        : QuotesService.FEES.SPREAD_SELL;

    if (side === 'buy') {
      // Buyers pay higher (spot + spread)
      return spotPrice * (1 + spread);
    } else {
      // Sellers receive lower (spot - spread)
      return spotPrice * (1 - spread);
    }
  }

  /**
   * Calculate fees for the quote
   */
  private static calculateFees(
    price: number,
    amount: number,
    side: 'buy' | 'sell'
  ) {
    const gross = price * amount;

    const makerFee =
      gross *
      (side === 'buy'
        ? QuotesService.FEES.BUY_MAKER_FEE
        : QuotesService.FEES.SELL_MAKER_FEE);
    const takerFee =
      gross *
      (side === 'buy'
        ? QuotesService.FEES.BUY_TAKER_FEE
        : QuotesService.FEES.SELL_TAKER_FEE);

    const spread =
      gross *
      (side === 'buy'
        ? QuotesService.FEES.SPREAD_BUY
        : QuotesService.FEES.SPREAD_SELL);
    const spreadPercentage =
      side === 'buy'
        ? QuotesService.FEES.SPREAD_BUY * 100
        : QuotesService.FEES.SPREAD_SELL * 100;

    return {
      makerFee,
      takerFee,
      spreadInfo: {
        spread,
        spreadPercentage,
      },
    };
  }

  /**
   * Create an unavailable quote response
   */
  private static createUnavailableQuote(
    request: QuoteRequest,
    quoteId: string,
    timestamp: number,
    expiresAt: number,
    reason: string
  ): QuoteResponse {
    return {
      symbol: request.symbol,
      side: request.side,
      amount: request.amount,
      format: request.format,
      payout: request.payout,

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
      },

      notices: [],
      requiresLicense: false,

      available: false,
      unavailableReason: reason,

      timestamp,
      expiresAt,
      quoteId,
    };
  }

  /**
   * Cache quote for short-term storage
   */
  private static async cacheQuote(quote: QuoteResponse): Promise<void> {
    try {
      await cache.setJson(
        `quote:${quote.quoteId}`,
        quote,
        QuotesService.QUOTE_CACHE_TTL
      );
    } catch (error) {
      logError('Failed to cache quote', error as Error);
      // Don't throw - caching failure shouldn't break quote generation
    }
  }

  /**
   * Get health status
   */
  static getHealthStatus(): { status: string; details?: string } {
    return {
      status: QuotesService.isInitialized ? 'healthy' : 'initializing',
    };
  }

  /**
   * Shutdown method
   */
  static async shutdown(): Promise<void> {
    QuotesService.isInitialized = false;
    logInfo('QuotesService shut down');
  }
}
