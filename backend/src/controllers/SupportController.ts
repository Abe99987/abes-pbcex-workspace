import { Request, Response } from 'express';
import { asyncHandler, createError } from '@/middlewares/errorMiddleware';
import { logInfo, logError, logWarn } from '@/utils/logger';
import { USER_ROLES } from '@/utils/constants';

/**
 * UserPayload interface for authenticated user on req.user
 */
export interface UserPayload {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  [key: string]: unknown;
}

/**
 * AuthedRequest type for requests with authenticated user
 */
export type AuthedRequest = Request & { user?: UserPayload };

/**
 * Support Controller for PBCEx Customer Service Module
 * Handles customer service and teller operations
 */

export interface UserDetailView {
  profile: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role: string;
    kycStatus: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    twoFactorEnabled: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
  };
  accounts: Array<{
    id: string;
    type: string;
    balances: Array<{
      asset: string;
      amount: string;
      usdValue: string;
    }>;
    totalUsdValue: string;
  }>;
  kycRecords: Array<{
    id: string;
    type: string;
    status: string;
    submissionData?: Record<string, unknown>; // Filtered sensitive data
    reviewNotes?: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  tradeHistory: Array<{
    id: string;
    fromAsset: string;
    toAsset: string;
    amount: string;
    status: string;
    executedAt?: Date;
    createdAt: Date;
  }>;
  orders: Array<{
    id: string;
    productName: string;
    quantity: number;
    totalPrice: string;
    status: string;
    createdAt: Date;
    shippedAt?: Date;
  }>;
  redemptions: Array<{
    id: string;
    asset: string;
    quantity: number;
    status: string;
    estimatedValue: string;
    createdAt: Date;
    deliveredAt?: Date;
  }>;
  supportTickets: Array<{
    id: string;
    type: string;
    priority: string;
    status: string;
    subject: string;
    createdAt: Date;
    resolvedAt?: Date;
  }>;
}

