import request from 'supertest';
import { app } from '../../helpers/test-app';

describe('Orders API', () => {
  it('POST /api/orders should create an order and return 201 with order_id', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({ metal: 'GOLD', qty: 2 })
      .expect(201);

    expect(response.body).toHaveProperty('order_id');
    expect(typeof response.body.order_id).toBe('string');
    expect(response.body.order_id.length).toBeGreaterThan(0);

    expect(response.body).toHaveProperty('state', 'PRICE_LOCKED');
    expect(response.body).toHaveProperty('lock_expiry');
    expect(new Date(response.body.lock_expiry).getTime()).toBeGreaterThan(Date.now());
  });
});


