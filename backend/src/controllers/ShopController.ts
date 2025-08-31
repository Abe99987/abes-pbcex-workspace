import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createError, asyncHandler } from '@/middlewares/errorMiddleware';
import { logInfo, logError } from '@/utils/logger';
import { Order, OrderUtils } from '@/models/Order';
import { BalanceUtils } from '@/models/Balance';
import { ORDER_STATUS, PRODUCT_CATEGORIES } from '@/utils/constants';
import { AuthController } from './AuthController';
import { WalletController } from './WalletController';

/**
 * Shop Controller for PBCEx
 * Handles physical precious metals marketplace
 */

// In-memory stores for products, quotes, and orders
const products = [
  // Gold Products
  {
    id: 'AU_EAGLE_1OZ',
    name: 'American Gold Eagle - 1 oz',
    category: 'COINS',
    metal: 'AU',
    weight: '1.0000',
    purity: '0.9167',
    basePrice: 2100.00,
    premium: 75.00,
    inStock: true,
    stockQuantity: 150,
    image: '/images/products/gold-eagle-1oz.jpg',
    description: '1 oz American Gold Eagle coin. Legal tender backed by the U.S. government.',
    specifications: {
      diameter: '32.7mm',
      thickness: '2.87mm',
      mintage: 'Various',
      designer: 'Augustus Saint-Gaudens',
    },
    provider: 'JM_BULLION',
  },
  {
    id: 'AU_MAPLE_1OZ',
    name: 'Canadian Gold Maple Leaf - 1 oz',
    category: 'COINS',
    metal: 'AU',
    weight: '1.0000',
    purity: '0.9999',
    basePrice: 2100.00,
    premium: 65.00,
    inStock: true,
    stockQuantity: 200,
    image: '/images/products/gold-maple-1oz.jpg',
    description: '1 oz Canadian Gold Maple Leaf coin. .9999 fine gold.',
    provider: 'JM_BULLION',
  },
  {
    id: 'AU_BAR_1OZ',
    name: 'Gold Bar - 1 oz',
    category: 'BARS',
    metal: 'AU',
    weight: '1.0000',
    purity: '0.9999',
    basePrice: 2100.00,
    premium: 35.00,
    inStock: true,
    stockQuantity: 300,
    image: '/images/products/gold-bar-1oz.jpg',
    description: '1 oz Gold Bar. Various refiners including PAMP Suisse, Valcambi.',
    provider: 'DILLON_GAGE',
  },

  // Silver Products
  {
    id: 'AG_EAGLE_1OZ',
    name: 'American Silver Eagle - 1 oz',
    category: 'COINS',
    metal: 'AG',
    weight: '1.0000',
    purity: '0.999',
    basePrice: 25.50,
    premium: 6.00,
    inStock: true,
    stockQuantity: 1000,
    image: '/images/products/silver-eagle-1oz.jpg',
    description: '1 oz American Silver Eagle coin. Official silver bullion coin of the United States.',
    provider: 'JM_BULLION',
  },
  {
    id: 'AG_BAR_10OZ',
    name: 'Silver Bar - 10 oz',
    category: 'BARS',
    metal: 'AG',
    weight: '10.0000',
    purity: '0.999',
    basePrice: 25.50,
    premium: 1.50,
    inStock: true,
    stockQuantity: 500,
    image: '/images/products/silver-bar-10oz.jpg',
    description: '10 oz Silver Bar. Various refiners.',
    provider: 'DILLON_GAGE',
  },

  // Platinum Products
  {
    id: 'PT_EAGLE_1OZ',
    name: 'American Platinum Eagle - 1 oz',
    category: 'COINS',
    metal: 'PT',
    weight: '1.0000',
    purity: '0.9995',
    basePrice: 980.00,
    premium: 120.00,
    inStock: true,
    stockQuantity: 50,
    image: '/images/products/platinum-eagle-1oz.jpg',
    description: '1 oz American Platinum Eagle coin. Official platinum bullion coin.',
    provider: 'JM_BULLION',
  },

  // Palladium Products
  {
    id: 'PD_BAR_1OZ',
    name: 'Palladium Bar - 1 oz',
    category: 'BARS',
    metal: 'PD',
    weight: '1.0000',
    purity: '0.9995',
    basePrice: 1150.00,
    premium: 80.00,
    inStock: true,
    stockQuantity: 25,
    image: '/images/products/palladium-bar-1oz.jpg',
    description: '1 oz Palladium Bar. PAMP Suisse and other refiners.',
    provider: 'DILLON_GAGE',
  },

  // Copper Products
  {
    id: 'CU_BAR_1LB',
    name: 'Copper Bar - 1 lb',
    category: 'BARS',
    metal: 'CU',
    weight: '1.0000',
    purity: '0.999',
    basePrice: 4.50,
    premium: 1.50,
    inStock: true,
    stockQuantity: 2000,
    image: '/images/products/copper-bar-1lb.jpg',
    description: '1 lb Copper Bar. Investment grade copper.',
    provider: 'DILLON_GAGE',
  },
];

