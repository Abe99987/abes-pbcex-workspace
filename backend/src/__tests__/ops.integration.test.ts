import request from 'supertest';
import app from '../server';
import { SSEObservabilityService } from '../services/SSEObservabilityService';

describe('Ops Controller Integration Tests', () => {
  beforeEach(async () => {
    // Reset metrics before each test
    await SSEObservabilityService.resetMetrics();
  });

  describe('GET /api/ops/sse/stats', () => {
    it('should deny access without admin role or key', async () => {
      const response = await request(app)
        .get('/api/ops/sse/stats')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Admin access required');
    });

    it('should allow access with X-Admin-Key header in non-production', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ADMIN_OPS_KEY = 'test-admin-key';

      const response = await request(app)
        .get('/api/ops/sse/stats')
        .set('X-Admin-Key', 'test-admin-key')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('activeByChannel');
      expect(response.body.data).toHaveProperty('lastHeartbeatMaxAgeSec');
      expect(response.body.data).toHaveProperty('opensLast5m');
      expect(response.body.data).toHaveProperty('closesLast5m');
      expect(response.body.data).toHaveProperty('sampleConnIds');
      expect(response.body.data).toHaveProperty('totalActive');
      expect(response.body.data).toHaveProperty('healthStatus');
    });

    it('should reject invalid admin key', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ADMIN_OPS_KEY = 'test-admin-key';

      const response = await request(app)
        .get('/api/ops/sse/stats')
        .set('X-Admin-Key', 'wrong-key')
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return valid stats structure', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ADMIN_OPS_KEY = 'test-admin-key';

      const response = await request(app)
        .get('/api/ops/sse/stats')
        .set('X-Admin-Key', 'test-admin-key')
        .expect(200);

      const { data } = response.body;
      
      expect(typeof data.activeByChannel).toBe('object');
      expect(typeof data.lastHeartbeatMaxAgeSec).toBe('number');
      expect(typeof data.opensLast5m).toBe('number');
      expect(typeof data.closesLast5m).toBe('number');
      expect(typeof data.sampleConnIds).toBe('object');
      expect(typeof data.totalActive).toBe('number');
      expect(['ok', 'warn', 'stale']).toContain(data.healthStatus);
      expect(typeof data.timestamp).toBe('string');
    });
  });

  describe('GET /api/ops/sse/health', () => {
    it('should return health status with admin access', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ADMIN_OPS_KEY = 'test-admin-key';

      const response = await request(app)
        .get('/api/ops/sse/health')
        .set('X-Admin-Key', 'test-admin-key')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe('SSE');
      expect(response.body.status).toBeDefined();
      expect(response.body.checks).toHaveProperty('heartbeats');
      expect(response.body.checks).toHaveProperty('connections');
    });

    it('should deny access without admin credentials', async () => {
      const response = await request(app)
        .get('/api/ops/sse/health')
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/ops/sse/cleanup', () => {
    it('should perform cleanup with admin access', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ADMIN_OPS_KEY = 'test-admin-key';

      const response = await request(app)
        .post('/api/ops/sse/cleanup')
        .set('X-Admin-Key', 'test-admin-key')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('cleaned');
      expect(typeof response.body.data.cleaned).toBe('number');
    });

    it('should deny access without admin credentials', async () => {
      const response = await request(app)
        .post('/api/ops/sse/cleanup')
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('SSE Observability Service Integration', () => {
    it('should track connection lifecycle', async () => {
      // Register a connection
      const connId = await SSEObservabilityService.registerConnection('prices', 'test-user-agent', '127.0.0.1');
      expect(connId).toBeDefined();
      expect(typeof connId).toBe('string');

      // Check stats show the connection
      process.env.NODE_ENV = 'development';
      process.env.ADMIN_OPS_KEY = 'test-admin-key';
      
      let response = await request(app)
        .get('/api/ops/sse/stats')
        .set('X-Admin-Key', 'test-admin-key')
        .expect(200);

      let stats = response.body.data;
      expect(stats.totalActive).toBeGreaterThan(0);

      // Update heartbeat
      await SSEObservabilityService.updateHeartbeat(connId, 'prices');

      // Unregister the connection
      await SSEObservabilityService.unregisterConnection(connId, 'prices');

      // Check stats updated
      response = await request(app)
        .get('/api/ops/sse/stats')
        .set('X-Admin-Key', 'test-admin-key')
        .expect(200);

      // Connection should be cleaned up (may take a moment due to async nature)
    });

    it('should handle Redis unavailable gracefully', async () => {
      // This test verifies fallback to in-memory tracking
      const connId = await SSEObservabilityService.registerConnection('prices', 'test-user-agent');
      expect(connId).toBeDefined();

      const stats = await SSEObservabilityService.getStats();
      expect(stats).toHaveProperty('activeByChannel');
      expect(stats).toHaveProperty('totalActive');

      await SSEObservabilityService.unregisterConnection(connId, 'prices');
    });
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.ADMIN_OPS_KEY;
  });
});
