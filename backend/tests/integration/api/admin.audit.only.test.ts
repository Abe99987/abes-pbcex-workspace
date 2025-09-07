import request from 'supertest';
import { app } from '../../helpers/test-app';

describe('Admin Audit middleware', () => {
  it('records an audit event for admin write and can list recent events', async () => {
    // Trigger an admin write (maintenance) with admin auth
    await request(app)
      .post('/api/admin/maintenance')
      .set('Authorization', 'Bearer mock-admin-jwt-token')
      .send({ operation: 'UPDATE_PRICES' })
      .expect(200);

    // Fetch recent audit events
    const res = await request(app)
      .get('/api/admin/audit/recent?limit=10')
      .set('Authorization', 'Bearer mock-admin-jwt-token')
      .expect(200);

    expect(res.body.code).toBe('SUCCESS');
    const events = res.body.data?.events || [];
    expect(Array.isArray(events)).toBe(true);
    const found = events.find((e: any) => e.action?.includes('/api/admin/maintenance'));
    expect(found).toBeDefined();
    expect(found.status).toBeGreaterThanOrEqual(200);
  });
});


