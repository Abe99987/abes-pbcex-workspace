#!/usr/bin/env node

/**
 * Test Database Migration Script
 * Applies migrations to the test database
 */

const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.test') });

const TEST_DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'pbcex_test',
  user: process.env.DB_USER || 'test_user',
  password: process.env.DB_PASSWORD || 'test_pass',
};

async function createDatabaseIfNotExists() {
  // Connect to postgres database to create test database
  const client = new Client({
    ...TEST_DB_CONFIG,
    database: 'postgres', // Connect to postgres db first
  });

  try {
    await client.connect();
    console.log('📡 Connected to PostgreSQL');

    // Check if test database exists
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [TEST_DB_CONFIG.database]
    );

    if (result.rows.length === 0) {
      console.log(`🗃️  Creating test database: ${TEST_DB_CONFIG.database}`);
      await client.query(`CREATE DATABASE "${TEST_DB_CONFIG.database}"`);
      console.log('✅ Test database created');
    } else {
      console.log(`✅ Test database already exists: ${TEST_DB_CONFIG.database}`);
    }
  } catch (error) {
    console.error('❌ Error creating database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function runMigrations() {
  const client = new Client(TEST_DB_CONFIG);

  try {
    await client.connect();
    console.log(`📡 Connected to test database: ${TEST_DB_CONFIG.database}`);

    // Create migrations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Define migrations
    const migrations = [
      {
        version: '001_initial',
        name: 'Initial Schema',
        sql: `
          -- Users table
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            role VARCHAR(20) NOT NULL DEFAULT 'USER',
            kyc_status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
            email_verified BOOLEAN DEFAULT FALSE,
            phone VARCHAR(20),
            phone_verified BOOLEAN DEFAULT FALSE,
            two_factor_enabled BOOLEAN DEFAULT FALSE,
            last_login_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          -- Accounts table
          CREATE TABLE IF NOT EXISTS accounts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(20) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          -- Balances table
          CREATE TABLE IF NOT EXISTS balances (
            account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            asset VARCHAR(20) NOT NULL,
            amount DECIMAL(20,8) NOT NULL DEFAULT 0,
            locked_amount DECIMAL(20,8) NOT NULL DEFAULT 0,
            last_updated TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (account_id, asset)
          );

          -- Trades table
          CREATE TABLE IF NOT EXISTS trades (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id),
            from_asset VARCHAR(20) NOT NULL,
            to_asset VARCHAR(20) NOT NULL,
            from_amount DECIMAL(20,8) NOT NULL,
            to_amount DECIMAL(20,8) NOT NULL,
            exchange_rate DECIMAL(20,8) NOT NULL,
            fee_amount DECIMAL(20,8) NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
            executed_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );

          -- Orders table
          CREATE TABLE IF NOT EXISTS orders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id),
            product_id VARCHAR(50) NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price DECIMAL(10,2) NOT NULL,
            total_price DECIMAL(10,2) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
            shipping_address JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          -- KYC Records table
          CREATE TABLE IF NOT EXISTS kyc_records (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(20) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
            submission_data JSONB,
            review_notes TEXT,
            reviewed_by UUID REFERENCES users(id),
            reviewed_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          -- Create indexes for performance
          CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
          CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
          CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
          CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
          CREATE INDEX IF NOT EXISTS idx_balances_asset ON balances(asset);
          CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
          CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
          CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
          CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
          CREATE INDEX IF NOT EXISTS idx_kyc_records_user_id ON kyc_records(user_id);
          CREATE INDEX IF NOT EXISTS idx_kyc_records_status ON kyc_records(status);
        `
      },
      {
        version: '002_vault_phase3',
        name: 'Phase-3 Vault Tables',
        sql: `
          -- Vault Inventory table
          CREATE TABLE IF NOT EXISTS vault_inventory (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            metal VARCHAR(2) NOT NULL CHECK (metal IN ('AU', 'AG', 'PT', 'PD', 'CU')),
            sku VARCHAR(50) UNIQUE NOT NULL,
            format VARCHAR(10) NOT NULL CHECK (format IN ('BAR', 'COIN', 'SHEET', 'COIL', 'ROUND')),
            weight DECIMAL(10,4) NOT NULL CHECK (weight > 0),
            purity DECIMAL(6,4) NOT NULL CHECK (purity > 0 AND purity <= 1),
            vault_location VARCHAR(100) NOT NULL,
            qty_available INTEGER NOT NULL DEFAULT 0 CHECK (qty_available >= 0),
            qty_reserved INTEGER NOT NULL DEFAULT 0 CHECK (qty_reserved >= 0),
            unit_cost DECIMAL(10,2) NOT NULL CHECK (unit_cost > 0),
            last_restocked TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            metadata JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          -- Redemption Requests table
          CREATE TABLE IF NOT EXISTS redemption_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            asset VARCHAR(20) NOT NULL,
            asset_amount DECIMAL(20,8) NOT NULL CHECK (asset_amount > 0),
            vault_sku VARCHAR(50) NOT NULL,
            requested_qty INTEGER NOT NULL CHECK (requested_qty > 0),
            allocated_qty INTEGER NOT NULL DEFAULT 0 CHECK (allocated_qty >= 0),
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
            shipping_address JSONB NOT NULL,
            vault_location VARCHAR(100) NOT NULL,
            estimated_value DECIMAL(10,2) NOT NULL CHECK (estimated_value > 0),
            lock_expires_at TIMESTAMPTZ NOT NULL,
            approved_by UUID REFERENCES users(id),
            approved_at TIMESTAMPTZ,
            shipping_carrier VARCHAR(50),
            tracking_number VARCHAR(100),
            shipped_at TIMESTAMPTZ,
            delivered_at TIMESTAMPTZ,
            failure_reason TEXT,
            metadata JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          -- Vault Audit Log table
          CREATE TABLE IF NOT EXISTS vault_audit_log (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            inventory_id UUID NOT NULL REFERENCES vault_inventory(id),
            action VARCHAR(20) NOT NULL CHECK (action IN ('RESTOCK', 'RESERVE', 'RELEASE', 'ALLOCATE', 'SHIPPED', 'RETURNED')),
            qty_change INTEGER NOT NULL,
            previous_qty INTEGER NOT NULL,
            new_qty INTEGER NOT NULL,
            user_id UUID REFERENCES users(id),
            redemption_id UUID REFERENCES redemption_requests(id),
            notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          -- Indexes for Phase-3 tables
          CREATE INDEX IF NOT EXISTS idx_vault_inventory_metal ON vault_inventory(metal);
          CREATE INDEX IF NOT EXISTS idx_vault_inventory_sku ON vault_inventory(sku);
          CREATE INDEX IF NOT EXISTS idx_vault_inventory_active ON vault_inventory(is_active);
          CREATE INDEX IF NOT EXISTS idx_redemption_requests_user_id ON redemption_requests(user_id);
          CREATE INDEX IF NOT EXISTS idx_redemption_requests_status ON redemption_requests(status);
          CREATE INDEX IF NOT EXISTS idx_vault_audit_log_inventory_id ON vault_audit_log(inventory_id);
          CREATE INDEX IF NOT EXISTS idx_vault_audit_log_action ON vault_audit_log(action);
        `
      }
    ];

    // Apply each migration
    for (const migration of migrations) {
      // Check if migration already applied
      const result = await client.query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [migration.version]
      );

      if (result.rows.length === 0) {
        console.log(`🔄 Applying migration: ${migration.name} (${migration.version})`);
        
        // Run migration SQL
        await client.query(migration.sql);
        
        // Record migration as applied
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [migration.version]
        );
        
        console.log(`✅ Applied migration: ${migration.name}`);
      } else {
        console.log(`⏭️  Migration already applied: ${migration.name}`);
      }
    }

    console.log('🎉 All migrations completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function insertSampleData() {
  const client = new Client(TEST_DB_CONFIG);

  try {
    await client.connect();
    
    // Insert sample vault inventory for testing
    await client.query(`
      INSERT INTO vault_inventory (metal, sku, format, weight, purity, vault_location, qty_available, unit_cost, metadata) 
      VALUES 
        ('AU', 'AU-EAGLE-1OZ', 'COIN', '1.0000', '0.9167', 'VAULT-MAIN', 100, '2150.00', '{"mint": "US Mint", "year": "2024"}'),
        ('AG', 'AG-EAGLE-1OZ', 'COIN', '1.0000', '0.999', 'VAULT-MAIN', 500, '32.50', '{"mint": "US Mint", "year": "2024"}'),
        ('AU', 'AU-BAR-1OZ', 'BAR', '1.0000', '0.9999', 'VAULT-MAIN', 200, '2140.00', '{"refinery": "PAMP Suisse"}')
      ON CONFLICT (sku) DO NOTHING
    `);

    console.log('✅ Sample vault inventory data inserted');

  } catch (error) {
    console.error('❌ Failed to insert sample data:', error);
  } finally {
    await client.end();
  }
}

async function main() {
  try {
    console.log('🚀 Starting test database migration...');
    
    await createDatabaseIfNotExists();
    await runMigrations();
    await insertSampleData();
    
    console.log('✅ Test database migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runMigrations,
  createDatabaseIfNotExists,
  insertSampleData,
};