export interface SupportAction {
  userId: string;
  action: string;
  performedBy: string;
  reason: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export class SupportController {
  /**
   * Check if user has support or teller role
   */
  private static checkSupportRole(req: AuthedRequest): void {
    const userRole = req.user?.role;
    if (
      !userRole ||
      ![USER_ROLES.SUPPORT, USER_ROLES.TELLER, USER_ROLES.ADMIN].includes(
        userRole as typeof USER_ROLES.SUPPORT | typeof USER_ROLES.TELLER | typeof USER_ROLES.ADMIN
      )
    ) {
      throw createError.authorization('Support or Teller access required');
    }
  }

  /**
   * GET /api/support/user/:id
   * Get comprehensive user profile for support
   */
  static getUserProfile = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      SupportController.checkSupportRole(req);

      const { id } = req.params;

      if (!id || !id.match(/^[a-f0-9-]+$/)) {
        throw createError.validation('Invalid user ID format');
      }

      logInfo('Support accessing user profile', {
        userId: id,
        supportUserId: req.user?.id,
        supportRole: req.user?.role,
      });

      try {
        // Mock user detail view - would query actual database
        const userDetail: UserDetailView = {
          profile: {
            id,
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            phone: '555-0123',
            role: USER_ROLES.USER,
            kycStatus: 'APPROVED',
            emailVerified: true,
            phoneVerified: true,
            twoFactorEnabled: false,
            lastLoginAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          accounts: [
            {
              id: 'funding-acc',
              type: 'FUNDING',
              balances: [
                { asset: 'PAXG', amount: '5.25000000', usdValue: '11287.50' },
                { asset: 'USD', amount: '2500.00', usdValue: '2500.00' },
              ],
              totalUsdValue: '13787.50',
            },
            {
              id: 'trading-acc',
              type: 'TRADING',
              balances: [
                { asset: 'XAU-s', amount: '2.15000000', usdValue: '4622.50' },
                { asset: 'XAG-s', amount: '100.00000000', usdValue: '3250.00' },
              ],
              totalUsdValue: '7872.50',
            },
          ],
          kycRecords: [
            {
              id: 'kyc-1',
              type: 'PERSONAL',
              status: 'APPROVED',
              reviewNotes: 'All documents verified successfully',
              createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
            },
          ],
          tradeHistory: [
            {
              id: 'trade-1',
              fromAsset: 'USD',
              toAsset: 'PAXG',
              amount: '2150.00',
              status: 'FILLED',
              executedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          ],
          orders: [],
          redemptions: [],
          supportTickets: [],
        };

        res.json({
          code: 'SUCCESS',
          data: { user: userDetail },
        });
      } catch (error) {
        logError('Failed to get user profile for support', error as Error);
        throw error;
      }
    }
  );

  /**
   * POST /api/support/user/:id/reset-password
   * Reset user password (support action)
   */
  static resetUserPassword = asyncHandler(
    async (
      req: AuthedRequest & { body: { reason?: string; sendEmail?: boolean } },
      res: Response
    ) => {
      SupportController.checkSupportRole(req);

      const { id } = req.params;
      const { reason, sendEmail = true } = req.body;

      if (!id || !id.match(/^[a-f0-9-]+$/)) {
        throw createError.validation('Invalid user ID format');
      }

      if (!reason || reason.trim().length < 10) {
        throw createError.validation(
          'Detailed reason is required for password reset'
        );
      }

      logWarn('Support initiated password reset', {
        targetUserId: id,
        supportUserId: req.user?.id,
        supportRole: req.user?.role,
        reason: reason.substring(0, 100), // Log partial reason
      });

      try {
        // Mock password reset - would implement actual logic
        const temporaryPassword = Math.random().toString(36).slice(-12);

        // Record support action
        const supportAction: SupportAction = {
          userId: id,
          action: 'PASSWORD_RESET',
          performedBy: req.user?.id || 'unknown',
          reason,
          metadata: {
            sendEmail,
            temporaryPasswordLength: temporaryPassword.length,
          },
          timestamp: new Date(),
        };

        // TODO: In real implementation:
        // 1. Generate secure temporary password
        // 2. Hash and update user password
        // 3. Invalidate all existing sessions
        // 4. Send email with temporary password (if requested)
        // 5. Log support action in audit trail
        // 6. Require password change on next login

        res.json({
          code: 'SUCCESS',
          message: 'Password reset completed successfully',
          data: {
            temporaryPasswordSent: sendEmail,
            requiresPasswordChangeOnLogin: true,
          },
        });
      } catch (error) {
        logError('Failed to reset user password', error as Error);
        throw error;
      }
    }
  );

  /**
   * POST /api/support/order/:id/adjust
   * Adjust order status or issue refund
   */
  static adjustOrder = asyncHandler(
    async (
      req: AuthedRequest & {
        body: {
          action?: string;
          newStatus?: string;
          refundAmount?: string;
          reason?: string;
        };
      },
      res: Response
    ) => {
      SupportController.checkSupportRole(req);

      const { id } = req.params;
      const { action, newStatus, refundAmount, reason } = req.body;

      if (!id || !id.match(/^[a-f0-9-]+$/)) {
        throw createError.validation('Invalid order ID format');
      }

      const validActions = [
        'CHANGE_STATUS',
        'ISSUE_REFUND',
        'EXPEDITE_SHIPPING',
        'CANCEL_ORDER',
      ];
      if (!action || !validActions.includes(action)) {
        throw createError.validation(
          `Invalid action. Must be one of: ${validActions.join(', ')}`
        );
      }

      if (!reason || reason.trim().length < 10) {
        throw createError.validation(
          'Detailed reason is required for order adjustment'
        );
      }

      logWarn('Support adjusting order', {
        orderId: id,
        action,
        newStatus,
        refundAmount,
        supportUserId: req.user?.id,
        supportRole: req.user?.role,
        reason: reason.substring(0, 100),
      });

      try {
        // Mock order adjustment - would implement actual logic
        const adjustmentResult = {
          orderId: id,
          previousStatus: 'PROCESSING',
          newStatus: newStatus || 'PROCESSING',
          actionTaken: action,
          refundAmount: refundAmount || '0.00',
          processedAt: new Date(),
        };

        // Record support action
        const supportAction: SupportAction = {
          userId: 'user-from-order', // Would get from order record
          action: `ORDER_${action}`,
          performedBy: req.user?.id || 'unknown',
          reason,
          metadata: {
            orderId: id,
            previousStatus: 'PROCESSING',
            newStatus,
            refundAmount,
          },
          timestamp: new Date(),
        };

        // TODO: In real implementation:
        // 1. Find order and validate ownership
        // 2. Check if action is allowed based on current status
        // 3. Update order status
        // 4. Process refund if requested (via payment processor)
        // 5. Send notifications to customer
        // 6. Log support action in audit trail

        res.json({
          code: 'SUCCESS',
          message: 'Order adjustment completed successfully',
          data: adjustmentResult,
        });
      } catch (error) {
        logError('Failed to adjust order', error as Error);
        throw error;
      }
    }
  );

  /**
   * GET /api/support/search?q=...
   * Search users by email, name, phone, or order ID
   */
  static searchUsers = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      SupportController.checkSupportRole(req);

      const { q, type = 'all', limit = 20 } = req.query;

      const queryQ = typeof q === 'string' ? q : Array.isArray(q) ? q[0] : '';
      const queryType =
        typeof type === 'string' ? type : Array.isArray(type) ? type[0] : 'all';
      const queryLimit =
        typeof limit === 'string'
          ? limit
          : Array.isArray(limit)
            ? limit[0]
            : 20;

             if (!queryQ || typeof queryQ !== 'string' || queryQ.trim().length < 3) {
         throw createError.validation(
           'Search query must be at least 3 characters'
         );
       }

       const searchQuery = queryQ.trim();
      const searchLimit = Math.min(parseInt(queryLimit as string) || 20, 100);

      logInfo('Support user search', {
        query: searchQuery.substring(0, 50), // Log partial query
        type: queryType,
        limit: searchLimit,
        supportUserId: req.user?.id,
        supportRole: req.user?.role,
      });

      try {
        // Mock search results - would implement actual database search
        const mockResults = [
          {
            id: 'user-1',
            email: 'john.doe@example.com',
            name: 'John Doe',
            phone: '555-0123',
            kycStatus: 'APPROVED',
            lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000),
            totalBalance: '21660.00',
            recentActivity: 'Trade 3 days ago',
          },
          {
            id: 'user-2',
            email: 'jane.smith@example.com',
            name: 'Jane Smith',
            phone: '555-0456',
            kycStatus: 'PENDING_REVIEW',
            lastLogin: new Date(Date.now() - 48 * 60 * 60 * 1000),
            totalBalance: '5420.00',
            recentActivity: 'KYC submitted 5 days ago',
          },
        ];

        // Filter results based on search query (mock implementation)
        const filteredResults = mockResults.filter(
          user =>
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.phone.includes(searchQuery)
        );

        res.json({
          code: 'SUCCESS',
          data: {
            results: filteredResults.slice(0, searchLimit),
            total: filteredResults.length,
            query: searchQuery,
          },
        });
      } catch (error) {
        logError('Failed to search users', error as Error);
        throw error;
      }
    }
  );

  /**
   * GET /api/support/dashboard
   * Get support dashboard statistics
   */
  static getDashboard = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      SupportController.checkSupportRole(req);

      logInfo('Loading support dashboard', {
        supportUserId: req.user?.id,
        supportRole: req.user?.role,
      });

      try {
        // Mock dashboard data - would aggregate from database
        const dashboardData = {
          summary: {
            pendingTickets: 23,
            pendingKyc: 15,
            pendingRedemptions: 8,
            pendingOrders: 12,
          },
          recentActivity: [
            {
              id: 'activity-1',
              type: 'KYC_REVIEW',
              user: 'john.doe@example.com',
              action: 'Approved personal KYC',
              performedBy: req.user?.email,
              timestamp: new Date(Date.now() - 30 * 60 * 1000),
            },
            {
              id: 'activity-2',
              type: 'ORDER_ADJUSTMENT',
              user: 'jane.smith@example.com',
              action: 'Expedited shipping for order #12345',
              performedBy: req.user?.email,
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            },
          ],
          metrics: {
            avgResponseTime: '2.4 hours',
            resolutionRate: '94.5%',
            customerSatisfaction: '4.7/5.0',
          },
          quickActions: [
            { action: 'SEARCH_USERS', label: 'Search Users', count: null },
            { action: 'PENDING_KYC', label: 'Review KYC', count: 15 },
            {
              action: 'PENDING_REDEMPTIONS',
              label: 'Process Redemptions',
              count: 8,
            },
            {
              action: 'ESCALATED_TICKETS',
              label: 'Escalated Issues',
              count: 3,
            },
          ],
        };

        res.json({
          code: 'SUCCESS',
          data: dashboardData,
        });
      } catch (error) {
        logError('Failed to load support dashboard', error as Error);
        throw error;
      }
    }
  );

  /**
   * POST /api/support/user/:id/note
   * Add internal note to user account
   */
  static addUserNote = asyncHandler(
    async (
      req: AuthedRequest & {
        body: { note?: string; category?: string; priority?: string };
      },
      res: Response
    ) => {
      SupportController.checkSupportRole(req);

      const { id } = req.params;
      const { note, category = 'GENERAL', priority = 'MEDIUM' } = req.body;

      if (!id || !id.match(/^[a-f0-9-]+$/)) {
        throw createError.validation('Invalid user ID format');
      }

      if (!note || note.trim().length < 5) {
        throw createError.validation('Note must be at least 5 characters');
      }

      const validCategories = [
        'GENERAL',
        'ACCOUNT',
        'KYC',
        'TRADING',
        'SUPPORT',
        'COMPLIANCE',
      ];
      if (!validCategories.includes(category)) {
        throw createError.validation(
          `Invalid category. Must be one of: ${validCategories.join(', ')}`
        );
      }

      logInfo('Support adding user note', {
        userId: id,
        category,
        priority,
        noteLength: note.length,
        supportUserId: req.user?.id,
      });

      try {
        // Mock note creation - would insert into database
        const userNote = {
          id: 'note_' + Math.random().toString(36).substr(2, 9),
          userId: id,
          note: note.trim(),
          category,
          priority,
          addedBy: req.user?.id,
          addedByName:
            `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim(),
          createdAt: new Date(),
        };

        // TODO: In real implementation:
        // 1. Insert note into user_notes table
        // 2. Create audit trail entry
        // 3. Send notification if high priority

        res.status(201).json({
          code: 'SUCCESS',
          message: 'Note added successfully',
          data: { note: userNote },
        });
      } catch (error) {
        logError('Failed to add user note', error as Error);
        throw error;
      }
    }
  );

  /**
   * GET /api/support/audit/:userId
   * Get audit trail for user (admin only)
   */
  static getUserAuditTrail = asyncHandler(
    async (req: AuthedRequest, res: Response) => {
      // Only admins can view audit trails
      if (req.user?.role !== USER_ROLES.ADMIN) {
        throw createError.authorization(
          'Admin access required for audit trails'
        );
      }

      const { userId } = req.params;

      if (!userId || !userId.match(/^[a-f0-9-]+$/)) {
        throw createError.validation('Invalid user ID format');
      }

      logInfo('Admin accessing user audit trail', {
        userId,
        adminUserId: req.user?.id,
      });

      try {
        // Mock audit trail - would query actual database
        const auditTrail = [
          {
            id: 'audit-1',
            userId,
            action: 'PASSWORD_RESET',
            performedBy: 'support-user-1',
            performedByName: 'Support Agent',
            reason: 'User requested password reset via phone call',
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            metadata: { sendEmail: true },
          },
          {
            id: 'audit-2',
            userId,
            action: 'KYC_STATUS_CHANGE',
            performedBy: 'admin-user-1',
            performedByName: 'Admin User',
            reason: 'Manual KYC approval after document review',
            timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            metadata: {
              previousStatus: 'PENDING_REVIEW',
              newStatus: 'APPROVED',
            },
          },
        ];

        res.json({
          code: 'SUCCESS',
          data: {
            auditTrail,
            total: auditTrail.length,
          },
        });
      } catch (error) {
        logError('Failed to get user audit trail', error as Error);
        throw error;
      }
    }
  );
}

export default SupportController;
