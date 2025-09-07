import request from 'supertest';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import authRoutes from '../../../src/routes/authRoutes';
import walletRoutes from '../../../src/routes/walletRoutes';
import tradesRoutes from '../../../src/routes/tradesRoutes';
import ledgerRoutes from '../../../src/routes/ledgerRoutes';
import pricesRoutes from '../../../src/routes/pricesRoutes';

import { Factory } from '../../helpers/factory';
import { generateToken } from '../../helpers/auth';
import { query } from '../../helpers/db';
import { AuthController } from '../../../src/controllers/AuthController';

describe('Smoke + Security Gates (signup → deposit stub → buy → balances → receipt)', () => {
  let app: express.Express;
  let userAuthToken: string;
  let userId: string;
  let fundingAccountId: string;
  let tradingAccountId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';
    process.env.DEV_FAKE_LOGIN = 'false';

    app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json());

    app.use('/api/auth', authRoutes);
    app.use('/api/wallet', walletRoutes);
    // Mount public price routes before authenticated trade routes to avoid accidental auth on public endpoints
    app.use('/api/prices', pricesRoutes);
    app.use('/api', tradesRoutes);
    app.use('/api', ledgerRoutes);

    // Minimal ledger schema required by Trades + Ledger routes
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

    // Create DB user + accounts and seed token
    const { user, fundingAccount, tradingAccount } = await Factory.createUserWithAccounts({ kycStatus: 'APPROVED' } as any);
    userId = user.id;
    fundingAccountId = fundingAccount.id;
    tradingAccountId = tradingAccount.id;
    userAuthToken = generateToken(user as any);

    // Seed ledger balances: give the user PAXG in funding and trading accounts
    const j = await query(
      `INSERT INTO ledger_journal (user_id, reference, description, metadata)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [userId, `seed-smoke-${Date.now()}`, 'Seed PAXG balances', JSON.stringify({ seed: true })]
    );
    const journalId = j.rows[0].id;
    const sys = await query(`SELECT gen_random_uuid() as id`);
    const sysId = sys.rows[0].id;
    await query(
      `INSERT INTO ledger_entries (journal_id, account_id, asset, direction, amount)
       VALUES ($1,$2,'PAXG','DEBIT',$4::numeric),
              ($1,$3,'PAXG','DEBIT',$5::numeric),
              ($1,$6,'PAXG','CREDIT',($4::numeric + $5::numeric))`,
      [journalId, fundingAccountId, tradingAccountId, '5.00000000', '5.00000000', sysId]
    );
    await query(`SELECT ledger_materialize_balances()`);
  });

  it('signup → deposit stub → buy → balances → receipt', async () => {
    // 1) Signup (register)
    const email = `smoke-${Date.now()}@example.com`;
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'Password1!', firstName: 'Smoke', lastName: 'Test' })
      .expect(201);
    expect(registerRes.body.code).toBe('SUCCESS');
    expect(registerRes.body.data?.accessToken).toBeDefined();

    // 2) Deposit stub for DB user (mock in-memory account resolver)
    const getUserAccountsSpy = jest.spyOn(AuthController, 'getUserAccounts').mockImplementation((uid: string) => {
      if (uid === userId) {
        return [
          { id: fundingAccountId, userId, type: 'FUNDING', name: 'Funding', isActive: true, createdAt: new Date(), updatedAt: new Date() } as any,
          { id: tradingAccountId, userId, type: 'TRADING', name: 'Trading', isActive: true, createdAt: new Date(), updatedAt: new Date() } as any,
        ];
      }
      return [] as any;
    });

    const depositRes = await request(app)
      .post('/api/wallet/deposit')
      .set('Authorization', `Bearer ${userAuthToken}`)
      .send({ asset: 'USD', amount: 1000, paymentMethod: 'BANK_TRANSFER' })
      .expect(201);
    expect(depositRes.body.code).toBe('SUCCESS');
    getUserAccountsSpy.mockRestore();

    // 3) Buy
    const reqId = `smoke-buy-${Date.now()}`;
    const buyRes = await request(app)
      .post('/api/trades/buy')
      .set('Authorization', `Bearer ${userAuthToken}`)
      .send({ symbol: 'XAU-s', qty: '0.25000000', slippage: 0.05, request_id: reqId })
      .expect(201);
    expect(buyRes.body.success).toBe(true);
    expect(buyRes.body.data?.journal_id).toBeDefined();
    expect(buyRes.body.data?.receipt_v).toBe('v1');

    // 4) Balances
    const balRes = await request(app)
      .get('/api/wallet/balances')
      .set('Authorization', `Bearer ${userAuthToken}`)
      .expect(200);
    expect(balRes.body.code).toBe('SUCCESS');
    const funding = balRes.body.data?.funding?.balances || [];
    const trading = balRes.body.data?.trading?.balances || [];
    const hasFundingPaxg = funding.some((b: any) => b.asset === 'PAXG');
    const hasTradingXau = trading.some((b: any) => b.asset === 'XAU-s');
    expect(hasFundingPaxg && hasTradingXau).toBe(true);
  });

  describe('Security gates', () => {
    it('requires authentication on trades', async () => {
      await request(app)
        .post('/api/trades/buy')
        .send({ symbol: 'XAU-s', qty: '0.10000000', slippage: 0.005, request_id: `unauth-${Date.now()}` })
        .expect(401)
        .then(res => {
          expect(res.body.code).toBe('AUTHENTICATION_ERROR');
        });
    });

    it('requires KYC approval', async () => {
      const pendingToken = generateToken({ id: userId, email: 'pending@ex.com', role: 'USER', kycStatus: 'PENDING' } as any);
      await request(app)
        .post('/api/trades/buy')
        .set('Authorization', `Bearer ${pendingToken}`)
        .send({ symbol: 'XAU-s', qty: '0.10000000', slippage: 0.005, request_id: `kyc-${Date.now()}` })
        .expect(403)
        .then(res => {
          expect(res.body.code).toBe('KYC_REQUIRED');
        });
    });

    it('enforces rate limiting on trades (expect at least one 429)', async () => {
      const results: number[] = [];
      for (let i = 0; i < 35; i++) {
        const r = await request(app)
          .post('/api/trades/buy')
          .set('Authorization', `Bearer ${userAuthToken}`)
          .send({ symbol: 'PAXG', qty: '0.01000000', slippage: 0.005, request_id: `rl-${Date.now()}-${i}` });
        results.push(r.statusCode);
        if (r.statusCode === 429) break; // stop early if limited
      }
      expect(results.some(s => s === 429)).toBe(true);
    });

    it('includes helmet security headers on public endpoints', async () => {
      const res = await request(app).get('/api/prices/symbols').expect(200);
      // A few standard helmet headers
      expect(res.headers['x-dns-prefetch-control']).toBeDefined();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });
  });
});


