import { test, expect } from '@playwright/test';
import { TestHelpers, TestDataGenerator, E2EAssertions } from '../utils/test-helpers';

/**
 * Customer Support E2E Tests
 * 
 * Tests the customer support module including:
 * - Support dashboard and user search
 * - User profile management
 * - Password reset operations
 * - Order adjustments
 * - Role-based access control (SUPPORT vs TELLER)
 * - Feature flag validation (Phase 3 requirement)
 */

test.describe('Customer Support Module', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Feature Flag Validation', () => {
    test('should block access when Phase < 3', async ({ page }) => {
      // Mock Phase 1 or 2
      await page.addInitScript(() => {
        window.localStorage.setItem('mockPhase', '1');
      });

      await helpers.loginAs('support');
      
      // Try to access support dashboard
      await page.goto('/support/dashboard');

      // Should show feature not available
      await expect(page.locator('[data-testid="feature-not-available"]')).toBeVisible();
      await expect(page.locator('[data-testid="phase-requirement"]')).toContainText('Phase 3');
      await expect(page.locator('[data-testid="current-phase"]')).toContainText('1');
      
      // Should redirect or show upgrade notice
      await expect(page.locator('[data-testid="upgrade-notice"]')).toContainText('contact administrator');
    });

    test('should allow access when Phase = 3', async ({ page }) => {
      // Mock Phase 3
      await page.addInitScript(() => {
        window.localStorage.setItem('mockPhase', '3');
      });

      await helpers.loginAs('support');
      await helpers.navigateToSection('support');

      // Should show support dashboard
      await expect(page.locator('[data-testid="support-dashboard"]')).toBeVisible();
      await expect(page.locator('h1')).toContainText('Customer Support');
    });
  });

  test.describe('Support Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      // Ensure Phase 3 is enabled
      await page.addInitScript(() => {
        window.localStorage.setItem('mockPhase', '3');
      });
      await helpers.loginAs('support');
    });

    test('should display support dashboard', async ({ page }) => {
      await helpers.navigateToSection('support');

      // Verify dashboard loaded
      await expect(page.locator('h1')).toContainText('Customer Support');
      await expect(page.locator('[data-testid="support-dashboard"]')).toBeVisible();

      // Check dashboard sections
      await expect(page.locator('[data-testid="user-search"]')).toBeVisible();
      await expect(page.locator('[data-testid="recent-tickets"]')).toBeVisible();
      await expect(page.locator('[data-testid="support-stats"]')).toBeVisible();

      // Check support statistics
      await expect(page.locator('[data-testid="active-tickets"]')).toBeVisible();
      await expect(page.locator('[data-testid="resolved-today"]')).toBeVisible();
      await expect(page.locator('[data-testid="avg-response-time"]')).toBeVisible();
    });

    test('should search for users', async ({ page }) => {
      await helpers.navigateToSection('support');

      // Search for user by email
      const searchEmail = 'e2euser@example.com';
      const userId = await helpers.searchUser(searchEmail);

      // Verify search results
      expect(userId).toBeTruthy();
      
      const userResult = page.locator('[data-testid="user-search-result"]');
      await expect(userResult.locator('[data-testid="user-email"]')).toContainText(searchEmail);
      await expect(userResult.locator('[data-testid="user-name"]')).toBeVisible();
      await expect(userResult.locator('[data-testid="user-status"]')).toBeVisible();
      await expect(userResult.locator('[data-testid="kyc-status"]')).toBeVisible();
    });

    test('should search users by different criteria', async ({ page }) => {
      await helpers.navigateToSection('support');

      // Search by partial email
      await page.fill('[data-testid="user-search"]', 'e2e');
      await page.click('[data-testid="search-button"]');
      await helpers.waitForLoader();

      const results = page.locator('[data-testid="user-search-result"]');
      await expect(results).toHaveCountGreaterThan(0);

      // Search by name
      await page.fill('[data-testid="user-search"]', 'John');
      await page.selectOption('[data-testid="search-type"]', 'name');
      await page.click('[data-testid="search-button"]');
      await helpers.waitForLoader();

      // Should show users with name John
      const nameResults = page.locator('[data-testid="user-search-result"]');
      const resultCount = await nameResults.count();
      
      for (let i = 0; i < resultCount; i++) {
        const userName = await nameResults.nth(i).locator('[data-testid="user-name"]').textContent();
        expect(userName?.toLowerCase()).toContain('john');
      }
    });

    test('should handle no search results', async ({ page }) => {
      await helpers.navigateToSection('support');

      // Search for non-existent user
      await page.fill('[data-testid="user-search"]', 'nonexistent@example.com');
      await page.click('[data-testid="search-button"]');
      await helpers.waitForLoader();

      // Should show no results message
      await expect(page.locator('[data-testid="no-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="no-results"]')).toContainText('No users found');
      
      // Should show search suggestions
      await expect(page.locator('[data-testid="search-suggestions"]')).toBeVisible();
    });

    test('should display recent support tickets', async ({ page }) => {
      await helpers.navigateToSection('support');

      // Check recent tickets section
      const tickets = page.locator('[data-testid="recent-ticket"]');
      
      if (await tickets.count() > 0) {
        const firstTicket = tickets.first();
        
        await expect(firstTicket.locator('[data-testid="ticket-id"]')).toBeVisible();
        await expect(firstTicket.locator('[data-testid="ticket-subject"]')).toBeVisible();
        await expect(firstTicket.locator('[data-testid="ticket-priority"]')).toBeVisible();
        await expect(firstTicket.locator('[data-testid="ticket-status"]')).toBeVisible();
        await expect(firstTicket.locator('[data-testid="ticket-assigned"]')).toBeVisible();
        
        // Timestamps should be valid
        const createdAt = await firstTicket.locator('[data-testid="ticket-created"]').getAttribute('datetime');
        if (createdAt) {
          E2EAssertions.expectTimestamp(createdAt);
        }
      } else {
        // Should show empty state
        await expect(page.locator('[data-testid="no-recent-tickets"]')).toBeVisible();
      }
    });
  });

  test.describe('User Profile Management', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem('mockPhase', '3');
      });
      await helpers.loginAs('support');
    });

    test('should display user profile details', async ({ page }) => {
      const userId = await helpers.searchUser('e2euser@example.com');
      await page.goto(`/support/user/${userId}`);

      // Verify user profile page
      await expect(page.locator('h1')).toContainText('User Profile');
      await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();

      // Check profile sections
      await expect(page.locator('[data-testid="personal-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="account-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="kyc-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();

      // Check personal information
      await expect(page.locator('[data-testid="user-email"]')).toContainText('e2euser@example.com');
      await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="registration-date"]')).toBeVisible();
      await expect(page.locator('[data-testid="last-login"]')).toBeVisible();

      // Check account summary
      await expect(page.locator('[data-testid="total-balance"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-trades"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-orders"]')).toBeVisible();
    });

    test('should show user balances and positions', async ({ page }) => {
      const userId = await helpers.searchUser('e2euser@example.com');
      await page.goto(`/support/user/${userId}`);

      // Check balances section
      await expect(page.locator('[data-testid="user-balances"]')).toBeVisible();
      
      const balanceEntries = page.locator('[data-testid="balance-entry"]');
      const balanceCount = await balanceEntries.count();

      if (balanceCount > 0) {
        for (let i = 0; i < balanceCount; i++) {
          const balance = balanceEntries.nth(i);
          
          await expect(balance.locator('[data-testid="asset-symbol"]')).toBeVisible();
          await expect(balance.locator('[data-testid="balance-amount"]')).toBeVisible();
          
          // Balance should be properly formatted
          const balanceText = await balance.locator('[data-testid="balance-amount"]').textContent();
          expect(balanceText).toMatch(/^\d+\.\d{2,8}$/);
        }
      } else {
        await expect(page.locator('[data-testid="no-balances"]')).toContainText('No balances');
      }
    });

    test('should display user trading history', async ({ page }) => {
      const userId = await helpers.searchUser('e2euser@example.com');
      await page.goto(`/support/user/${userId}`);

      // Navigate to trading tab
      await page.click('[data-testid="tab-trading"]');

      // Check trading history
      await expect(page.locator('[data-testid="trading-history"]')).toBeVisible();
      
      const trades = page.locator('[data-testid="trade-entry"]');
      const tradeCount = await trades.count();

      if (tradeCount > 0) {
        const firstTrade = trades.first();
        
        await expect(firstTrade.locator('[data-testid="trade-asset"]')).toBeVisible();
        await expect(firstTrade.locator('[data-testid="trade-side"]')).toBeVisible();
        await expect(firstTrade.locator('[data-testid="trade-quantity"]')).toBeVisible();
        await expect(firstTrade.locator('[data-testid="trade-price"]')).toBeVisible();
        await expect(firstTrade.locator('[data-testid="trade-date"]')).toBeVisible();
      }
    });

    test('should show KYC status and documents', async ({ page }) => {
      const userId = await helpers.searchUser('e2euser@example.com');
      await page.goto(`/support/user/${userId}`);

      // Navigate to KYC tab
      await page.click('[data-testid="tab-kyc"]');

      // Check KYC information
      await expect(page.locator('[data-testid="kyc-status-display"]')).toBeVisible();
      await expect(page.locator('[data-testid="kyc-submission-date"]')).toBeVisible();

      const kycStatus = await page.locator('[data-testid="kyc-status-display"]').textContent();
      
      if (kycStatus === 'APPROVED') {
        await expect(page.locator('[data-testid="approval-date"]')).toBeVisible();
        await expect(page.locator('[data-testid="approved-by"]')).toBeVisible();
      } else if (kycStatus === 'REJECTED') {
        await expect(page.locator('[data-testid="rejection-reason"]')).toBeVisible();
        await expect(page.locator('[data-testid="rejection-notes"]')).toBeVisible();
      }

      // Should show document list
      await expect(page.locator('[data-testid="kyc-documents"]')).toBeVisible();
    });
  });

  test.describe('Password Reset Operations', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem('mockPhase', '3');
      });
      await helpers.loginAs('support');
    });

    test('should reset user password', async ({ page }) => {
      const userId = await helpers.searchUser('e2euser@example.com');
      
      await helpers.resetUserPassword(userId, 'User locked out of account');

      // Verify password reset success
      await helpers.waitForToast('success');
      await expect(page.locator('[data-testid="password-reset-success"]')).toContainText('Password reset successfully');
      
      // Should show temporary password notice
      await expect(page.locator('[data-testid="temp-password-notice"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-expiry"]')).toContainText('24 hours');
      
      // Should log the action for audit
      await expect(page.locator('[data-testid="action-logged"]')).toContainText('Action logged for audit');
    });

    test('should validate reset reason', async ({ page }) => {
      const userId = await helpers.searchUser('e2euser@example.com');
      await page.goto(`/support/user/${userId}`);

      // Try to reset without reason
      await page.click('[data-testid="reset-password-button"]');
      await page.click('[data-testid="confirm-password-reset"]');

      // Should show validation error
      await expect(page.locator('[data-testid="error-reset-reason"]')).toContainText('Reset reason is required');
    });

    test('should track password reset history', async ({ page }) => {
      const userId = await helpers.searchUser('e2euser@example.com');
      await page.goto(`/support/user/${userId}`);

      // Navigate to audit tab
      await page.click('[data-testid="tab-audit"]');

      // Check audit log
      await expect(page.locator('[data-testid="audit-log"]')).toBeVisible();
      
      const auditEntries = page.locator('[data-testid="audit-entry"]');
      
      if (await auditEntries.count() > 0) {
        const firstEntry = auditEntries.first();
        
        await expect(firstEntry.locator('[data-testid="audit-action"]')).toBeVisible();
        await expect(firstEntry.locator('[data-testid="audit-timestamp"]')).toBeVisible();
        await expect(firstEntry.locator('[data-testid="audit-performed-by"]')).toBeVisible();
      }
    });

    test('should send password reset notification', async ({ page }) => {
      const userId = await helpers.searchUser('e2euser@example.com');
      
      await helpers.resetUserPassword(userId, 'Account recovery request');

      // Should show notification options
      await expect(page.locator('[data-testid="notification-sent"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-notification"]')).toContainText('Email sent');
      
      // Should offer SMS notification option
      await expect(page.locator('[data-testid="send-sms-button"]')).toBeVisible();
    });
  });

  test.describe('Order Adjustments', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem('mockPhase', '3');
      });
      await helpers.loginAs('support');
    });

    test('should display user orders', async ({ page }) => {
      const userId = await helpers.searchUser('e2euser@example.com');
      await page.goto(`/support/user/${userId}`);

      // Navigate to orders tab
      await page.click('[data-testid="tab-orders"]');

      // Check orders list
      await expect(page.locator('[data-testid="user-orders"]')).toBeVisible();
      
      const orders = page.locator('[data-testid="order-entry"]');
      
      if (await orders.count() > 0) {
        const firstOrder = orders.first();
        
        await expect(firstOrder.locator('[data-testid="order-id"]')).toBeVisible();
        await expect(firstOrder.locator('[data-testid="order-status"]')).toBeVisible();
        await expect(firstOrder.locator('[data-testid="order-total"]')).toBeVisible();
        await expect(firstOrder.locator('[data-testid="order-date"]')).toBeVisible();
        
        // Should have adjust order button for eligible orders
        const orderStatus = await firstOrder.locator('[data-testid="order-status"]').textContent();
        
        if (orderStatus === 'PROCESSING' || orderStatus === 'CONFIRMED') {
          await expect(firstOrder.locator('[data-testid="adjust-order-button"]')).toBeVisible();
        }
      }
    });

    test('should adjust order details', async ({ page }) => {
      const userId = await helpers.searchUser('e2euser@example.com');
      await page.goto(`/support/user/${userId}`);
      
      await page.click('[data-testid="tab-orders"]');
      
      // Click adjust on first eligible order
      const orders = page.locator('[data-testid="order-entry"]');
      
      if (await orders.count() > 0) {
        await orders.first().locator('[data-testid="adjust-order-button"]').click();
        
        // Should show adjustment modal
        await helpers.waitForModal('order-adjustment');
        
        // Check adjustment options
        await expect(page.locator('[data-testid="adjust-status"]')).toBeVisible();
        await expect(page.locator('[data-testid="adjust-shipping"]')).toBeVisible();
        await expect(page.locator('[data-testid="add-refund"]')).toBeVisible();
        
        // Make adjustment
        await page.selectOption('[data-testid="new-status"]', 'EXPEDITED');
        await page.fill('[data-testid="adjustment-reason"]', 'Customer requested expedited shipping');
        
        await page.click('[data-testid="apply-adjustment"]');
        
        await helpers.waitForToast('success');
        await expect(page.locator('[data-testid="adjustment-applied"]')).toContainText('Order adjusted successfully');
      }
    });

    test('should process refunds', async ({ page }) => {
      const userId = await helpers.searchUser('e2euser@example.com');
      await page.goto(`/support/user/${userId}`);
      
      await page.click('[data-testid="tab-orders"]');
      
      const orders = page.locator('[data-testid="order-entry"]');
      
      if (await orders.count() > 0) {
        await orders.first().locator('[data-testid="adjust-order-button"]').click();
        await helpers.waitForModal('order-adjustment');
        
        // Process refund
        await page.click('[data-testid="process-refund-tab"]');
        await page.fill('[data-testid="refund-amount"]', '100.00');
        await page.selectOption('[data-testid="refund-reason"]', 'DAMAGED_GOODS');
        await page.fill('[data-testid="refund-notes"]', 'Item arrived damaged');
        
        await page.click('[data-testid="process-refund"]');
        
        // Should require confirmation
        await page.click('[data-testid="confirm-refund"]');
        
        await helpers.waitForToast('success');
        await expect(page.locator('[data-testid="refund-processed"]')).toContainText('Refund processed');
        
        // Should show refund reference
        await expect(page.locator('[data-testid="refund-reference"]')).toBeVisible();
      }
    });

    test('should validate adjustment permissions', async ({ page }) => {
      // Login as different role (TELLER vs SUPPORT)
      await helpers.logout();
      await helpers.loginAs('teller');
      
      const userId = await helpers.searchUser('e2euser@example.com');
      await page.goto(`/support/user/${userId}`);
      
      // Tellers might have different permissions
      const hasDifferentPermissions = await page.locator('[data-testid="limited-permissions"]').isVisible();
      
      if (hasDifferentPermissions) {
        // Some adjustment options might be restricted
        await expect(page.locator('[data-testid="permission-notice"]')).toContainText('limited permissions');
      }
    });
  });

  test.describe('Role-Based Access Control', () => {
    test('should enforce SUPPORT role permissions', async ({ page }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem('mockPhase', '3');
      });
      await helpers.loginAs('support');

      // Support user should have access to support dashboard
      await helpers.navigateToSection('support');
      await expect(page.locator('[data-testid="support-dashboard"]')).toBeVisible();

      // Should have user search capabilities
      await expect(page.locator('[data-testid="user-search"]')).toBeVisible();
      
      // Should be able to reset passwords
      await expect(page.locator('[data-testid="password-reset-permissions"]')).toBeVisible();
      
      // Should have limited order adjustment permissions
      const userId = await helpers.searchUser('e2euser@example.com');
      await page.goto(`/support/user/${userId}`);
      
      await expect(page.locator('[data-testid="adjust-orders-permission"]')).toBeVisible();
    });

    test('should enforce TELLER role permissions', async ({ page }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem('mockPhase', '3');
      });
      await helpers.loginAs('teller');

      // Teller should have access to teller dashboard
      await page.goto('/teller/dashboard');
      await expect(page.locator('[data-testid="teller-dashboard"]')).toBeVisible();

      // Teller might have different capabilities than support
      await expect(page.locator('[data-testid="branch-operations"]')).toBeVisible();
      await expect(page.locator('[data-testid="customer-service"]')).toBeVisible();
      
      // Should be able to access user profiles
      const userId = await helpers.searchUser('e2euser@example.com');
      await page.goto(`/teller/user/${userId}`);
      
      await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    });

    test('should block access for insufficient role', async ({ page }) => {
      // Login as regular user
      await helpers.loginAs('user');

      // Try to access support dashboard
      await page.goto('/support/dashboard');

      // Should be blocked
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
      await expect(page.locator('[data-testid="insufficient-permissions"]')).toContainText('support access');
      
      // Should redirect to appropriate page
      await helpers.expectUrl('/dashboard');
    });

    test('should allow ADMIN to bypass role restrictions', async ({ page }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem('mockPhase', '3');
      });
      await helpers.loginAs('admin');

      // Admin should have access to all support functions
      await helpers.navigateToSection('support');
      await expect(page.locator('[data-testid="support-dashboard"]')).toBeVisible();
      
      // Should show admin privileges notice
      await expect(page.locator('[data-testid="admin-privileges"]')).toContainText('Administrator access');
      
      // Should have all permissions
      await expect(page.locator('[data-testid="admin-all-permissions"]')).toBeVisible();
    });
  });

  test.describe('Audit and Compliance', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem('mockPhase', '3');
      });
      await helpers.loginAs('support');
    });

    test('should log all support actions', async ({ page }) => {
      const userId = await helpers.searchUser('e2euser@example.com');
      
      // Perform several actions
      await helpers.resetUserPassword(userId, 'Account recovery');
      await page.goto(`/support/user/${userId}`);
      await page.click('[data-testid="tab-orders"]');
      
      // Check audit log
      await page.goto('/support/audit');
      
      await expect(page.locator('[data-testid="audit-log"]')).toBeVisible();
      
      const auditEntries = page.locator('[data-testid="audit-entry"]');
      const entryCount = await auditEntries.count();
      
      expect(entryCount).toBeGreaterThan(0);
      
      // Check audit entry details
      const firstEntry = auditEntries.first();
      await expect(firstEntry.locator('[data-testid="action-type"]')).toBeVisible();
      await expect(firstEntry.locator('[data-testid="target-user"]')).toBeVisible();
      await expect(firstEntry.locator('[data-testid="performed-by"]')).toBeVisible();
      await expect(firstEntry.locator('[data-testid="timestamp"]')).toBeVisible();
      await expect(firstEntry.locator('[data-testid="ip-address"]')).toBeVisible();
    });

    test('should track session activities', async ({ page }) => {
      await page.goto('/support/dashboard');
      
      // Navigate through different sections
      await helpers.searchUser('e2euser@example.com');
      
      // Check session log
      await page.goto('/support/session-log');
      
      await expect(page.locator('[data-testid="session-activities"]')).toBeVisible();
      
      const activities = page.locator('[data-testid="session-activity"]');
      
      if (await activities.count() > 0) {
        const firstActivity = activities.first();
        
        await expect(firstActivity.locator('[data-testid="activity-type"]')).toBeVisible();
        await expect(firstActivity.locator('[data-testid="activity-timestamp"]')).toBeVisible();
        await expect(firstActivity.locator('[data-testid="activity-details"]')).toBeVisible();
      }
    });

    test('should generate compliance reports', async ({ page }) => {
      await page.goto('/support/reports');
      
      // Generate support activity report
      await page.selectOption('[data-testid="report-type"]', 'SUPPORT_ACTIVITY');
      await page.fill('[data-testid="date-from"]', '2024-01-01');
      await page.fill('[data-testid="date-to"]', '2024-01-31');
      
      await page.click('[data-testid="generate-report"]');
      
      await helpers.waitForLoader();
      
      // Should show report preview
      await expect(page.locator('[data-testid="report-preview"]')).toBeVisible();
      await expect(page.locator('[data-testid="report-summary"]')).toBeVisible();
      
      // Should allow download
      await expect(page.locator('[data-testid="download-csv"]')).toBeVisible();
      await expect(page.locator('[data-testid="download-pdf"]')).toBeVisible();
    });
  });

  test.describe('Performance and Usability', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem('mockPhase', '3');
      });
      await helpers.loginAs('support');
    });

    test('should load support dashboard quickly', async ({ page }) => {
      const loadTime = await helpers.measurePageLoad('/support/dashboard');
      
      expect(loadTime).toBeLessThan(3000);
      console.log(`Support dashboard loaded in ${loadTime}ms`);
    });

    test('should perform user search efficiently', async ({ page }) => {
      await helpers.navigateToSection('support');
      
      const searchTime = await helpers.measureActionTime(async () => {
        await helpers.searchUser('e2euser@example.com');
      });
      
      expect(searchTime).toBeLessThan(1500);
      console.log(`User search completed in ${searchTime}ms`);
    });

    test('should handle large user lists efficiently', async ({ page }) => {
      await helpers.navigateToSection('support');
      
      // Search for common term that returns many results
      await page.fill('[data-testid="user-search"]', 'example.com');
      await page.click('[data-testid="search-button"]');
      
      await helpers.waitForLoader();
      
      // Should show pagination for large result sets
      await expect(page.locator('[data-testid="search-pagination"]')).toBeVisible();
      await expect(page.locator('[data-testid="results-count"]')).toBeVisible();
      
      // Should be able to navigate through pages
      if (await page.locator('[data-testid="next-page"]').isEnabled()) {
        await page.click('[data-testid="next-page"]');
        await helpers.waitForLoader();
        await expect(page.locator('[data-testid="page-indicator"]')).toContainText('Page 2');
      }
    });

    test('should provide keyboard shortcuts for common actions', async ({ page }) => {
      await helpers.navigateToSection('support');
      
      // Ctrl+K should focus search
      await page.keyboard.press('Control+k');
      await expect(page.locator('[data-testid="user-search"]')).toBeFocused();
      
      // ESC should clear search
      await page.fill('[data-testid="user-search"]', 'test');
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="user-search"]')).toHaveValue('');
    });

    test('should be responsive on different screen sizes', async ({ page }) => {
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await helpers.navigateToSection('support');
      
      await expect(page.locator('[data-testid="tablet-support-layout"]')).toBeVisible();
      await expect(page.locator('[data-testid="collapsible-sidebar"]')).toBeVisible();
      
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await expect(page.locator('[data-testid="mobile-support-layout"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        window.localStorage.setItem('mockPhase', '3');
      });
      await helpers.loginAs('support');
    });

    test('should handle API failures gracefully', async ({ page }) => {
      // Mock API failure
      await page.route('/api/support/search', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({
            code: 'SEARCH_SERVICE_ERROR',
            message: 'Search service temporarily unavailable'
          })
        });
      });

      await helpers.navigateToSection('support');
      
      await page.fill('[data-testid="user-search"]', 'test');
      await page.click('[data-testid="search-button"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="search-error"]')).toContainText('Search service temporarily unavailable');
      
      // Should offer retry option
      await expect(page.locator('[data-testid="retry-search"]')).toBeVisible();
    });

    test('should handle session timeouts', async ({ page }) => {
      await helpers.navigateToSection('support');
      
      // Mock session timeout
      await page.route('/api/support/**', route => {
        route.fulfill({
          status: 401,
          body: JSON.stringify({
            code: 'SESSION_EXPIRED',
            message: 'Your session has expired'
          })
        });
      });
      
      await page.fill('[data-testid="user-search"]', 'test');
      await page.click('[data-testid="search-button"]');
      
      // Should redirect to login with session expired message
      await expect(page.locator('[data-testid="session-expired-notice"]')).toBeVisible();
      await helpers.expectUrl('/auth/login');
    });

    test('should preserve work during network interruptions', async ({ page }) => {
      const userId = await helpers.searchUser('e2euser@example.com');
      await page.goto(`/support/user/${userId}`);
      
      // Start filling adjustment form
      await page.click('[data-testid="tab-orders"]');
      
      if (await page.locator('[data-testid="adjust-order-button"]').isVisible()) {
        await page.click('[data-testid="adjust-order-button"]');
        await helpers.waitForModal('order-adjustment');
        
        await page.fill('[data-testid="adjustment-reason"]', 'Customer complaint - partially filled');
        
        // Simulate network interruption
        await page.setOffline(true);
        
        await page.click('[data-testid="apply-adjustment"]');
        
        // Should show offline notice
        await expect(page.locator('[data-testid="offline-notice"]')).toBeVisible();
        await expect(page.locator('[data-testid="data-saved-locally"]')).toContainText('saved locally');
        
        // Restore network
        await page.setOffline(false);
        
        // Should sync changes when online
        await expect(page.locator('[data-testid="syncing-changes"]')).toBeVisible();
        await helpers.waitForToast('success');
      }
    });
  });
});
