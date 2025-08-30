import { Pool } from 'pg';
import seedDevData from './seed-dev';

/**
 * Supabase/Postgres seeder - extends in-memory seeder with database operations
 */

const DEV_USER_ID = '11111111-1111-1111-1111-111111111111';

async function seedSupabase() {
  console.log('🌱 Seeding Supabase database...\n');

  const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

  if (!databaseUrl || databaseUrl.includes('[YOUR-PASSWORD]')) {
    console.log(
      '⚠️  No DATABASE_URL configured, falling back to in-memory seed'
    );
    await seedDevData();
    return;
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to Supabase database');
    client.release();

    // 1. Seed profiles
    console.log('Creating dev user profile...');
    await pool.query(
      `
      INSERT INTO profiles (id, email, display_name, phone, kyc_status, two_factor_enabled)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        phone = EXCLUDED.phone,
        kyc_status = EXCLUDED.kyc_status,
        two_factor_enabled = EXCLUDED.two_factor_enabled,
        updated_at = NOW()
    `,
      [
        DEV_USER_ID,
        'dev@local.test',
        'Dev User',
        '+1-555-0123',
        'APPROVED',
        false,
      ]
    );

    // 2. Seed accounts
    console.log('Creating user accounts...');
    const fundingAccountId = '22222222-2222-2222-2222-222222222222';
    const tradingAccountId = '33333333-3333-3333-3333-333333333333';

    await pool.query(
      `
      INSERT INTO accounts (id, user_id, type, label)
      VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)
      ON CONFLICT (user_id, type, label) DO UPDATE SET
        updated_at = NOW()
    `,
      [
        fundingAccountId,
        DEV_USER_ID,
        'FUNDING',
        'Primary Funding',
        tradingAccountId,
        DEV_USER_ID,
        'TRADING',
        'Primary Trading',
      ]
    );

    // 3. Seed balances
    console.log('Adding initial balances...');
    const balances = [
      [fundingAccountId, 'USD', '10000.00', '10000.00'],
      [fundingAccountId, 'PAXG', '2.5000', '5125.63'],
      [fundingAccountId, 'USDC', '5000.00', '5000.00'],
      [tradingAccountId, 'XAU-s', '1.2500', '2562.81'],
      [tradingAccountId, 'XAG-s', '150.0000', '3712.50'],
      [tradingAccountId, 'XPT-s', '0.8000', '780.40'],
      [tradingAccountId, 'XPD-s', '0.3000', '345.23'],
      [tradingAccountId, 'XCU-s', '80.0000', '660.00'],
    ];

    for (const [accountId, asset, amount, usdValue] of balances) {
      await pool.query(
        `
        INSERT INTO balances (account_id, asset, amount, usd_value)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (account_id, asset) DO UPDATE SET
          amount = EXCLUDED.amount,
          usd_value = EXCLUDED.usd_value,
          updated_at = NOW()
      `,
        [accountId, asset, amount, usdValue]
      );
    }

    // 4. Seed transaction history (last 7-10 days)
    console.log('Adding sample transaction history...');
    const now = new Date();
    const transactions = [
      [
        DEV_USER_ID,
        fundingAccountId,
        new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        'USD',
        '10000.00',
        '10000.00',
        'DEPOSIT',
        'COMPLETED',
        '0.00',
        'INIT_USD_001',
        'Initial USD deposit for development',
      ],
      [
        DEV_USER_ID,
        fundingAccountId,
        new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        'PAXG',
        '2.5000',
        '5125.63',
        'DEPOSIT',
        'COMPLETED',
        '25.00',
        'INIT_PAXG_001',
        'Initial PAXG deposit via Paxos',
      ],
      [
        DEV_USER_ID,
        tradingAccountId,
        new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        'XAU-s',
        '1.2500',
        '2562.81',
        'CONVERSION',
        'COMPLETED',
        '12.81',
        'CONV_PAXG_XAU_001',
        'Converted PAXG to synthetic gold for trading',
      ],
      [
        DEV_USER_ID,
        tradingAccountId,
        new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        'XAG-s',
        '150.0000',
        '3712.50',
        'TRADE',
        'COMPLETED',
        '18.56',
        'TRADE_XAU_XAG_001',
        'Traded XAU-s for XAG-s (market order)',
      ],
      [
        DEV_USER_ID,
        tradingAccountId,
        new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        'XPT-s',
        '0.8000',
        '780.40',
        'TRADE',
        'COMPLETED',
        '3.90',
        'TRADE_XAG_XPT_001',
        'Traded XAG-s for XPT-s (limit order)',
      ],
      [
        DEV_USER_ID,
        fundingAccountId,
        new Date(now.getTime() - 12 * 60 * 60 * 1000),
        'USDC',
        '5000.00',
        '5000.00',
        'DEPOSIT',
        'COMPLETED',
        '0.00',
        'WIRE_USDC_001',
        'Bank wire converted to USDC',
      ],
    ];

    for (const [
      userId,
      accountId,
      ts,
      asset,
      amount,
      usdValue,
      type,
      status,
      feeUsd,
      reference,
      description,
    ] of transactions) {
      await pool.query(
        `
        INSERT INTO transactions (user_id, account_id, ts, asset, amount, usd_value, type, status, fee_usd, reference, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING
      `,
        [
          userId,
          accountId,
          ts,
          asset,
          amount,
          usdValue,
          type,
          status,
          feeUsd,
          reference,
          description,
        ]
      );
    }

    // 5. Seed trade history
    console.log('Adding sample trade history...');
    const trades = [
      [
        DEV_USER_ID,
        new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        'XAUUSD',
        'SELL',
        'MARKET',
        '2051.25',
        '0.5000',
        '0.5000',
        '2.05',
        'USD',
        'FILLED',
      ],
      [
        DEV_USER_ID,
        new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        'XAGUSD',
        'BUY',
        'MARKET',
        '24.75',
        '150.0000',
        '150.0000',
        '18.56',
        'USD',
        'FILLED',
      ],
      [
        DEV_USER_ID,
        new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        'XPTUSD',
        'BUY',
        'LIMIT',
        '975.50',
        '0.8000',
        '0.8000',
        '3.90',
        'USD',
        'FILLED',
      ],
      [
        DEV_USER_ID,
        new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        'XPDUSD',
        'BUY',
        'LIMIT',
        '1150.75',
        '0.3000',
        '0.1500',
        '1.73',
        'USD',
        'PARTIALLY_FILLED',
      ],
      [
        DEV_USER_ID,
        new Date(now.getTime() - 8 * 60 * 60 * 1000),
        'XAUUSD',
        'BUY',
        'LIMIT',
        '2040.00',
        '0.2500',
        '0.0000',
        '0.00',
        'USD',
        'PENDING',
      ],
      [
        DEV_USER_ID,
        new Date(now.getTime() - 4 * 60 * 60 * 1000),
        'XAGUSD',
        'SELL',
        'STOP_LOSS',
        '23.50',
        '50.0000',
        '0.0000',
        '0.00',
        'USD',
        'CANCELLED',
      ],
    ];

    for (const [
      userId,
      ts,
      pair,
      side,
      orderType,
      price,
      amount,
      filled,
      fee,
      feeAsset,
      status,
    ] of trades) {
      await pool.query(
        `
        INSERT INTO trades (user_id, ts, pair, side, order_type, price, amount, filled, fee, fee_asset, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING
      `,
        [
          userId,
          ts,
          pair,
          side,
          orderType,
          price,
          amount,
          filled,
          fee,
          feeAsset,
          status,
        ]
      );
    }

    console.log('\n📊 Supabase Seeding Summary:');
    console.log('============================');

    const profilesCount = await pool.query('SELECT COUNT(*) FROM profiles');
    const accountsCount = await pool.query('SELECT COUNT(*) FROM accounts');
    const balancesCount = await pool.query('SELECT COUNT(*) FROM balances');
    const transactionsCount = await pool.query(
      'SELECT COUNT(*) FROM transactions'
    );
    const tradesCount = await pool.query('SELECT COUNT(*) FROM trades');

    console.log(`👥 Profiles: ${profilesCount.rows[0].count}`);
    console.log(`🏦 Accounts: ${accountsCount.rows[0].count}`);
    console.log(`💰 Balances: ${balancesCount.rows[0].count}`);
    console.log(`📋 Transactions: ${transactionsCount.rows[0].count}`);
    console.log(`📊 Trades: ${tradesCount.rows[0].count}`);

    console.log('\n🎯 Ready for testing:');
    console.log('  • Visit http://localhost:3000/dashboard');
    console.log('  • Login with: dev@local.test / pbcextest1');
    console.log('  • Test: /wallet/transactions, /wallet/orders');

    console.log('\n✅ Supabase database seeded successfully!\n');

    // Also run in-memory seed for controllers that still use it
    console.log('Running in-memory seed for backward compatibility...');
    await seedDevData();
  } catch (error) {
    console.error('❌ Failed to seed Supabase database:', error);
    console.log('\n⚠️  Falling back to in-memory seed...');
    await seedDevData();
  } finally {
    await pool.end();
  }
}

// Run the seeder
if (require.main === module) {
  seedSupabase();
}

export default seedSupabase;
