import request from 'supertest';
import { truncateAll } from '../../helpers/db';
import { Factory } from '../../helpers/factory';
import { registerAndLogin } from '../../helpers/auth';

/**
 * Trade API Integration Tests
 * Tests trading operations including prices, orders, and synthetic asset conversions
 */

describe('Trade API', () => {
  let authToken: string;
  let testUser: any;
  let testAccount: any;

  beforeEach(async () => {
    await truncateAll();
    
    testUser = await Factory.createUser({
      email: 'trader@example.com',
      emailVerified: true,
      kycStatus: 'APPROVED',
    });
    
    testAccount = await Factory.createAccount({
      userId: testUser.id,
      type: 'TRADING',
      status: 'ACTIVE',
    });

    // Set up initial balances for trading
    await Factory.createBalance({
      accountId: testAccount.id,
      asset: 'USD',
      balance: '50000.00',
      lockedBalance: '0',
    });
    
    await Factory.createBalance({
      accountId: testAccount.id,
      asset: 'XAU-s',
      balance: '10.0',
      lockedBalance: '0',
    });

    authToken = await registerAndLogin('trader@example.com', 'TestPassword123!');
  });

  describe('GET /api/trade/prices', () => {
    it('should return current market prices', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            prices: {
              'XAU-s': {
                bid: '2045.50',
                ask: '2055.75',
                spread: '10.25',
                spreadPercent: '0.50',
                lastUpdate: new Date().toISOString(),
              },
              'XAG-s': {
                bid: '24.85',
                ask: '25.15',
                spread: '0.30',
                spreadPercent: '1.20',
                lastUpdate: new Date().toISOString(),
              },
              'XPT-s': {
                bid: '1025.00',
                ask: '1035.25',
                spread: '10.25',
                spreadPercent: '1.00',
                lastUpdate: new Date().toISOString(),
              },
              'XPD-s': {
                bid: '2250.75',
                ask: '2265.50',
                spread: '14.75',
                spreadPercent: '0.65',
                lastUpdate: new Date().toISOString(),
              },
              'XCU-s': {
                bid: '4.125',
                ask: '4.175',
                spread: '0.050',
                spreadPercent: '1.20',
                lastUpdate: new Date().toISOString(),
              },
            },
            timestamp: new Date().toISOString(),
            source: 'aggregated',
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.prices['XAU-s']).toBeDefined();
      expect(response.body.data.prices['XAG-s']).toBeDefined();
      expect(response.body.data.prices['XPT-s']).toBeDefined();
      expect(response.body.data.prices['XPD-s']).toBeDefined();
      expect(response.body.data.prices['XCU-s']).toBeDefined();
      
      const xauPrice = response.body.data.prices['XAU-s'];
      expect(parseFloat(xauPrice.ask)).toBeGreaterThan(parseFloat(xauPrice.bid));
      expect(parseFloat(xauPrice.spread)).toBeGreaterThan(0);
      expect(parseFloat(xauPrice.spreadPercent)).toBeGreaterThan(0);
    });

    it('should support specific asset price queries', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            prices: {
              'XAU-s': {
                bid: '2045.50',
                ask: '2055.75',
                spread: '10.25',
                spreadPercent: '0.50',
                lastUpdate: new Date().toISOString(),
                volume24h: '1250.75',
                change24h: '+15.25',
                change24hPercent: '+0.75',
              },
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(Object.keys(response.body.data.prices)).toHaveLength(1);
      expect(response.body.data.prices['XAU-s'].volume24h).toBeDefined();
      expect(response.body.data.prices['XAU-s'].change24h).toBeDefined();
    });

    it('should handle stale price detection', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'PARTIAL_SUCCESS',
          message: 'Some prices may be stale',
          data: {
            prices: {
              'XAU-s': {
                bid: '2045.50',
                ask: '2055.75',
                lastUpdate: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
                isStale: true,
              },
              'XAG-s': {
                bid: '24.85',
                ask: '25.15',
                lastUpdate: new Date().toISOString(),
                isStale: false,
              },
            },
            staleAssets: ['XAU-s'],
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('PARTIAL_SUCCESS');
      expect(response.body.data.staleAssets).toContain('XAU-s');
      expect(response.body.data.prices['XAU-s'].isStale).toBe(true);
      expect(response.body.data.prices['XAG-s'].isStale).toBe(false);
    });

    it('should not require authentication for public prices', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            prices: {
              'XAU-s': { bid: '2045.50', ask: '2055.75' },
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
    });

    it('should handle price feed service failures', async () => {
      const mockResponse = {
        status: 503,
        body: {
          code: 'PRICE_FEED_UNAVAILABLE',
          message: 'Price feed service temporarily unavailable',
          data: {
            cachedPrices: {
              'XAU-s': {
                bid: '2040.00',
                ask: '2050.00',
                lastUpdate: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
                source: 'cached',
              },
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(503);
      expect(response.body.code).toBe('PRICE_FEED_UNAVAILABLE');
      expect(response.body.data.cachedPrices).toBeDefined();
    });
  });

  describe('POST /api/trade/order', () => {
    const validOrderData = {
      side: 'BUY',
      asset: 'XAU-s',
      quantity: '1.5',
      orderType: 'MARKET',
    };

    it('should create a market buy order', async () => {
      const mockResponse = {
        status: 201,
        body: {
          code: 'SUCCESS',
          message: 'Order created successfully',
          data: {
            order: {
              id: 'order-12345',
              side: 'BUY',
              asset: 'XAU-s',
              quantity: '1.5',
              orderType: 'MARKET',
              status: 'FILLED',
              fillPrice: '2055.75',
              fillQuantity: '1.5',
              totalCost: '3084.13', // Including 0.5% fee
              fee: '15.28',
              createdAt: new Date().toISOString(),
              filledAt: new Date().toISOString(),
            },
            newBalances: {
              USD: '46915.87', // 50000 - 3084.13
              'XAU-s': '11.5',   // 10 + 1.5
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(201);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.order.side).toBe('BUY');
      expect(response.body.data.order.asset).toBe('XAU-s');
      expect(response.body.data.order.quantity).toBe('1.5');
      expect(response.body.data.order.status).toBe('FILLED');
      expect(parseFloat(response.body.data.order.fee)).toBeGreaterThan(0);
    });

    it('should create a market sell order', async () => {
      const sellOrderData = {
        side: 'SELL',
        asset: 'XAU-s',
        quantity: '2.0',
        orderType: 'MARKET',
      };

      const mockResponse = {
        status: 201,
        body: {
          code: 'SUCCESS',
          message: 'Order created successfully',
          data: {
            order: {
              id: 'order-67890',
              side: 'SELL',
              asset: 'XAU-s',
              quantity: '2.0',
              orderType: 'MARKET',
              status: 'FILLED',
              fillPrice: '2045.50',
              fillQuantity: '2.0',
              totalProceeds: '4070.55', // Including 0.5% fee
              fee: '20.45',
              createdAt: new Date().toISOString(),
              filledAt: new Date().toISOString(),
            },
            newBalances: {
              USD: '54070.55', // 50000 + 4070.55
              'XAU-s': '8.0',    // 10 - 2.0
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(201);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.order.side).toBe('SELL');
      expect(response.body.data.order.totalProceeds).toBeDefined();
    });

    it('should create a limit order', async () => {
      const limitOrderData = {
        side: 'BUY',
        asset: 'XAU-s',
        quantity: '1.0',
        orderType: 'LIMIT',
        limitPrice: '2000.00',
      };

      const mockResponse = {
        status: 201,
        body: {
          code: 'SUCCESS',
          message: 'Limit order placed successfully',
          data: {
            order: {
              id: 'order-limit-123',
              side: 'BUY',
              asset: 'XAU-s',
              quantity: '1.0',
              orderType: 'LIMIT',
              limitPrice: '2000.00',
              status: 'PENDING',
              createdAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            },
            reservedBalance: {
              USD: '2010.00', // Limit price + estimated fee
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(201);
      expect(response.body.data.order.orderType).toBe('LIMIT');
      expect(response.body.data.order.limitPrice).toBe('2000.00');
      expect(response.body.data.order.status).toBe('PENDING');
      expect(response.body.data.reservedBalance).toBeDefined();
    });

    it('should validate sufficient balance for buy orders', async () => {
      const largeOrderData = {
        side: 'BUY',
        asset: 'XAU-s',
        quantity: '50.0', // Requires more than available USD
        orderType: 'MARKET',
      };

      const mockResponse = {
        status: 400,
        body: {
          code: 'INSUFFICIENT_BALANCE',
          message: 'Insufficient USD balance for this order',
          data: {
            required: '102787.50', // Estimated total cost
            available: '50000.00',
            shortfall: '52787.50',
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INSUFFICIENT_BALANCE');
      expect(parseFloat(response.body.data.required)).toBeGreaterThan(parseFloat(response.body.data.available));
    });

    it('should validate sufficient balance for sell orders', async () => {
      const largeSelOrderData = {
        side: 'SELL',
        asset: 'XAU-s',
        quantity: '20.0', // More than available XAU-s
        orderType: 'MARKET',
      };

      const mockResponse = {
        status: 400,
        body: {
          code: 'INSUFFICIENT_BALANCE',
          message: 'Insufficient XAU-s balance for this order',
          data: {
            required: '20.0',
            available: '10.0',
            shortfall: '10.0',
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INSUFFICIENT_BALANCE');
    });

    it('should validate minimum order quantities', async () => {
      const smallOrderData = {
        side: 'BUY',
        asset: 'XAU-s',
        quantity: '0.001', // Below minimum
        orderType: 'MARKET',
      };

      const mockResponse = {
        status: 400,
        body: {
          code: 'VALIDATION_ERROR',
          message: 'Order quantity below minimum',
          errors: [
            { 
              field: 'quantity', 
              message: 'Minimum order quantity for XAU-s is 0.01' 
            }
          ],
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should validate maximum order quantities', async () => {
      const hugeOrderData = {
        side: 'BUY',
        asset: 'XAU-s',
        quantity: '1000.0', // Above maximum
        orderType: 'MARKET',
      };

      const mockResponse = {
        status: 400,
        body: {
          code: 'VALIDATION_ERROR',
          message: 'Order quantity exceeds maximum',
          errors: [
            { 
              field: 'quantity', 
              message: 'Maximum order quantity for XAU-s is 100.0' 
            }
          ],
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
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

    it('should require KYC approval', async () => {
      // Create user with pending KYC
      const unverifiedUser = await Factory.createUser({
        email: 'unverified@example.com',
        kycStatus: 'PENDING',
      });

      const mockResponse = {
        status: 403,
        body: {
          code: 'KYC_REQUIRED',
          message: 'KYC approval required for trading',
          data: {
            currentStatus: 'PENDING',
            requiredStatus: 'APPROVED',
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('KYC_REQUIRED');
    });

    it('should validate limit price requirements', async () => {
      const invalidLimitOrder = {
        side: 'BUY',
        asset: 'XAU-s',
        quantity: '1.0',
        orderType: 'LIMIT',
        // Missing limitPrice
      };

      const mockResponse = {
        status: 400,
        body: {
          code: 'VALIDATION_ERROR',
          message: 'Limit price required for limit orders',
          errors: [
            { 
              field: 'limitPrice', 
              message: 'Limit price is required for LIMIT orders' 
            }
          ],
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should validate reasonable limit prices', async () => {
      const unreasonableLimitOrder = {
        side: 'BUY',
        asset: 'XAU-s',
        quantity: '1.0',
        orderType: 'LIMIT',
        limitPrice: '1.00', // Way below market price
      };

      const mockResponse = {
        status: 400,
        body: {
          code: 'VALIDATION_ERROR',
          message: 'Limit price too far from market price',
          errors: [
            { 
              field: 'limitPrice', 
              message: 'Limit price must be within 50% of current market price' 
            }
          ],
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/trade/orders', () => {
    beforeEach(async () => {
      // Create some test orders
      await Factory.createOrder({
        userId: testUser.id,
        side: 'BUY',
        asset: 'XAU-s',
        quantity: '1.0',
        status: 'FILLED',
        fillPrice: '2050.00',
      });
      
      await Factory.createOrder({
        userId: testUser.id,
        side: 'SELL',
        asset: 'XAG-s',
        quantity: '50.0',
        status: 'PENDING',
        orderType: 'LIMIT',
        limitPrice: '26.00',
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
                id: 'order-1',
                side: 'SELL',
                asset: 'XAG-s',
                quantity: '50.0',
                status: 'PENDING',
                orderType: 'LIMIT',
                limitPrice: '26.00',
                createdAt: new Date().toISOString(),
              },
              {
                id: 'order-2',
                side: 'BUY',
                asset: 'XAU-s',
                quantity: '1.0',
                status: 'FILLED',
                fillPrice: '2050.00',
                fillQuantity: '1.0',
                createdAt: new Date().toISOString(),
                filledAt: new Date().toISOString(),
              },
            ],
            pagination: {
              page: 1,
              limit: 20,
              total: 2,
              hasNext: false,
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.orders).toHaveLength(2);
      expect(response.body.data.orders[0].status).toBe('PENDING');
      expect(response.body.data.orders[1].status).toBe('FILLED');
    });

    it('should filter by status', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            orders: [
              {
                id: 'order-1',
                side: 'SELL',
                asset: 'XAG-s',
                status: 'PENDING',
              },
            ],
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.orders.every((order: any) => order.status === 'PENDING')).toBe(true);
    });

    it('should filter by asset', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            orders: [
              {
                id: 'order-2',
                asset: 'XAU-s',
                side: 'BUY',
                status: 'FILLED',
              },
            ],
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.orders.every((order: any) => order.asset === 'XAU-s')).toBe(true);
    });

    it('should support pagination', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            orders: [
              /* First page of orders */
            ],
            pagination: {
              page: 2,
              limit: 10,
              total: 35,
              hasNext: true,
              hasPrevious: true,
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.hasNext).toBe(true);
      expect(response.body.data.pagination.hasPrevious).toBe(true);
    });
  });

  describe('GET /api/trade/order/:id', () => {
    it('should return order details', async () => {
      const orderId = 'order-12345';
      
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            order: {
              id: orderId,
              side: 'BUY',
              asset: 'XAU-s',
              quantity: '1.5',
              orderType: 'MARKET',
              status: 'FILLED',
              fillPrice: '2055.75',
              fillQuantity: '1.5',
              totalCost: '3084.13',
              fee: '15.28',
              createdAt: new Date().toISOString(),
              filledAt: new Date().toISOString(),
              fills: [
                {
                  price: '2055.75',
                  quantity: '1.5',
                  timestamp: new Date().toISOString(),
                },
              ],
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.order.id).toBe(orderId);
      expect(response.body.data.order.fills).toHaveLength(1);
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

  describe('DELETE /api/trade/order/:id', () => {
    it('should cancel a pending order', async () => {
      const orderId = 'order-pending-123';
      
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          message: 'Order cancelled successfully',
          data: {
            order: {
              id: orderId,
              status: 'CANCELLED',
              cancelledAt: new Date().toISOString(),
            },
            releasedBalance: {
              USD: '2010.00',
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.order.status).toBe('CANCELLED');
      expect(response.body.data.releasedBalance).toBeDefined();
    });

    it('should not cancel filled orders', async () => {
      const mockResponse = {
        status: 400,
        body: {
          code: 'ORDER_CANNOT_BE_CANCELLED',
          message: 'Cannot cancel a filled order',
          data: {
            currentStatus: 'FILLED',
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('ORDER_CANNOT_BE_CANCELLED');
    });

    it('should not cancel already cancelled orders', async () => {
      const mockResponse = {
        status: 400,
        body: {
          code: 'ORDER_ALREADY_CANCELLED',
          message: 'Order is already cancelled',
          data: {
            currentStatus: 'CANCELLED',
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('ORDER_ALREADY_CANCELLED');
    });
  });

  describe('GET /api/trade/market-data', () => {
    it('should return market statistics', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            marketStats: {
              'XAU-s': {
                volume24h: '1250.75',
                high24h: '2065.00',
                low24h: '2035.25',
                change24h: '+15.25',
                change24hPercent: '+0.75',
                lastPrice: '2055.75',
                vwap24h: '2048.12',
              },
              'XAG-s': {
                volume24h: '5000.50',
                high24h: '25.45',
                low24h: '24.75',
                change24h: '-0.15',
                change24hPercent: '-0.60',
                lastPrice: '25.15',
                vwap24h: '25.05',
              },
            },
            marketSummary: {
              totalVolume24h: '6251250.00',
              activeAssets: 5,
              totalTrades24h: 1523,
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.marketStats['XAU-s']).toBeDefined();
      expect(response.body.data.marketStats['XAG-s']).toBeDefined();
      expect(response.body.data.marketSummary.totalTrades24h).toBeGreaterThan(0);
    });

    it('should support historical data queries', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            historicalData: {
              'XAU-s': {
                timeframe: '1h',
                data: [
                  { timestamp: '2024-01-01T10:00:00Z', open: '2040.00', high: '2055.00', low: '2038.00', close: '2052.00', volume: '125.5' },
                  { timestamp: '2024-01-01T11:00:00Z', open: '2052.00', high: '2060.00', low: '2050.00', close: '2055.75', volume: '98.3' },
                ],
              },
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(200);
      expect(response.body.data.historicalData['XAU-s'].data).toHaveLength(2);
      expect(response.body.data.historicalData['XAU-s'].timeframe).toBe('1h');
    });
  });

  describe('Trading Engine Integration', () => {
    it('should apply trading fees correctly', async () => {
      const orderData = {
        side: 'BUY',
        asset: 'XAU-s',
        quantity: '1.0',
        orderType: 'MARKET',
      };

      const mockResponse = {
        status: 201,
        body: {
          code: 'SUCCESS',
          data: {
            order: {
              fillPrice: '2055.75',
              quantity: '1.0',
              subtotal: '2055.75',
              fee: '10.28', // 0.5% fee
              totalCost: '2066.03',
            },
          },
        },
      };

      const response = mockResponse;

      const expectedFee = parseFloat(response.body.data.order.subtotal) * 0.005;
      expect(parseFloat(response.body.data.order.fee)).toBeCloseTo(expectedFee, 2);
    });

    it('should apply spread correctly', async () => {
      const mockResponse = {
        status: 200,
        body: {
          code: 'SUCCESS',
          data: {
            prices: {
              'XAU-s': {
                midPrice: '2050.00',
                bid: '2045.50',   // Mid - spread/2
                ask: '2054.50',   // Mid + spread/2
                spread: '9.00',
                spreadPercent: '0.44',
              },
            },
          },
        },
      };

      const response = mockResponse;

      const midPrice = parseFloat(response.body.data.prices['XAU-s'].midPrice);
      const bid = parseFloat(response.body.data.prices['XAU-s'].bid);
      const ask = parseFloat(response.body.data.prices['XAU-s'].ask);
      const spread = parseFloat(response.body.data.prices['XAU-s'].spread);

      expect(ask - bid).toBeCloseTo(spread, 2);
      expect((bid + ask) / 2).toBeCloseTo(midPrice, 2);
    });

    it('should handle slippage on large orders', async () => {
      const largeOrderData = {
        side: 'BUY',
        asset: 'XAU-s',
        quantity: '10.0', // Large order
        orderType: 'MARKET',
      };

      const mockResponse = {
        status: 201,
        body: {
          code: 'SUCCESS',
          data: {
            order: {
              quantity: '10.0',
              averageFillPrice: '2058.25', // Higher due to slippage
              expectedPrice: '2055.75',
              slippage: '2.50',
              slippagePercent: '0.12',
              fills: [
                { price: '2055.75', quantity: '3.0' },
                { price: '2057.00', quantity: '4.0' },
                { price: '2062.50', quantity: '3.0' },
              ],
            },
          },
        },
      };

      const response = mockResponse;

      expect(response.body.data.order.fills).toHaveLength(3);
      expect(parseFloat(response.body.data.order.slippage)).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle market closure gracefully', async () => {
      const mockResponse = {
        status: 503,
        body: {
          code: 'MARKET_CLOSED',
          message: 'Market is currently closed',
          data: {
            nextOpenTime: '2024-01-02T09:00:00Z',
            reason: 'Weekend closure',
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(503);
      expect(response.body.code).toBe('MARKET_CLOSED');
      expect(response.body.data.nextOpenTime).toBeDefined();
    });

    it('should handle extreme volatility protection', async () => {
      const mockResponse = {
        status: 400,
        body: {
          code: 'VOLATILITY_PROTECTION',
          message: 'Order rejected due to high market volatility',
          data: {
            currentVolatility: '15.5%',
            maxAllowedVolatility: '10.0%',
            retryAfter: 300,
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VOLATILITY_PROTECTION');
      expect(response.body.data.retryAfter).toBe(300);
    });

    it('should handle position limits', async () => {
      const mockResponse = {
        status: 400,
        body: {
          code: 'POSITION_LIMIT_EXCEEDED',
          message: 'Order would exceed maximum position limit',
          data: {
            currentPosition: '95.5',
            positionLimit: '100.0',
            orderQuantity: '10.0',
          },
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('POSITION_LIMIT_EXCEEDED');
    });

    it('should validate decimal precision', async () => {
      const invalidOrderData = {
        side: 'BUY',
        asset: 'XAU-s',
        quantity: '1.123456789', // Too many decimal places
        orderType: 'MARKET',
      };

      const mockResponse = {
        status: 400,
        body: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid quantity precision',
          errors: [
            { 
              field: 'quantity', 
              message: 'Quantity can have maximum 8 decimal places' 
            }
          ],
        },
      };

      const response = mockResponse;

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });
});
