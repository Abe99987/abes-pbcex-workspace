import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createError, asyncHandler } from '@/middlewares/errorMiddleware';
import { logInfo, logError } from '@/utils/logger';
import { Trade, CreateTradeInput, TradeUtils } from '@/models/Trade';
import { BalanceUtils } from '@/models/Balance';
import { TRADING, TRADE_STATUS, ASSETS } from '@/utils/constants';
import { AuthController } from './AuthController';
import { WalletController } from './WalletController';

/**
 * Trade Controller for PBCEx
 * Handles asset trading and price feeds
 */

// In-memory stores for trades and price data
const trades: Trade[] = [];
const priceCache: Map<string, { price: number; timestamp: Date; change24h: number }> = new Map();

export class TradeController {
  /**
   * GET /api/trade/prices
   * Get current spot prices for assets
   */
  static getPrices = asyncHandler(async (req: Request, res: Response) => {
    const { asset } = req.query;

    // Update price cache if stale (in production, this would be real-time)
    await TradeController.updatePriceCache();

    // Get all prices or specific asset
    const prices: Record<string, any> = {};
    
    const assetsToReturn = asset ? [asset as string] : ['AU', 'AG', 'PT', 'PD', 'CU'];

    for (const assetCode of assetsToReturn) {
      const priceData = priceCache.get(assetCode);
      if (priceData) {
        prices[assetCode] = {
          price: priceData.price.toFixed(2),
          change24h: priceData.change24h > 0 ? `+${priceData.change24h.toFixed(2)}%` : `${priceData.change24h.toFixed(2)}%`,
          lastUpdated: priceData.timestamp.toISOString(),
        };
      }
    }

    res.json({
      code: 'SUCCESS',
      data: prices,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * POST /api/trade/order
   * Place a market conversion order
   */
  static placeOrder = asyncHandler(async (req: Request, res: Response) => {
    const { fromAsset, toAsset, amount } = req.body;
    const userId = req.user!.id;

    logInfo('Trade order received', { 
      userId, 
      fromAsset, 
      toAsset, 
      amount 
    });

    // Validate trade parameters
    TradeController.validateTradeRequest(fromAsset, toAsset, amount);

    // Get user accounts
    const userAccounts = AuthController.getUserAccounts(userId);
    const sourceAccount = TradeController.getAccountForAsset(userAccounts, fromAsset);
    const targetAccount = TradeController.getAccountForAsset(userAccounts, toAsset);

    if (!sourceAccount || !targetAccount) {
      throw createError.validation('Invalid asset or account configuration');
    }

    // Check sufficient balance
    const sourceBalance = WalletController.getUserBalances(userId)
      .find(b => b.accountId === sourceAccount.id && b.asset === fromAsset);

    if (!sourceBalance || !BalanceUtils.hasSufficientBalance(sourceBalance, amount)) {
      throw createError.validation(`Insufficient ${fromAsset} balance`);
    }

    // Get current market price and calculate quote
    const quote = await TradeController.calculateTradeQuote(fromAsset, toAsset, amount);

    // Check if user has enough to cover amount + fee
    const totalRequired = BalanceUtils.add(amount, quote.fee);
    if (!BalanceUtils.hasSufficientBalance(sourceBalance, totalRequired)) {
      throw createError.validation(`Insufficient balance to cover amount (${amount}) + fee (${quote.fee})`);
    }

    // Execute trade atomically
    const tradeId = uuidv4();
    
    try {
      // Create trade record
      const trade: Trade = {
        id: tradeId,
        userId,
        fromAccountId: sourceAccount.id,
        toAccountId: targetAccount.id,
        assetSold: fromAsset,
        assetBought: toAsset,
        amountSold: amount,
        amountBought: quote.amountReceived,
        price: quote.price,
        feeAmount: quote.fee,
        feeAsset: fromAsset,
        status: TRADE_STATUS.FILLED,
        orderType: 'MARKET',
        executedAt: new Date(),
        reference: `MARKET_${tradeId.slice(-8)}`,
        metadata: {
          originalQuote: quote,
          spread: quote.spread,
          feeRate: quote.feeRate,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Update balances
      // Debit source account (amount + fee)
      const newSourceBalance = BalanceUtils.subtract(sourceBalance.amount, totalRequired);
      
      // Credit target account  
      const targetBalance = WalletController.getUserBalances(userId)
        .find(b => b.accountId === targetAccount.id && b.asset === toAsset) || 
        { amount: '0', lockedAmount: '0' } as any;
      
      const newTargetBalance = BalanceUtils.add(targetBalance.amount || '0', quote.amountReceived);

      // In production, these would be atomic database operations
      sourceBalance.amount = newSourceBalance;
      sourceBalance.lastUpdated = new Date();

      if (targetBalance.id) {
        targetBalance.amount = newTargetBalance;
        targetBalance.lastUpdated = new Date();
      } else {
        // Create new balance record
        const newBalance = {
          id: uuidv4(),
          accountId: targetAccount.id,
          asset: toAsset,
          amount: newTargetBalance,
          lockedAmount: '0',
          lastUpdated: new Date(),
          createdAt: new Date(),
        };
        WalletController.getAllBalances().push(newBalance);
      }

      // Record trade
      trades.push(trade);

      logInfo('Trade executed successfully', { 
        tradeId,
        userId,
        fromAsset,
        toAsset,
        amount,
        amountReceived: quote.amountReceived,
        fee: quote.fee,
        price: quote.price,
      });

      res.status(201).json({
        code: 'SUCCESS',
        message: 'Trade executed successfully',
        data: {
          trade: {
            ...trade,
            effectiveRate: TradeUtils.calculateEffectiveRate(trade.amountSold, trade.amountBought),
            feeRate: TradeUtils.calculateFeeRate(trade.feeAmount, trade.amountSold),
            netAmountBought: TradeUtils.calculateNetAmount(
              trade.amountBought, 
              trade.feeAmount, 
              trade.feeAsset, 
              trade.assetBought
            ),
          },
        },
      });

    } catch (error) {
      logError('Trade execution failed', error as Error);
      throw createError.internal('Trade execution failed');
    }
  });

  /**
   * GET /api/trade/history
   * Get user's trade history
   */
  static getTradeHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { limit = 50, offset = 0, pair, status } = req.query;

    // Filter trades for the user
    let userTrades = trades.filter(t => t.userId === userId);

    // Apply filters
    if (pair) {
      const [fromAsset, toAsset] = (pair as string).split('/');
      userTrades = userTrades.filter(t => 
        (t.assetSold === fromAsset && t.assetBought === toAsset) ||
        (t.assetSold === toAsset && t.assetBought === fromAsset)
      );
    }

    if (status) {
      userTrades = userTrades.filter(t => t.status === status);
    }

    // Sort by date (newest first) and paginate
    userTrades.sort((a, b) => b.executedAt!.getTime() - a.executedAt!.getTime());
    const paginatedTrades = userTrades.slice(
      parseInt(offset as string),
      parseInt(offset as string) + parseInt(limit as string)
    );

    // Add calculated fields
    const tradesWithDetails = paginatedTrades.map(trade => 
      TradeUtils.withDetails(trade)
    );

    res.json({
      code: 'SUCCESS',
      data: {
        trades: tradesWithDetails,
        total: userTrades.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  });

  /**
   * GET /api/trade/pairs
   * Get available trading pairs and their stats
   */
  static getTradingPairs = asyncHandler(async (req: Request, res: Response) => {
    await TradeController.updatePriceCache();

    const pairs = [
      { from: 'PAXG', to: 'XAU-s', description: 'Gold Custody → Gold Synthetic' },
      { from: 'XAU-s', to: 'XAG-s', description: 'Gold Synthetic → Silver Synthetic' },
      { from: 'XAG-s', to: 'XPT-s', description: 'Silver Synthetic → Platinum Synthetic' },
      { from: 'XPT-s', to: 'XPD-s', description: 'Platinum Synthetic → Palladium Synthetic' },
      { from: 'XPD-s', to: 'XCU-s', description: 'Palladium Synthetic → Copper Synthetic' },
    ];

    const pairsWithStats = pairs.map(pair => {
      const fromPrice = TradeController.getAssetPrice(pair.from);
      const toPrice = TradeController.getAssetPrice(pair.to);
      const rate = fromPrice && toPrice ? (fromPrice / toPrice).toFixed(8) : '0';

      // Calculate 24h volume for this pair
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);
      
      const pairVolume = trades
        .filter(t => 
          t.executedAt! > yesterday &&
          ((t.assetSold === pair.from && t.assetBought === pair.to) ||
           (t.assetSold === pair.to && t.assetBought === pair.from))
        )
        .reduce((sum, t) => sum + parseFloat(t.amountSold), 0);

      return {
        pair: `${pair.from}/${pair.to}`,
        description: pair.description,
        price: rate,
        change24h: Math.random() > 0.5 ? `+${(Math.random() * 3).toFixed(2)}%` : `-${(Math.random() * 2).toFixed(2)}%`,
        volume24h: pairVolume.toFixed(8),
        high24h: (parseFloat(rate) * (1 + Math.random() * 0.05)).toFixed(8),
        low24h: (parseFloat(rate) * (1 - Math.random() * 0.05)).toFixed(8),
      };
    });

    res.json({
      code: 'SUCCESS',
      data: {
        pairs: pairsWithStats,
        lastUpdated: new Date().toISOString(),
      },
    });
  });

  /**
   * POST /api/trade/quote
   * Get a trading quote without executing
   */
  static getQuote = asyncHandler(async (req: Request, res: Response) => {
    const { fromAsset, toAsset, amount } = req.body;
    const userId = req.user!.id;

    // Validate trade parameters
    TradeController.validateTradeRequest(fromAsset, toAsset, amount);

    // Calculate quote
    const quote = await TradeController.calculateTradeQuote(fromAsset, toAsset, amount);

    res.json({
      code: 'SUCCESS',
      data: {
        quote: {
          ...quote,
          quoteId: uuidv4(),
          expiresAt: new Date(Date.now() + 30000).toISOString(), // 30 seconds
          userId,
        },
      },
    });
  });

  // Private helper methods

  private static validateTradeRequest(fromAsset: string, toAsset: string, amount: string): void {
    // Validate assets
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

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw createError.validation('Amount must be a positive number');
    }
    if (amountNum < TRADING.MIN_TRADE_AMOUNT) {
      throw createError.validation(`Minimum trade amount is ${TRADING.MIN_TRADE_AMOUNT}`);
    }
    if (amountNum > TRADING.MAX_TRADE_AMOUNT) {
      throw createError.validation(`Maximum trade amount is ${TRADING.MAX_TRADE_AMOUNT}`);
    }

    // Validate trading pair
    if (!TradeController.isValidTradingPair(fromAsset, toAsset)) {
      throw createError.validation(`Trading pair ${fromAsset}→${toAsset} is not supported`);
    }
  }

  private static isValidTradingPair(fromAsset: string, toAsset: string): boolean {
    // PAXG can only be converted to XAU-s and vice versa
    if (fromAsset === 'PAXG' && toAsset === 'XAU-s') return true;
    if (fromAsset === 'XAU-s' && toAsset === 'PAXG') return true;

    // Synthetic assets can be traded among themselves
    const synthetics = ['XAU-s', 'XAG-s', 'XPT-s', 'XPD-s', 'XCU-s'];
    return synthetics.includes(fromAsset) && synthetics.includes(toAsset);
  }

  private static getAccountForAsset(userAccounts: any[], asset: string) {
    const realAssets = ['PAXG', 'USD', 'USDC'];
    const synthetics = ['XAU-s', 'XAG-s', 'XPT-s', 'XPD-s', 'XCU-s'];

    if (realAssets.includes(asset)) {
      return userAccounts.find(a => a.type === 'FUNDING');
    } else if (synthetics.includes(asset)) {
      return userAccounts.find(a => a.type === 'TRADING');
    }
    return null;
  }

  private static async calculateTradeQuote(
    fromAsset: string, 
    toAsset: string, 
    amount: string
  ) {
    await TradeController.updatePriceCache();

    const amountNum = parseFloat(amount);

    // Get base exchange rate
    let baseRate: number;

    if ((fromAsset === 'PAXG' && toAsset === 'XAU-s') || 
        (fromAsset === 'XAU-s' && toAsset === 'PAXG')) {
      baseRate = 1.0; // 1:1 conversion
    } else {
      const fromPrice = TradeController.getAssetPrice(fromAsset);
      const toPrice = TradeController.getAssetPrice(toAsset);
      
      if (!fromPrice || !toPrice) {
        throw createError.serviceUnavailable('PriceFeed', 'Price data unavailable');
      }
      
      baseRate = fromPrice / toPrice;
    }

    // Apply spread (0.1% on each side = 0.2% total)
    const spreadRate = 0.002;
    const spreadAmount = baseRate * spreadRate;
    const quotedRate = baseRate - spreadAmount; // Slightly worse rate for user

    // Calculate amounts
    const grossAmountReceived = amountNum * quotedRate;
    
    // Calculate fee (0.5% of input amount)
    const feeRate = TRADING.DEFAULT_FEE_RATE;
    const feeAmount = amountNum * feeRate;
    
    // Net amount received after fee
    const netAmountReceived = grossAmountReceived; // Fee is taken from input

    return {
      fromAsset,
      toAsset,
      fromAmount: amount,
      amountReceived: netAmountReceived.toFixed(8),
      price: quotedRate.toFixed(8),
      baseRate: baseRate.toFixed(8),
      spread: spreadAmount.toFixed(8),
      spreadRate: (spreadRate * 100).toFixed(2),
      fee: feeAmount.toFixed(8),
      feeRate: (feeRate * 100).toFixed(2),
      totalCost: (amountNum + feeAmount).toFixed(8),
    };
  }

  private static async updatePriceCache(): Promise<void> {
    const now = new Date();
    
    // Mock price updates (in production, this would fetch from TradingView/Chainlink)
    const mockPrices = {
      'AU': { base: 2050, volatility: 0.02 },
      'AG': { base: 24.75, volatility: 0.03 },
      'PT': { base: 975.50, volatility: 0.025 },
      'PD': { base: 1150.75, volatility: 0.04 },
      'CU': { base: 8.25, volatility: 0.025 },
    };

    for (const [asset, { base, volatility }] of Object.entries(mockPrices)) {
      const cached = priceCache.get(asset);
      
      // Update if cache is older than 5 seconds or doesn't exist
      if (!cached || now.getTime() - cached.timestamp.getTime() > 5000) {
        // Simulate price movement
        const change = (Math.random() - 0.5) * volatility;
        const newPrice = base * (1 + change);
        const change24h = (Math.random() - 0.5) * 4; // ±2% daily change
        
        priceCache.set(asset, {
          price: newPrice,
          timestamp: now,
          change24h: change24h,
        });
      }
    }
  }

  private static getAssetPrice(asset: string): number | null {
    // Map asset codes to price cache keys
    const assetToPriceKey: Record<string, string> = {
      'PAXG': 'AU',
      'XAU-s': 'AU',
      'XAG-s': 'AG', 
      'XPT-s': 'PT',
      'XPD-s': 'PD',
      'XCU-s': 'CU',
      'USD': 'USD',
      'USDC': 'USD',
    };

    const priceKey = assetToPriceKey[asset];
    if (!priceKey) return null;

    if (priceKey === 'USD') return 1.0;

    const cached = priceCache.get(priceKey);
    return cached ? cached.price : null;
  }

  // Utility methods for testing and admin
  static getAllTrades = (): Trade[] => trades;
  static getUserTrades = (userId: string): Trade[] => trades.filter(t => t.userId === userId);
  static getPriceCache = (): Map<string, any> => priceCache;
  static getTradeById = (id: string): Trade | undefined => trades.find(t => t.id === id);
  
  // Statistics
  static getTradeStatistics = () => {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const trades24h = trades.filter(t => t.executedAt! > last24h);
    const volume24h = trades24h.reduce((sum, t) => sum + parseFloat(t.amountSold), 0);
    const fees24h = trades24h.reduce((sum, t) => sum + parseFloat(t.feeAmount), 0);
    
    return {
      totalTrades: trades.length,
      trades24h: trades24h.length,
      volume24h: volume24h.toFixed(8),
      fees24h: fees24h.toFixed(8),
      averageTradeSize: trades.length > 0 ? 
        (trades.reduce((sum, t) => sum + parseFloat(t.amountSold), 0) / trades.length).toFixed(8) : '0',
      mostActivePair: TradeController.getMostActivePair(),
    };
  };

  private static getMostActivePair(): string {
    const pairCounts: Record<string, number> = {};
    
    trades.forEach(t => {
      const pair = `${t.assetSold}/${t.assetBought}`;
      pairCounts[pair] = (pairCounts[pair] || 0) + 1;
    });
    
    return Object.entries(pairCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';
  }
}
