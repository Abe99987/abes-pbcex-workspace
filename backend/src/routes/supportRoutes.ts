import { Router } from 'express';
import { asyncHandler, createError } from '@/middlewares/errorMiddleware';
import { authenticate, authorize } from '@/middlewares/authMiddleware';
import { validateBody, validateQuery } from '@/utils/validators';
import SupportController from '@/controllers/SupportController';
import { USER_ROLES } from '@/utils/constants';
import { z } from 'zod';

const router = Router();

// All support routes require authentication
router.use(authenticate);

// Support role middleware
const requireSupportRole = (req: any, res: any, next: any) => {
  const userRole = req.user?.role;
  if (!userRole || ![USER_ROLES.SUPPORT, USER_ROLES.TELLER, USER_ROLES.ADMIN].includes(userRole)) {
    return res.status(403).json({
      code: 'AUTHORIZATION_ERROR',
      message: 'Support, Teller, or Admin access required',
      requiredRoles: [USER_ROLES.SUPPORT, USER_ROLES.TELLER, USER_ROLES.ADMIN],
      userRole: userRole,
    });
  }
  next();
};

// Apply support role requirement to all routes
router.use(requireSupportRole);

// Validation schemas
const passwordResetSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason too long'),
  sendEmail: z.boolean().default(true),
});

const orderAdjustmentSchema = z.object({
  action: z.enum(['CHANGE_STATUS', 'ISSUE_REFUND', 'EXPEDITE_SHIPPING', 'CANCEL_ORDER']),
  newStatus: z.string().optional(),
  refundAmount: z.string().regex(/^\d+\.?\d*$/, 'Invalid refund amount').optional(),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason too long'),
});

const userNoteSchema = z.object({
  note: z.string().min(5, 'Note must be at least 5 characters').max(1000, 'Note too long'),
  category: z.enum(['GENERAL', 'ACCOUNT', 'KYC', 'TRADING', 'SUPPORT', 'COMPLIANCE']).default('GENERAL'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

const searchQuerySchema = z.object({
  q: z.string().min(3, 'Search query must be at least 3 characters').max(100, 'Search query too long'),
  type: z.enum(['all', 'email', 'name', 'phone', 'order']).default('all'),
  limit: z.string().transform(val => Math.min(parseInt(val) || 20, 100)).optional(),
});

/**
 * GET /api/support/dashboard
 * Get support dashboard with key metrics and pending items
 */
router.get('/dashboard', SupportController.getDashboard);

/**
 * GET /api/support/search
 * Search users by email, name, phone, or order ID
 */
router.get('/search',
  validateQuery(searchQuerySchema),
  SupportController.searchUsers
);

/**
 * GET /api/support/user/:id
 * Get comprehensive user profile for support
 */
router.get('/user/:id',
  SupportController.getUserProfile
);

/**
 * POST /api/support/user/:id/reset-password
 * Reset user password (support action)
 */
router.post('/user/:id/reset-password',
  validateBody(passwordResetSchema),
  SupportController.resetUserPassword
);

/**
 * POST /api/support/user/:id/note
 * Add internal note to user account
 */
router.post('/user/:id/note',
  validateBody(userNoteSchema),
  SupportController.addUserNote
);

/**
 * POST /api/support/order/:id/adjust
 * Adjust order status or issue refund
 */
router.post('/order/:id/adjust',
  validateBody(orderAdjustmentSchema),
  SupportController.adjustOrder
);

/**
 * GET /api/support/audit/:userId (Admin only)
 * Get audit trail for user actions
 */
router.get('/audit/:userId',
  authorize(USER_ROLES.ADMIN),
  SupportController.getUserAuditTrail
);

/**
 * GET /api/support/tickets (Future expansion)
 * Get support tickets assigned to current user
 */
router.get('/tickets',
  asyncHandler(async (req, res) => {
    // Stub for future ticket system
    res.json({
      code: 'SUCCESS',
      data: {
        tickets: [],
        total: 0,
        message: 'Ticket system not yet implemented',
      },
    });
  })
);

/**
 * POST /api/support/tickets (Future expansion)
 * Create internal support ticket
 */
router.post('/tickets',
  asyncHandler(async (req, res) => {
    // Stub for future ticket system
    res.status(501).json({
      code: 'SERVICE_UNAVAILABLE',
      message: 'Ticket creation system not yet implemented',
    });
  })
);

/**
 * GET /api/support/stats
 * Get support team statistics
 */
router.get('/stats',
  authorize(USER_ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    // Mock support statistics
    const stats = {
      team: {
        totalSupportAgents: 12,
        totalTellers: 8,
        activeToday: 18,
        averageResponseTime: '2.4 hours',
      },
      tickets: {
        totalOpen: 45,
        totalClosed: 234,
        escalated: 7,
        avgResolutionTime: '4.2 hours',
      },
      actions: {
        passwordResets: 23,
        orderAdjustments: 15,
        kycApprovals: 8,
        accountActions: 12,
      },
      satisfaction: {
        rating: 4.7,
        responses: 156,
        nps: 68,
      },
    };

    res.json({
      code: 'SUCCESS',
      data: stats,
    });
  })
);

export default router;
