import request from 'supertest';
import app from '../test-server';

describe('Authentication Error Handling', () => {
  describe('GET /api/recurring/rules', () => {
    it('should return 401 when unauthenticated', async () => {
      const response = await request(app)
        .get('/api/recurring/rules')
        .expect(401);

      expect(response.body).toMatchObject({
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication required',
      });
    });
  });

  describe('POST /api/transfers/internal', () => {
    it('should return 401 when unauthenticated', async () => {
      const response = await request(app)
        .post('/api/transfers/internal')
        .send({
          toAccountNumber: '1234567890',
          asset: 'AU',
          amount: 1,
        })
        .expect(401);

      expect(response.body).toMatchObject({
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication required',
      });
    });
  });
});
