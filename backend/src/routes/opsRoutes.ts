import express from 'express';
import OpsController from '@/controllers/OpsController';

const router = express.Router();

/**
 * Operations routes for admin monitoring and diagnostics
 * All routes require admin authentication
 */

// SSE observability endpoints
router.get('/sse/stats', ...OpsController.getSSEStats);
router.get('/sse/health', ...OpsController.getSSEHealth);
router.post('/sse/cleanup', ...OpsController.cleanupSSEConnections);

// Idempotency monitoring endpoints
router.get('/idem/stats', ...OpsController.getIdempotencyStats);
router.get('/idem/samples', ...OpsController.getIdempotencySamples);
router.post('/idem/test', ...OpsController.testIdempotency);

export default router;
