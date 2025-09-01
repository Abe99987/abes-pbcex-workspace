import request from 'supertest';
import app from '@/server';
import { CommodityConfigService } from '@/services/CommodityConfigService';
import { QuotesService } from '@/services/QuotesService';

describe('Shop Modals API Endpoints', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Initialize services
    await CommodityConfigService.initialize();
    await QuotesService.initialize();

    // Create test user and get auth token
    const signupResponse = await request(app).post('/api/auth/signup').send({
      email: 'test-shop-modals@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
    });

    if (signupResponse.status === 201) {
      authToken = signupResponse.body.data.token;
      userId = signupResponse.body.data.user.id;

      // Complete KYC
      await request(app)
        .post('/api/kyc/update-status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'APPROVED',
          notes: 'Test approval',
        });
    }
  });

  describe('GET /api/shop/config', () => {
    it('should return commodity configuration', async () => {
      const response = await request(app).get('/api/shop/config').expect(200);

      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.assets).toBeInstanceOf(Array);
      expect(response.body.data.assets.length).toBeGreaterThan(0);

      const goldConfig = response.body.data.assets.find(
        (asset: any) => asset.symbol === 'AU'
      );
      expect(goldConfig).toBeDefined();
      expect(goldConfig.displayName).toBe('Gold');
      expect(goldConfig.unitLabel).toBe('oz');
      expect(goldConfig.formats).toBeInstanceOf(Array);
      expect(goldConfig.formats.length).toBeGreaterThan(0);
    });

    it('should return proper format configuration for copper', async () => {
      const response = await request(app).get('/api/shop/config').expect(200);

      const copperConfig = response.body.data.assets.find(
        (asset: any) => asset.symbol === 'CU'
      );
      expect(copperConfig).toBeDefined();
      expect(copperConfig.displayName).toBe('Copper');
      expect(copperConfig.unitLabel).toBe('lbs');

      const coilsFormat = copperConfig.formats.find(
        (format: any) => format.key === 'coils'
      );
      expect(coilsFormat).toBeDefined();
      expect(coilsFormat.minOrder).toBe(2000); // 1 ton minimum for coils
      expect(coilsFormat.step).toBe(100);
    });

    it('should indicate license requirements for crude oil', async () => {
      const response = await request(app).get('/api/shop/config').expect(200);

      const crudeOilConfig = response.body.data.assets.find(
        (asset: any) => asset.symbol === 'CL'
      );
      expect(crudeOilConfig).toBeDefined();
      expect(crudeOilConfig.requiresLicense).toBe(true);
      expect(crudeOilConfig.logisticsNotices).toContain(
        'Requires special licensing for physical delivery'
      );
    });
  });

  describe('GET /api/quotes/estimate', () => {
    it('should return quote estimate for gold purchase', async () => {
      const response = await request(app)
        .get('/api/quotes/estimate')
        .query({
          symbol: 'AU',
          side: 'buy',
          amount: 1.0,
          format: 'coins',
        })
        .expect(200);

      expect(response.body.code).toBe('SUCCESS');
      const quote = response.body.data;

      expect(quote.symbol).toBe('AU');
      expect(quote.side).toBe('buy');
      expect(quote.amount).toBe(1.0);
      expect(quote.format).toBe('coins');
      expect(quote.quotedPrice).toBeGreaterThan(0);
      expect(quote.estimatedTotal).toBeGreaterThan(0);
      expect(quote.validation.minOrder).toBe(0.1);
      expect(quote.validation.stepSize).toBe(0.1);
      expect(quote.validation.unitLabel).toBe('oz');
      expect(quote.validation.isValidAmount).toBe(true);
      expect(quote.available).toBe(true);
      expect(quote.requiresLicense).toBe(false);
    });

    it('should return quote estimate for silver sale', async () => {
      const response = await request(app)
        .get('/api/quotes/estimate')
        .query({
          symbol: 'AG',
          side: 'sell',
          amount: 10,
          payout: 'USD',
        })
        .expect(200);

      const quote = response.body.data;
      expect(quote.symbol).toBe('AG');
      expect(quote.side).toBe('sell');
      expect(quote.estimatedProceeds).toBeGreaterThan(0);
      expect(quote.payout).toBe('USD');
    });

    it('should validate minimum order requirements', async () => {
      const response = await request(app)
        .get('/api/quotes/estimate')
        .query({
          symbol: 'AU',
          side: 'buy',
          amount: 0.05, // Below minimum
        })
        .expect(200);

      const quote = response.body.data;
      expect(quote.validation.isValidAmount).toBe(false);
      expect(quote.validation.validationError).toContain(
        'Minimum order is 0.1 oz'
      );
    });

    it('should validate step size alignment', async () => {
      const response = await request(app)
        .get('/api/quotes/estimate')
        .query({
          symbol: 'AU',
          side: 'buy',
          amount: 0.15, // Not aligned to 0.1 step
        })
        .expect(200);

      const quote = response.body.data;
      expect(quote.validation.isValidAmount).toBe(false);
      expect(quote.validation.validationError).toContain(
        'Amount must be in increments of 0.1 oz'
      );
    });

    it('should enforce format-specific minimums for copper', async () => {
      const response = await request(app)
        .get('/api/quotes/estimate')
        .query({
          symbol: 'CU',
          side: 'buy',
          amount: 500,
          format: 'coils', // Requires 2000 lbs minimum
        })
        .expect(200);

      const quote = response.body.data;
      expect(quote.validation.isValidAmount).toBe(false);
      expect(quote.validation.validationError).toContain(
        'Minimum order is 2000 lbs for coils'
      );
    });

    it('should indicate license requirement for crude oil', async () => {
      const response = await request(app)
        .get('/api/quotes/estimate')
        .query({
          symbol: 'CL',
          side: 'buy',
          amount: 100,
        })
        .expect(200);

      const quote = response.body.data;
      expect(quote.requiresLicense).toBe(true);
      expect(quote.notices).toContain(
        'This commodity requires special licensing for physical delivery'
      );
    });

    it('should return error for invalid symbol', async () => {
      const response = await request(app)
        .get('/api/quotes/estimate')
        .query({
          symbol: 'INVALID',
          side: 'buy',
          amount: 1,
        })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return error for missing required parameters', async () => {
      const response = await request(app)
        .get('/api/quotes/estimate')
        .query({
          symbol: 'AU',
          // Missing side and amount
        })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should validate payout method for sell orders', async () => {
      const response = await request(app)
        .get('/api/quotes/estimate')
        .query({
          symbol: 'AU',
          side: 'sell',
          amount: 1,
          payout: 'INVALID',
        })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/quotes/:quoteId', () => {
    let quoteId: string;

    beforeEach(async () => {
      const response = await request(app).get('/api/quotes/estimate').query({
        symbol: 'AU',
        side: 'buy',
        amount: 1.0,
      });

      quoteId = response.body.data.quoteId;
    });

    it('should return cached quote', async () => {
      const response = await request(app)
        .get(`/api/quotes/${quoteId}`)
        .expect(200);

      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.quoteId).toBe(quoteId);
    });

    it('should return 404 for invalid quote ID', async () => {
      const response = await request(app)
        .get('/api/quotes/invalid-quote-id')
        .expect(404);

      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/orders/physical (authenticated)', () => {
    it('should create physical order successfully', async () => {
      const response = await request(app)
        .post('/api/orders/physical')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          symbol: 'AU',
          amount: 1.0,
          format: 'coins',
          paymentMethod: 'BALANCE',
          clientId: 'test-client-123',
          idempotencyKey: 'test-idempotency-key-12345',
          shippingAddress: {
            name: 'John Doe',
            line1: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            postalCode: '12345',
            country: 'US',
            phone: '+1-555-123-4567',
          },
        })
        .expect(201);

      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.orderId).toBeDefined();
      expect(response.body.data.symbol).toBe('AU');
      expect(response.body.data.amount).toBe(1.0);
      expect(response.body.data.format).toBe('coins');
      expect(response.body.data.status).toBe('PENDING_PAYMENT');
    });

    it('should enforce idempotency', async () => {
      const orderData = {
        symbol: 'AU',
        amount: 1.0,
        format: 'coins',
        paymentMethod: 'BALANCE',
        clientId: 'test-client-456',
        idempotencyKey: 'idempotency-test-duplicate-789',
      };

      // First request
      const response1 = await request(app)
        .post('/api/orders/physical')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const orderId1 = response1.body.data.orderId;

      // Second request with same idempotency key
      const response2 = await request(app)
        .post('/api/orders/physical')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(200);

      expect(response2.body.message).toBe('Order already exists');
      expect(response2.body.data.orderId).toBe(orderId1);
    });

    it('should validate minimum order requirements', async () => {
      const response = await request(app)
        .post('/api/orders/physical')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          symbol: 'AU',
          amount: 0.05, // Below minimum
          format: 'coins',
          paymentMethod: 'BALANCE',
          clientId: 'test-client-789',
          idempotencyKey: 'test-validation-key-456',
        })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/orders/physical')
        .send({
          symbol: 'AU',
          amount: 1.0,
          format: 'coins',
          paymentMethod: 'BALANCE',
          clientId: 'test-client',
          idempotencyKey: 'test-key',
        })
        .expect(401);

      expect(response.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/orders/sell-convert (authenticated)', () => {
    it('should create sell/convert transaction successfully', async () => {
      const response = await request(app)
        .post('/api/orders/sell-convert')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          symbol: 'AU',
          amount: 1.0,
          payout: 'USD',
          clientId: 'test-client-sell-123',
          idempotencyKey: 'test-sell-idempotency-key-12345',
        })
        .expect(201);

      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.transactionId).toBeDefined();
      expect(response.body.data.symbol).toBe('AU');
      expect(response.body.data.amount).toBe(1.0);
      expect(response.body.data.payout).toBe('USD');
      expect(response.body.data.status).toBe('PROCESSING');
    });

    it('should enforce idempotency for sell orders', async () => {
      const orderData = {
        symbol: 'AG',
        amount: 10,
        payout: 'USDC',
        clientId: 'test-client-sell-456',
        idempotencyKey: 'sell-idempotency-test-duplicate-789',
      };

      // First request
      const response1 = await request(app)
        .post('/api/orders/sell-convert')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      const transactionId1 = response1.body.data.transactionId;

      // Second request with same idempotency key
      const response2 = await request(app)
        .post('/api/orders/sell-convert')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(200);

      expect(response2.body.message).toBe('Transaction already exists');
      expect(response2.body.data.transactionId).toBe(transactionId1);
    });

    it('should validate payout method', async () => {
      const response = await request(app)
        .post('/api/orders/sell-convert')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          symbol: 'AU',
          amount: 1.0,
          payout: 'INVALID_PAYOUT',
          clientId: 'test-client-invalid',
          idempotencyKey: 'test-invalid-payout-key',
        })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/orders/sell-convert')
        .send({
          symbol: 'AU',
          amount: 1.0,
          payout: 'USD',
          clientId: 'test-client',
          idempotencyKey: 'test-key',
        })
        .expect(401);

      expect(response.body.code).toBe('UNAUTHORIZED');
    });
  });
});
