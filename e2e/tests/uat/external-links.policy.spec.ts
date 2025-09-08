import { test, expect } from '@playwright/test';

test.describe('External Links Policy @smoke', () => {
  test.beforeEach(async ({ page }) => {
    // Visit a page that contains external links (markets symbol page has TradingView link)
    await page.goto('/markets/XAUUSD');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should render TradingView link with correct security attributes', async ({ page }) => {
    // Find the TradingView external link
    const tradingViewLink = page.locator('a[href*="tradingview.com"]').first();
    
    await expect(tradingViewLink).toBeVisible();
    
    // Verify security attributes are present
    await expect(tradingViewLink).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(tradingViewLink).toHaveAttribute('target', '_blank');
    
    // Verify the link is to an allowed host
    const href = await tradingViewLink.getAttribute('href');
    expect(href).toContain('tradingview.com');
  });

  test('should allow tradingview.com in allowlist', async ({ page }) => {
    // Check that TradingView links are not blocked
    const tradingViewLink = page.locator('a[href*="tradingview.com"]').first();
    
    // Click the link and verify no error toast appears
    await tradingViewLink.click();
    
    // Should not see error toast for allowed host
    const errorToast = page.locator('[data-testid="toast"]', { hasText: 'not allowed' });
    await expect(errorToast).not.toBeVisible({ timeout: 2000 });
  });

  test('should block disallowed hosts with toast notification', async ({ page }) => {
    // Inject a test link to a disallowed host
    await page.evaluate(() => {
      const testLink = document.createElement('a');
      testLink.href = 'https://malicious-site.com/test';
      testLink.textContent = 'Test Disallowed Link';
      testLink.className = 'test-disallowed-link';
      testLink.setAttribute('data-testid', 'disallowed-link');
      document.body.appendChild(testLink);
    });

    // Wait for the link to be added
    const disallowedLink = page.locator('[data-testid="disallowed-link"]');
    await expect(disallowedLink).toBeVisible();

    // Click the disallowed link
    await disallowedLink.click();

    // Should see error toast for disallowed host
    const errorToast = page.locator('.Toastify__toast--error', { hasText: 'not allowed' });
    await expect(errorToast).toBeVisible({ timeout: 3000 });
  });

  test('should handle invalid URLs gracefully', async ({ page }) => {
    // Inject a test link with invalid URL
    await page.evaluate(() => {
      const testLink = document.createElement('a');
      testLink.href = 'invalid-url-format';
      testLink.textContent = 'Invalid URL Link';
      testLink.className = 'test-invalid-link';
      testLink.setAttribute('data-testid', 'invalid-link');
      document.body.appendChild(testLink);
    });

    const invalidLink = page.locator('[data-testid="invalid-link"]');
    await expect(invalidLink).toBeVisible();

    // Click the invalid link
    await invalidLink.click();

    // Should see error toast for invalid URL
    const errorToast = page.locator('.Toastify__toast--error', { hasText: 'Invalid URL' });
    await expect(errorToast).toBeVisible({ timeout: 3000 });
  });
});
