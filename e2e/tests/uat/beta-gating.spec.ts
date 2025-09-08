import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL || process.env.BASE_URL || process.env.STAGING_WEB_BASE_URL || 'http://localhost:3000';

test.describe('UAT: Public Beta badge (informational)', () => {
  test('Case A: flags off → no beta badge @smoke', async ({ page }) => {
    test.skip(
      !!process.env.PUBLIC_BETA_MODE && ['on', 'true', '1'].includes(process.env.PUBLIC_BETA_MODE.toLowerCase()),
      'PUBLIC_BETA_MODE is enabled in env'
    );
    await page.goto(`${BASE}/`);
    await expect(page.getByTestId('public-beta-badge')).toHaveCount(0);
  });

  test('Case B: flags on → badge visible; disclosures link resolves 200 @smoke', async ({ page, request }) => {
    test.skip(
      !process.env.PUBLIC_BETA_MODE || !['on', 'true', '1'].includes(process.env.PUBLIC_BETA_MODE.toLowerCase()),
      'PUBLIC_BETA_MODE is not enabled in env'
    );
    await page.goto(`${BASE}/`);
    await expect(page.getByTestId('public-beta-badge')).toBeVisible();
    const res = await request.get(`${BASE}/legal/risk-disclosures`);
    expect(res.ok()).toBeTruthy();
  });
});


