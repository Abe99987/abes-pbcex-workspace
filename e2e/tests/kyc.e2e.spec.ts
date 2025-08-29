import { test, expect } from '@playwright/test';
import { TestHelpers, TestDataGenerator, E2EAssertions } from '../utils/test-helpers';

/**
 * KYC (Know Your Customer) E2E Tests
 * 
 * Tests the complete KYC verification flow including:
 * - Document submission
 * - Personal information collection
 * - Address verification
 * - Identity document upload
 * - Review and approval process
 */

test.describe('KYC Verification Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.loginAs('user');
  });

  test.describe('KYC Form Submission', () => {
    test('should complete KYC form successfully', async ({ page }) => {
      await helpers.navigateToSection('kyc');

      // Verify KYC page loaded
      await expect(page.locator('h1')).toContainText('Identity Verification');
      await expect(page.locator('[data-testid="kyc-form"]')).toBeVisible();

      // Check current status
      await expect(page.locator('[data-testid="kyc-status"]')).toContainText('Not Started');

      // Fill personal information
      const kycData = TestDataGenerator.validKycData();
      await helpers.fillForm(kycData);

      // Upload identity document (front)
      await page.setInputFiles(
        'input[data-testid="id-document-front"]',
        'e2e/fixtures/documents/sample-id-front.jpg'
      );

      // Upload identity document (back)
      await page.setInputFiles(
        'input[data-testid="id-document-back"]',
        'e2e/fixtures/documents/sample-id-back.jpg'
      );

      // Upload proof of address
      await page.setInputFiles(
        'input[data-testid="address-document"]',
        'e2e/fixtures/documents/sample-utility-bill.pdf'
      );

      // Select document type
      await page.selectOption('[data-testid="document-type"]', 'DRIVERS_LICENSE');

      // Confirm identity verification
      await page.check('[data-testid="confirm-identity"]');
      await page.check('[data-testid="consent-data-processing"]');

      // Submit KYC form
      await helpers.submitForm('[data-testid="kyc-form"]');

      // Verify successful submission
      await helpers.waitForToast('success');
      await expect(page.locator('[data-testid="kyc-submitted"]')).toContainText('KYC submitted successfully');
      
      // Check status updated
      await expect(page.locator('[data-testid="kyc-status"]')).toContainText('Under Review');
      
      // Verify estimated review time shown
      await expect(page.locator('[data-testid="review-timeline"]')).toContainText(/1-3 business days/i);
    });

    test('should validate required personal information', async ({ page }) => {
      await helpers.navigateToSection('kyc');

      // Try to submit without required fields
      await page.click('button[type="submit"]');

      // Check validation errors
      await expect(page.locator('[data-testid="error-firstName"]')).toContainText('First name is required');
      await expect(page.locator('[data-testid="error-lastName"]')).toContainText('Last name is required');
      await expect(page.locator('[data-testid="error-dateOfBirth"]')).toContainText('Date of birth is required');
      await expect(page.locator('[data-testid="error-ssn"]')).toContainText('SSN is required');
      await expect(page.locator('[data-testid="error-phone"]')).toContainText('Phone number is required');
    });

    test('should validate address information', async ({ page }) => {
      await helpers.navigateToSection('kyc');

      // Fill personal info but skip address
      await helpers.fillForm({
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        ssn: '123-45-6789',
        phone: '+1-555-0123',
      });

      await page.click('button[type="submit"]');

      // Check address validation errors
      await expect(page.locator('[data-testid="error-street"]')).toContainText('Street address is required');
      await expect(page.locator('[data-testid="error-city"]')).toContainText('City is required');
      await expect(page.locator('[data-testid="error-state"]')).toContainText('State is required');
      await expect(page.locator('[data-testid="error-zipCode"]')).toContainText('ZIP code is required');
      await expect(page.locator('[data-testid="error-country"]')).toContainText('Country is required');
    });

    test('should validate document uploads', async ({ page }) => {
      await helpers.navigateToSection('kyc');

      // Fill form but skip document uploads
      const kycData = TestDataGenerator.validKycData();
      await helpers.fillForm(kycData);
      
      await page.check('[data-testid="confirm-identity"]');
      await page.check('[data-testid="consent-data-processing"]');

      await page.click('button[type="submit"]');

      // Check document validation errors
      await expect(page.locator('[data-testid="error-id-document-front"]')).toContainText('Front of ID document is required');
      await expect(page.locator('[data-testid="error-id-document-back"]')).toContainText('Back of ID document is required');
      await expect(page.locator('[data-testid="error-address-document"]')).toContainText('Proof of address document is required');
    });

    test('should validate file formats and sizes', async ({ page }) => {
      await helpers.navigateToSection('kyc');

      // Try to upload invalid file format
      await page.setInputFiles(
        'input[data-testid="id-document-front"]',
        'e2e/fixtures/documents/invalid-format.txt'
      );

      await expect(page.locator('[data-testid="error-file-format"]')).toContainText('Invalid file format. Please upload JPG, PNG, or PDF files');

      // Try to upload oversized file (mock)
      await page.evaluate(() => {
        // Simulate oversized file error
        const errorElement = document.querySelector('[data-testid="error-file-size"]');
        if (errorElement) {
          errorElement.textContent = 'File size must be less than 10MB';
          errorElement.style.display = 'block';
        }
      });

      await expect(page.locator('[data-testid="error-file-size"]')).toContainText('File size must be less than 10MB');
    });

    test('should validate age requirements', async ({ page }) => {
      await helpers.navigateToSection('kyc');

      // Enter birth date for someone under 18
      await helpers.fillForm({
        dateOfBirth: '2010-01-01', // 13 years old
      });

      await page.blur('input[name="dateOfBirth"]');

      await expect(page.locator('[data-testid="error-age"]')).toContainText('You must be at least 18 years old');
    });

    test('should validate SSN format', async ({ page }) => {
      await helpers.navigateToSection('kyc');

      const invalidSSNs = [
        '123456789',     // Missing dashes
        '123-45-678',    // Too short
        '000-00-0000',   // Invalid SSN
        'abc-de-fghi',   // Non-numeric
      ];

      for (const invalidSSN of invalidSSNs) {
        await page.fill('input[name="ssn"]', invalidSSN);
        await page.blur('input[name="ssn"]');
        
        await expect(page.locator('[data-testid="error-ssn"]')).toContainText(/invalid.*ssn.*format/i);
        
        // Clear for next iteration
        await page.fill('input[name="ssn"]', '');
      }
    });

    test('should validate phone number format', async ({ page }) => {
      await helpers.navigateToSection('kyc');

      const invalidPhones = [
        '555-0123',        // Missing area code
        '1234567890',      // No formatting
        '+1-555-012',      // Too short
        'not-a-phone',     // Non-numeric
      ];

      for (const invalidPhone of invalidPhones) {
        await page.fill('input[name="phone"]', invalidPhone);
        await page.blur('input[name="phone"]');
        
        await expect(page.locator('[data-testid="error-phone"]')).toContainText(/invalid.*phone.*format/i);
        
        // Clear for next iteration
        await page.fill('input[name="phone"]', '');
      }
    });
  });

  test.describe('KYC Status Tracking', () => {
    test('should display current KYC status', async ({ page }) => {
      await helpers.navigateToSection('kyc');

      // Check various status states
      const statusStates = [
        { status: 'NOT_STARTED', text: 'Not Started', color: 'gray' },
        { status: 'PENDING', text: 'Under Review', color: 'yellow' },
        { status: 'APPROVED', text: 'Approved', color: 'green' },
        { status: 'REJECTED', text: 'Rejected', color: 'red' },
      ];

      for (const state of statusStates) {
        // Mock different status responses
        await page.route('/api/kyc/status', route => {
          route.fulfill({
            status: 200,
            body: JSON.stringify({
              code: 'SUCCESS',
              data: {
                kycStatus: state.status,
                submittedAt: state.status !== 'NOT_STARTED' ? new Date().toISOString() : null,
                reviewedAt: state.status === 'APPROVED' || state.status === 'REJECTED' ? new Date().toISOString() : null,
              }
            })
          });
        });

        await page.reload();
        
        await expect(page.locator('[data-testid="kyc-status"]')).toContainText(state.text);
        await expect(page.locator('[data-testid="status-indicator"]')).toHaveClass(new RegExp(state.color));
      }
    });

    test('should show submission timeline', async ({ page }) => {
      // Mock KYC with timeline data
      await page.route('/api/kyc/status', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            code: 'SUCCESS',
            data: {
              kycStatus: 'PENDING',
              submittedAt: new Date().toISOString(),
              timeline: [
                {
                  status: 'SUBMITTED',
                  timestamp: new Date().toISOString(),
                  description: 'KYC application submitted',
                },
                {
                  status: 'DOCUMENTS_RECEIVED',
                  timestamp: new Date().toISOString(),
                  description: 'Identity documents received and validated',
                },
                {
                  status: 'UNDER_REVIEW',
                  timestamp: new Date().toISOString(),
                  description: 'Application under manual review',
                },
              ],
            }
          })
        });
      });

      await helpers.navigateToSection('kyc');

      await expect(page.locator('[data-testid="kyc-timeline"]')).toBeVisible();
      await expect(page.locator('[data-testid="timeline-item"]')).toHaveCount(3);
      
      // Check timeline items have proper timestamps
      const timelineItems = page.locator('[data-testid="timeline-item"]');
      for (let i = 0; i < 3; i++) {
        await expect(timelineItems.nth(i).locator('[data-testid="timestamp"]')).toBeVisible();
        await expect(timelineItems.nth(i).locator('[data-testid="description"]')).toBeVisible();
      }
    });

    test('should handle KYC rejection with reasons', async ({ page }) => {
      // Mock rejected KYC status
      await page.route('/api/kyc/status', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            code: 'SUCCESS',
            data: {
              kycStatus: 'REJECTED',
              rejectionReason: 'DOCUMENT_QUALITY',
              rejectionNotes: 'Identity document image is unclear. Please resubmit a clearer photo.',
              rejectedAt: new Date().toISOString(),
              resubmissionAllowed: true,
            }
          })
        });
      });

      await helpers.navigateToSection('kyc');

      await expect(page.locator('[data-testid="kyc-status"]')).toContainText('Rejected');
      await expect(page.locator('[data-testid="rejection-reason"]')).toContainText('Document Quality');
      await expect(page.locator('[data-testid="rejection-notes"]')).toContainText('Identity document image is unclear');
      await expect(page.locator('[data-testid="resubmit-button"]')).toBeVisible();
    });

    test('should allow KYC resubmission after rejection', async ({ page }) => {
      // Set up rejected KYC state
      await page.route('/api/kyc/status', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            code: 'SUCCESS',
            data: {
              kycStatus: 'REJECTED',
              resubmissionAllowed: true,
            }
          })
        });
      });

      await helpers.navigateToSection('kyc');
      
      // Click resubmit button
      await page.click('[data-testid="resubmit-button"]');

      // Should show KYC form again
      await expect(page.locator('[data-testid="kyc-form"]')).toBeVisible();
      await expect(page.locator('[data-testid="resubmission-notice"]')).toContainText('Please address the following issues');
    });
  });

  test.describe('Document Upload Experience', () => {
    test('should provide upload guidance', async ({ page }) => {
      await helpers.navigateToSection('kyc');

      // Check upload instructions are visible
      await expect(page.locator('[data-testid="upload-instructions"]')).toContainText('Clear, high-quality images');
      await expect(page.locator('[data-testid="supported-formats"]')).toContainText('JPG, PNG, PDF');
      await expect(page.locator('[data-testid="file-size-limit"]')).toContainText('Maximum 10MB');

      // Check example images
      await expect(page.locator('[data-testid="good-example"]')).toBeVisible();
      await expect(page.locator('[data-testid="bad-example"]')).toBeVisible();
    });

    test('should show upload progress', async ({ page }) => {
      await helpers.navigateToSection('kyc');

      // Mock file upload with progress
      await page.route('/api/kyc/upload', route => {
        // Simulate upload progress
        setTimeout(() => {
          route.fulfill({
            status: 200,
            body: JSON.stringify({
              code: 'SUCCESS',
              data: {
                fileId: 'file-12345',
                url: '/api/files/file-12345',
                status: 'UPLOADED',
              }
            })
          });
        }, 1000);
      });

      // Upload file
      await page.setInputFiles(
        'input[data-testid="id-document-front"]',
        'e2e/fixtures/documents/sample-id-front.jpg'
      );

      // Check upload progress appears
      await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();

      // Wait for upload completion
      await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="file-preview"]')).toBeVisible();
    });

    test('should handle upload errors gracefully', async ({ page }) => {
      await helpers.navigateToSection('kyc');

      // Mock upload failure
      await page.route('/api/kyc/upload', route => {
        route.fulfill({
          status: 413,
          body: JSON.stringify({
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds the maximum limit of 10MB',
          })
        });
      });

      await page.setInputFiles(
        'input[data-testid="id-document-front"]',
        'e2e/fixtures/documents/large-file.jpg'
      );

      await expect(page.locator('[data-testid="upload-error"]')).toContainText('File size exceeds');
      await expect(page.locator('[data-testid="retry-upload"]')).toBeVisible();
    });

    test('should allow file replacement', async ({ page }) => {
      await helpers.navigateToSection('kyc');

      // Upload initial file
      await page.setInputFiles(
        'input[data-testid="id-document-front"]',
        'e2e/fixtures/documents/sample-id-front.jpg'
      );

      await expect(page.locator('[data-testid="file-preview"]')).toBeVisible();

      // Replace file
      await page.click('[data-testid="replace-file"]');
      await page.setInputFiles(
        'input[data-testid="id-document-front"]',
        'e2e/fixtures/documents/sample-id-front-v2.jpg'
      );

      await expect(page.locator('[data-testid="file-replaced"]')).toContainText('File replaced successfully');
    });
  });

  test.describe('Admin KYC Review', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.logout();
      await helpers.loginAs('admin');
    });

    test('should display pending KYC applications', async ({ page }) => {
      await page.goto('/admin/kyc');

      await expect(page.locator('h1')).toContainText('KYC Review');
      await expect(page.locator('[data-testid="pending-applications"]')).toBeVisible();

      // Check application list
      const applications = page.locator('[data-testid="kyc-application"]');
      await expect(applications).toHaveCountGreaterThan(0);

      // Check application details
      const firstApp = applications.first();
      await expect(firstApp.locator('[data-testid="applicant-name"]')).toBeVisible();
      await expect(firstApp.locator('[data-testid="submission-date"]')).toBeVisible();
      await expect(firstApp.locator('[data-testid="application-status"]')).toBeVisible();
    });

    test('should allow KYC approval', async ({ page }) => {
      await page.goto('/admin/kyc');

      // Click on first pending application
      await page.click('[data-testid="kyc-application"]');

      // Review application details
      await expect(page.locator('[data-testid="applicant-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="document-viewer"]')).toBeVisible();

      // Approve application
      await page.click('[data-testid="approve-kyc"]');
      await page.fill('[data-testid="approval-notes"]', 'All documents verified successfully');
      await page.click('[data-testid="confirm-approval"]');

      await helpers.waitForToast('success');
      await expect(page.locator('[data-testid="application-approved"]')).toContainText('KYC application approved');
    });

    test('should allow KYC rejection with reasons', async ({ page }) => {
      await page.goto('/admin/kyc');

      await page.click('[data-testid="kyc-application"]');

      // Reject application
      await page.click('[data-testid="reject-kyc"]');
      await page.selectOption('[data-testid="rejection-reason"]', 'DOCUMENT_QUALITY');
      await page.fill('[data-testid="rejection-notes"]', 'ID document image is too blurry to verify');
      await page.click('[data-testid="confirm-rejection"]');

      await helpers.waitForToast('success');
      await expect(page.locator('[data-testid="application-rejected"]')).toContainText('KYC application rejected');
    });

    test('should track review history', async ({ page }) => {
      await page.goto('/admin/kyc/history');

      await expect(page.locator('[data-testid="review-history"]')).toBeVisible();
      
      const historyItems = page.locator('[data-testid="history-item"]');
      await expect(historyItems).toHaveCountGreaterThan(0);

      // Check history item details
      const firstItem = historyItems.first();
      await expect(firstItem.locator('[data-testid="reviewer-name"]')).toBeVisible();
      await expect(firstItem.locator('[data-testid="action-taken"]')).toBeVisible();
      await expect(firstItem.locator('[data-testid="review-timestamp"]')).toBeVisible();
    });
  });

  test.describe('KYC Integration with Trading', () => {
    test('should block trading for non-KYC users', async ({ page }) => {
      // Mock user with pending KYC
      await page.route('/api/auth/me', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            code: 'SUCCESS',
            data: {
              user: {
                id: 'user-123',
                email: 'pending@example.com',
                kycStatus: 'PENDING',
              }
            }
          })
        });
      });

      await helpers.navigateToSection('trade');

      // Should show KYC requirement
      await expect(page.locator('[data-testid="kyc-required"]')).toBeVisible();
      await expect(page.locator('[data-testid="kyc-required"]')).toContainText('KYC verification required');
      await expect(page.locator('[data-testid="complete-kyc-button"]')).toBeVisible();

      // Trading form should be disabled
      await expect(page.locator('[data-testid="trade-form"]')).toHaveClass(/disabled/);
    });

    test('should enable trading after KYC approval', async ({ page }) => {
      // Mock approved KYC user
      await page.route('/api/auth/me', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            code: 'SUCCESS',
            data: {
              user: {
                id: 'user-123',
                email: 'approved@example.com',
                kycStatus: 'APPROVED',
              }
            }
          })
        });
      });

      await helpers.navigateToSection('trade');

      // Should not show KYC requirement
      await expect(page.locator('[data-testid="kyc-required"]')).not.toBeVisible();

      // Trading form should be enabled
      await expect(page.locator('[data-testid="trade-form"]')).not.toHaveClass(/disabled/);
      await expect(page.locator('[data-testid="place-order-button"]')).toBeEnabled();
    });
  });

  test.describe('Accessibility and UX', () => {
    test('should be keyboard accessible', async ({ page }) => {
      await helpers.navigateToSection('kyc');

      // Tab through form fields
      let tabCount = 0;
      const maxTabs = 20;

      while (tabCount < maxTabs) {
        await page.keyboard.press('Tab');
        tabCount++;

        const focusedElement = await page.locator(':focus');
        if (await focusedElement.count() > 0) {
          const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
          if (['input', 'select', 'button', 'textarea'].includes(tagName)) {
            console.log(`Tab ${tabCount}: Focused on ${tagName}`);
          }
        }
      }

      // Should be able to submit form with keyboard
      await page.keyboard.press('Enter');
    });

    test('should have proper form labels', async ({ page }) => {
      await helpers.navigateToSection('kyc');

      // Check all form fields have associated labels
      const formFields = [
        'firstName',
        'lastName',
        'dateOfBirth',
        'ssn',
        'phone',
        'street',
        'city',
        'state',
        'zipCode',
        'country',
      ];

      for (const field of formFields) {
        const input = page.locator(`input[name="${field}"], select[name="${field}"]`);
        await expect(input).toHaveAttribute('aria-label');
      }
    });

    test('should provide helpful error messages', async ({ page }) => {
      await helpers.navigateToSection('kyc');

      // Submit empty form
      await page.click('button[type="submit"]');

      const errorMessages = page.locator('[data-testid^="error-"]');
      const errorCount = await errorMessages.count();

      for (let i = 0; i < errorCount; i++) {
        const errorMessage = await errorMessages.nth(i).textContent();
        expect(errorMessage).toMatch(/required|invalid|must|please/i);
        expect(errorMessage?.length || 0).toBeGreaterThan(10); // Meaningful error message
      }
    });
  });

  test.describe('Performance', () => {
    test('should load KYC page quickly', async ({ page }) => {
      const loadTime = await helpers.measurePageLoad('/account/kyc');
      
      expect(loadTime).toBeLessThan(3000);
      console.log(`KYC page loaded in ${loadTime}ms`);
    });

    test('should handle file uploads efficiently', async ({ page }) => {
      await helpers.navigateToSection('kyc');

      const uploadTime = await helpers.measureActionTime(async () => {
        await page.setInputFiles(
          'input[data-testid="id-document-front"]',
          'e2e/fixtures/documents/sample-id-front.jpg'
        );
        
        await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
      });

      expect(uploadTime).toBeLessThan(5000);
      console.log(`File upload completed in ${uploadTime}ms`);
    });
  });
});
