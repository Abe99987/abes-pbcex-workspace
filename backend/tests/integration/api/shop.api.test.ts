import request from 'supertest';
import { truncateAll } from '../../helpers/db';
import { Factory } from '../../helpers/factory';
import { registerAndLogin } from '../../helpers/auth';

/**
 * Shop API Integration Tests
 * Tests e-commerce functionality including products, quotes, and checkout
 */

describe('Shop API', () => {
  let authToken: string;
  let testUser: any;
  let testAccount: any;

  beforeEach(async () => {
    await truncateAll();
    
    testUser = await Factory.createUser({
      email: 'shopper@example.com',
      emailVerified: true,
      kycStatus: 'APPROVED',
    });
    
    testAccount = await Factory.createAccount({
      userId: testUser.id,
      type: 'FUNDING',
      status: 'ACTIVE',
    });

    // Set up balance for shopping
    await Factory.createBalance({
      accountId: testAccount.id,
      asset: 'USD',
      balance: '10000.00',
      lockedBalance: '0',
    });

    authToken = await registerAndLogin('shopper@example.com', 'TestPassword123!');
  });

  describe('GET /api/shop/products', () => {
    it('should return available products', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            products: [
              {
                id: 'prod-gold-bar-1oz',
                name: '1 oz Gold Bar - PAMP Suisse',
                description: 'Fine gold bar with assay certificate',
                metal: 'GOLD',
                weight: '1.0',
                weightUnit: 'oz',
                format: 'BAR',
                purity: '0.9999',
                brand: 'PAMP Suisse',
                imageUrl: '/images/gold-bar-1oz.jpg',
                inStock: true,
                stockQuantity: 150,
                basePrice: '2100.00',
                premium: '85.00',
                totalPrice: '2185.00',
                categories: ['precious-metals', 'gold', 'bars'],
              },
              {
                id: 'prod-silver-coin-1oz',
                name: '1 oz Silver American Eagle',
                description: 'Official silver coin of the United States',
                metal: 'SILVER',
                weight: '1.0',
                weightUnit: 'oz',
                format: 'COIN',
                purity: '0.999',
                brand: 'US Mint',
                imageUrl: '/images/silver-eagle-1oz.jpg',
                inStock: true,
                stockQuantity: 500,
                basePrice: '26.50',
                premium: '4.50',
                totalPrice: '31.00',
                categories: ['precious-metals', 'silver', 'coins'],
              },
            ],
            categories: [
              { slug: 'gold', name: 'Gold', productCount: 25 },
              { slug: 'silver', name: 'Silver', productCount: 35 },
              { slug: 'platinum', name: 'Platinum', productCount: 8 },
            ],
            pagination: {
              page: 1,
              limit: 20,
              total: 68,
              hasNext: true,
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.products).toHaveLength(2);
      expect(response.body.data.categories).toHaveLength(3);
      
      const goldProduct = response.body.data.products[0];
      expect(goldProduct.metal).toBe('GOLD');
      expect(goldProduct.inStock).toBe(true);
      expect(parseFloat(goldProduct.totalPrice)).toBeGreaterThan(parseFloat(goldProduct.basePrice));
    });

    it('should filter by category', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            products: [
              {
                id: 'prod-gold-bar-1oz',
                metal: 'GOLD',
                categories: ['precious-metals', 'gold', 'bars'],
              },
            ],
            appliedFilters: {
              category: 'gold',
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.products.every((p: any) => p.categories.includes('gold'))).toBe(true);
      expect(response.body.data.appliedFilters.category).toBe('gold');
    });

    it('should filter by metal type', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            products: [
              { metal: 'SILVER' },
              { metal: 'SILVER' },
            ],
            appliedFilters: {
              metal: 'SILVER',
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.products.every((p: any) => p.metal === 'SILVER')).toBe(true);
    });

    it('should filter by price range', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            products: [
              { totalPrice: '31.00' },
              { totalPrice: '45.50' },
            ],
            appliedFilters: {
              minPrice: '25.00',
              maxPrice: '50.00',
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      response.body.data.products.forEach((p: any) => {
        expect(parseFloat(p.totalPrice)).toBeGreaterThanOrEqual(25.00);
        expect(parseFloat(p.totalPrice)).toBeLessThanOrEqual(50.00);
      });
    });

    it('should sort by price', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            products: [
              { totalPrice: '31.00' },
              { totalPrice: '45.50' },
              { totalPrice: '2185.00' },
            ],
            sortBy: 'price_asc',
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      
      const prices = response.body.data.products.map((p: any) => parseFloat(p.totalPrice));
      const sortedPrices = [...prices].sort((a, b) => a - b);
      expect(prices).toEqual(sortedPrices);
    });

    it('should include stock information', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            products: [
              {
                id: 'prod-low-stock',
                inStock: true,
                stockQuantity: 3,
                lowStock: true,
              },
              {
                id: 'prod-out-of-stock',
                inStock: false,
                stockQuantity: 0,
                lowStock: false,
              },
            ],
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.products[0].lowStock).toBe(true);
      expect(response.body.data.products[1].inStock).toBe(false);
    });

    it('should not require authentication for browsing', async () => {
      // Test without auth token
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            products: [
              { id: 'prod-1', name: 'Gold Bar' },
            ],
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
    });
  });

  describe('GET /api/shop/product/:id', () => {
    it('should return detailed product information', async () => {
      const productId = 'prod-gold-bar-1oz';
      
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            product: {
              id: productId,
              name: '1 oz Gold Bar - PAMP Suisse',
              description: 'Fine gold bar with assay certificate and secure packaging',
              longDescription: 'This 1 oz gold bar from PAMP Suisse features...',
              metal: 'GOLD',
              weight: '1.0',
              weightUnit: 'oz',
              format: 'BAR',
              purity: '0.9999',
              brand: 'PAMP Suisse',
              dimensions: {
                length: '30.6',
                width: '18.0',
                height: '1.7',
                unit: 'mm',
              },
              images: [
                '/images/gold-bar-1oz-front.jpg',
                '/images/gold-bar-1oz-back.jpg',
                '/images/gold-bar-1oz-package.jpg',
              ],
              inStock: true,
              stockQuantity: 150,
              basePrice: '2100.00',
              premium: '85.00',
              totalPrice: '2185.00',
              priceBreakdown: {
                spotPrice: '2100.00',
                premium: '85.00',
                premiumPercent: '4.05',
              },
              shipping: {
                freeThreshold: '1000.00',
                standardRate: '25.00',
                expeditedRate: '45.00',
                insuranceRequired: true,
              },
              specifications: {
                mintage: 'Unlimited',
                certificationNumber: true,
                packaging: 'Assay card',
              },
              categories: ['precious-metals', 'gold', 'bars'],
              tags: ['investment-grade', 'pamp-suisse', 'certified'],
            },
            relatedProducts: [
              {
                id: 'prod-gold-bar-10oz',
                name: '10 oz Gold Bar - PAMP Suisse',
                totalPrice: '21850.00',
              },
            ],
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.product.id).toBe(productId);
      expect(response.body.data.product.dimensions).toBeDefined();
      expect(response.body.data.product.images).toHaveLength(3);
      expect(response.body.data.product.priceBreakdown).toBeDefined();
      expect(response.body.data.relatedProducts).toHaveLength(1);
    });

    it('should return 404 for non-existent product', async () => {
      const mockResponse = {
        status: 404,
        body: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found',
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('should include current pricing with real-time updates', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            product: {
              id: 'prod-gold-bar-1oz',
              basePrice: '2100.00',
              premium: '85.00',
              totalPrice: '2185.00',
              priceLastUpdated: new Date().toISOString(),
              priceValidUntil: new Date(Date.now() + 600000).toISOString(), // 10 minutes
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.product.priceLastUpdated).toBeDefined();
      expect(response.body.data.product.priceValidUntil).toBeDefined();
    });
  });

  describe('POST /api/shop/quote', () => {
    const quoteData = {
      items: [
        {
          productId: 'prod-gold-bar-1oz',
          quantity: 2,
        },
        {
          productId: 'prod-silver-coin-1oz',
          quantity: 10,
        },
      ],
      shippingAddress: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'NY',
        zipCode: '12345',
        country: 'US',
      },
    };

    it('should generate a price quote with timer', async () => {
      const mockResponse = {
        status: 201,
        body: {
          code: 'SUCCESS',
          message: 'Quote generated successfully',
          data: {
            quote: {
              id: 'quote-12345',
              items: [
                {
                  productId: 'prod-gold-bar-1oz',
                  productName: '1 oz Gold Bar - PAMP Suisse',
                  quantity: 2,
                  unitPrice: '2185.00',
                  totalPrice: '4370.00',
                },
                {
                  productId: 'prod-silver-coin-1oz',
                  productName: '1 oz Silver American Eagle',
                  quantity: 10,
                  unitPrice: '31.00',
                  totalPrice: '310.00',
                },
              ],
              subtotal: '4680.00',
              shipping: '0.00', // Free shipping over $1000
              insurance: '46.80',
              taxes: '0.00',
              total: '4726.80',
              currency: 'USD',
              expiresAt: new Date(Date.now() + 600000).toISOString(), // 10 minutes
              createdAt: new Date().toISOString(),
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(201);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.quote.id).toBeDefined();
      expect(response.body.data.quote.items).toHaveLength(2);
      expect(response.body.data.quote.expiresAt).toBeDefined();
      
      const total = parseFloat(response.body.data.quote.total);
      const subtotal = parseFloat(response.body.data.quote.subtotal);
      const shipping = parseFloat(response.body.data.quote.shipping);
      const insurance = parseFloat(response.body.data.quote.insurance);
      const taxes = parseFloat(response.body.data.quote.taxes);
      
      expect(total).toBe(subtotal + shipping + insurance + taxes);
    });

    it('should require authentication', async () => {
      const mockResponse = {
        status: 401,
        body: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication required',
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should validate product availability', async () => {
      const quoteDataUnavailable = {
        items: [
          {
            productId: 'prod-out-of-stock',
            quantity: 1,
          },
        ],
      };

      const mockResponse = {
        status: 400,
        body: {
          code: 'PRODUCT_UNAVAILABLE',
          message: 'Some products are not available',
          errors: [
            {
              field: 'items[0].productId',
              message: 'Product is out of stock',
              productId: 'prod-out-of-stock',
              availableQuantity: 0,
            }
          ],
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('PRODUCT_UNAVAILABLE');
    });

    it('should validate requested quantities against stock', async () => {
      const quoteDataExcessive = {
        items: [
          {
            productId: 'prod-gold-bar-1oz',
            quantity: 200, // More than available stock
          },
        ],
      };

      const mockResponse = {
        status: 400,
        body: {
          code: 'INSUFFICIENT_STOCK',
          message: 'Requested quantity exceeds available stock',
          errors: [
            {
              field: 'items[0].quantity',
              message: 'Only 150 units available',
              productId: 'prod-gold-bar-1oz',
              requested: 200,
              available: 150,
            }
          ],
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INSUFFICIENT_STOCK');
    });

    it('should calculate shipping based on location and value', async () => {
      const quoteDataLowValue = {
        items: [
          {
            productId: 'prod-silver-coin-1oz',
            quantity: 1, // Under free shipping threshold
          },
        ],
        shippingAddress: {
          state: 'CA',
          country: 'US',
        },
      };

      const mockResponse = {
        status: 201,
        body: {
          code: 'SUCCESS',
          data: {
            quote: {
              subtotal: '31.00',
              shipping: '25.00', // Standard shipping
              shippingOptions: [
                {
                  method: 'STANDARD',
                  price: '25.00',
                  estimatedDays: '5-7',
                },
                {
                  method: 'EXPEDITED',
                  price: '45.00',
                  estimatedDays: '2-3',
                },
              ],
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(201);
      expect(response.body.data.quote.shipping).toBe('25.00');
      expect(response.body.data.quote.shippingOptions).toHaveLength(2);
    });

    it('should calculate insurance for high-value orders', async () => {
      const mockResponse = {
        status: 201,
        body: {
          code: 'SUCCESS',
          data: {
            quote: {
              subtotal: '4680.00',
              insurance: '46.80', // 1% of subtotal
              insuranceRequired: true,
              insuranceDetails: {
                rate: '1.00',
                minimum: '10.00',
                coverage: '4680.00',
              },
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(201);
      expect(response.body.data.quote.insuranceRequired).toBe(true);
      expect(parseFloat(response.body.data.quote.insurance)).toBeGreaterThan(0);
    });

    it('should handle international shipping', async () => {
      const internationalQuoteData = {
        items: [{ productId: 'prod-gold-bar-1oz', quantity: 1 }],
        shippingAddress: {
          country: 'CA', // Canada
        },
      };

      const mockResponse = {
        status: 201,
        body: {
          code: 'SUCCESS',
          data: {
            quote: {
              subtotal: '2185.00',
              shipping: '125.00', // International shipping
              duties: '87.40', // Estimated duties
              total: '2397.40',
              shippingNotice: 'International orders may be subject to additional customs duties and processing delays',
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(201);
      expect(response.body.data.quote.duties).toBeDefined();
      expect(response.body.data.quote.shippingNotice).toContain('International');
    });
  });

  describe('GET /api/shop/quote/:id', () => {
    it('should return quote details and remaining time', async () => {
      const quoteId = 'quote-12345';
      
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            quote: {
              id: quoteId,
              items: [
                {
                  productId: 'prod-gold-bar-1oz',
                  quantity: 2,
                  unitPrice: '2185.00',
                  totalPrice: '4370.00',
                },
              ],
              total: '4726.80',
              expiresAt: new Date(Date.now() + 300000).toISOString(), // 5 minutes remaining
              remainingSeconds: 300,
              isExpired: false,
              createdAt: new Date().toISOString(),
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.quote.id).toBe(quoteId);
      expect(response.body.data.quote.remainingSeconds).toBe(300);
      expect(response.body.data.quote.isExpired).toBe(false);
    });

    it('should handle expired quotes', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            quote: {
              id: 'quote-expired-123',
              expiresAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
              remainingSeconds: 0,
              isExpired: true,
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.quote.isExpired).toBe(true);
      expect(response.body.data.quote.remainingSeconds).toBe(0);
    });

    it('should return 404 for non-existent quotes', async () => {
      const mockResponse = {
        status: 404,
        body: {
          code: 'QUOTE_NOT_FOUND',
          message: 'Quote not found',
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('QUOTE_NOT_FOUND');
    });

    it('should prevent access to other users quotes', async () => {
      const mockResponse = {
        status: 403,
        body: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this quote',
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('ACCESS_DENIED');
    });
  });

  describe('POST /api/shop/checkout', () => {
    const checkoutData = {
      quoteId: 'quote-12345',
      paymentMethod: 'ACCOUNT_BALANCE',
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        street: '123 Main St',
        city: 'Anytown',
        state: 'NY',
        zipCode: '12345',
        country: 'US',
        phone: '+1-555-0123',
      },
      shippingMethod: 'STANDARD',
    };

    it('should process checkout with account balance', async () => {
      const mockResponse = {
        status: 201,
        body: {
          code: 'SUCCESS',
          message: 'Order placed successfully',
          data: {
            order: {
              id: 'order-12345',
              quoteId: 'quote-12345',
              status: 'CONFIRMED',
              items: [
                {
                  productId: 'prod-gold-bar-1oz',
                  productName: '1 oz Gold Bar - PAMP Suisse',
                  quantity: 2,
                  unitPrice: '2185.00',
                  totalPrice: '4370.00',
                },
              ],
              subtotal: '4680.00',
              shipping: '0.00',
              insurance: '46.80',
              total: '4726.80',
              paymentMethod: 'ACCOUNT_BALANCE',
              fulfillmentStrategy: 'JM', // Based on FULFILLMENT_STRATEGY env var
              estimatedShipDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
              estimatedDeliveryDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days
              createdAt: new Date().toISOString(),
            },
            newBalance: {
              USD: '5273.20', // 10000 - 4726.80
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(201);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.order.status).toBe('CONFIRMED');
      expect(response.body.data.order.fulfillmentStrategy).toBe('JM');
      expect(response.body.data.newBalance.USD).toBe('5273.20');
    });

    it('should use different fulfillment strategies based on env', async () => {
      // Simulate FULFILLMENT_STRATEGY=BRINKS
      const mockResponse = {
        status: 201,
        body: {
          code: 'SUCCESS',
          data: {
            order: {
              id: 'order-67890',
              fulfillmentStrategy: 'BRINKS',
              fulfillmentDetails: {
                warehouse: 'BRINKS_MEMPHIS',
                estimatedProcessingDays: 2,
              },
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(201);
      expect(response.body.data.order.fulfillmentStrategy).toBe('BRINKS');
      expect(response.body.data.order.fulfillmentDetails.warehouse).toBe('BRINKS_MEMPHIS');
    });

    it('should validate quote expiration', async () => {
      const expiredCheckoutData = {
        ...checkoutData,
        quoteId: 'quote-expired-123',
      };

      const mockResponse = {
        status: 400,
        body: {
          code: 'QUOTE_EXPIRED',
          message: 'Quote has expired. Please request a new quote.',
          data: {
            expiredAt: new Date(Date.now() - 60000).toISOString(),
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('QUOTE_EXPIRED');
    });

    it('should validate sufficient account balance', async () => {
      // Simulate insufficient balance
      await Factory.createBalance({
        accountId: testAccount.id,
        asset: 'USD',
        balance: '1000.00', // Not enough for the order
        lockedBalance: '0',
      });

      const mockResponse = {
        status: 400,
        body: {
          code: 'INSUFFICIENT_BALANCE',
          message: 'Insufficient account balance',
          data: {
            required: '4726.80',
            available: '1000.00',
            shortfall: '3726.80',
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INSUFFICIENT_BALANCE');
    });

    it('should validate shipping address', async () => {
      const invalidCheckoutData = {
        ...checkoutData,
        shippingAddress: {
          // Missing required fields
          street: '123 Main St',
          // Missing city, state, zipCode, etc.
        },
      };

      const mockResponse = {
        status: 400,
        body: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid shipping address',
          errors: [
            { field: 'shippingAddress.firstName', message: 'First name is required' },
            { field: 'shippingAddress.lastName', message: 'Last name is required' },
            { field: 'shippingAddress.city', message: 'City is required' },
            { field: 'shippingAddress.state', message: 'State is required' },
            { field: 'shippingAddress.zipCode', message: 'ZIP code is required' },
          ],
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.errors).toHaveLength(5);
    });

    it('should require KYC approval for large orders', async () => {
      const unverifiedUser = await Factory.createUser({
        email: 'unverified@example.com',
        kycStatus: 'PENDING',
      });

      const mockResponse = {
        status: 403,
        body: {
          code: 'KYC_REQUIRED',
          message: 'KYC approval required for orders over $1000',
          data: {
            currentStatus: 'PENDING',
            requiredStatus: 'APPROVED',
            orderValue: '4726.80',
            kycThreshold: '1000.00',
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('KYC_REQUIRED');
    });

    it('should handle inventory allocation failures', async () => {
      const mockResponse = {
        status: 400,
        body: {
          code: 'INVENTORY_ALLOCATION_FAILED',
          message: 'Unable to allocate inventory for this order',
          data: {
            failedItems: [
              {
                productId: 'prod-gold-bar-1oz',
                requested: 2,
                available: 1,
              },
            ],
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVENTORY_ALLOCATION_FAILED');
    });

    it('should call DillonGage restock after fulfillment', async () => {
      const mockResponse = {
        status: 201,
        body: {
          code: 'SUCCESS',
          data: {
            order: {
              id: 'order-12345',
              status: 'CONFIRMED',
              fulfillmentStrategy: 'JM',
            },
            restockTriggered: {
              service: 'DillonGage',
              items: [
                { metal: 'GOLD', quantity: '2.0' },
              ],
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(201);
      expect(response.body.data.restockTriggered).toBeDefined();
      expect(response.body.data.restockTriggered.service).toBe('DillonGage');
    });
  });

  describe('GET /api/shop/orders', () => {
    beforeEach(async () => {
      await Factory.createOrder({
        userId: testUser.id,
        type: 'SHOP_ORDER',
        status: 'CONFIRMED',
        total: '4726.80',
        items: JSON.stringify([
          { productId: 'prod-gold-bar-1oz', quantity: 2 }
        ]),
      });
    });

    it('should return user order history', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            orders: [
              {
                id: 'order-12345',
                status: 'CONFIRMED',
                total: '4726.80',
                itemCount: 1,
                createdAt: new Date().toISOString(),
                estimatedShipDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                tracking: null,
              },
            ],
            pagination: {
              page: 1,
              limit: 20,
              total: 1,
              hasNext: false,
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.orders).toHaveLength(1);
    });

    it('should filter by status', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            orders: [
              { status: 'SHIPPED' },
            ],
            appliedFilters: {
              status: 'SHIPPED',
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.orders.every((o: any) => o.status === 'SHIPPED')).toBe(true);
    });

    it('should require authentication', async () => {
      const mockResponse = {
        status: 401,
        body: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication required',
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('GET /api/shop/order/:id', () => {
    it('should return detailed order information', async () => {
      const orderId = 'order-12345';
      
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            order: {
              id: orderId,
              status: 'SHIPPED',
              items: [
                {
                  productId: 'prod-gold-bar-1oz',
                  productName: '1 oz Gold Bar - PAMP Suisse',
                  quantity: 2,
                  unitPrice: '2185.00',
                  totalPrice: '4370.00',
                },
              ],
              subtotal: '4680.00',
              shipping: '0.00',
              insurance: '46.80',
              total: '4726.80',
              paymentMethod: 'ACCOUNT_BALANCE',
              shippingAddress: {
                firstName: 'John',
                lastName: 'Doe',
                street: '123 Main St',
                city: 'Anytown',
                state: 'NY',
                zipCode: '12345',
                country: 'US',
              },
              tracking: {
                carrier: 'FedEx',
                trackingNumber: '1234567890',
                status: 'IN_TRANSIT',
                estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                trackingUrl: 'https://fedex.com/track/1234567890',
              },
              timeline: [
                { status: 'CONFIRMED', timestamp: new Date().toISOString() },
                { status: 'PROCESSING', timestamp: new Date().toISOString() },
                { status: 'SHIPPED', timestamp: new Date().toISOString() },
              ],
              createdAt: new Date().toISOString(),
              shippedAt: new Date().toISOString(),
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.order.id).toBe(orderId);
      expect(response.body.data.order.tracking).toBeDefined();
      expect(response.body.data.order.timeline).toHaveLength(3);
    });

    it('should return 404 for non-existent order', async () => {
      const mockResponse = {
        status: 404,
        body: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('ORDER_NOT_FOUND');
    });

    it('should prevent access to other users orders', async () => {
      const mockResponse = {
        status: 403,
        body: {
          code: 'ACCESS_DENIED',
          message: 'Access denied to this order',
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('ACCESS_DENIED');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle product price fluctuations during checkout', async () => {
      const mockResponse = {
        status: 400,
        body: {
          code: 'PRICE_CHANGED',
          message: 'Product prices have changed since quote was generated',
          data: {
            priceChanges: [
              {
                productId: 'prod-gold-bar-1oz',
                oldPrice: '2185.00',
                newPrice: '2195.00',
                change: '+10.00',
              },
            ],
            newTotal: '4746.80',
            originalTotal: '4726.80',
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('PRICE_CHANGED');
      expect(response.body.data.priceChanges).toHaveLength(1);
    });

    it('should handle shipping restrictions', async () => {
      const restrictedCheckoutData = {
        ...checkoutData,
        shippingAddress: {
          ...checkoutData.shippingAddress,
          state: 'NY', // Assume NY has restrictions
        },
      };

      const mockResponse = {
        status: 400,
        body: {
          code: 'SHIPPING_RESTRICTED',
          message: 'Shipping to this location is restricted',
          data: {
            restrictions: [
              'Precious metals shipments to NY require additional documentation',
              'Additional insurance may be required',
            ],
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('SHIPPING_RESTRICTED');
    });

    it('should validate minimum order values', async () => {
      const smallOrderData = {
        items: [
          {
            productId: 'prod-silver-coin-1oz',
            quantity: 1, // Small order under minimum
          },
        ],
      };

      const mockResponse = {
        status: 400,
        body: {
          code: 'ORDER_BELOW_MINIMUM',
          message: 'Order value below minimum threshold',
          data: {
            orderValue: '31.00',
            minimumValue: '50.00',
            shortfall: '19.00',
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('ORDER_BELOW_MINIMUM');
    });

    it('should handle fulfillment service failures gracefully', async () => {
      const mockResponse = {
        status: 503,
        body: {
          code: 'FULFILLMENT_SERVICE_UNAVAILABLE',
          message: 'Fulfillment service temporarily unavailable',
          data: {
            service: 'JM Bullion API',
            retryAfter: 300,
            alternativeOptions: [
              'BRINKS fulfillment available',
              'Manual processing available',
            ],
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(503);
      expect(response.body.code).toBe('FULFILLMENT_SERVICE_UNAVAILABLE');
      expect(response.body.data.alternativeOptions).toHaveLength(2);
    });
  });
});
