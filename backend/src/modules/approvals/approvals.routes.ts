import { Router } from 'express';
import { ApprovalsController } from './approvals.controller';
import { authenticate, requireAdmin } from '@/middlewares/authMiddleware';
import { requireApproverRole } from './approvals.middleware';
import { validateBody, validateQuery } from '@/utils/validators';
import { z } from 'zod';

/**
 * Admin Terminal Approvals Routes
 * Dual-approval workflow management endpoints
 */
const router = Router();

// All approval routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/approvals
 * List approval requests with optional filters
 */
router.get('/',
  validateQuery(z.object({
    status: z.enum(['pending', 'approved', 'denied', 'expired']).optional(),
    requesterUserId: z.string().optional(),
    resourceType: z.string().optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    offset: z.string().regex(/^\d+$/).optional(),
  })),
  ApprovalsController.listRequests
);

/**
 * GET /api/admin/approvals/pending
 * Get pending approval requests for current user
 */
router.get('/pending', ApprovalsController.getPendingForUser);

/**
 * GET /api/admin/approvals/rules
 * Get approval rules configuration
 */
router.get('/rules', ApprovalsController.getRules);

/**
 * GET /api/admin/approvals/check/:resourceType/:action
 * Check if approval is required for operation
 */
router.get('/check/:resourceType/:action', ApprovalsController.checkRequirement);

/**
 * POST /api/admin/approvals/cleanup
 * Cleanup expired approval requests
 */
router.post('/cleanup', ApprovalsController.cleanupExpired);

/**
 * GET /api/admin/approvals/:id
 * Get specific approval request
 */
router.get('/:id', ApprovalsController.getRequest);

/**
 * POST /api/admin/approvals/:id/approve
 * Approve a pending request
 */
router.post('/:id/approve',
  validateBody(z.object({
    reason: z.string().optional(),
    step_up_id: z.string().optional(),
  })),
  ApprovalsController.approveRequest
);

/**
 * POST /api/admin/approvals/:id/deny
 * Deny a pending request
 */
router.post('/:id/deny',
  validateBody(z.object({
    reason: z.string().min(1, 'Reason is required for denial'),
  })),
  ApprovalsController.denyRequest
);

export default router;
