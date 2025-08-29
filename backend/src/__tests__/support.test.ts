import request from 'supertest';
import app from '../server';
import { USER_ROLES } from '../utils/constants';

/**
 * Support Controller Tests
 * Tests the Phase-3 Customer Service module with RBAC
 */

describe('Support API', () => {
  // Mock JWT tokens for different roles
  const mockTokens = {
    admin: 'mock-admin-jwt-token',
    support: 'mock-support-jwt-token', 
    teller: 'mock-teller-jwt-token',
    user: 'mock-user-jwt-token',
  };

  const mockUserId = '12345678-1234-1234-1234-123456789012';

  describe('Authentication & Authorization', () => {
    it('should require authentication for all support endpoints', async () => {
      const response = await request(app)
        .get('/api/support/dashboard');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should reject regular users from support endpoints', async () => {
      const response = await request(app)
        .get('/api/support/dashboard')
        .set('Authorization', `Bearer ${mockTokens.user}`);

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('AUTHORIZATION_ERROR');
      expect(response.body.requiredRoles).toContain(USER_ROLES.SUPPORT);
      expect(response.body.requiredRoles).toContain(USER_ROLES.TELLER);
      expect(response.body.requiredRoles).toContain(USER_ROLES.ADMIN);
    });

    it('should allow support role access', async () => {
      const response = await request(app)
        .get('/api/support/dashboard')
        .set('Authorization', `Bearer ${mockTokens.support}`);

      expect(response.status).not.toBe(403);
    });

    it('should allow teller role access', async () => {
      const response = await request(app)
        .get('/api/support/dashboard')
        .set('Authorization', `Bearer ${mockTokens.teller}`);

      expect(response.status).not.toBe(403);
    });

    it('should allow admin role access', async () => {
      const response = await request(app)
        .get('/api/support/dashboard')
        .set('Authorization', `Bearer ${mockTokens.admin}`);

      expect(response.status).not.toBe(403);
    });
  });

  describe('Support Dashboard', () => {
    it('should return dashboard statistics for authorized users', async () => {
      const response = await request(app)
        .get('/api/support/dashboard')
        .set('Authorization', `Bearer ${mockTokens.support}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data).toMatchObject({
        summary: expect.objectContaining({
          pendingTickets: expect.any(Number),
          pendingKyc: expect.any(Number),
          pendingRedemptions: expect.any(Number),
          pendingOrders: expect.any(Number),
        }),
        recentActivity: expect.any(Array),
        metrics: expect.objectContaining({
          avgResponseTime: expect.any(String),
          resolutionRate: expect.any(String),
          customerSatisfaction: expect.any(String),
        }),
        quickActions: expect.any(Array),
      });
    });

    it('should include recent activity in dashboard', async () => {
      const response = await request(app)
        .get('/api/support/dashboard')
        .set('Authorization', `Bearer ${mockTokens.support}`);

      expect(response.status).toBe(200);
      expect(response.body.data.recentActivity).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            type: expect.any(String),
            user: expect.any(String),
            action: expect.any(String),
            performedBy: expect.any(String),
            timestamp: expect.any(String),
          })
        ])
      );
    });
  });

  describe('User Search', () => {
    it('should search users by query', async () => {
      const response = await request(app)
        .get('/api/support/search')
        .set('Authorization', `Bearer ${mockTokens.support}`)
        .query({ q: 'john.doe' });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data).toMatchObject({
        results: expect.any(Array),
        total: expect.any(Number),
        query: 'john.doe',
      });
    });

    it('should reject search queries that are too short', async () => {
      const response = await request(app)
        .get('/api/support/search')
        .set('Authorization', `Bearer ${mockTokens.support}`)
        .query({ q: 'ab' }); // Only 2 characters

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.message).toMatch(/3 characters/);
    });

    it('should respect search result limits', async () => {
      const response = await request(app)
        .get('/api/support/search')
        .set('Authorization', `Bearer ${mockTokens.support}`)
        .query({ q: 'test', limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.data.results.length).toBeLessThanOrEqual(5);
    });

    it('should enforce maximum search limit', async () => {
      const response = await request(app)
        .get('/api/support/search')
        .set('Authorization', `Bearer ${mockTokens.support}`)
        .query({ q: 'test', limit: 1000 }); // Over maximum

      expect(response.status).toBe(200);
      expect(response.body.data.results.length).toBeLessThanOrEqual(100);
    });
  });

  describe('User Profile Access', () => {
    it('should return comprehensive user profile for support', async () => {
      const response = await request(app)
        .get(`/api/support/user/${mockUserId}`)
        .set('Authorization', `Bearer ${mockTokens.support}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.user).toMatchObject({
        profile: expect.objectContaining({
          id: expect.any(String),
          email: expect.any(String),
          role: expect.any(String),
          kycStatus: expect.any(String),
          emailVerified: expect.any(Boolean),
          phoneVerified: expect.any(Boolean),
          createdAt: expect.any(String),
        }),
        accounts: expect.any(Array),
        kycRecords: expect.any(Array),
        tradeHistory: expect.any(Array),
        orders: expect.any(Array),
        redemptions: expect.any(Array),
        supportTickets: expect.any(Array),
      });
    });

    it('should reject invalid user ID format', async () => {
      const response = await request(app)
        .get('/api/support/user/invalid-id')
        .set('Authorization', `Bearer ${mockTokens.support}`);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.message).toMatch(/Invalid user ID format/);
    });

    it('should include account balances in user profile', async () => {
      const response = await request(app)
        .get(`/api/support/user/${mockUserId}`)
        .set('Authorization', `Bearer ${mockTokens.support}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.accounts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            type: expect.any(String),
            balances: expect.arrayContaining([
              expect.objectContaining({
                asset: expect.any(String),
                amount: expect.any(String),
                usdValue: expect.any(String),
              })
            ]),
            totalUsdValue: expect.any(String),
          })
        ])
      );
    });
  });

  describe('Password Reset', () => {
    it('should allow support to reset user password with valid reason', async () => {
      const response = await request(app)
        .post(`/api/support/user/${mockUserId}/reset-password`)
        .set('Authorization', `Bearer ${mockTokens.support}`)
        .send({
          reason: 'User called support requesting password reset due to forgotten password',
          sendEmail: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data).toMatchObject({
        temporaryPasswordSent: true,
        requiresPasswordChangeOnLogin: true,
      });
    });

    it('should reject password reset without sufficient reason', async () => {
      const response = await request(app)
        .post(`/api/support/user/${mockUserId}/reset-password`)
        .set('Authorization', `Bearer ${mockTokens.support}`)
        .send({
          reason: 'short', // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.message).toMatch(/10 characters/);
    });

    it('should handle email sending preference', async () => {
      const response = await request(app)
        .post(`/api/support/user/${mockUserId}/reset-password`)
        .set('Authorization', `Bearer ${mockTokens.support}`)
        .send({
          reason: 'User requested password reset via phone call verification',
          sendEmail: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.temporaryPasswordSent).toBe(false);
    });
  });

  describe('Order Adjustments', () => {
    const mockOrderId = '87654321-4321-4321-4321-210987654321';

    it('should allow support to adjust order status', async () => {
      const response = await request(app)
        .post(`/api/support/order/${mockOrderId}/adjust`)
        .set('Authorization', `Bearer ${mockTokens.support}`)
        .send({
          action: 'CHANGE_STATUS',
          newStatus: 'EXPEDITED',
          reason: 'Customer requested expedited processing due to urgent need',
        });

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data).toMatchObject({
        orderId: mockOrderId,
        actionTaken: 'CHANGE_STATUS',
        processedAt: expect.any(String),
      });
    });

    it('should allow support to issue refunds', async () => {
      const response = await request(app)
        .post(`/api/support/order/${mockOrderId}/adjust`)
        .set('Authorization', `Bearer ${mockTokens.support}`)
        .send({
          action: 'ISSUE_REFUND',
          refundAmount: '1500.00',
          reason: 'Product quality issue reported by customer, issuing full refund',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.refundAmount).toBe('1500.00');
    });

    it('should reject invalid adjustment actions', async () => {
      const response = await request(app)
        .post(`/api/support/order/${mockOrderId}/adjust`)
        .set('Authorization', `Bearer ${mockTokens.support}`)
        .send({
          action: 'INVALID_ACTION',
          reason: 'This is a valid reason but invalid action',
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should require detailed reason for order adjustments', async () => {
      const response = await request(app)
        .post(`/api/support/order/${mockOrderId}/adjust`)
        .set('Authorization', `Bearer ${mockTokens.support}`)
        .send({
          action: 'CANCEL_ORDER',
          reason: 'short', // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/10 characters/);
    });
  });

  describe('User Notes', () => {
    it('should allow support to add user notes', async () => {
      const response = await request(app)
        .post(`/api/support/user/${mockUserId}/note`)
        .set('Authorization', `Bearer ${mockTokens.support}`)
        .send({
          note: 'User called regarding account verification process. Provided additional documentation via email.',
          category: 'KYC',
          priority: 'MEDIUM',
        });

      expect(response.status).toBe(201);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.note).toMatchObject({
        id: expect.any(String),
        userId: mockUserId,
        note: expect.any(String),
        category: 'KYC',
        priority: 'MEDIUM',
        addedBy: expect.any(String),
        createdAt: expect.any(String),
      });
    });

    it('should reject notes that are too short', async () => {
      const response = await request(app)
        .post(`/api/support/user/${mockUserId}/note`)
        .set('Authorization', `Bearer ${mockTokens.support}`)
        .send({
          note: 'Hi', // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.message).toMatch(/5 characters/);
    });

    it('should use default values for optional fields', async () => {
      const response = await request(app)
        .post(`/api/support/user/${mockUserId}/note`)
        .set('Authorization', `Bearer ${mockTokens.support}`)
        .send({
          note: 'Simple user interaction note without explicit category or priority',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.note.category).toBe('GENERAL');
      expect(response.body.data.note.priority).toBe('MEDIUM');
    });

    it('should validate note categories', async () => {
      const response = await request(app)
        .post(`/api/support/user/${mockUserId}/note`)
        .set('Authorization', `Bearer ${mockTokens.support}`)
        .send({
          note: 'Valid note with invalid category',
          category: 'INVALID_CATEGORY',
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Audit Trail Access', () => {
    it('should allow admin to view user audit trail', async () => {
      const response = await request(app)
        .get(`/api/support/audit/${mockUserId}`)
        .set('Authorization', `Bearer ${mockTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data).toMatchObject({
        auditTrail: expect.any(Array),
        total: expect.any(Number),
      });
    });

    it('should reject audit trail access for non-admin users', async () => {
      const response = await request(app)
        .get(`/api/support/audit/${mockUserId}`)
        .set('Authorization', `Bearer ${mockTokens.support}`);

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('AUTHORIZATION_ERROR');
    });

    it('should reject audit trail access for teller users', async () => {
      const response = await request(app)
        .get(`/api/support/audit/${mockUserId}`)
        .set('Authorization', `Bearer ${mockTokens.teller}`);

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('AUTHORIZATION_ERROR');
    });

    it('should include detailed audit information', async () => {
      const response = await request(app)
        .get(`/api/support/audit/${mockUserId}`)
        .set('Authorization', `Bearer ${mockTokens.admin}`);

      expect(response.status).toBe(200);
      if (response.body.data.auditTrail.length > 0) {
        expect(response.body.data.auditTrail[0]).toMatchObject({
          id: expect.any(String),
          userId: mockUserId,
          action: expect.any(String),
          performedBy: expect.any(String),
          performedByName: expect.any(String),
          reason: expect.any(String),
          timestamp: expect.any(String),
        });
      }
    });
  });

  describe('Support Statistics', () => {
    it('should return support stats for admin users', async () => {
      const response = await request(app)
        .get('/api/support/stats')
        .set('Authorization', `Bearer ${mockTokens.admin}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data).toMatchObject({
        team: expect.objectContaining({
          totalSupportAgents: expect.any(Number),
          totalTellers: expect.any(Number),
          activeToday: expect.any(Number),
        }),
        tickets: expect.objectContaining({
          totalOpen: expect.any(Number),
          totalClosed: expect.any(Number),
          escalated: expect.any(Number),
        }),
        actions: expect.objectContaining({
          passwordResets: expect.any(Number),
          orderAdjustments: expect.any(Number),
          kycApprovals: expect.any(Number),
        }),
        satisfaction: expect.objectContaining({
          rating: expect.any(Number),
          responses: expect.any(Number),
          nps: expect.any(Number),
        }),
      });
    });

    it('should reject stats access for non-admin users', async () => {
      const response = await request(app)
        .get('/api/support/stats')
        .set('Authorization', `Bearer ${mockTokens.support}`);

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('AUTHORIZATION_ERROR');
    });
  });

  describe('Ticket System Stubs', () => {
    it('should return empty tickets list (future feature)', async () => {
      const response = await request(app)
        .get('/api/support/tickets')
        .set('Authorization', `Bearer ${mockTokens.support}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe('SUCCESS');
      expect(response.body.data.tickets).toEqual([]);
      expect(response.body.data.message).toMatch(/not yet implemented/);
    });

    it('should return 501 for ticket creation (future feature)', async () => {
      const response = await request(app)
        .post('/api/support/tickets')
        .set('Authorization', `Bearer ${mockTokens.support}`)
        .send({
          subject: 'Test ticket',
          description: 'Test description',
          priority: 'MEDIUM',
        });

      expect(response.status).toBe(501);
      expect(response.body.code).toBe('SERVICE_UNAVAILABLE');
      expect(response.body.message).toMatch(/not yet implemented/);
    });
  });

  describe('Input Validation', () => {
    it('should validate UUID format for user IDs', async () => {
      const invalidIds = [
        'not-a-uuid',
        '12345',
        'abcd-efgh-ijkl-mnop-qrst',
        '',
      ];

      for (const invalidId of invalidIds) {
        const response = await request(app)
          .get(`/api/support/user/${invalidId}`)
          .set('Authorization', `Bearer ${mockTokens.support}`);

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should validate order adjustment request format', async () => {
      const mockOrderId = '87654321-4321-4321-4321-210987654321';
      
      const invalidRequests = [
        {}, // Missing required fields
        { action: 'INVALID' }, // Invalid action
        { action: 'CHANGE_STATUS' }, // Missing reason
        { action: 'ISSUE_REFUND', refundAmount: 'invalid' }, // Invalid amount
      ];

      for (const invalidRequest of invalidRequests) {
        const response = await request(app)
          .post(`/api/support/order/${mockOrderId}/adjust`)
          .set('Authorization', `Bearer ${mockTokens.support}`)
          .send(invalidRequest);

        expect(response.status).toBe(400);
        expect(response.body.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should sanitize and validate note inputs', async () => {
      const response = await request(app)
        .post(`/api/support/user/${mockUserId}/note`)
        .set('Authorization', `Bearer ${mockTokens.support}`)
        .send({
          note: '   Valid note with whitespace   ', // Should be trimmed
          category: 'ACCOUNT',
          priority: 'HIGH',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.note.note).toBe('Valid note with whitespace');
    });
  });
});

// Test helper functions
export const supportTestHelpers = {
  createMockUserProfile: (overrides = {}) => ({
    profile: {
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: USER_ROLES.USER,
      kycStatus: 'APPROVED',
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date().toISOString(),
    },
    accounts: [],
    kycRecords: [],
    tradeHistory: [],
    orders: [],
    redemptions: [],
    supportTickets: [],
    ...overrides,
  }),

  createMockSupportNote: (overrides = {}) => ({
    note: 'Test support note for user interaction',
    category: 'GENERAL',
    priority: 'MEDIUM',
    ...overrides,
  }),

  createMockOrderAdjustment: (overrides = {}) => ({
    action: 'CHANGE_STATUS',
    newStatus: 'PROCESSING',
    reason: 'Customer requested status update due to delivery concerns',
    ...overrides,
  }),

  expectUserProfileResponse: (profile: any) => {
    expect(profile).toMatchObject({
      profile: expect.objectContaining({
        id: expect.any(String),
        email: expect.any(String),
        role: expect.any(String),
        kycStatus: expect.any(String),
      }),
      accounts: expect.any(Array),
      kycRecords: expect.any(Array),
      tradeHistory: expect.any(Array),
    });
  },

  expectSupportStatsResponse: (stats: any) => {
    expect(stats).toMatchObject({
      team: expect.objectContaining({
        totalSupportAgents: expect.any(Number),
        totalTellers: expect.any(Number),
      }),
      tickets: expect.objectContaining({
        totalOpen: expect.any(Number),
        totalClosed: expect.any(Number),
      }),
      actions: expect.objectContaining({
        passwordResets: expect.any(Number),
        orderAdjustments: expect.any(Number),
      }),
    });
  },

  withRole: async (role: string, testFn: () => Promise<void>) => {
    // Helper to run tests with specific role context
    const mockToken = `mock-${role}-jwt-token`;
    await testFn();
  },
};
