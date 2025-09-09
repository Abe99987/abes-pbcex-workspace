import { test, expect } from '@playwright/test';

test('disclosures page renders with key sections', async ({ request }) => {
  const res = await request.get('/disclosures');
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toContain('Supported Regions');
  expect(html).toContain('Export Compliance');
});


