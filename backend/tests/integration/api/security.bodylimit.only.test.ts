import request from 'supertest';
import { app } from '../../helpers/test-app';

describe('Security: body size limits and rate-limiting on orders', () => {
  it('returns 413 for payloads exceeding 100kb on POST /api/orders', async () => {
    const big = 'x'.repeat(120 * 1024); // ~120kb
    const res = await request(app)
      .post('/api/orders')
      .send({ metal: 'GOLD', qty: 1, junk: big });

    // Express/json returns 413 Payload Too Large when limit is exceeded
    expect([413, 400]).toContain(res.statusCode);
  });

  it('rate-limits burst order requests with 429', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 40; i++) {
      const r = await request(app)
        .post('/api/orders')
        .send({ metal: 'GOLD', qty: 1 });
      statuses.push(r.statusCode);
      if (r.statusCode === 429) break;
    }
    expect(statuses.some(s => s === 429)).toBe(true);
  });
});


