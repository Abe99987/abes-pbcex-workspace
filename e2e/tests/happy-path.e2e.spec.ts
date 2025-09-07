import { test, expect } from '@playwright/test';

test('signup → KYC approved → seed deposit → trade → balances', async ({ request }) => {
  const apiBase = 'http://localhost:4001';

  // 1) Register
  const email = `user${Date.now()}@example.com`;
  const register = await request.post(`${apiBase}/api/auth/register`, {
    data: { email, password: 'Passw0rd!', firstName: 'E2E', lastName: 'User' },
  });
  expect(register.status()).toBe(201);

  // 2) Login
  const login = await request.post(`${apiBase}/api/auth/login`, {
    data: { email, password: 'Passw0rd!' },
  });
  if (!login.ok()) {
    console.log('LOGIN_ERROR', login.status(), await login.text());
  }
  expect(login.ok()).toBeTruthy();
  let loginJson = await login.json();
  let token = loginJson.data.accessToken as string;
  let headers: Record<string, string> = { Authorization: `Bearer ${token}` };

  // 3) KYC auto-approve (test-only)
  const kyc = await request.post(`${apiBase}/api/test/kyc/auto-approve`, {
    data: { email },
  });
  if (!kyc.ok()) {
    console.log('KYC_ERROR', kyc.status(), await kyc.text());
  }
  expect(kyc.ok()).toBeTruthy();

  // 3b) Refresh auth after KYC so JWT reflects APPROVED
  const relogin = await request.post(`${apiBase}/api/auth/login`, {
    data: { email, password: 'Passw0rd!' },
  });
  if (!relogin.ok()) {
    console.log('RELOGIN_ERROR', relogin.status(), await relogin.text());
  }
  expect(relogin.ok()).toBeTruthy();
  loginJson = await relogin.json();
  token = loginJson.data.accessToken as string;
  headers = { Authorization: `Bearer ${token}` };

  // 4) Seed balances (test-only): fund USD and PAXG to enable a trade
  const seed = await request.post(`${apiBase}/api/test/balances/setup`, {
    data: { email, balances: { USD: '10000.00', PAXG: '1.00000000', 'XAU-s': '0.00000000' } },
  });
  if (seed.status() !== 201) {
    console.log('SEED_ERROR', seed.status(), await seed.text());
  }
  expect(seed.status()).toBe(201);
  const seedJson = await seed.json();
  console.log('SEED_OK', JSON.stringify(seedJson.data));

  // Quick sanity: fetch balances to capture account IDs
  const preBalances = await request.get(`${apiBase}/api/wallet/balances`, { headers, timeout: 30000 });
  if (!preBalances.ok()) {
    console.log('PRE_BAL_ERROR', preBalances.status(), await preBalances.text());
  }
  const preBalJson = await preBalances.json();
  console.log('BAL_IDS', JSON.stringify({
    fundingId: preBalJson?.data?.funding?.id,
    tradingId: preBalJson?.data?.trading?.id,
  }));

  // 5) Place a trade: PAXG → XAU-s (MARKET)
  const order = await request.post(`${apiBase}/api/trade/order`, {
    headers: { ...headers, 'Content-Type': 'application/json' },
    data: { fromAsset: 'PAXG', toAsset: 'XAU-s', amount: 0.1 },
  });
  if (order.status() !== 201) {
    console.log('ORDER_ERROR', order.status(), await order.text());
  }
  expect(order.status()).toBe(201);
  const orderJson = await order.json();
  expect(orderJson.code).toBe('SUCCESS');
  const trade = orderJson.data.trade;
  expect(trade.assetSold).toBe('PAXG');
  expect(trade.assetBought).toBe('XAU-s');

  // 6) Verify balances reflect the trade
  const balances = await request.get(`${apiBase}/api/wallet/balances`, { headers, timeout: 30000 });
  expect(balances.ok()).toBeTruthy();
  const balJson = await balances.json();
  expect(balJson.code).toBe('SUCCESS');
  // Ensure trading account shows XAU-s > 0 and funding PAXG decreased
  const trading = balJson.data.trading.balances as Array<{ asset: string; amount: string }>;
  const funding = balJson.data.funding.balances as Array<{ asset: string; amount: string }>;
  const xaus = trading.find(b => b.asset === 'XAU-s');
  expect(xaus && parseFloat(xaus.amount) > 0).toBeTruthy();
  const paxgFunding = funding.find(b => b.asset === 'PAXG');
  // Funding might not list PAXG if zero after seed+trade; allow either nonexistence or reduced > 0
  if (paxgFunding) {
    expect(parseFloat(paxgFunding.amount)).toBeLessThan(1.0);
  }
});