const lockedQuotes: Map<string, any> = new Map();
const orders: Order[] = [];

export class ShopController {
  /**
   * GET /api/shop/products
   * List available precious metals products
   */
  static getProducts = asyncHandler(async (req: Request, res: Response) => {
    const { 
      metal, 
      category, 
      minPrice, 
      maxPrice, 
      limit = 20, 
      offset = 0,
      inStockOnly = true 
    } = req.query;

    let filteredProducts = [...products];

    // Apply filters
    if (metal) {
      filteredProducts = filteredProducts.filter(p => p.metal === metal);
    }

    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }

    if (minPrice) {
      const min = parseFloat(minPrice as string);
      filteredProducts = filteredProducts.filter(p => (p.basePrice + p.premium) >= min);
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice as string);
      filteredProducts = filteredProducts.filter(p => (p.basePrice + p.premium) <= max);
    }

    if (inStockOnly === true || inStockOnly === 'true') {
      filteredProducts = filteredProducts.filter(p => p.inStock && p.stockQuantity > 0);
    }

    // Paginate
    const startIndex = parseInt(offset as string);
    const endIndex = startIndex + parseInt(limit as string);
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    // Format response with current pricing
    const productsWithPricing = await Promise.all(
      paginatedProducts.map(async (product) => {
        const currentPrice = await ShopController.getCurrentProductPrice(product);
        
        return {
          id: product.id,
          name: product.name,
          category: product.category,
          metal: product.metal,
          weight: product.weight,
          purity: product.purity,
          unitPrice: currentPrice.toFixed(2),
          basePrice: product.basePrice.toFixed(2),
          premium: product.premium.toFixed(2),
          inStock: product.inStock,
          stockQuantity: product.stockQuantity,
          image: product.image,
          description: product.description,
          specifications: product.specifications || {},
          provider: product.provider,
          estimatedShipping: ShopController.getEstimatedShipping(product.provider),
        };
      })
    );

