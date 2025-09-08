import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL || process.env.BASE_URL || process.env.STAGING_WEB_BASE_URL || 'http://localhost:3000';

test.describe('UAT: Routes and footer links', () => {
  test('Routes reachability with visible h1', async ({ page, request }) => {
    const routes = [
      '/',
      '/legal',
      '/legal/tos',
      '/legal/privacy',
      '/legal/risk-disclosures',
      '/legal/supported-regions',
    ];

    for (const path of routes) {
      const res = await request.get(`${BASE}${path}`);
      expect(res.ok(), `${path} should return 200`).toBeTruthy();

      await page.goto(`${BASE}${path}`);
      const h1 = page.locator('h1');
      await expect(h1, `${path} should have an H1`).toBeVisible();
    }
  });

  test('Footer legal links present and navigable', async ({ page }) => {
    await page.goto(`${BASE}/`);

    await expect(page.getByTestId('footer-link-tos')).toBeVisible();
    await expect(page.getByTestId('footer-link-privacy')).toBeVisible();
    await expect(page.getByTestId('footer-link-risk')).toBeVisible();
    await expect(page.getByTestId('footer-link-supported-regions')).toBeVisible();

    await page.getByTestId('footer-link-tos').click();
    await expect(page).toHaveURL(/\/legal\/tos/);

    await page.goto(`${BASE}/`);
    await page.getByTestId('footer-link-privacy').click();
    await expect(page).toHaveURL(/\/legal\/privacy/);

    await page.goto(`${BASE}/`);
    await page.getByTestId('footer-link-risk').click();
    await expect(page).toHaveURL(/\/legal\/risk-disclosures/);

    await page.goto(`${BASE}/`);
    await page.getByTestId('footer-link-supported-regions').click();
    await expect(page).toHaveURL(/\/legal\/supported-regions/);
  });
});


