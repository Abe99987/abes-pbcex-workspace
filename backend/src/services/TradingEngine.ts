import { Trade, CreateTradeInput, TradeUtils } from '@/models/Trade';
import { Balance, BalanceUtils } from '@/models/Balance';
import { createError } from '@/middlewares/errorMiddleware';
import { logInfo, logError, logWarn } from '@/utils/logger';
import { TRADING, TRADE_STATUS, ASSETS } from '@/utils/constants';

/**
 * Trading Engine for PBCEx
 * Handles market conversion trades with fees and spread
 */

export interface QuoteRequest {
  userId: string;
  fromAsset: string;
  toAsset: string;
  amount: string;
}

export interface TradeQuote {
  fromAsset: string;
  toAsset: string;
  fromAmount: string;
  toAmount: string;
  price: string;
  fee: string;
  spread: string;
  totalCost: string;
  expiresAt: Date;
  quoteId: string;
}

export interface ExecuteTradeRequest {
  userId: string;
  quoteId?: string;
  fromAsset: string;
  toAsset: string;
  amount: string;
  maxSlippage?: string; // Maximum acceptable price slippage
}

export class TradingEngine {
  /**
   * Get a trading quote for asset conversion
   */
  static async getQuote(request: QuoteRequest): Promise<TradeQuote> {
    logInfo('Quote requested', { 
      userId: request.userId,
      pair: `${request.fromAsset}→${request.toAsset}`,
      amount: request.amount 
    });

    try {
      // Validate assets
      TradingEngine.validateAssetPair(request.fromAsset, request.toAsset);

      // Get current spot prices (stub - would call PriceFeedService)
      const spotPrice = await TradingEngine.getSpotPrice(request.fromAsset, request.toAsset);
      
      // Calculate spread (0.1% on each side = 0.2% total spread)
      const spreadRate = 0.002; // 0.2%
      const spreadAdjustment = spotPrice * spreadRate;
      const quotedPrice = spotPrice + spreadAdjustment;

      // Calculate amounts
      const fromAmount = parseFloat(request.amount);
      const toAmount = fromAmount * quotedPrice;
      
      // Calculate fee (0.5% of traded amount)
      const feeRate = TRADING.DEFAULT_FEE_RATE;
      const feeAmount = fromAmount * feeRate;

      // Calculate total cost including fee
      const totalCost = fromAmount + feeAmount;

      const quote: TradeQuote = {
        fromAsset: request.fromAsset,
        toAsset: request.toAsset,
        fromAmount: fromAmount.toFixed(8),
        toAmount: toAmount.toFixed(8),
        price: quotedPrice.toFixed(8),
        fee: feeAmount.toFixed(8),
        spread: spreadAdjustment.toFixed(8),
        totalCost: totalCost.toFixed(8),
        expiresAt: new Date(Date.now() + 30000), // 30 seconds
        quoteId: 'quote_' + Math.random().toString(36).substr(2, 9),
      };

      logInfo('Quote generated', { quoteId: quote.quoteId, price: quote.price });
      return quote;

    } catch (error) {
      logError('Quote generation failed', error as Error);
      throw error;
    }
  }

