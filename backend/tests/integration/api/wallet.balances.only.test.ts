import request from 'supertest';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import walletRoutes from '../../../src/routes/walletRoutes';
import { Factory } from '../../helpers/factory';
import { generateToken } from '../../helpers/auth';
import { query } from '../../helpers/db';

describe('Wallet API (focused balances)', () => {
  let app: express.Express;
  let authToken: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';
    process.env.DEV_FAKE_LOGIN = 'false';

    app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use('/api/wallet', walletRoutes);

    const { user, fundingAccount, tradingAccount } = await Factory.createUserWithAccounts({ kycStatus: 'APPROVED' } as any);
    authToken = generateToken(user as any);

    // Seed ledger balances for funding (PAXG) and trading (appears as XAU-s)
    const j = await query(
      `INSERT INTO ledger_journal (user_id, reference, description, metadata)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [user.id, `seed-wallet-${Date.now()}`, 'Seed wallet PAXG balances', JSON.stringify({ seed: true })]
    );
    const journalId = j.rows[0].id;
    const sys = await query(`SELECT gen_random_uuid() as id`);
    const sysId = sys.rows[0].id;
    await query(
      `INSERT INTO ledger_entries (journal_id, account_id, asset, direction, amount)
       VALUES ($1,$2,'PAXG','DEBIT',$4::numeric),
              ($1,$3,'PAXG','DEBIT',$5::numeric),
              ($1,$6,'PAXG','CREDIT',($4::numeric + $5::numeric))`,
      [journalId, fundingAccount.id, tradingAccount.id, '3.00000000', '2.00000000', sysId]
    );
    await query(`SELECT ledger_materialize_balances()`);
  });

  it('GET /api/wallet/balances returns funding PAXG and trading XAU-s', async () => {
    const res = await request(app)
      .get('/api/wallet/balances')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.code).toBe('SUCCESS');
    const funding = res.body.data?.funding?.balances || [];
    const trading = res.body.data?.trading?.balances || [];

    const hasFundingPaxg = funding.some((b: any) => b.asset === 'PAXG');
    const hasTradingXau = trading.some((b: any) => b.asset === 'XAU-s');
    expect(hasFundingPaxg).toBe(true);
    expect(hasTradingXau).toBe(true);
  });
});


