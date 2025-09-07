import { test, expect, request } from '@playwright/test';

// Tag for filtering in CI only
test.describe('@staging smoke', () => {
  const baseUrl = process.env.STAGING_BASE_URL;
  const bearer = process.env.STAGING_BEARER;

  test('health endpoint is 200', async () => {
    if (!baseUrl) test.skip(true, 'STAGING_BASE_URL missing');
    const ctx = await request.newContext({ baseURL: baseUrl, timeout: 15000 });
    const res = await ctx.get('/health');
    expect(res.status(), 'health status').toBe(200);
  });

  test('balances GET and trade quote POST succeed (read-only)', async () => {
    if (!baseUrl) test.skip(true, 'STAGING_BASE_URL missing');
    if (!bearer) test.skip(true, 'STAGING_BEARER missing');

    const ctx = await request.newContext({
      baseURL: baseUrl,
      extraHTTPHeaders: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    // Balances GET
    const balances = await ctx.get('/api/wallet/balances');
    expect(balances.status(), 'balances status').toBe(200);
    const balancesJson = await balances.json();
    expect(balancesJson?.code).toBe('SUCCESS');

    // Quote POST (no side effects)
    const quote = await ctx.post('/api/trade/quote', {
      data: { fromAsset: 'XAU-s', toAsset: 'XAG-s', amount: '0.01' },
    });
    expect(quote.status(), 'quote status').toBe(200);
    const quoteJson = await quote.json();
    expect(quoteJson?.code).toBe('SUCCESS');
  });
});