  /**
   * Execute a trade based on current market prices
   */
  static async executeTrade(request: ExecuteTradeRequest): Promise<Trade> {
    logInfo('Trade execution requested', {
      userId: request.userId,
      pair: `${request.fromAsset}→${request.toAsset}`,
      amount: request.amount,
    });

    try {
      // Validate trade request
      await TradingEngine.validateTradeRequest(request);

      // Get fresh quote
      const quote = await TradingEngine.getQuote({
        userId: request.userId,
        fromAsset: request.fromAsset,
        toAsset: request.toAsset,
        amount: request.amount,
      });

      // Check slippage if specified
      if (request.maxSlippage) {
        const slippage = parseFloat(quote.spread) / parseFloat(quote.price);
        const maxSlippage = parseFloat(request.maxSlippage);
        
        if (slippage > maxSlippage) {
          throw createError.validation('Price slippage exceeds maximum tolerance');
        }
      }

      // Get user accounts (stub - would query database)
      const { fromAccount, toAccount } = await TradingEngine.getUserAccounts(
        request.userId,
        request.fromAsset,
        request.toAsset
      );

      // Check sufficient balance (stub - would query database)
      await TradingEngine.checkSufficientBalance(fromAccount.id, request.fromAsset, quote.totalCost);

      // Create trade record
      const tradeInput: CreateTradeInput = {
        userId: request.userId,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        assetSold: request.fromAsset,
        assetBought: request.toAsset,
        amountSold: quote.fromAmount,
        amountBought: quote.toAmount,
        price: quote.price,
        feeAmount: quote.fee,
        feeAsset: request.fromAsset, // Fee charged in source asset
        reference: quote.quoteId,
      };

      // Execute the trade atomically (stub - would be a database transaction)
      const trade = await TradingEngine.executeTradeTransaction(tradeInput);

      logInfo('Trade executed successfully', {
        tradeId: trade.id,
        userId: request.userId,
        pair: `${request.fromAsset}→${request.toAsset}`,
        amount: request.amount,
      });

      return trade;

    } catch (error) {
      logError('Trade execution failed', error as Error);
      throw error;
    }
  }

  /**
   * Get current trading pairs and their prices
   */
  static async getTradingPairs(): Promise<Array<{
    pair: string;
    price: string;
    change24h: string;
    volume24h: string;
  }>> {
    try {
      // Stub implementation - would get real market data
      const pairs = [
        { pair: 'PAXG/XAU-s', price: '1.000000', change24h: '0.00', volume24h: '1250.5' },
        { pair: 'XAU-s/XAG-s', price: '75.25', change24h: '+0.85', volume24h: '890.2' },
        { pair: 'XAG-s/XPT-s', price: '0.025', change24h: '-0.12', volume24h: '445.8' },
        { pair: 'XPT-s/XPD-s', price: '0.85', change24h: '+1.25', volume24h: '125.3' },
        { pair: 'XPD-s/XCU-s', price: '425.8', change24h: '+2.15', volume24h: '75.9' },
      ];

      return pairs;
    } catch (error) {
      logError('Failed to get trading pairs', error as Error);
      throw error;
    }
  }

  // Private helper methods

  private static validateAssetPair(fromAsset: string, toAsset: string): void {
    const validAssets = Object.values(ASSETS);
    
    if (!validAssets.includes(fromAsset as any)) {
      throw createError.validation(`Invalid source asset: ${fromAsset}`);
    }
    
    if (!validAssets.includes(toAsset as any)) {
      throw createError.validation(`Invalid target asset: ${toAsset}`);
    }
    
    if (fromAsset === toAsset) {
      throw createError.validation('Cannot trade the same asset');
    }

    // Check if conversion is allowed
    const isValidConversion = TradingEngine.isValidAssetConversion(fromAsset, toAsset);
    if (!isValidConversion) {
      throw createError.validation(`Trading pair ${fromAsset}→${toAsset} is not supported`);
    }
  }

  private static isValidAssetConversion(fromAsset: string, toAsset: string): boolean {
    // PAXG can only be converted to XAU-s and vice versa
    if (fromAsset === 'PAXG') {
      return toAsset === 'XAU-s';
    }
    if (toAsset === 'PAXG') {
      return fromAsset === 'XAU-s';
    }

    // Synthetic assets can be traded among themselves
    const syntheticAssets = ['XAU-s', 'XAG-s', 'XPT-s', 'XPD-s', 'XCU-s'];
    return syntheticAssets.includes(fromAsset) && syntheticAssets.includes(toAsset);
  }

