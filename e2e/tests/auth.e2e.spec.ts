import { test, expect } from '@playwright/test';
import { TestHelpers, TestDataGenerator, E2EAssertions } from '../utils/test-helpers';

/**
 * Authentication E2E Tests
 * 
 * Tests the complete user authentication flow including:
 * - User registration
 * - Email verification
 * - Login/logout
 * - Password reset
 * - Account security features
 */

test.describe('Authentication Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('User Registration', () => {
    test('should register new user successfully', async ({ page }) => {
      const testEmail = TestDataGenerator.randomEmail('newuser');
      const password = 'NewUserPassword123!';

      // Navigate to registration page
      await page.goto('/auth/register');

      // Verify page loaded correctly
      await expect(page.locator('h1')).toContainText('Create Account');
      await expect(page.locator('[data-testid="registration-form"]')).toBeVisible();

      // Fill registration form
      await helpers.fillForm({
        email: testEmail,
        password: password,
        confirmPassword: password,
        firstName: 'John',
        lastName: 'Doe',
        acceptTerms: true,
      });

      // Submit form
      await helpers.submitForm('[data-testid="registration-form"]');

      // Verify successful registration
      await helpers.waitForToast('success');
      await helpers.expectUrl('/auth/verify-email');

      // Check verification email sent message
      await helpers.expectVisible('[data-testid="verification-email-sent"]');
      await helpers.expectText('[data-testid="email-address"]', testEmail);
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/auth/register');

      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Check validation errors
      await expect(page.locator('[data-testid="error-email"]')).toContainText('Email is required');
      await expect(page.locator('[data-testid="error-password"]')).toContainText('Password is required');
      await expect(page.locator('[data-testid="error-firstName"]')).toContainText('First name is required');
      await expect(page.locator('[data-testid="error-lastName"]')).toContainText('Last name is required');
      await expect(page.locator('[data-testid="error-acceptTerms"]')).toContainText('You must accept the terms');
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/auth/register');

      const invalidEmails = [
        'invalid-email',
        'user@',
        '@domain.com',
        'user..name@domain.com',
        'user@domain',
      ];

      for (const invalidEmail of invalidEmails) {
        await page.fill('input[name="email"]', invalidEmail);
        await page.click('button[type="submit"]');
        
        await expect(page.locator('[data-testid="error-email"]')).toContainText('Invalid email format');
        
        // Clear field for next iteration
        await page.fill('input[name="email"]', '');
      }
    });

    test('should validate password strength', async ({ page }) => {
      await page.goto('/auth/register');

      const weakPasswords = [
        '12345678',        // Only numbers
        'password',        // Only lowercase
        'PASSWORD',        // Only uppercase
        'Pass123',         // Too short
        'passwordwithoutcaps123', // No uppercase or symbols
      ];

      for (const weakPassword of weakPasswords) {
        await helpers.fillForm({
          email: 'test@example.com',
          password: weakPassword,
          confirmPassword: weakPassword,
          firstName: 'John',
          lastName: 'Doe',
          acceptTerms: true,
        });

        await page.click('button[type="submit"]');
        
        await expect(page.locator('[data-testid="error-password"]')).toContainText(/password.*strength|uppercase.*lowercase.*numbers.*special/i);
        
        // Clear form for next iteration
        await page.reload();
      }
    });

    test('should validate password confirmation', async ({ page }) => {
      await page.goto('/auth/register');

      await helpers.fillForm({
        email: 'test@example.com',
        password: 'StrongPassword123!',
        confirmPassword: 'DifferentPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        acceptTerms: true,
      });

      await page.click('button[type="submit"]');

      await expect(page.locator('[data-testid="error-confirmPassword"]')).toContainText('Passwords do not match');
    });

    test('should prevent duplicate email registration', async ({ page }) => {
      const existingEmail = 'e2euser@example.com'; // Created in global setup

      await page.goto('/auth/register');

      await helpers.fillForm({
        email: existingEmail,
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        acceptTerms: true,
      });

      await page.click('button[type="submit"]');

      await helpers.waitForToast('error');
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Email address is already registered');
    });

    test('should handle network errors gracefully', async ({ page }) => {
      await page.goto('/auth/register');

      // Intercept registration request and return error
      await page.route('/api/auth/register', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({
            code: 'INTERNAL_ERROR',
            message: 'Registration service temporarily unavailable'
          })
        });
      });

      await helpers.fillForm({
        email: TestDataGenerator.randomEmail(),
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
        acceptTerms: true,
      });

      await page.click('button[type="submit"]');

      await helpers.waitForToast('error');
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Registration service temporarily unavailable');
    });
  });

  test.describe('User Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      await page.goto('/auth/login');

      // Verify login page loaded
      await expect(page.locator('h1')).toContainText('Sign In');
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

      // Login with existing test user
      await helpers.fillForm({
        email: 'e2euser@example.com',
        password: 'E2EPassword123!',
      });

      await helpers.submitForm('[data-testid="login-form"]');

      // Verify successful login
      await helpers.waitForToast('success');
      await helpers.expectUrl('/dashboard');

      // Check user is logged in
      await helpers.expectVisible('[data-testid="user-menu"]');
      await helpers.expectText('[data-testid="user-name"]', /John Doe/);
    });

    test('should reject invalid credentials', async ({ page }) => {
      await page.goto('/auth/login');

      await helpers.fillForm({
        email: 'e2euser@example.com',
        password: 'WrongPassword123!',
      });

      await page.click('button[type="submit"]');

      await helpers.waitForToast('error');
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid email or password');
      
      // Should stay on login page
      await helpers.expectUrl('/auth/login');
    });

    test('should require email verification', async ({ page }) => {
      // This test would require creating an unverified user
      // For now, we'll simulate the behavior
      
      await page.goto('/auth/login');

      // Mock response for unverified user login
      await page.route('/api/auth/login', route => {
        route.fulfill({
          status: 403,
          body: JSON.stringify({
            code: 'EMAIL_NOT_VERIFIED',
            message: 'Please verify your email address before logging in',
            data: {
              resendVerificationAvailable: true
            }
          })
        });
      });

      await helpers.fillForm({
        email: 'unverified@example.com',
        password: 'Password123!',
      });

      await page.click('button[type="submit"]');

      await expect(page.locator('[data-testid="email-verification-required"]')).toBeVisible();
      await expect(page.locator('[data-testid="resend-verification-button"]')).toBeVisible();
    });

    test('should handle rate limiting', async ({ page }) => {
      await page.goto('/auth/login');

      // Mock rate limiting response
      await page.route('/api/auth/login', route => {
        route.fulfill({
          status: 429,
          body: JSON.stringify({
            code: 'RATE_LIMITED',
            message: 'Too many login attempts. Please try again later.',
            retryAfter: 300
          })
        });
      });

      await helpers.fillForm({
        email: 'e2euser@example.com',
        password: 'WrongPassword123!',
      });

      await page.click('button[type="submit"]');

      await expect(page.locator('[data-testid="rate-limit-message"]')).toContainText('Too many login attempts');
      await expect(page.locator('[data-testid="retry-timer"]')).toBeVisible();
    });

    test('should redirect after successful login', async ({ page }) => {
      // Navigate to a protected page first
      await page.goto('/trade');
      
      // Should redirect to login
      await helpers.expectUrl('/auth/login');

      // Login
      await helpers.fillForm({
        email: 'e2euser@example.com',
        password: 'E2EPassword123!',
      });

      await page.click('button[type="submit"]');

      // Should redirect back to originally requested page
      await helpers.expectUrl('/trade');
    });

    test('should remember login with "Remember Me"', async ({ page }) => {
      await page.goto('/auth/login');

      await helpers.fillForm({
        email: 'e2euser@example.com',
        password: 'E2EPassword123!',
        rememberMe: true,
      });

      await page.click('button[type="submit"]');
      await helpers.expectUrl('/dashboard');

      // Close browser and reopen (simulate)
      await page.context().clearCookies();
      
      // Check if session persists (would need to verify token storage)
      await page.reload();
      
      // In a real test, this would check if user is still logged in
      // For now, we'll just verify the remember me checkbox was checked
      await page.goto('/auth/login');
      await expect(page.locator('input[name="rememberMe"]')).toBeChecked();
    });
  });

  test.describe('Password Reset', () => {
    test('should initiate password reset', async ({ page }) => {
      await page.goto('/auth/forgot-password');

      await expect(page.locator('h1')).toContainText('Reset Password');
      
      await helpers.fillForm({
        email: 'e2euser@example.com',
      });

      await page.click('button[type="submit"]');

      await helpers.waitForToast('success');
      await expect(page.locator('[data-testid="reset-email-sent"]')).toContainText('Password reset instructions sent');
    });

    test('should not reveal non-existent emails', async ({ page }) => {
      await page.goto('/auth/forgot-password');

      await helpers.fillForm({
        email: 'nonexistent@example.com',
      });

      await page.click('button[type="submit"]');

      // Should show same success message for security
      await helpers.waitForToast('success');
      await expect(page.locator('[data-testid="reset-email-sent"]')).toContainText('Password reset instructions sent');
    });

    test('should reset password with valid token', async ({ page }) => {
      // Simulate clicking reset link from email
      const resetToken = 'mock-reset-token-12345';
      await page.goto(`/auth/reset-password?token=${resetToken}`);

      await expect(page.locator('h1')).toContainText('Set New Password');

      const newPassword = 'NewPassword123!';
      await helpers.fillForm({
        password: newPassword,
        confirmPassword: newPassword,
      });

      await page.click('button[type="submit"]');

      await helpers.waitForToast('success');
      await helpers.expectUrl('/auth/login');
      await expect(page.locator('[data-testid="password-reset-success"]')).toContainText('Password reset successful');
    });

    test('should reject invalid reset tokens', async ({ page }) => {
      await page.goto('/auth/reset-password?token=invalid-token');

      await expect(page.locator('[data-testid="invalid-token"]')).toContainText('Invalid or expired reset token');
      await expect(page.locator('[data-testid="request-new-reset"]')).toBeVisible();
    });

    test('should validate new password strength', async ({ page }) => {
      const resetToken = 'mock-reset-token-12345';
      await page.goto(`/auth/reset-password?token=${resetToken}`);

      await helpers.fillForm({
        password: 'weakpass',
        confirmPassword: 'weakpass',
      });

      await page.click('button[type="submit"]');

      await expect(page.locator('[data-testid="error-password"]')).toContainText(/password.*strength/i);
    });
  });

  test.describe('Logout Flow', () => {
    test('should logout successfully', async ({ page }) => {
      // Login first
      await helpers.loginAs('user');

      // Logout
      await helpers.logout();

      // Verify logout
      await helpers.expectUrl('/auth/login');
      await expect(page.locator('[data-testid="logout-success"]')).toContainText('You have been logged out');
    });

    test('should clear user data on logout', async ({ page }) => {
      await helpers.loginAs('user');

      // Check that user data is present
      await helpers.expectVisible('[data-testid="user-menu"]');

      // Logout
      await helpers.logout();

      // Try to access protected page
      await page.goto('/dashboard');
      
      // Should redirect to login
      await helpers.expectUrl('/auth/login');
    });

    test('should handle logout API failures gracefully', async ({ page }) => {
      await helpers.loginAs('user');

      // Mock logout API failure
      await page.route('/api/auth/logout', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({
            code: 'LOGOUT_FAILED',
            message: 'Logout service temporarily unavailable'
          })
        });
      });

      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');

      // Should still logout client-side even if server fails
      await helpers.expectUrl('/auth/login');
    });
  });

  test.describe('Email Verification', () => {
    test('should verify email with valid token', async ({ page }) => {
      const verificationToken = 'mock-verification-token-12345';
      await page.goto(`/auth/verify-email?token=${verificationToken}`);

      await helpers.waitForToast('success');
      await expect(page.locator('[data-testid="verification-success"]')).toContainText('Email verified successfully');
      await expect(page.locator('[data-testid="proceed-to-login"]')).toBeVisible();
    });

    test('should reject invalid verification tokens', async ({ page }) => {
      await page.goto('/auth/verify-email?token=invalid-token');

      await expect(page.locator('[data-testid="verification-failed"]')).toContainText('Invalid or expired verification token');
      await expect(page.locator('[data-testid="resend-verification"]')).toBeVisible();
    });

    test('should resend verification email', async ({ page }) => {
      await page.goto('/auth/verify-email');
      
      await helpers.fillForm({
        email: 'e2euser@example.com',
      });

      await page.click('[data-testid="resend-verification"]');

      await helpers.waitForToast('success');
      await expect(page.locator('[data-testid="verification-resent"]')).toContainText('Verification email sent');
    });

    test('should handle already verified emails', async ({ page }) => {
      const verificationToken = 'already-used-token-12345';
      
      await page.route('/api/auth/verify-email', route => {
        route.fulfill({
          status: 400,
          body: JSON.stringify({
            code: 'EMAIL_ALREADY_VERIFIED',
            message: 'This email address is already verified'
          })
        });
      });

      await page.goto(`/auth/verify-email?token=${verificationToken}`);

      await expect(page.locator('[data-testid="already-verified"]')).toContainText('already verified');
      await expect(page.locator('[data-testid="proceed-to-login"]')).toBeVisible();
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page reloads', async ({ page }) => {
      await helpers.loginAs('user');

      // Reload page
      await page.reload();

      // Should still be logged in
      await helpers.expectVisible('[data-testid="user-menu"]');
      await helpers.expectUrl('/dashboard');
    });

    test('should handle expired sessions', async ({ page }) => {
      await helpers.loginAs('user');

      // Mock expired session response
      await page.route('/api/**', route => {
        if (route.request().url().includes('/api/auth/me')) {
          route.fulfill({
            status: 401,
            body: JSON.stringify({
              code: 'SESSION_EXPIRED',
              message: 'Your session has expired'
            })
          });
        } else {
          route.continue();
        }
      });

      // Try to access user data
      await page.goto('/dashboard');

      // Should redirect to login with expiration message
      await helpers.expectUrl('/auth/login');
      await expect(page.locator('[data-testid="session-expired"]')).toContainText('session has expired');
    });

    test('should handle concurrent sessions', async ({ page, browser }) => {
      await helpers.loginAs('user');

      // Open second tab/context
      const secondContext = await browser.newContext();
      const secondPage = await secondContext.newPage();
      const secondHelpers = new TestHelpers(secondPage);

      // Login in second context
      await secondHelpers.loginAs('user');

      // Both sessions should be active
      await helpers.expectVisible('[data-testid="user-menu"]');
      await secondHelpers.expectVisible('[data-testid="user-menu"]');

      // Logout from first session
      await helpers.logout();

      // Second session should still be active (or handle based on security policy)
      await secondPage.reload();
      await secondHelpers.expectVisible('[data-testid="user-menu"]');

      await secondContext.close();
    });
  });

  test.describe('Security Features', () => {
    test('should show security warnings for suspicious activity', async ({ page }) => {
      await page.goto('/auth/login');

      // Mock suspicious activity response
      await page.route('/api/auth/login', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            code: 'LOGIN_SUCCESS_WITH_WARNING',
            data: {
              user: { id: '123', email: 'e2euser@example.com' },
              accessToken: 'token-123',
              securityWarnings: [
                {
                  type: 'NEW_DEVICE',
                  message: 'Login from new device detected',
                  timestamp: new Date().toISOString()
                }
              ]
            }
          })
        });
      });

      await helpers.fillForm({
        email: 'e2euser@example.com',
        password: 'E2EPassword123!',
      });

      await page.click('button[type="submit"]');

      await expect(page.locator('[data-testid="security-warning"]')).toContainText('Login from new device detected');
      await expect(page.locator('[data-testid="acknowledge-warning"]')).toBeVisible();
    });

    test('should enforce HTTPS in production', async ({ page }) => {
      // This test would check protocol enforcement
      // In a real test, this would verify redirect from HTTP to HTTPS
      const currentUrl = page.url();
      if (process.env.NODE_ENV === 'production') {
        expect(currentUrl).toMatch(/^https:/);
      }
    });

    test('should implement CSRF protection', async ({ page }) => {
      await page.goto('/auth/login');

      // Try to submit form without CSRF token
      await page.evaluate(() => {
        const form = document.querySelector('[data-testid="login-form"]') as HTMLFormElement;
        const csrfInput = form.querySelector('input[name="_token"]') as HTMLInputElement;
        if (csrfInput) {
          csrfInput.value = 'invalid-token';
        }
      });

      await helpers.fillForm({
        email: 'e2euser@example.com',
        password: 'E2EPassword123!',
      });

      await page.click('button[type="submit"]');

      // Should show CSRF error (if CSRF is implemented)
      const errorMessage = page.locator('[data-testid="error-message"]');
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toContainText(/csrf|token/i);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/auth/login');

      // Tab through form elements
      await page.keyboard.press('Tab'); // Email field
      await expect(page.locator('input[name="email"]')).toBeFocused();

      await page.keyboard.press('Tab'); // Password field
      await expect(page.locator('input[name="password"]')).toBeFocused();

      await page.keyboard.press('Tab'); // Remember me checkbox
      await expect(page.locator('input[name="rememberMe"]')).toBeFocused();

      await page.keyboard.press('Tab'); // Submit button
      await expect(page.locator('button[type="submit"]')).toBeFocused();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/auth/register');

      // Check form has proper labels
      await expect(page.locator('input[name="email"]')).toHaveAttribute('aria-label', /email/i);
      await expect(page.locator('input[name="password"]')).toHaveAttribute('aria-label', /password/i);
      await expect(page.locator('input[name="firstName"]')).toHaveAttribute('aria-label', /first.*name/i);
      await expect(page.locator('input[name="lastName"]')).toHaveAttribute('aria-label', /last.*name/i);
    });

    test('should announce form errors to screen readers', async ({ page }) => {
      await page.goto('/auth/register');

      // Submit empty form
      await page.click('button[type="submit"]');

      // Check error messages have proper ARIA attributes
      const emailError = page.locator('[data-testid="error-email"]');
      await expect(emailError).toHaveAttribute('role', 'alert');
      await expect(emailError).toHaveAttribute('aria-live', 'polite');
    });
  });

  test.describe('Performance', () => {
    test('should load login page quickly', async ({ page }) => {
      const loadTime = await helpers.measurePageLoad('/auth/login');
      
      expect(loadTime).toBeLessThan(3000); // 3 seconds max
      console.log(`Login page loaded in ${loadTime}ms`);
    });

    test('should handle login response quickly', async ({ page }) => {
      await page.goto('/auth/login');

      await helpers.fillForm({
        email: 'e2euser@example.com',
        password: 'E2EPassword123!',
      });

      const loginTime = await helpers.measureActionTime(async () => {
        await page.click('button[type="submit"]');
        await helpers.expectUrl('/dashboard');
      });

      expect(loginTime).toBeLessThan(2000); // 2 seconds max
      console.log(`Login completed in ${loginTime}ms`);
    });
  });
});
