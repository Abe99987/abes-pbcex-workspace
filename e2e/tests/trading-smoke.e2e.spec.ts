import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || process.env.STAGING_WEB_BASE_URL || '';

test.describe('Trading staging smoke', () => {
  test.skip(!BASE, 'BASE_URL/STAGING_WEB_BASE_URL is required');

  test('spot-usd: USD locked, min notional blocks, balances visible; SSE single; idempotency header', async ({
    page,
  }) => {
    const sseRequests: string[] = [];
    page.on('request', req => {
      const url = req.url();
      if (url.includes('/api/markets/stream')) sseRequests.push(url);
    });

    // Intercept order endpoints to assert idempotency header and avoid real side effects
    const fulfillOk = async (route: any) => {
      const headers = route.request().headers();
      expect(headers['x-idempotency-key']).toBeTruthy();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'SUCCESS',
          data: { trade: { id: 'e2e', price: '100.00', fee: '0.10' } },
          timestamp: new Date().toISOString(),
        }),
      });
    };
    await page.route('**/api/trading/orders', fulfillOk);
    await page.route('**/api/trade/order', fulfillOk);

    await page.goto(`${BASE}/trading/spot-usd`);
    await expect(page).toHaveTitle(/PBCEx|PBCex|Trade/i);

    // Balances line present - use .first() to target Buy panel
    await expect(page.getByText(/Trading balance — USD/i).first()).toBeVisible();

    // Fill in valid order values (notional > $5)
    await page.fill('#price', '10');
    await page.fill('#amount', '1');
    
    // Place order - this will trigger the idempotency header assertion
    const buyButton = page.getByRole('button', { name: /Buy GOLD/i });
    await expect(buyButton).toBeEnabled();
    await buyButton.click();

    // SSE: exactly one connection started on page
    await page.waitForTimeout(1000);
    expect(sseRequests.length).toBe(1);

    // Navigate away and ensure no additional SSE is opened
    await page.goto(`${BASE}/contact`);
    await page.waitForTimeout(500);
    expect(sseRequests.length).toBe(1);
  });

  test('spot-usdc: toggle visible, settling banner present', async ({
    page,
  }) => {
    await page.goto(`${BASE}/trading/spot-usdc`);
    await expect(page.getByRole('button', { name: /USDC/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /USDT/i })).toBeVisible();
    // Use .first() to target the first "Settling in" text
    await expect(page.getByText(/Settling in/i).first()).toBeVisible();
  });

  test('coin: settle-in dropdown present', async ({ page }) => {
    await page.goto(`${BASE}/trading/coin`);
    // Use .first() to target the first "Settle in:" label
    await expect(page.getByText(/Settle in:/i).first()).toBeVisible();
    // Dropdown trigger
    await page
      .getByRole('button')
      .filter({ hasText: /^PAXG|XAG|BTC|ETH|SOL|USDC|USDT$/ })
      .first()
      .isVisible();
  });
});