  private static async getSpotPrice(fromAsset: string, toAsset: string): Promise<number> {
    // Stub implementation - would call PriceFeedService
    logInfo('Getting spot price', { pair: `${fromAsset}→${toAsset}` });

    // Mock prices for different asset pairs
    const mockPrices: Record<string, number> = {
      'PAXG→XAU-s': 1.0, // 1:1 conversion
      'XAU-s→PAXG': 1.0, // 1:1 conversion
      'XAU-s→XAG-s': 75.25, // ~75 ounces of silver per ounce of gold
      'XAG-s→XAU-s': 1 / 75.25,
      'XAU-s→XPT-s': 2.1, // Gold to platinum ratio
      'XPT-s→XAU-s': 1 / 2.1,
      'XAU-s→XPD-s': 1.8, // Gold to palladium ratio
      'XPD-s→XAU-s': 1 / 1.8,
      'XAU-s→XCU-s': 2650, // Gold to copper ratio (very rough)
      'XCU-s→XAU-s': 1 / 2650,
    };

    const pairKey = `${fromAsset}→${toAsset}`;
    const price = mockPrices[pairKey];
    
    if (!price) {
      throw createError.serviceUnavailable('PriceFeed', `No price available for ${pairKey}`);
    }

    return price;
  }

  private static async validateTradeRequest(request: ExecuteTradeRequest): Promise<void> {
    const amount = parseFloat(request.amount);
    
    if (amount <= 0) {
      throw createError.validation('Trade amount must be positive');
    }
    
    if (amount < TRADING.MIN_TRADE_AMOUNT) {
      throw createError.validation(`Minimum trade amount is ${TRADING.MIN_TRADE_AMOUNT}`);
    }
    
    if (amount > TRADING.MAX_TRADE_AMOUNT) {
      throw createError.validation(`Maximum trade amount is ${TRADING.MAX_TRADE_AMOUNT}`);
    }
  }

  private static async getUserAccounts(
    userId: string,
    fromAsset: string,
    toAsset: string
  ): Promise<{ fromAccount: { id: string }; toAccount: { id: string } }> {
    // Stub implementation - would query user's accounts
    logInfo('Getting user accounts for trade', { userId, fromAsset, toAsset });

    // Mock account IDs
    return {
      fromAccount: { id: `${userId}_funding_account` },
      toAccount: { id: `${userId}_trading_account` },
    };
  }

  private static async checkSufficientBalance(
    accountId: string,
    asset: string,
    requiredAmount: string
  ): Promise<void> {
    // Stub implementation - would query balance
    logInfo('Checking balance', { accountId, asset, requiredAmount });

    // For demo purposes, assume sufficient balance
    const mockBalance = '10000.00000000';
    const required = parseFloat(requiredAmount);
    const available = parseFloat(mockBalance);

    if (available < required) {
      throw createError.validation(`Insufficient balance. Required: ${requiredAmount}, Available: ${mockBalance}`);
    }
  }

  private static async executeTradeTransaction(tradeInput: CreateTradeInput): Promise<Trade> {
    // Stub implementation - would execute atomic database transaction
    logInfo('Executing trade transaction', { 
      fromAsset: tradeInput.assetSold,
      toAsset: tradeInput.assetBought,
      amount: tradeInput.amountSold,
    });

    // Create trade record
    const trade: Trade = {
      id: 'trade_' + Math.random().toString(36).substr(2, 9),
      ...tradeInput,
      ...TradeUtils.getDefaultValues(tradeInput),
      status: TRADE_STATUS.FILLED,
      executedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Trade;

    // TODO: In real implementation:
    // 1. Lock balances
    // 2. Update source account balance (subtract amount + fee)
    // 3. Update target account balance (add amount)
    // 4. Create balance change records
    // 5. Update trade status to FILLED
    // 6. Trigger hedging if needed (for synthetic assets)
    // 7. Send notifications

    return trade;
  }

  /**
   * Get trade history for a user
   */
  static async getUserTradeHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ trades: Trade[]; total: number }> {
    logInfo('Getting user trade history', { userId, limit, offset });

    try {
      // Stub implementation - would query database
      const mockTrades: Trade[] = []; // Empty for now
      
      return {
        trades: mockTrades,
        total: 0,
      };
    } catch (error) {
      logError('Failed to get user trade history', error as Error);
      throw error;
    }
  }

  /**
   * Cancel a pending trade
   */
  static async cancelTrade(tradeId: string, userId: string): Promise<void> {
    logInfo('Cancelling trade', { tradeId, userId });

    try {
      // Stub implementation - would update trade status and unlock balances
      throw createError.notFound('Trade');
    } catch (error) {
      logError('Trade cancellation failed', error as Error);
      throw error;
    }
  }
}

export default TradingEngine;
