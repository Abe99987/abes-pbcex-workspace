import request from 'supertest';
import { app } from '../../helpers/test-app';

describe('Admin RBAC', () => {
  it('returns 403 for non-admin on /api/admin/metrics', async () => {
    await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', 'Bearer mock-user-jwt-token')
      .expect(403);
  });
});


