import { test, expect } from '@playwright/test';

test.describe('Deeplink fallback', () => {
  test('shows CTA and fallback link', async ({ page }) => {
    await page.goto('/deeplink/open');
    await expect(page.getByRole('heading', { name: 'Open in app' })).toBeVisible();
    await page.waitForTimeout(1500);
    const link = page.getByRole('link', { name: 'Continue in browser' });
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toMatch(/^https?:\/\//);
  });
});
