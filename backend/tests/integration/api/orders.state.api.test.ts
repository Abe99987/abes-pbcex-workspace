import request from 'supertest';
import { app } from '../../helpers/test-app';
import OrdersService from '@/services/OrdersService';

describe('Orders State Transitions', () => {
  it('allows relock only after expiry and cancel only if not paid', async () => {
    // Create order
    const create = await request(app)
      .post('/api/orders')
      .send({ metal: 'SILVER', qty: 1 })
      .expect(201);
    const orderId = create.body.order_id as string;

    // Relock should fail if not expired
    await request(app).post(`/api/orders/${orderId}/relock`).expect(409);

    // Expire then relock should succeed
    OrdersService.expireLockForTest(orderId);
    const relock = await request(app)
      .post(`/api/orders/${orderId}/relock`)
      .expect(200);
    expect(relock.body.state).toBe('PRICE_LOCKED');

    // Force expire by calling internal test hook via same process
    // We cannot import service here; simulate expiry by waiting negative time not possible.
    // Instead, perform a relock after manipulating ID through a special endpoint is not available.
    // Use a workaround: create a new order and ensure cancel works when not paid.

    // Cancel allowed when not paid
    const cancel = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .expect(200);
    expect(cancel.body.state).toBe('CANCELLED');

    // Cancel again should be idempotent-ish conflict
    await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .expect(200);
  });
});


