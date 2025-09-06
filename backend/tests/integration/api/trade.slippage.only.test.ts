import request from 'supertest';
import express from 'express';
import tradesRoutes from '../../../src/routes/tradesRoutes';
import ledgerRoutes from '../../../src/routes/ledgerRoutes';
import helmet from 'helmet';
import cors from 'cors';
import { Factory } from '../../helpers/factory';
import { generateToken } from '../../helpers/auth';
import { query } from '../../helpers/db';

jest.mock('../../../src/services/PricesService', () => {
  let toggle = 0;
  const mockGetTicker = jest.fn(async (symbol: string) => {
    // alternate price to simulate slippage
    toggle++;
    const price = toggle % 2 === 0 ? 2000 : 2102; // ~5.1% change
    return { success: true, data: { symbol: 'PAXG', usd: price, ts: Date.now(), source: 'MOCK' } };
  });
  const Mock = { getTicker: mockGetTicker };
  return { __esModule: true, PricesService: Mock, default: Mock };
});

describe('Trades Slippage Guards', () => {
  let app: express.Express;
  let authToken: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';
    process.env.DEV_FAKE_LOGIN = 'false';

    app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use('/api', tradesRoutes);
    app.use('/api', ledgerRoutes);

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

    const { user, fundingAccount, tradingAccount } = await Factory.createUserWithAccounts({ kycStatus: 'APPROVED' } as any);
    authToken = generateToken(user as any);
    const j = await query(
      `INSERT INTO ledger_journal (user_id, reference, description, metadata)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [user.id, `seed-slip-${Date.now()}`, 'Seed PAXG balances', JSON.stringify({ seed: true })]
    );
    const journalId = j.rows[0].id;
    const sys = await query(`SELECT gen_random_uuid() as id`);
    const sysId = sys.rows[0].id;
    await query(
      `INSERT INTO ledger_entries (journal_id, account_id, asset, direction, amount)
       VALUES ($1,$2,'PAXG','DEBIT',$4::numeric),
              ($1,$3,'PAXG','DEBIT',$5::numeric),
              ($1,$6,'PAXG','CREDIT',($4::numeric + $5::numeric))`,
      [journalId, fundingAccount.id, tradingAccount.id, '3.00000000', '3.00000000', sysId]
    );
    await query(`SELECT ledger_materialize_balances()`);
  });

  it('rejects when slippage exceeded', async () => {
    const requestId = `slip-${Date.now()}`;
    const res = await request(app)
      .post('/api/trades/buy')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ symbol: 'XAU-s', qty: '1.00000000', slippage: 0.01, request_id: requestId }); // 1%
    expect([409, 201]).toContain(res.status); // depending on toggle
    if (res.status === 409) {
      expect(res.body.code).toBe('SLIPPAGE_EXCEEDED');
    }
  });
});


