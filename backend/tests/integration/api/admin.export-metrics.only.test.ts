import request from 'supertest';
import express from 'express';
import adminRoutes from '../../../src/routes/adminRoutes';
import ledgerRoutes from '../../../src/routes/ledgerRoutes';
import helmet from 'helmet';
import cors from 'cors';
import { Factory } from '../../helpers/factory';
import { generateToken } from '../../helpers/auth';
import { query } from '../../helpers/db';

describe('Admin export CSV and metrics (shape only)', () => {
  let app: express.Express;
  let adminToken: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';
    process.env.DEV_FAKE_LOGIN = 'false';

    app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use('/api/admin', adminRoutes);
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
    `);

    const admin = await Factory.createAdminUser({ email: `admin+${Date.now()}@pbcex.com` } as any);
    adminToken = generateToken(admin as any);
  });

  it('metrics endpoint exists and returns JSON', async () => {
    const res = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body).toBeDefined();
  });

  it('export balances CSV has text/csv and header row', async () => {
    const res = await request(app)
      .get('/api/admin/export/balances')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.headers['content-type']).toContain('text/csv');
    const lines = String(res.text || '').trim().split('\n');
    expect(lines[0]).toBe('account_id,asset,balance,updated_at');
  });
});


