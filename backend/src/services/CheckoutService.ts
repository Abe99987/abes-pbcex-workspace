import { v4 as uuidv4 } from 'uuid';
import { logInfo, logWarn, logError } from '@/utils/logger';
import { env } from '@/config/env';
import { cache } from '@/cache/redis';
import { PricesService } from './PricesService';

/**
 * Checkout Service for PBCEx
 * Handles price-lock quotes and confirmations for JM Bullion/Dillon Gage integration stubs
 * Provides 10-minute price locks with configurable spreads
 */

export interface PriceLockQuoteRequest {
  symbol: string; // e.g., "PAXG"
  quantity: number;
  side: 'buy' | 'sell';
  userId?: string;
}

export interface PriceLockQuote {
  id: string;
  symbol: string;
  quantity: number;
  side: 'buy' | 'sell';
  basePrice: number;
  spread: number;
  spreadBps: number;
  lockedPrice: number;
  totalAmount: number;
  currency: string;
  expiresAt: number; // Unix timestamp
  createdAt: number;
  userId?: string;
  vendor: 'JM_BULLION' | 'DILLON_GAGE' | 'STUB';
}

export interface PriceLockConfirmation {
  id: string;
  quoteId: string;
  confirmed: boolean;
  confirmedAt: number;
  finalPrice: number;
  totalAmount: number;
  status: 'confirmed' | 'expired' | 'cancelled';
}

export interface CheckoutResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  correlationId: string;
}

export class CheckoutService {
  private static isInitialized = false;
  
  // Configuration
  private static readonly LOCK_WINDOW_SECONDS = 600; // 10 minutes as specified
  private static readonly DEFAULT_SPREAD_BPS = 50; // 0.5% default spread
  private static readonly CACHE_PREFIX = 'pricelock';
  
  // Supported symbols and their vendor mappings
  private static readonly SYMBOL_VENDOR_MAP = {
    'PAXG': 'JM_BULLION',
    'XAU': 'DILLON_GAGE', // Future precious metals
    'XAG': 'DILLON_GAGE',
  } as const;

  /**
   * Initialize Checkout service
   */
  static async initialize(): Promise<void> {
    if (CheckoutService.isInitialized) {
      logWarn('CheckoutService already initialized');
      return;
    }

    logInfo('Initializing CheckoutService');

    try {
      // Ensure PricesService is available
      logInfo('CheckoutService depends on PricesService for base price data');
      
      CheckoutService.isInitialized = true;
      logInfo('CheckoutService initialized successfully');

    } catch (error) {
      logError('Failed to initialize CheckoutService', error as Error);
      throw error;
    }
  }

