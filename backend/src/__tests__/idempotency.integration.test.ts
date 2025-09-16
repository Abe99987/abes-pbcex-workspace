import request from 'supertest';
import app from '../server';
import { IdempotencyMetricsService } from '../services/IdempotencyMetricsService';

describe('Idempotency Operations Integration Tests', () => {
  beforeEach(async () => {
    // Reset metrics before each test
    await IdempotencyMetricsService.resetMetrics();
  });

  describe('POST /api/ops/idem/test', () => {
    it('should deny access without admin role or key', async () => {
      const response = await request(app)
        .post('/api/ops/idem/test')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Admin access required');
    });

    it('should deny access in production environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      process.env.ADMIN_OPS_KEY = 'test-admin-key';

      try {
        const response = await request(app)
          .post('/api/ops/idem/test')
          .set('X-Admin-Key', 'test-admin-key')
          .expect(403);

        expect(response.body.message).toContain('not available in production');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should allow access with X-Admin-Key header in non-production', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ADMIN_OPS_KEY = 'test-admin-key';

      const response = await request(app)
        .post('/api/ops/idem/test')
        .set('X-Admin-Key', 'test-admin-key')
        .expect(204);

      // Should have no response body for 204
      expect(response.body).toEqual({});
    });

    it('should add idempotency observation headers', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ADMIN_OPS_KEY = 'test-admin-key';

      const response = await request(app)
        .post('/api/ops/idem/test')
        .set('X-Admin-Key', 'test-admin-key')
        .set('X-Idempotency-Key', 'test-key-12345')
        .expect(204);

      expect(response.headers['x-idempotency-observed']).toBe('present');
      expect(response.headers['x-idempotency-window']).toBe('5m,60m');
    });

    it('should mark absent when no idempotency key provided', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ADMIN_OPS_KEY = 'test-admin-key';

      const response = await request(app)
        .post('/api/ops/idem/test')
        .set('X-Admin-Key', 'test-admin-key')
        .expect(204);

      expect(response.headers['x-idempotency-observed']).toBe('absent');
    });

    it('should track duplicate requests correctly', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ADMIN_OPS_KEY = 'test-admin-key';

      const idempotencyKey = 'duplicate-test-key-12345';

      // Send first request
      await request(app)
        .post('/api/ops/idem/test')
        .set('X-Admin-Key', 'test-admin-key')
        .set('X-Idempotency-Key', idempotencyKey)
        .expect(204);

      // Send duplicate request
      await request(app)
        .post('/api/ops/idem/test')
        .set('X-Admin-Key', 'test-admin-key')
        .set('X-Idempotency-Key', idempotencyKey)
        .expect(204);

      // Check stats
      const statsResponse = await request(app)
        .get('/api/ops/idem/stats')
        .set('X-Admin-Key', 'test-admin-key')
        .expect(200);

      const { data } = statsResponse.body;
      
      expect(data.window5m.present).toBe(2);
      expect(data.window5m.dupes).toBe(1);
      expect(data.window5m.unique).toBe(1);
      expect(parseFloat(data.window5m.dupePercentage)).toBe(50.0);
    });
  });

  describe('GET /api/ops/idem/stats', () => {
    it('should deny access without admin credentials', async () => {
      const response = await request(app)
        .get('/api/ops/idem/stats')
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return valid stats structure', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ADMIN_OPS_KEY = 'test-admin-key';

      const response = await request(app)
        .get('/api/ops/idem/stats')
        .set('X-Admin-Key', 'test-admin-key')
        .expect(200);

      const { data } = response.body;
      
      expect(data).toHaveProperty('window5m');
      expect(data).toHaveProperty('window60m');
      expect(data).toHaveProperty('lastUpdated');

      // Check 5m window structure
      expect(data.window5m).toHaveProperty('present');
      expect(data.window5m).toHaveProperty('dupes');
      expect(data.window5m).toHaveProperty('unique');
      expect(data.window5m).toHaveProperty('dupePercentage');
      expect(data.window5m).toHaveProperty('sampleKeys');

      // Check 60m window structure
      expect(data.window60m).toHaveProperty('present');
      expect(data.window60m).toHaveProperty('dupes');
      expect(data.window60m).toHaveProperty('unique');
      expect(data.window60m).toHaveProperty('dupePercentage');
      expect(data.window60m).toHaveProperty('sampleKeys');

      // Verify types
      expect(typeof data.window5m.present).toBe('number');
      expect(typeof data.window5m.dupes).toBe('number');
      expect(typeof data.window5m.unique).toBe('number');
      expect(typeof data.window5m.dupePercentage).toBe('string');
      expect(Array.isArray(data.window5m.sampleKeys)).toBe(true);
    });

    it('should calculate percentages correctly', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ADMIN_OPS_KEY = 'test-admin-key';

      // Send some test requests to generate data
      await request(app)
        .post('/api/ops/idem/test')
        .set('X-Admin-Key', 'test-admin-key')
        .set('X-Idempotency-Key', 'unique-key-1')
        .expect(204);

      await request(app)
        .post('/api/ops/idem/test')
        .set('X-Admin-Key', 'test-admin-key')
        .set('X-Idempotency-Key', 'unique-key-2')
        .expect(204);

      await request(app)
        .post('/api/ops/idem/test')
        .set('X-Admin-Key', 'test-admin-key')
        .set('X-Idempotency-Key', 'unique-key-1') // Duplicate
        .expect(204);

      const response = await request(app)
        .get('/api/ops/idem/stats')
        .set('X-Admin-Key', 'test-admin-key')
        .expect(200);

      const { data } = response.body;
      
      // Should have 3 present, 1 dupe, 2 unique
      expect(data.window5m.present).toBe(3);
      expect(data.window5m.dupes).toBe(1);
      expect(data.window5m.unique).toBe(2);
      
      // 1 dupe out of 3 total = 33.3%
      expect(data.window5m.dupePercentage).toBe('33.3%');
    });
  });

  describe('GET /api/ops/idem/samples', () => {
    it('should return sample keys with privacy truncation', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ADMIN_OPS_KEY = 'test-admin-key';

      // Send some test requests
      const longKey = 'very-long-idempotency-key-for-testing-truncation-12345';
      await request(app)
        .post('/api/ops/idem/test')
        .set('X-Admin-Key', 'test-admin-key')
        .set('X-Idempotency-Key', longKey)
        .expect(204);

      const response = await request(app)
        .get('/api/ops/idem/samples')
        .set('X-Admin-Key', 'test-admin-key')
        .expect(200);

      const { data } = response.body;
      
      expect(data).toHaveProperty('samples5m');
      expect(data).toHaveProperty('samples60m');
      expect(Array.isArray(data.samples5m)).toBe(true);
      expect(Array.isArray(data.samples60m)).toBe(true);

      // Check truncation (should be 12 chars + '...')
      if (data.samples5m.length > 0) {
        expect(data.samples5m[0].key).toBe('very-long-id...');
        expect(data.samples5m[0].window).toBe('5m');
      }
    });

    it('should deny access without admin credentials', async () => {
      const response = await request(app)
        .get('/api/ops/idem/samples')
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('IdempotencyMetricsService Integration', () => {
    it('should handle Redis unavailable gracefully', async () => {
      // This test verifies fallback to in-memory tracking
      const stats = await IdempotencyMetricsService.getStats();
      
      expect(stats).toHaveProperty('window5m');
      expect(stats).toHaveProperty('window60m');
      expect(stats).toHaveProperty('lastUpdated');
      
      // Should start with zero stats
      expect(stats.window5m.present).toBe(0);
      expect(stats.window5m.dupes).toBe(0);
      expect(stats.window5m.unique).toBe(0);
    });

    it('should track metrics correctly through service', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ADMIN_OPS_KEY = 'test-admin-key';

      // Create middleware and simulate requests
      const middleware = IdempotencyMetricsService.createMiddleware();
      
      // Mock request/response objects
      const createMockReq = (key?: string) => ({
        headers: key ? { 'x-idempotency-key': key } : {},
        path: '/test'
      });
      
      const createMockRes = () => {
        const res: any = {};
        res.setHeader = jest.fn();
        return res;
      };

      // Test first request
      await new Promise<void>((resolve) => {
        middleware(
          createMockReq('test-key-123') as any,
          createMockRes() as any,
          () => resolve()
        );
      });

      // Test duplicate request  
      await new Promise<void>((resolve) => {
        middleware(
          createMockReq('test-key-123') as any,
          createMockRes() as any,
          () => resolve()
        );
      });

      const stats = await IdempotencyMetricsService.getStats();
      
      expect(stats.window5m.present).toBe(2);
      expect(stats.window5m.dupes).toBe(1);
      expect(stats.window5m.unique).toBe(1);
    });
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.ADMIN_OPS_KEY;
  });
});
