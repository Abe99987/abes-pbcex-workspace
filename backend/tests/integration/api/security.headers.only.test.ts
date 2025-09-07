import request from 'supertest';
import { app } from '../../helpers/test-app';

describe('Security headers via Helmet', () => {
  it('applies standard Helmet headers on public health endpoint', async () => {
    const res = await request(app).get('/api/prices/health');
    expect(res.statusCode).toBeLessThan(500);
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
  });

  it('applies headers on admin metrics (with auth) and rejects without auth', async () => {
    const unauth = await request(app).get('/api/admin/metrics');
    expect(unauth.statusCode).toBe(401);

    const auth = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', 'Bearer mock-admin-jwt-token');
    expect(auth.statusCode).toBe(200);
    expect(auth.headers['x-content-type-options']).toBe('nosniff');
    expect(auth.headers['x-frame-options']).toBe('DENY');
  });
});


