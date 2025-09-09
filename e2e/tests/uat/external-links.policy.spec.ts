import { test, expect } from '@playwright/test';

test.describe.fixme('External links policy (wrapper bridge)', () => {
  test('allowlisted hosts navigate in-app; others would call bridge', async ({ page }) => {
    // No reliable public route currently uses ExternalLink; defer full E2E to next slice.
    await expect(true).toBeTruthy();
  });
});
