import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createError, asyncHandler } from '@/middlewares/errorMiddleware';
import { AuthenticatedRequest } from '@/middlewares/auth';
import { logInfo, logError } from '@/utils/logger';
import { ValidationService } from '@/services/ValidationService';
import OrdersService from '@/services/OrdersService';
import { CommodityConfigService } from '@/services/CommodityConfigService';
import { QuotesService } from '@/services/QuotesService';
import { db } from '@/db';

/**
 * Orders Controller for PBCEx
 * Handles physical order placement and sell/convert operations
 */

export interface PhysicalOrderRequest {
  symbol: string;
  amount: number;
  format: string;
  paymentMethod: 'BALANCE' | 'STRIPE_CARD';
  clientId: string;
  idempotencyKey: string;
  shippingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
}

export interface SellConvertRequest {
  symbol: string;
  amount: number;
  payout: 'USD' | 'USDC' | 'USDT' | 'TOKEN';
  clientId: string;
  idempotencyKey: string;
}

export class OrdersController {
  /**
   * POST /api/orders
   * Create a new order with a 10-minute price lock
   */
  static createOrder = asyncHandler(async (req: any, res: Response) => {
    const { metal, qty } = req.body as { metal: string; qty: number };

    // minimal validation occurs in route layer; just create
    const result = await OrdersService.createOrder({ metal, qty });
    return res.status(201).json(result);
  });

