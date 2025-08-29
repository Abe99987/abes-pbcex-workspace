import { Pool, Client } from 'pg';
import { env } from '../../src/config/env';

/**
 * Database Test Helpers
 * Provides utilities for managing test database state
 */

let testPool: Pool | null = null;

/**
 * Get or create test database connection pool
 */
export function getTestDb(): Pool {
  if (!testPool) {
    testPool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: env.DB_CONNECT_TIMEOUT,
    });
  }
  return testPool;
}

/**
 * Connect to test database
 */
export async function connectTestDb(): Promise<Pool> {
  const pool = getTestDb();
  
  try {
    // Test connection
    const client = await pool.connect();
    client.release();
    console.log('✅ Test database connected');
    return pool;
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    throw error;
  }
}

/**
 * Close test database connections
 */
export async function closeTestDb(): Promise<void> {
  if (testPool) {
    await testPool.end();
    testPool = null;
    console.log('✅ Test database connections closed');
  }
}

/**
 * Truncate all test tables (except migrations)
 */
export async function truncateAll(): Promise<void> {
  const pool = getTestDb();
  const client = await pool.connect();
  
  try {
    // Get all tables except schema_migrations
    const result = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != 'schema_migrations'
    `);
    
    const tables = result.rows.map(row => row.tablename);
    
    if (tables.length === 0) {
      return;
    }
    
    // Disable foreign key checks and truncate
    await client.query('SET session_replication_role = replica');
    
    for (const table of tables) {
      await client.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
    }
    
    await client.query('SET session_replication_role = DEFAULT');
    
    console.log(`🧹 Truncated ${tables.length} tables:`, tables.join(', '));
  } catch (error) {
    console.error('❌ Failed to truncate tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Run a function inside a database transaction
 * Automatically rolls back after the function completes
 */
export async function withTransaction<T>(
  fn: (client: any) => Promise<T>
): Promise<T> {
  const pool = getTestDb();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('ROLLBACK'); // Always rollback in tests
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Execute raw SQL query
 */
export async function query(sql: string, params: any[] = []): Promise<any> {
  const pool = getTestDb();
  const client = await pool.connect();
  
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
}

/**
 * Check if database tables exist
 */
export async function tablesExist(): Promise<boolean> {
  try {
    const result = await query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Run database migrations for testing
 */
export async function runMigrations(): Promise<void> {
  const pool = getTestDb();
  const client = await pool.connect();
  
  try {
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    // Simple migration runner - in production would be more sophisticated
    const migrations = [
      // Migration 001: Core tables
      {
        version: '001_initial',
        sql: `
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

          CREATE TABLE IF NOT EXISTS accounts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(20) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS balances (
            account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            asset VARCHAR(20) NOT NULL,
            amount DECIMAL(20,8) NOT NULL DEFAULT 0,
            locked_amount DECIMAL(20,8) NOT NULL DEFAULT 0,
            last_updated TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (account_id, asset)
          );

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

          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
          CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
          CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
          CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
          CREATE INDEX IF NOT EXISTS idx_kyc_records_user_id ON kyc_records(user_id);
        `
      }
    ];

    for (const migration of migrations) {
      // Check if migration already applied
      const result = await client.query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [migration.version]
      );

      if (result.rows.length === 0) {
        console.log(`🔄 Running migration: ${migration.version}`);
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [migration.version]
        );
        console.log(`✅ Applied migration: ${migration.version}`);
      }
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Seed test data
 */
export async function seedTestData(): Promise<void> {
  // This would insert common test fixtures
  // For now, let the test factories handle data creation
  console.log('🌱 Test data seeding placeholder');
}

/**
 * Database health check for tests
 */
export async function healthCheck(): Promise<{ healthy: boolean; message: string }> {
  try {
    const result = await query('SELECT NOW() as timestamp');
    return {
      healthy: true,
      message: `Connected at ${result.rows[0].timestamp}`,
    };
  } catch (error) {
    return {
      healthy: false,
      message: `Database connection failed: ${(error as Error).message}`,
    };
  }
}

/**
 * Get table row count (for test verification)
 */
export async function getRowCount(tableName: string): Promise<number> {
  const result = await query(`SELECT COUNT(*) as count FROM "${tableName}"`);
  return parseInt(result.rows[0].count);
}

/**
 * Create test transaction helper for isolated testing
 */
export class TestTransaction {
  private client: any = null;
  
  async begin(): Promise<void> {
    const pool = getTestDb();
    this.client = await pool.connect();
    await this.client.query('BEGIN');
  }
  
  async rollback(): Promise<void> {
    if (this.client) {
      await this.client.query('ROLLBACK');
      this.client.release();
      this.client = null;
    }
  }
  
  async query(sql: string, params: any[] = []): Promise<any> {
    if (!this.client) {
      throw new Error('Transaction not started');
    }
    return await this.client.query(sql, params);
  }
}

export default {
  connectTestDb,
  closeTestDb,
  truncateAll,
  withTransaction,
  query,
  tablesExist,
  runMigrations,
  seedTestData,
  healthCheck,
  getRowCount,
  TestTransaction,
};
