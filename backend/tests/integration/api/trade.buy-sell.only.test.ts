import request from 'supertest';
import express from 'express';
import tradesRoutes from '../../../src/routes/tradesRoutes';
import ledgerRoutes from '../../../src/routes/ledgerRoutes';
import { generateToken } from '../../helpers/auth';
import { Factory } from '../../helpers/factory';
import helmet from 'helmet';
import cors from 'cors';
import { query } from '../../helpers/db';

jest.mock('../../../src/services/PricesService', () => {
  const mockGetTicker = jest.fn(async (symbol: string) => ({ success: true, data: { usd: 2000 } }));
  const Mock = { getTicker: mockGetTicker };
  return { __esModule: true, PricesService: Mock, default: Mock };
});

describe('Trades API (focused buy/sell)', () => {
  let authToken: string;
  let app: express.Express;

  beforeAll(async () => {
    // Minimal ledger schema required by TradesController/LedgerService
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
    process.env.NODE_ENV = 'development';
    process.env.DEV_FAKE_LOGIN = 'false';
    app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use('/api', tradesRoutes);
    app.use('/api', ledgerRoutes);

    // Create a fresh user with funding/trading accounts and seed ledger balances
    const { user, fundingAccount, tradingAccount } = await Factory.createUserWithAccounts({ kycStatus: 'APPROVED' } as any);
    authToken = generateToken(user as any);

    // Seed ledger: give the user PAXG in both funding and trading accounts via a balanced journal
    const j = await query(
      `INSERT INTO ledger_journal (user_id, reference, description, metadata)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [user.id, `seed-${Date.now()}`, 'Seed PAXG balances', JSON.stringify({ seed: true })]
    );
    const journalId = j.rows[0].id;
    // Create a synthetic system account as counterparty for balance seeding
    const sys = await query(`SELECT gen_random_uuid() as id`);
    const sysId = sys.rows[0].id;
    await query(
      `INSERT INTO ledger_entries (journal_id, account_id, asset, direction, amount)
       VALUES ($1,$2,'PAXG','DEBIT',$3),
              ($1,$4,'PAXG','DEBIT',$3),
              ($1,$5,'PAXG','CREDIT',$6)`,
      [journalId, fundingAccount.id, '5.00000000', tradingAccount.id, sysId, '10.00000000']
    );
    await query(`SELECT ledger_materialize_balances()`);
  });

  it('POST /api/trades/buy should create a receipt and be idempotent', async () => {
    const requestId = `buy-${Date.now()}`;
    const body = { symbol: 'XAU-s', qty: '1.00000000', slippage: 0.005, request_id: requestId };

    const res1 = await request(app)
      .post('/api/trades/buy')
      .set('Authorization', `Bearer ${authToken}`)
      .send(body)
      .expect(201);

    expect(res1.body.success).toBe(true);
    expect(res1.body.data).toMatchObject({
      symbol: 'XAU-s',
      qty: '1.00000000',
      request_id: requestId,
      side: 'BUY',
    });
    expect(res1.body.data.journal_id).toBeDefined();
    expect(res1.body.data.price).toBeDefined();
    expect(res1.body.data.fee).toBeDefined();
    expect(res1.body.data.ts).toBeDefined();

    // Repeat same request_id → 200 idempotent response
    const res2 = await request(app)
      .post('/api/trades/buy')
      .set('Authorization', `Bearer ${authToken}`)
      .send(body)
      .expect(200);

    expect(res2.body.success).toBe(true);
    expect(res2.body.data.request_id).toBe(requestId);
  });

  it('POST /api/trades/sell should create a receipt and be idempotent', async () => {
    const requestId = `sell-${Date.now()}`;
    const body = { symbol: 'XAU-s', qty: '0.50000000', slippage: 0.005, request_id: requestId };

    const res1 = await request(app)
      .post('/api/trades/sell')
      .set('Authorization', `Bearer ${authToken}`)
      .send(body)
      .expect(201);

    expect(res1.body.success).toBe(true);
    expect(res1.body.data).toMatchObject({
      symbol: 'XAU-s',
      qty: '0.50000000',
      request_id: requestId,
      side: 'SELL',
    });
    expect(res1.body.data.journal_id).toBeDefined();

    const res2 = await request(app)
      .post('/api/trades/sell')
      .set('Authorization', `Bearer ${authToken}`)
      .send(body)
      .expect(200);

    expect(res2.body.success).toBe(true);
    expect(res2.body.data.request_id).toBe(requestId);
  });

  it('ledger trial-balance should be zero per asset after trades', async () => {
    const res = await request(app)
      .get('/api/ledger/trial-balance')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const rows: Array<{ asset: string; difference: string }> = res.body.data || [];
    for (const row of rows) {
      expect(parseFloat(row.difference)).toBeCloseTo(0, 8);
    }
  });
});