  /**
   * POST /api/orders/:id/relock
   * Relock an order if expired.
   */
  static relockOrder = asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params as { id: string };
    const outcome = OrdersService.relockOrder(id);
    if (!outcome.ok) {
      if (outcome.reason === 'NOT_FOUND') return res.status(404).json({ code: 'NOT_FOUND' });
      if (outcome.reason === 'NOT_EXPIRED') return res.status(409).json({ code: 'CONFLICT', message: 'Lock not expired' });
      return res.status(409).json({ code: 'CONFLICT', message: 'Invalid state' });
    }
    return res.status(200).json(outcome.result);
  });

  /**
   * POST /api/orders/:id/cancel
   * Cancel an order if not paid/fulfilled.
   */
  static cancelOrder = asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params as { id: string };
    const outcome = OrdersService.cancelOrder(id);
    if (!outcome.ok) {
      if (outcome.reason === 'NOT_FOUND') return res.status(404).json({ code: 'NOT_FOUND' });
      if (outcome.reason === 'ALREADY_FINALIZED') return res.status(409).json({ code: 'CONFLICT', message: 'Already paid or fulfilled' });
      return res.status(409).json({ code: 'CONFLICT' });
    }
    return res.status(200).json(outcome.result);
  });

  /**
   * POST /api/orders/physical
   * Place physical commodity order
   */
  static createPhysicalOrder = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      if (!userId) {
        throw createError.authentication('User authentication required');
      }

      const orderData: PhysicalOrderRequest = req.body;
      const orderId = uuidv4();

      logInfo('Physical order creation requested', {
        orderId,
        userId,
        symbol: orderData.symbol,
        amount: orderData.amount,
        format: orderData.format,
        idempotencyKey: orderData.idempotencyKey,
      });

      try {
        // Validate idempotency key
        const idempotencyValidation = ValidationService.validateIdempotencyKey(
          orderData.idempotencyKey
        );
        ValidationService.throwIfInvalid(
          idempotencyValidation,
          'Invalid idempotency key'
        );

        // Check for duplicate idempotency key
        const existingOrder = await OrdersController.findOrderByIdempotencyKey(
          userId,
          orderData.idempotencyKey
        );
        if (existingOrder) {
          logInfo(
            'Duplicate idempotency key detected, returning existing order',
            {
              orderId: existingOrder.id,
              idempotencyKey: orderData.idempotencyKey,
            }
          );
          res.json({
            code: 'SUCCESS',
            message: 'Order already exists',
            data: { orderId: existingOrder.id },
          });
          return;
        }

        // Validate client ID
        const clientIdValidation = ValidationService.validateClientId(
          orderData.clientId
        );
        ValidationService.throwIfInvalid(
          clientIdValidation,
          'Invalid client ID'
        );

        // Validate order request
        const orderValidation = await ValidationService.validateOrder({
          symbol: orderData.symbol,
          amount: orderData.amount,
          format: orderData.format,
          side: 'buy',
          userId,
          paymentMethod: orderData.paymentMethod,
          licenseVerified: false, // TODO: Check user's license status
        });
        ValidationService.throwIfInvalid(
          orderValidation,
          'Order validation failed'
        );

        // Get commodity configuration
        const config = await CommodityConfigService.getConfig(orderData.symbol);
        if (!config) {
          throw createError.validation('Unknown commodity');
        }

        // Get current quote for pricing
        const quote = await QuotesService.getEstimate({
          symbol: orderData.symbol,
          side: 'buy',
          amount: orderData.amount,
          format: orderData.format,
        });

        if (!quote.available) {
          throw createError.serviceUnavailable(
            'Pricing',
            quote.unavailableReason || 'Pricing unavailable'
          );
        }

        // Validate payment method balance if using BALANCE
        if (orderData.paymentMethod === 'BALANCE') {
          const balanceValidation = await ValidationService.validateBalance({
            userId,
            asset: 'USD',
            amount: quote.estimatedTotal || 0,
          });
          ValidationService.throwIfInvalid(
            balanceValidation,
            'Insufficient balance'
          );
        }

        // Create order record (in production, this would use the database)
        const order = {
          id: orderId,
          userId,
          symbol: orderData.symbol,
          amount: orderData.amount,
          format: orderData.format,
          paymentMethod: orderData.paymentMethod,
          clientId: orderData.clientId,
          idempotencyKey: orderData.idempotencyKey,
          quotedPrice: quote.quotedPrice,
          estimatedTotal: quote.estimatedTotal,
          fees: quote.fees,
          status: 'PENDING_PAYMENT',
          quoteId: quote.quoteId,
          shippingAddress: orderData.shippingAddress,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Store order (placeholder - would use database in production)
        await OrdersController.storeOrder(order);

        // Create audit log entry
        await OrdersController.createAuditLog({
          orderId,
          userId,
          action: 'ORDER_CREATED',
          details: {
            symbol: orderData.symbol,
            amount: orderData.amount,
            format: orderData.format,
            estimatedTotal: quote.estimatedTotal,
          },
        });

        logInfo('Physical order created successfully', {
          orderId,
          userId,
          symbol: orderData.symbol,
          estimatedTotal: quote.estimatedTotal,
        });

        res.status(201).json({
          code: 'SUCCESS',
          message: 'Physical order created successfully',
          data: {
            orderId,
            status: order.status,
            symbol: order.symbol,
            amount: order.amount,
            format: order.format,
            estimatedTotal: order.estimatedTotal,
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt,
          },
        });
      } catch (error) {
        logError('Physical order creation failed', error as Error);
        throw error;
      }
    }
  );

  /**
   * POST /api/orders/sell-convert
   * Process sell/convert operation
   */
  static createSellConvertOrder = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      if (!userId) {
        throw createError.authentication('User authentication required');
      }

      const orderData: SellConvertRequest = req.body;
      const transactionId = uuidv4();

      logInfo('Sell/convert order creation requested', {
        transactionId,
        userId,
        symbol: orderData.symbol,
        amount: orderData.amount,
        payout: orderData.payout,
        idempotencyKey: orderData.idempotencyKey,
      });

      try {
        // Validate idempotency key
        const idempotencyValidation = ValidationService.validateIdempotencyKey(
          orderData.idempotencyKey
        );
        ValidationService.throwIfInvalid(
          idempotencyValidation,
          'Invalid idempotency key'
        );

        // Check for duplicate idempotency key
        const existingTransaction =
          await OrdersController.findTransactionByIdempotencyKey(
            userId,
            orderData.idempotencyKey
          );
        if (existingTransaction) {
          logInfo(
            'Duplicate idempotency key detected, returning existing transaction',
            {
              transactionId: existingTransaction.id,
              idempotencyKey: orderData.idempotencyKey,
            }
          );
          res.json({
            code: 'SUCCESS',
            message: 'Transaction already exists',
            data: { transactionId: existingTransaction.id },
          });
          return;
        }

        // Validate client ID
        const clientIdValidation = ValidationService.validateClientId(
          orderData.clientId
        );
        ValidationService.throwIfInvalid(
          clientIdValidation,
          'Invalid client ID'
        );

        // Validate payout method
        const payoutValidation = ValidationService.validatePayoutMethod(
          orderData.payout
        );
        ValidationService.throwIfInvalid(
          payoutValidation,
          'Invalid payout method'
        );

        // Validate order request
        const orderValidation = await ValidationService.validateOrder({
          symbol: orderData.symbol,
          amount: orderData.amount,
          side: 'sell',
          userId,
        });
        ValidationService.throwIfInvalid(
          orderValidation,
          'Order validation failed'
        );

        // Validate balance - user must have sufficient tokens to sell
        const balanceValidation = await ValidationService.validateBalance({
          userId,
          asset: orderData.symbol,
          amount: orderData.amount,
        });
        ValidationService.throwIfInvalid(
          balanceValidation,
          'Insufficient balance'
        );

        // Get current quote for pricing
        const quote = await QuotesService.getEstimate({
          symbol: orderData.symbol,
          side: 'sell',
          amount: orderData.amount,
          payout: orderData.payout,
        });

        if (!quote.available) {
          throw createError.serviceUnavailable(
            'Pricing',
            quote.unavailableReason || 'Pricing unavailable'
          );
        }

        // Create transaction record
        const transaction = {
          id: transactionId,
          userId,
          type: 'SELL_CONVERT',
          symbol: orderData.symbol,
          amount: orderData.amount,
          payout: orderData.payout,
          clientId: orderData.clientId,
          idempotencyKey: orderData.idempotencyKey,
          quotedPrice: quote.quotedPrice,
          estimatedProceeds: quote.estimatedProceeds,
          fees: quote.fees,
          status: 'PROCESSING',
          quoteId: quote.quoteId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Process the transaction (placeholder implementation)
        await OrdersController.processSellConvert(transaction);

        // Store transaction record
        await OrdersController.storeTransaction(transaction);

        // Create audit log entry
        await OrdersController.createAuditLog({
          orderId: transactionId,
          userId,
          action: 'SELL_CONVERT_COMPLETED',
          details: {
            symbol: orderData.symbol,
            amount: orderData.amount,
            payout: orderData.payout,
            estimatedProceeds: quote.estimatedProceeds,
          },
        });

        logInfo('Sell/convert transaction completed successfully', {
          transactionId,
          userId,
          symbol: orderData.symbol,
          estimatedProceeds: quote.estimatedProceeds,
        });

        res.status(201).json({
          code: 'SUCCESS',
          message: 'Sell/convert transaction completed successfully',
          data: {
            transactionId,
            status: transaction.status,
            symbol: transaction.symbol,
            amount: transaction.amount,
            payout: transaction.payout,
            estimatedProceeds: transaction.estimatedProceeds,
            createdAt: transaction.createdAt,
          },
        });
      } catch (error) {
        logError('Sell/convert transaction failed', error as Error);
        throw error;
      }
    }
  );

  // Private helper methods

  private static async findOrderByIdempotencyKey(
    userId: string,
    idempotencyKey: string
  ): Promise<{ id: string } | null> {
    // Placeholder implementation
    // In production, this would query the database
    return null;
  }

  private static async findTransactionByIdempotencyKey(
    userId: string,
    idempotencyKey: string
  ): Promise<{ id: string } | null> {
    // Placeholder implementation
    // In production, this would query the database
    return null;
  }

  private static async storeOrder(order: any): Promise<void> {
    // Placeholder implementation
    // In production, this would insert into the database
    logInfo('Order stored', { orderId: order.id });
  }

  private static async storeTransaction(transaction: any): Promise<void> {
    // Placeholder implementation
    // In production, this would insert into the database
    logInfo('Transaction stored', { transactionId: transaction.id });
  }

  private static async processSellConvert(transaction: any): Promise<void> {
    // Placeholder implementation for sell/convert processing
    // This would:
    // 1. Burn/debit tokens from user's balance
    // 2. Credit the payout route (USD, USDC, etc.)
    // 3. Update transaction status

    logInfo('Processing sell/convert transaction', {
      transactionId: transaction.id,
      symbol: transaction.symbol,
      amount: transaction.amount,
      payout: transaction.payout,
    });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    transaction.status = 'COMPLETED';
    transaction.completedAt = new Date();
  }

  private static async createAuditLog(entry: {
    orderId: string;
    userId: string;
    action: string;
    details: Record<string, any>;
  }): Promise<void> {
    // Placeholder implementation
    // In production, this would insert audit log entries
    logInfo('Audit log entry created', {
      orderId: entry.orderId,
      action: entry.action,
      userId: entry.userId,
    });
  }
}
