/*
 * Perf Baseline Script
 * Measures p50/p95/p99 latencies for:
 *  - POST /api/trades/buy
 *  - POST /api/trades/sell
 *  - GET  /api/prices/symbols
 * Run: ts-node -r tsconfig-paths/register scripts/perf-baseline.ts
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import request from 'supertest';

import tradesRoutes from '../src/routes/tradesRoutes';
import ledgerRoutes from '../src/routes/ledgerRoutes';
import pricesRoutes from '../src/routes/pricesRoutes';

import { Factory } from '../tests/helpers/factory';
import { generateToken } from '../tests/helpers/auth';
import { query, runMigrations } from '../tests/helpers/db';

type Summary = {
  name: string;
  count: number;
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
};

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(Math.max((p / 100) * (sorted.length - 1), 0), sorted.length - 1);
  const low = Math.floor(idx);
  const high = Math.ceil(idx);
  if (low === high) return sorted[low]!;
  const weight = idx - low;
  const lo = sorted[low]!;
  const hi = sorted[high]!;
  return lo * (1 - weight) + hi * weight;
}

function summarize(name: string, samples: number[]): Summary {
  const arr = samples.slice().sort((a, b) => a - b);
  return {
    name,
    count: arr.length,
    p50: Math.round(percentile(arr, 50)),
    p95: Math.round(percentile(arr, 95)),
    p99: Math.round(percentile(arr, 99)),
    min: arr[0] ?? 0,
    max: arr[arr.length - 1] ?? 0,
  };
}

async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const startedAt = Date.now();
  process.env.NODE_ENV = 'development';
  process.env.DEV_FAKE_LOGIN = 'false';

  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use('/api', tradesRoutes);
  app.use('/api', ledgerRoutes);
  app.use('/api/prices', pricesRoutes);

  // Ensure minimal ledger schema exists
  await runMigrations();
  await query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE TABLE IF NOT EXISTS ledger_journal (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      user_id UUID,
      reference VARCHAR(100),
      description VARCHAR(500),
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ledger_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      journal_id UUID NOT NULL REFERENCES ledger_journal(id) ON DELETE CASCADE,
      account_id UUID NOT NULL,
      asset VARCHAR(20) NOT NULL,
      direction VARCHAR(6) NOT NULL CHECK (direction IN ('DEBIT','CREDIT')),
      amount DECIMAL(20,8) NOT NULL CHECK (amount > 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ledger_balances (
      account_id UUID NOT NULL,
      asset VARCHAR(20) NOT NULL,
      balance DECIMAL(20,8) NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (account_id, asset)
    );
    CREATE OR REPLACE VIEW ledger_trial_balance AS
    SELECT asset,
           SUM(CASE WHEN direction = 'DEBIT' THEN amount ELSE 0 END) AS total_debits,
           SUM(CASE WHEN direction = 'CREDIT' THEN amount ELSE 0 END) AS total_credits,
           (SUM(CASE WHEN direction = 'DEBIT' THEN amount ELSE 0 END) -
            SUM(CASE WHEN direction = 'CREDIT' THEN amount ELSE 0 END)) AS difference
    FROM ledger_entries
    GROUP BY asset;
    CREATE OR REPLACE FUNCTION ledger_materialize_balances()
    RETURNS VOID AS $$
    BEGIN
      DELETE FROM ledger_balances;
      INSERT INTO ledger_balances (account_id, asset, balance, updated_at)
      SELECT account_id,
             asset,
             ROUND(SUM(CASE WHEN direction = 'DEBIT' THEN amount ELSE -amount END)::numeric, 8) AS balance,
             NOW()
      FROM ledger_entries
      GROUP BY account_id, asset;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Seed user/accounts and balances
  const { user, fundingAccount, tradingAccount } = await Factory.createUserWithAccounts({ kycStatus: 'APPROVED' } as any);
  const authToken = generateToken(user as any);

  const j = await query(
    `INSERT INTO ledger_journal (user_id, reference, description, metadata)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [user.id, `seed-perf-${Date.now()}`, 'Seed PAXG balances', JSON.stringify({ seed: true })]
  );
  const journalId = j.rows[0].id;
  const sys = await query(`SELECT gen_random_uuid() as id`);
  const sysId = sys.rows[0].id;
  await query(
    `INSERT INTO ledger_entries (journal_id, account_id, asset, direction, amount)
     VALUES ($1,$2,'PAXG','DEBIT',$4::numeric),
            ($1,$3,'PAXG','DEBIT',$5::numeric),
            ($1,$6,'PAXG','CREDIT',($4::numeric + $5::numeric))`,
    [journalId, fundingAccount.id, tradingAccount.id, '6.00000000', '6.00000000', sysId]
  );
  await query(`SELECT ledger_materialize_balances()`);

  const buys: number[] = [];
  const sells: number[] = [];
  const symbols: number[] = [];

  const ITER = 10; // keep under trade rate limit (30/min)

  for (let i = 0; i < ITER; i++) {
    const buyStart = Date.now();
    const buyRes = await request(app)
      .post('/api/trades/buy')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ symbol: 'XAU-s', qty: '0.10000000', slippage: 0.005, request_id: `perf-buy-${Date.now()}-${i}` });
    buys.push(Date.now() - buyStart);
    if (buyRes.status === 429) break; // respect rate limiting
    await sleep(50);
  }

  for (let i = 0; i < ITER; i++) {
    const sellStart = Date.now();
    const sellRes = await request(app)
      .post('/api/trades/sell')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ symbol: 'XAU-s', qty: '0.05000000', slippage: 0.005, request_id: `perf-sell-${Date.now()}-${i}` });
    sells.push(Date.now() - sellStart);
    if (sellRes.status === 429) break;
    await sleep(50);
  }

  for (let i = 0; i < ITER; i++) {
    const t0 = Date.now();
    await request(app).get('/api/prices/symbols');
    symbols.push(Date.now() - t0);
    await sleep(20);
  }

  const report = {
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    durationsMs: {
      tradesBuy: summarize('trades.buy', buys),
      tradesSell: summarize('trades.sell', sells),
      pricesSymbols: summarize('prices.symbols', symbols),
    },
  } as const;

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report, null, 2));
}

main().then(() => process.exit(0)).catch(err => {
  // eslint-disable-next-line no-console
  console.error('perf-baseline error:', err);
  process.exit(1);
});


