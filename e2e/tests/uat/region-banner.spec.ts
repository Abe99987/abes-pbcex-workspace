import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL || process.env.BASE_URL || process.env.STAGING_WEB_BASE_URL || 'http://localhost:3000';

test.describe('UAT: Region gating banner', () => {
  test('Banner renders when gating on and region unsupported @smoke', async ({ page }) => {
    test.skip(!process.env.PUBLIC_REGION_GATING || process.env.PUBLIC_REGION_GATING.toLowerCase() !== 'on', 'PUBLIC_REGION_GATING!=on');
    const unsupported = 'AU';
    await page.goto(`${BASE}/?pbce_region=${unsupported}`);
    const banner = page.getByTestId('region-gating-banner');
    await expect(banner).toBeVisible();
    if (process.env.PUBLIC_REGION_MESSAGE) {
      await expect(page.getByText(process.env.PUBLIC_REGION_MESSAGE)).toBeVisible();
    }
  });

  test('Banner hidden when region allowed or gating off', async ({ page }) => {
    const supported = (process.env.PUBLIC_SUPPORTED_REGIONS || 'US,CA,GB').split(',')[0].trim();
    await page.goto(`${BASE}/?pbce_region=${supported}`);
    await expect(page.getByTestId('region-gating-banner')).toHaveCount(0);
  });
});


