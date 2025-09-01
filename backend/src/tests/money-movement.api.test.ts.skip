import request from 'supertest';
import app from '@/test-server';

describe('Money Movement API Integration Tests', () => {
  describe('Transfers', () => {
    describe('POST /api/transfers/internal', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const response = await request(app)
          .post('/api/transfers/internal')
          .send({
            toInternalAccountNumber: '12345',
            asset: 'AU',
            amount: '1.0',
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('AUTHENTICATION_ERROR');
      });

      it('should return 401 for invalid request body (auth check happens first)', async () => {
        const response = await request(app)
          .post('/api/transfers/internal')
          .send({
            // Missing required fields
            asset: 'AU',
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('AUTHENTICATION_ERROR');
      });
    });

    describe('GET /api/transfers/internal/:id', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const response = await request(app).get(
          '/api/transfers/internal/test-uuid'
        );

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('AUTHENTICATION_ERROR');
      });
    });

    describe('POST /api/transfers/bank', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const response = await request(app).post('/api/transfers/bank').send({
          beneficiaryId: 'test-uuid',
          amount: '100.00',
          currency: 'USD',
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('AUTHENTICATION_ERROR');
      });
    });

    describe('GET /api/transfers/history', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const response = await request(app).get('/api/transfers/history');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('AUTHENTICATION_ERROR');
      });
    });
  });

  describe('Crypto', () => {
    describe('GET /api/crypto/networks', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const response = await request(app).get('/api/crypto/networks');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('AUTHENTICATION_ERROR');
      });
    });

    describe('GET /api/crypto/assets', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const response = await request(app).get('/api/crypto/assets');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('AUTHENTICATION_ERROR');
      });
    });

    describe('POST /api/crypto/withdrawals', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const response = await request(app)
          .post('/api/crypto/withdrawals')
          .send({
            asset: 'BTC',
            network: 'bitcoin',
            address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            amount: '0.001',
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('AUTHENTICATION_ERROR');
      });
    });
  });

  describe('Beneficiaries', () => {
    describe('POST /api/beneficiaries', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const response = await request(app)
          .post('/api/beneficiaries')
          .send({
            type: 'bank_swift',
            displayName: 'Test Bank',
            details: { accountNumber: '123456789' },
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('AUTHENTICATION_ERROR');
      });
    });

    describe('GET /api/beneficiaries', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const response = await request(app).get('/api/beneficiaries');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('AUTHENTICATION_ERROR');
      });
    });
  });

  describe('QR', () => {
    describe('POST /api/qr/pay', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const response = await request(app).post('/api/qr/pay').send({
          asset: 'AU',
          amount: '1.0',
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('AUTHENTICATION_ERROR');
      });
    });

    describe('GET /api/qr/:token', () => {
      it('should return 500 for non-existent token (server error)', async () => {
        const response = await request(app).get('/api/qr/non-existent-token');

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('INTERNAL_ERROR');
      });
    });
  });

  describe('Payment Requests', () => {
    describe('POST /api/payment-requests', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const response = await request(app)
          .post('/api/payment-requests')
          .send({
            mode: 'internal_user',
            target: { userId: 'test-uuid' },
            asset: 'AU',
            amount: '1.0',
          });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('AUTHENTICATION_ERROR');
      });
    });

    describe('GET /api/payment-requests', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const response = await request(app).get('/api/payment-requests');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('AUTHENTICATION_ERROR');
      });
    });
  });

  describe('Recurring', () => {
    describe('POST /api/recurring/rules', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const response = await request(app).post('/api/recurring/rules').send({
          name: 'Monthly Gold',
          asset: 'AU',
          amount: '1.0',
          frequency: 'monthly',
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('AUTHENTICATION_ERROR');
      });
    });

    describe('GET /api/recurring/rules', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const response = await request(app).get('/api/recurring/rules');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('AUTHENTICATION_ERROR');
      });
    });
  });

  describe('Card Funding', () => {
    describe('GET /api/cards/funding', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const response = await request(app).get('/api/cards/funding');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('AUTHENTICATION_ERROR');
      });
    });

    describe('GET /api/cards/funding/assets', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const response = await request(app).get('/api/cards/funding/assets');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('AUTHENTICATION_ERROR');
      });
    });
  });

  describe('DCA', () => {
    describe('POST /api/dca/plans', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const response = await request(app).post('/api/dca/plans').send({
          name: 'Weekly Gold DCA',
          asset: 'AU',
          amount: '100.00',
          frequency: 'weekly',
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('AUTHENTICATION_ERROR');
      });
    });

    describe('GET /api/dca/plans', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const response = await request(app).get('/api/dca/plans');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('AUTHENTICATION_ERROR');
      });
    });

    describe('POST /api/dca/backtest', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const response = await request(app).post('/api/dca/backtest').send({
          asset: 'AU',
          amount: '100.00',
          frequency: 'weekly',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('code');
        expect(response.body.code).toBe('AUTHENTICATION_ERROR');
      });
    });
  });
});
