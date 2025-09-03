import { Router } from 'express';
import { AuditController } from './audit.controller';
import { authenticate, requireAdmin } from '@/middlewares/authMiddleware';
import { requireRole, requirePermission } from '@/modules/rbac';
import { AdminRole } from '@/modules/rbac/rbac.service';
import { validateBody, validateQuery } from '@/utils/validators';
import { z } from 'zod';

/**
 * Admin Terminal Audit Routes
 * Provides audit log management and verification endpoints
 */
const router = Router();

// All audit routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * POST /api/admin/audit/append
 * Manually append audit entry (super admin only)
 */
router.post('/append',
  requireRole(AdminRole.SUPER_ADMIN),
  requirePermission('audit', 'write'),
  validateBody(z.object({
    action: z.string().min(1, 'Action is required'),
    resource: z.object({
      type: z.string().min(1, 'Resource type is required'),
      id: z.string().min(1, 'Resource ID is required'),
      name: z.string().optional(),
    }),
    details: z.record(z.any()).optional(),
    outcome: z.enum(['success', 'failure', 'partial']).optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  })),
  AuditController.appendEntry
);

/**
 * GET /api/admin/audit/search
 * Search audit entries with filters
 */
router.get('/search',
  requirePermission('audit', 'read'),
  validateQuery(z.object({
    userId: z.string().optional(),
    action: z.string().optional(),
    resourceType: z.string().optional(),
    resourceId: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    outcome: z.enum(['success', 'failure', 'partial']).optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    offset: z.string().regex(/^\d+$/).optional(),
  })),
  AuditController.searchEntries
);

/**
 * GET /api/admin/audit/verify
 * Verify audit chain integrity
 */
router.get('/verify',
  requirePermission('audit', 'read'),
  AuditController.verifyChain
);

/**
 * GET /api/admin/audit/:id
 * Get specific audit entry by ID
 */
router.get('/:id',
  requirePermission('audit', 'read'),
  AuditController.getEntry
);

export default router;
