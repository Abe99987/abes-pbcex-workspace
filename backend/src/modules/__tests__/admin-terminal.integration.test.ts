import request from 'supertest';
import app from '../../server';
import jwt from 'jsonwebtoken';

/**
 * Admin Terminal Integration Tests
 * Tests key admin terminal endpoints
 */

// Mock user for testing
const mockAdminUser = {
  id: 'test-admin-123',
  email: 'admin@pbcex.com',
  role: 'ADMIN',
  kycStatus: 'APPROVED'
};

// Generate proper JWT token for testing
const mockJwtToken = jwt.sign(
  {
    userId: mockAdminUser.id,
    email: mockAdminUser.email,
    role: mockAdminUser.role,
    kycStatus: mockAdminUser.kycStatus,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  },
  process.env.JWT_SECRET || 'test-secret-key-32-chars-long-for-testing-only',
  {
    issuer: 'pbcex-api',
    audience: 'pbcex-users',
  }
);

describe('Admin Terminal API Integration', () => {
  describe('Health Endpoints', () => {
    it('should return server health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('healthy');
    });

    it('should return admin terminal status', async () => {
      const response = await request(app)
        .get('/api/admin/terminal/status')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data).toHaveProperty('status');
    });
  });

  describe('Core Admin Routes', () => {
    it('should get cases list', async () => {
      const response = await request(app)
        .get('/api/admin/terminal/cases')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data).toHaveProperty('cases');
    });

    it('should get markets data', async () => {
      const response = await request(app)
        .get('/api/admin/terminal/markets')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data).toHaveProperty('markets');
    });

    it('should get hedging positions', async () => {
      const response = await request(app)
        .get('/api/admin/terminal/hedging')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data).toHaveProperty('positions');
    });

    it('should get reserves status', async () => {
      const response = await request(app)
        .get('/api/admin/terminal/reserves')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data).toHaveProperty('reserves');
    });

    it('should get orders list', async () => {
      const response = await request(app)
        .get('/api/admin/terminal/orders')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data).toHaveProperty('orders');
    });
  });

  describe('KPI Endpoints', () => {
    it('should get operator KPIs', async () => {
      const response = await request(app)
        .get('/api/admin/terminal/kpis/operator')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data).toHaveProperty('revenue');
    });

    it('should get investor KPIs with redaction', async () => {
      const response = await request(app)
        .get('/api/admin/terminal/kpis/investor')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data).toHaveProperty('totalValue');
    });
  });

  describe('Governance Endpoints', () => {
    it('should get governance status', async () => {
      const response = await request(app)
        .get('/api/admin/terminal/governance')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data).toHaveProperty('toggles');
    });
  });

  describe('Authentication & Authorization', () => {
    it('should require authentication for admin routes', async () => {
      await request(app)
        .get('/api/admin/terminal/cases')
        .expect(401);
    });

    it('should validate JWT tokens', async () => {
      await request(app)
        .get('/api/admin/terminal/cases')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid case ID gracefully', async () => {
      const response = await request(app)
        .get('/api/admin/terminal/cases/invalid-id')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .expect(200);

      expect(response.body.code).toBe('SUCCESS');
    });

    it('should handle malformed requests', async () => {
      await request(app)
        .post('/api/admin/terminal/cases')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send({ invalid: 'data' })
        .expect(200); // Should not crash
    });
  });
});

describe('Admin Terminal Performance', () => {
  it('should respond to health check within 100ms', async () => {
    const start = Date.now();
    
    await request(app)
      .get('/health')
      .expect(200);
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });

  it('should handle concurrent requests', async () => {
    const requests = Array(10).fill(null).map(() =>
      request(app)
        .get('/api/admin/terminal/status')
        .set('Authorization', `Bearer ${mockJwtToken}`)
    );

    const responses = await Promise.all(requests);
    
    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
    });
  });
});
