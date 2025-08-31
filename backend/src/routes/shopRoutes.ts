import { Router } from 'express';
import { authenticate, requireKyc } from '@/middlewares/authMiddleware';
import { validateBody, validateQuery } from '@/utils/validators';
import { productQuerySchema, lockQuoteSchema, checkoutSchema } from '@/utils/validators';
import { ShopController } from '@/controllers/ShopController';
import { z } from 'zod';

const router = Router();

/**
 * GET /api/shop/products
 * List available precious metals products
 */
router.get('/products',
  validateQuery(productQuerySchema),
  ShopController.getProducts
);

/**
 * GET /api/shop/products/:productId
 * Get detailed product information
 */
router.get('/products/:productId',
  ShopController.getProduct
);

/**
 * POST /api/shop/lock-quote
 * Lock price quote for 10 minutes
 */
router.post('/lock-quote',
  authenticate,
  requireKyc(['APPROVED']),
  validateBody(lockQuoteSchema),
  ShopController.lockQuote
);

/**
 * GET /api/shop/quote/:quoteId
 * Get locked quote details
 */
router.get('/quote/:quoteId',
  authenticate,
  ShopController.getQuote
);

/**
 * POST /api/shop/checkout
 * Complete purchase with locked quote
 */
router.post('/checkout',
  authenticate,
  requireKyc(['APPROVED']),
  validateBody(checkoutSchema),
  ShopController.checkout
);

/**
 * GET /api/shop/orders
 * Get user's orders
 */
router.get('/orders',
  authenticate,
  validateQuery(z.object({
    status: z.enum([
      'DRAFT', 'QUOTE_LOCKED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 
      'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'
    ]).optional(),
    limit: z.coerce.number().min(1).max(100).default(50),
    offset: z.coerce.number().min(0).default(0),
  })),
  ShopController.getOrders
);

/**
 * GET /api/shop/orders/:orderId
 * Get detailed order information
 */
router.get('/orders/:orderId',
  authenticate,
  ShopController.getOrder
);

/**
 * POST /api/shop/orders/:orderId/cancel
 * Cancel an order
 */
router.post('/orders/:orderId/cancel',
  authenticate,
  ShopController.cancelOrder
);

export default router;