  /**
   * Request a price-lock quote
   */
  static async requestQuote(request: PriceLockQuoteRequest): Promise<CheckoutResult<PriceLockQuote>> {
    const correlationId = Math.random().toString(36).substr(2, 9);

    logInfo('Price-lock quote requested', {
      symbol: request.symbol,
      quantity: request.quantity,
      side: request.side,
      userId: request.userId,
      correlationId,
    });

    try {
      // Input validation
      const validationError = CheckoutService.validateQuoteRequest(request);
      if (validationError) {
        return {
          success: false,
          error: validationError,
          correlationId,
        };
      }

      // Get current base price
      const priceResult = await PricesService.getTicker(request.symbol);
      if (!priceResult.success || !priceResult.data) {
        return {
          success: false,
          error: `Unable to get current price for ${request.symbol}: ${priceResult.error}`,
          correlationId,
        };
      }

      const basePrice = priceResult.data.usd;

      // Calculate spread and locked price
      const spreadBps = CheckoutService.getSpreadBps();
      const spread = basePrice * (spreadBps / 10000); // Convert basis points to decimal
      
      // For buys, add spread; for sells, subtract spread
      const lockedPrice = request.side === 'buy' 
        ? basePrice + spread 
        : basePrice - spread;

      const totalAmount = lockedPrice * request.quantity;

      // Generate quote
      const quote: PriceLockQuote = {
        id: uuidv4(),
        symbol: request.symbol,
        quantity: request.quantity,
        side: request.side,
        basePrice,
        spread,
        spreadBps,
        lockedPrice,
        totalAmount,
        currency: 'USD',
        expiresAt: Date.now() + (CheckoutService.LOCK_WINDOW_SECONDS * 1000),
        createdAt: Date.now(),
        userId: request.userId,
        vendor: CheckoutService.SYMBOL_VENDOR_MAP[request.symbol as keyof typeof CheckoutService.SYMBOL_VENDOR_MAP] || 'STUB',
      };

      // Store quote in Redis with TTL
      await CheckoutService.storeQuote(quote);

      logInfo('Price-lock quote created', {
        quoteId: quote.id,
        symbol: quote.symbol,
        lockedPrice: quote.lockedPrice,
        totalAmount: quote.totalAmount,
        expiresAt: new Date(quote.expiresAt).toISOString(),
        correlationId,
      });

      return {
        success: true,
        data: quote,
        correlationId,
      };

    } catch (error) {
      logError('Failed to create price-lock quote', {
        error: error as Error,
        correlationId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown quote error',
        correlationId,
      };
    }
  }

  /**
   * Confirm a price-lock quote
   */
  static async confirmQuote(quoteId: string, userId?: string): Promise<CheckoutResult<PriceLockConfirmation>> {
    const correlationId = Math.random().toString(36).substr(2, 9);

    logInfo('Price-lock confirmation requested', {
      quoteId,
      userId,
      correlationId,
    });

    try {
      // Retrieve quote from cache
      const quote = await CheckoutService.getQuote(quoteId);
      if (!quote) {
        return {
          success: false,
          error: 'Quote not found or expired',
          correlationId,
        };
      }

      // Verify user authorization if provided
      if (userId && quote.userId && quote.userId !== userId) {
        return {
          success: false,
          error: 'Unauthorized to confirm this quote',
          correlationId,
        };
      }

      // Check if quote is still valid
      if (Date.now() > quote.expiresAt) {
        // Clean up expired quote
        await CheckoutService.deleteQuote(quoteId);
        
        return {
          success: false,
          error: 'Quote has expired',
          correlationId,
        };
      }

      // Create confirmation
      const confirmation: PriceLockConfirmation = {
        id: uuidv4(),
        quoteId: quote.id,
        confirmed: true,
        confirmedAt: Date.now(),
        finalPrice: quote.lockedPrice,
        totalAmount: quote.totalAmount,
        status: 'confirmed',
      };

      // Store confirmation and remove the quote
      await CheckoutService.storeConfirmation(confirmation);
      await CheckoutService.deleteQuote(quoteId);

      // Emit event (placeholder for future integration)
      await CheckoutService.emitConfirmationEvent(quote, confirmation);

      logInfo('Price-lock confirmed successfully', {
        quoteId: quote.id,
        confirmationId: confirmation.id,
        symbol: quote.symbol,
        totalAmount: confirmation.totalAmount,
        vendor: quote.vendor,
        correlationId,
      });

      return {
        success: true,
        data: confirmation,
        correlationId,
      };

    } catch (error) {
      logError('Failed to confirm price-lock', {
        quoteId,
        error: error as Error,
        correlationId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown confirmation error',
        correlationId,
      };
    }
  }

  /**
   * Get quote by ID
   */
  static async getQuoteById(quoteId: string): Promise<CheckoutResult<PriceLockQuote | null>> {
    const correlationId = Math.random().toString(36).substr(2, 9);

    try {
      const quote = await CheckoutService.getQuote(quoteId);
      
      return {
        success: true,
        data: quote,
        correlationId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      };
    }
  }

  /**
   * Get service health status
   */
  static getHealthStatus(): {
    status: string;
    configured: boolean;
    lockWindowSeconds: number;
    spreadBps: number;
    supportedSymbols: string[];
  } {
    return {
      status: CheckoutService.isInitialized ? 'initialized' : 'not_initialized',
      configured: true, // Always configured as stub
      lockWindowSeconds: CheckoutService.LOCK_WINDOW_SECONDS,
      spreadBps: CheckoutService.getSpreadBps(),
      supportedSymbols: Object.keys(CheckoutService.SYMBOL_VENDOR_MAP),
    };
  }

  /**
   * Shutdown service gracefully
   */
  static async shutdown(): Promise<void> {
    logInfo('Shutting down CheckoutService');
    CheckoutService.isInitialized = false;
    logInfo('CheckoutService shut down');
  }

  // Private helper methods

  private static validateQuoteRequest(request: PriceLockQuoteRequest): string | null {
    if (!request.symbol || typeof request.symbol !== 'string') {
      return 'Symbol is required';
    }

    if (!request.quantity || typeof request.quantity !== 'number' || request.quantity <= 0) {
      return 'Quantity must be a positive number';
    }

    if (request.quantity > 1000) {
      return 'Quantity exceeds maximum limit (1000)';
    }

    if (!request.side || !['buy', 'sell'].includes(request.side)) {
      return 'Side must be either "buy" or "sell"';
    }

    const upperSymbol = request.symbol.toUpperCase();
    if (!CheckoutService.SYMBOL_VENDOR_MAP[upperSymbol as keyof typeof CheckoutService.SYMBOL_VENDOR_MAP]) {
      return `Unsupported symbol: ${request.symbol}`;
    }

    return null;
  }

  private static getSpreadBps(): number {
    const envSpread = process.env.PRICELOCK_SPREAD_BPS;
    if (envSpread) {
      const parsed = parseInt(envSpread, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1000) { // Max 10% spread
        return parsed;
      }
    }
    return CheckoutService.DEFAULT_SPREAD_BPS;
  }

  private static async storeQuote(quote: PriceLockQuote): Promise<void> {
    try {
      const key = `${CheckoutService.CACHE_PREFIX}:${quote.id}`;
      const ttl = CheckoutService.LOCK_WINDOW_SECONDS;
      
      await cache.setex(key, ttl, JSON.stringify(quote));
      
      logInfo('Quote stored in cache', {
        quoteId: quote.id,
        ttl,
        key,
      });
    } catch (error) {
      logError('Failed to store quote in cache', { 
        quoteId: quote.id,
        error,
      });
      throw error;
    }
  }

  private static async getQuote(quoteId: string): Promise<PriceLockQuote | null> {
    try {
      const key = `${CheckoutService.CACHE_PREFIX}:${quoteId}`;
      const cached = await cache.get(key);
      
      if (!cached) {
        return null;
      }

      const quote: PriceLockQuote = JSON.parse(cached);
      
      // Validate quote data structure
      if (!quote.id || !quote.symbol || !quote.lockedPrice) {
        logWarn('Invalid quote data in cache', { quoteId });
        return null;
      }

      return quote;
    } catch (error) {
      logError('Failed to retrieve quote from cache', { 
        quoteId,
        error,
      });
      return null;
    }
  }

  private static async deleteQuote(quoteId: string): Promise<void> {
    try {
      const key = `${CheckoutService.CACHE_PREFIX}:${quoteId}`;
      await cache.del(key);
      
      logInfo('Quote deleted from cache', { quoteId });
    } catch (error) {
      logError('Failed to delete quote from cache', { 
        quoteId,
        error,
      });
      // Don't throw - deletion failure shouldn't break the flow
    }
  }

  private static async storeConfirmation(confirmation: PriceLockConfirmation): Promise<void> {
    try {
      // Store confirmation with longer TTL for audit purposes
      const key = `confirmation:${confirmation.id}`;
      const ttl = 24 * 60 * 60; // 24 hours
      
      await cache.setex(key, ttl, JSON.stringify(confirmation));
      
      logInfo('Confirmation stored', {
        confirmationId: confirmation.id,
        quoteId: confirmation.quoteId,
      });
    } catch (error) {
      logError('Failed to store confirmation', { 
        confirmationId: confirmation.id,
        error,
      });
      // Don't throw - confirmation storage failure shouldn't break the flow
    }
  }

  private static async emitConfirmationEvent(quote: PriceLockQuote, confirmation: PriceLockConfirmation): Promise<void> {
    // Placeholder for future event emission to integrate with partner APIs
    logInfo('Confirmation event emitted (stub)', {
      quoteId: quote.id,
      confirmationId: confirmation.id,
      symbol: quote.symbol,
      vendor: quote.vendor,
      totalAmount: confirmation.totalAmount,
      event: 'pricelock_confirmed',
    });

    // In the future, this would:
    // 1. Call JM Bullion API for PAXG orders
    // 2. Call Dillon Gage API for other metals
    // 3. Update internal order management system
    // 4. Send notifications to user
    // 5. Trigger fulfillment workflows
  }
}

export default CheckoutService;
