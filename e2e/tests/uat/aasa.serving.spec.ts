import { test, expect } from '@playwright/test';

const isWrapperEnabled = (process.env.PUBLIC_IOS_WRAPPER || 'false').toLowerCase() === 'true';

test.skip(!isWrapperEnabled, 'PUBLIC_IOS_WRAPPER is false; skipping AASA UAT');

test('AASA is served with applinks details', async ({ request }) => {
  const res = await request.get('/.well-known/apple-app-site-association');
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json).toHaveProperty('applinks');
  expect(json.applinks).toHaveProperty('details');
  expect(Array.isArray(json.applinks.details)).toBe(true);
  const first = json.applinks.details[0];
  expect(first).toHaveProperty('appIDs');
  expect(first).toHaveProperty('paths');
  expect(Array.isArray(first.paths)).toBe(true);
});


