import request from 'supertest';
import { app } from '../../helpers/test-app';

describe('Admin KPI Overview', () => {
  it('returns overview with expected shape and types', async () => {
    const res = await request(app)
      .get('/api/admin/kpi/overview')
      .set('Authorization', 'Bearer mock-admin-jwt-token')
      .expect(200);

    expect(res.body.code).toBe('SUCCESS');
    const data = res.body.data;
    expect(typeof data.userCount).toBe('number');
    expect(typeof data.byAsset['XAU-s'].exposure).toBe('string');
    expect(typeof data.feesToDate.amount).toBe('string');
    expect(typeof data.feesToDate.pendingSource).toBe('boolean');
    expect(typeof data.reservesIOU.amount).toBe('string');
    expect(data.reservesIOU.pendingSource).toBe(true);
  });
});


