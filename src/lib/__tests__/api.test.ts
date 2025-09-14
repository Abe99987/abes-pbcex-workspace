/**
 * API Adapter Tests - Markets & Spending Wiring v1
 * Basic tests for both adapters (flags, normalization, CSV BOM)
 */

import { spendingAdapter, marketsAdapter, tradeAdapter } from '../api';
import { FEATURE_FLAGS } from '@/config/features';

// Declare test globals to satisfy TypeScript in this repo without jest types
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;

// Vitest global (available under Vite env); fallback to any
declare const vi: { fn: () => any } | undefined;

// Mock fetch globally
(global as any).fetch = vi ? vi.fn() : ((() => {}) as any);

describe('MarketsAdapter', () => {
  beforeEach(() => {
    (fetch as any).mockReset?.();
  });

  it('returns mock symbols when markets.v1 is disabled', async () => {
    const original = FEATURE_FLAGS['markets.v1'];
    (FEATURE_FLAGS as any)['markets.v1'] = false;

    const symbols = await marketsAdapter.getSymbols();

    expect(Array.isArray(symbols)).toBe(true);
    expect(symbols.length).toBeGreaterThan(0);
    expect(symbols[0]).toHaveProperty('pair');

    (FEATURE_FLAGS as any)['markets.v1'] = original;
  });

  it('normalizes getSymbols API data shape', async () => {
    const mockApiResponse = {
      code: 'SUCCESS',
      data: [
        {
          pair: 'BTC/USDC',
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 43567.89,
          changePercent: 2.8,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const symbols = await marketsAdapter.getSymbols();

    expect(symbols).toBeDefined();
    expect(symbols[0].pair).toBe('BTC/USDC');
    expect(symbols[0].symbol).toBe('BTC');
    expect(symbols[0].price).toBe('43567.89');
    expect(typeof symbols[0].changePercent).toBe('number');
  });
});

describe('SpendingAdapter', () => {
  beforeEach(() => {
    (fetch as any).mockReset?.();
  });

  it('returns mock transactions when spending.v1 is disabled', async () => {
    const original = FEATURE_FLAGS['spending.v1'];
    (FEATURE_FLAGS as any)['spending.v1'] = false;

    const transactions = await spendingAdapter.getTransactions();

    expect(Array.isArray(transactions)).toBe(true);
    expect(transactions.length).toBeGreaterThan(0);
    expect(transactions[0]).toHaveProperty('id');

    (FEATURE_FLAGS as any)['spending.v1'] = original;
  });

  it('normalizes getTransactions API data shape with filters', async () => {
    const mockApiResponse = {
      code: 'SUCCESS',
      data: [
        {
          id: '123',
          merchant: 'Test Merchant',
          amount: -100.5,
          date: '2024-01-15T00:00:00Z',
        },
      ],
      timestamp: new Date().toISOString(),
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const tx = await spendingAdapter.getTransactions({
      month: '2024-01',
      category: 'Shopping',
    });

    expect(tx).toBeDefined();
    expect(tx[0].id).toBe('123');
    expect(tx[0].merchant).toBe('Test Merchant');
    expect(tx[0].amount).toBe(-100.5);
    expect(typeof tx[0].date).toBe('string');
  });

  it('exportCsv returns CSV with UTF-8 BOM (mock path)', async () => {
    const original = FEATURE_FLAGS['spending.v1'];
    (FEATURE_FLAGS as any)['spending.v1'] = false;
    try {
      const blob = await spendingAdapter.exportCsv({ month: '2024-01' });
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/csv;charset=utf-8');

      const text = await blob.text();
      expect(text.charCodeAt(0)).toBe(0xfeff); // BOM
    } finally {
      (FEATURE_FLAGS as any)['spending.v1'] = original;
    }
  });

  it('createRule includes idempotency key and returns created rule', async () => {
    const mockRule = {
      alias: 'test_gold',
      asset: 'Gold',
      amount: 100,
      frequency: 'monthly' as const,
      nextExecution: '2024-02-01T10:00:00Z',
      isActive: true,
    };

    const mockApiResponse = {
      code: 'SUCCESS',
      data: { ...mockRule, id: 'dca_123' },
      timestamp: new Date().toISOString(),
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const result = await spendingAdapter.createRule(mockRule);

    expect(result.id).toBe('dca_123');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/dca/rules',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Idempotency-Key': expect.stringContaining('test_gold_'),
        }),
      })
    );
  });
});

describe('TradeAdapter', () => {
  beforeEach(() => {
    (fetch as any).mockReset?.();
  });

  it('getBalances returns array (mock fallback ok)', async () => {
    const rows = await tradeAdapter.getBalances();
    expect(Array.isArray(rows)).toBe(true);
  });

  it('placeOrder sets X-Idempotency-Key header', async () => {
    (global as any).fetch = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { trade: { id: 't1', price: '100.00', fee: '0.10' } },
        }),
      });

    await tradeAdapter.placeOrder({
      side: 'buy',
      base: 'BTC',
      quote: 'USDC',
      amount: 0.01,
    });
    const call = (fetch as any).mock.calls[0];
    expect(call[0]).toMatch('/trade/order');
    expect(call[1].headers['X-Idempotency-Key']).toBeDefined();
  });
});

describe('Performance SLOs', () => {
  it('handles transaction fetch under 150ms', async () => {
    const start = performance.now();
    const tx = await spendingAdapter.getTransactions();
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(150);
    expect(tx).toBeDefined();
  });
});