    res.json({
      code: 'SUCCESS',
      data: {
        products: productsWithPricing,
        total: filteredProducts.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        filters: {
          availableMetals: ['AU', 'AG', 'PT', 'PD', 'CU'],
          availableCategories: Object.values(PRODUCT_CATEGORIES),
        },
      },
    });
  });

  /**
   * GET /api/shop/products/:productId
   * Get detailed product information
   */
  static getProduct = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;

    const product = products.find(p => p.id === productId);
    if (!product) {
      throw createError.notFound('Product');
    }

    const currentPrice = await ShopController.getCurrentProductPrice(product);

    res.json({
      code: 'SUCCESS',
      data: {
        product: {
          ...product,
          unitPrice: currentPrice.toFixed(2),
          estimatedShipping: ShopController.getEstimatedShipping(product.provider),
          shippingCost: ShopController.calculateShippingCost(product, 1),
        },
      },
    });
  });

  /**
   * POST /api/shop/lock-quote
   * Lock price quote for 10 minutes
   */
  static lockQuote = asyncHandler(async (req: Request, res: Response) => {
    const { productId, quantity } = req.body;
    const userId = req.user!.id;

    logInfo('Quote lock requested', { userId, productId, quantity });

    const product = products.find(p => p.id === productId);
    if (!product) {
      throw createError.notFound('Product');
    }

    if (!product.inStock || product.stockQuantity < quantity) {
      throw createError.validation('Insufficient stock');
    }

    if (quantity < 1) {
      throw createError.validation('Quantity must be at least 1');
    }

    // Get current price and calculate total
    const currentPrice = await ShopController.getCurrentProductPrice(product);
    const subtotal = currentPrice * quantity;
    const shippingCost = ShopController.calculateShippingCost(product, quantity);
    const totalPrice = subtotal + shippingCost;

    // Create locked quote
    const quoteId = uuidv4();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const quote = {
      id: quoteId,
      userId,
      productId,
      productName: product.name,
      quantity,
      unitPrice: currentPrice.toFixed(2),
      subtotal: subtotal.toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      totalPrice: totalPrice.toFixed(2),
      metal: product.metal,
      weight: product.weight,
      expiresAt,
      createdAt: new Date(),
    };

    lockedQuotes.set(quoteId, quote);

    // Auto-expire quote after 10 minutes
    setTimeout(() => {
      lockedQuotes.delete(quoteId);
      logInfo('Quote expired', { quoteId, userId });
    }, 10 * 60 * 1000);

    logInfo('Quote locked successfully', { 
      quoteId, 
      userId, 
      productId, 
      totalPrice: quote.totalPrice 
    });

    res.status(201).json({
      code: 'SUCCESS',
      message: 'Price locked for 10 minutes',
      data: {
        quote,
        timeRemaining: 600, // seconds
      },
    });
  });

  /**
   * GET /api/shop/quote/:quoteId
   * Get locked quote details
   */
  static getQuote = asyncHandler(async (req: Request, res: Response) => {
    const { quoteId } = req.params;
    const userId = req.user!.id;

    if (!quoteId) {
      throw createError.validation('Quote ID is required');
    }

    const quote = lockedQuotes.get(quoteId);
    if (!quote || quote.userId !== userId) {
      throw createError.notFound('Quote');
    }

    const now = new Date();
    const timeRemaining = Math.max(0, Math.floor((quote.expiresAt.getTime() - now.getTime()) / 1000));

    if (timeRemaining === 0) {
      lockedQuotes.delete(quoteId);
      throw createError.validation('Quote has expired');
    }

    res.json({
      code: 'SUCCESS',
      data: {
        quote,
        timeRemaining,
        isValid: timeRemaining > 0,
      },
    });
  });

  /**
   * POST /api/shop/checkout
   * Complete purchase with locked quote
   */
  static checkout = asyncHandler(async (req: Request, res: Response) => {
    const { 
      quoteId, 
      paymentMethod, 
      shippingAddress, 
      billingAddress,
      specialInstructions 
    } = req.body;
    const userId = req.user!.id;

    logInfo('Checkout initiated', { userId, quoteId, paymentMethod });

    // Validate quote
    const quote = lockedQuotes.get(quoteId);
    if (!quote || quote.userId !== userId) {
      throw createError.notFound('Quote');
    }

    if (new Date() > quote.expiresAt) {
      lockedQuotes.delete(quoteId);
      throw createError.validation('Quote has expired');
    }

    // Get product details
    const product = products.find(p => p.id === quote.productId);
    if (!product) {
      throw createError.notFound('Product');
    }

    // Validate payment method and check balance
    if (paymentMethod === 'BALANCE') {
      await ShopController.validateSufficientBalance(userId, quote.totalPrice);
    }

    // Create order
    const orderId = uuidv4();
    const order: Order = {
      id: orderId,
      userId,
      productCode: quote.productId,
      productName: quote.productName,
      productCategory: product.category as any,
      metal: quote.metal as any,
      quantity: quote.quantity,
      unitPrice: quote.unitPrice,
      totalPrice: quote.totalPrice,
      lockedPrice: quote.unitPrice,
      lockExpiresAt: quote.expiresAt,
      status: ORDER_STATUS.PAYMENT_PENDING,
      paymentMethod: paymentMethod as any,
      shippingAddress,
      billingAddress,
      shipping: {
        carrier: 'FEDEX',
        service: ShopController.getShippingService(parseFloat(quote.totalPrice)),
        cost: quote.shippingCost,
      },
      specialInstructions,
      fulfillmentProvider: product.provider as any,
      metadata: {
        originalQuote: quote,
        productDetails: product,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // Process payment
      if (paymentMethod === 'BALANCE') {
        await ShopController.processBalancePayment(userId, quote, order);
        order.status = ORDER_STATUS.PAYMENT_CONFIRMED;
        order.paymentReference = `BALANCE_${orderId.slice(-8)}`;
      }

      // Reserve inventory
      product.stockQuantity -= quote.quantity;

      // Save order
      orders.push(order);

      // Remove used quote
      lockedQuotes.delete(quoteId);

      // Initiate fulfillment process
      await ShopController.initiateFulfillment(order);

      logInfo('Order created successfully', { 
        orderId, 
        userId, 
        productId: quote.productId,
        totalPrice: quote.totalPrice,
        paymentMethod,
      });

      res.status(201).json({
        code: 'SUCCESS',
        message: 'Order placed successfully',
        data: {
          order: {
            id: order.id,
            status: order.status,
            productName: order.productName,
            quantity: order.quantity,
            totalPrice: order.totalPrice,
            estimatedDelivery: ShopController.calculateEstimatedDelivery(order),
            trackingNumber: order.shipping.trackingNumber,
          },
        },
      });

    } catch (error) {
      // Restore inventory on failure
      product.stockQuantity += quote.quantity;
      throw error;
    }
  });

  /**
   * GET /api/shop/orders
   * Get user's orders
   */
  static getOrders = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { status, limit = 50, offset = 0 } = req.query;

    let userOrders = orders.filter(o => o.userId === userId);

    // Filter by status if specified
    if (status) {
      userOrders = userOrders.filter(o => o.status === status);
    }

    // Sort by date (newest first) and paginate
    userOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const paginatedOrders = userOrders.slice(
      parseInt(offset as string),
      parseInt(offset as string) + parseInt(limit as string)
    );

    const ordersWithDetails = paginatedOrders.map(order => ({
      id: order.id,
      productName: order.productName,
      quantity: order.quantity,
      unitPrice: order.unitPrice,
      totalPrice: order.totalPrice,
      status: order.status,
      paymentMethod: order.paymentMethod,
      estimatedDelivery: order.shipping.estimatedDelivery,
      trackingNumber: order.shipping.trackingNumber,
      createdAt: order.createdAt,
      canCancel: OrderUtils.canCancel(order),
    }));

    res.json({
      code: 'SUCCESS',
      data: {
        orders: ordersWithDetails,
        total: userOrders.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  });

  /**
   * GET /api/shop/orders/:orderId
   * Get detailed order information
   */
  static getOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const userId = req.user!.id;

    const order = orders.find(o => o.id === orderId && o.userId === userId);
    if (!order) {
      throw createError.notFound('Order');
    }

    res.json({
      code: 'SUCCESS',
      data: {
        order: {
          ...order,
          canCancel: OrderUtils.canCancel(order),
          estimatedDelivery: ShopController.calculateEstimatedDelivery(order),
        },
      },
    });
  });

  /**
   * POST /api/shop/orders/:orderId/cancel
   * Cancel an order
   */
  static cancelOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const userId = req.user!.id;

    const order = orders.find(o => o.id === orderId && o.userId === userId);
    if (!order) {
      throw createError.notFound('Order');
    }

    if (!OrderUtils.canCancel(order)) {
      throw createError.validation('Order cannot be cancelled in current status');
    }

    // Process refund if payment was made
    if (order.status === ORDER_STATUS.PAYMENT_CONFIRMED) {
      await ShopController.processRefund(userId, order);
    }

    // Restore inventory
    const product = products.find(p => p.id === order.productCode);
    if (product) {
      product.stockQuantity += order.quantity;
    }

    // Update order status
    order.status = ORDER_STATUS.CANCELLED;
    order.updatedAt = new Date();

    logInfo('Order cancelled', { orderId, userId });

    res.json({
      code: 'SUCCESS',
      message: 'Order cancelled successfully',
      data: {
        order: {
          id: order.id,
          status: order.status,
        },
      },
    });
  });

  // Private helper methods

  private static async getCurrentProductPrice(product: any): Promise<number> {
    // In production, this would fetch real-time spot prices
    // For now, we'll simulate small price movements
    const variance = (Math.random() - 0.5) * 0.02; // ±1% variance
    const adjustedBasePrice = product.basePrice * (1 + variance);
    return adjustedBasePrice + product.premium;
  }

  private static getEstimatedShipping(provider: string): string {
    const shippingTimes: Record<string, string> = {
      'JM_BULLION': '3-5 business days',
      'DILLON_GAGE': '2-4 business days',
    };
    return shippingTimes[provider] || '3-5 business days';
  }

  private static calculateShippingCost(product: any, quantity: number): number {
    const orderValue = (product.basePrice + product.premium) * quantity;
    
    // Free shipping over $1500
    if (orderValue >= 1500) return 0;
    
    // Flat rate shipping by metal
    const shippingRates: Record<string, number> = {
      'AU': 25, // Gold - secure shipping
      'AG': 15, // Silver - standard
      'PT': 25, // Platinum - secure
      'PD': 25, // Palladium - secure  
      'CU': 10, // Copper - standard
    };

    return shippingRates[product.metal] || 15;
  }

  private static getShippingService(orderValue: number): 'STANDARD' | 'EXPEDITED' | 'OVERNIGHT' {
    if (orderValue >= 5000) return 'OVERNIGHT';
    if (orderValue >= 1500) return 'EXPEDITED';
    return 'STANDARD';
  }

  private static calculateEstimatedDelivery(order: Order): Date {
    const now = new Date();
    const businessDays = order.shipping.service === 'OVERNIGHT' ? 1 : 
                        order.shipping.service === 'EXPEDITED' ? 2 : 5;
    
    // Add business days (skip weekends)
    const delivery = new Date(now);
    let daysAdded = 0;
    
    while (daysAdded < businessDays) {
      delivery.setDate(delivery.getDate() + 1);
      if (delivery.getDay() !== 0 && delivery.getDay() !== 6) { // Not Sunday (0) or Saturday (6)
        daysAdded++;
      }
    }
    
    return delivery;
  }

  private static async validateSufficientBalance(userId: string, totalPrice: string): Promise<void> {
    const userBalances = WalletController.getUserBalances(userId);
    const fundingBalances = userBalances.filter(b => {
      const userAccounts = AuthController.getUserAccounts(userId);
      const fundingAccount = userAccounts.find(a => a.type === 'FUNDING');
      return b.accountId === fundingAccount?.id;
    });

    // Check USD/USDC balance
    const usdBalance = fundingBalances.find(b => b.asset === 'USD');
    const usdcBalance = fundingBalances.find(b => b.asset === 'USDC');

    const totalFiatBalance = parseFloat(usdBalance?.amount || '0') + 
                           parseFloat(usdcBalance?.amount || '0');

    if (totalFiatBalance < parseFloat(totalPrice)) {
      throw createError.validation('Insufficient USD/USDC balance for purchase');
    }
  }

  private static async processBalancePayment(userId: string, quote: any, order: Order): Promise<void> {
    // Debit user's USD balance
    const userAccounts = AuthController.getUserAccounts(userId);
    const fundingAccount = userAccounts.find(a => a.type === 'FUNDING');
    
    if (!fundingAccount) {
      throw createError.internal('Funding account not found');
    }

    const userBalances = WalletController.getUserBalances(userId);
    const usdBalance = userBalances.find(b => 
      b.accountId === fundingAccount.id && b.asset === 'USD'
    );

    if (usdBalance) {
      const newBalance = BalanceUtils.subtract(usdBalance.amount, quote.totalPrice);
      usdBalance.amount = newBalance;
      usdBalance.lastUpdated = new Date();
    }

    logInfo('Balance payment processed', { 
      userId, 
      orderId: order.id, 
      amount: quote.totalPrice 
    });
  }

  private static async processRefund(userId: string, order: Order): Promise<void> {
    // Credit user's USD balance
    const userAccounts = AuthController.getUserAccounts(userId);
    const fundingAccount = userAccounts.find(a => a.type === 'FUNDING');
    
    if (!fundingAccount) return;

    const userBalances = WalletController.getUserBalances(userId);
    const usdBalance = userBalances.find(b => 
      b.accountId === fundingAccount.id && b.asset === 'USD'
    );

    if (usdBalance) {
      const newBalance = BalanceUtils.add(usdBalance.amount, order.totalPrice);
      usdBalance.amount = newBalance;
      usdBalance.lastUpdated = new Date();
    }

    logInfo('Refund processed', { 
      userId, 
      orderId: order.id, 
      amount: order.totalPrice 
    });
  }

  private static async initiateFulfillment(order: Order): Promise<void> {
    // Simulate fulfillment provider API call
    const providerId = `${order.fulfillmentProvider}_${order.id.slice(-8)}`;
    
    // Create shipping label
    const trackingNumber = await ShopController.createShippingLabel(order);
    order.shipping.trackingNumber = trackingNumber;
    order.shipping.estimatedDelivery = ShopController.calculateEstimatedDelivery(order);

    // Update order status
    order.status = ORDER_STATUS.PROCESSING;
    order.providerOrderId = providerId;
    order.updatedAt = new Date();

    logInfo('Fulfillment initiated', { 
      orderId: order.id, 
      providerId, 
      trackingNumber 
    });
  }

  private static async createShippingLabel(order: Order): Promise<string> {
    // Simulate FedEx API call
    const trackingNumber = `1Z${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    logInfo('Shipping label created', { 
      orderId: order.id, 
      trackingNumber,
      service: order.shipping.service,
    });

    return trackingNumber;
  }

  // Utility methods for testing and admin
  static getAllProducts = () => products;
  static getAllOrders = (): Order[] => orders;
  static getUserOrders = (userId: string): Order[] => 
    orders.filter(o => o.userId === userId);
  static getOrderById = (id: string): Order | undefined => 
    orders.find(o => o.id === id);
  static getLockedQuotes = (): Map<string, any> => lockedQuotes;
  
  // Shop statistics
  static getShopStatistics = () => {
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter(o => o.status !== ORDER_STATUS.CANCELLED)
      .reduce((sum, o) => sum + parseFloat(o.totalPrice), 0);
    
    const ordersByMetal = orders.reduce((acc, order) => {
      acc[order.metal] = (acc[order.metal] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalProducts: products.length,
      totalOrders,
      totalRevenue: totalRevenue.toFixed(2),
      averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0',
      ordersByMetal,
      inStockProducts: products.filter(p => p.inStock && p.stockQuantity > 0).length,
    };
  };
}
