import { Pool } from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * Database migration runner for Supabase/Postgres
 */

async function runMigrations() {
  console.log('🔄 Running database migrations...\n');

  const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

  if (!databaseUrl || databaseUrl.includes('[YOUR-PASSWORD]')) {
    console.log('⚠️  No DATABASE_URL configured, skipping migrations');
    console.log('📝 Note: Migrations only run against real Postgres databases');
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
    console.log('✅ Connected to database');
    client.release();

    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Get list of executed migrations
    const executedResult = await pool.query(
      'SELECT filename FROM migrations ORDER BY id'
    );
    const executedMigrations = new Set(
      executedResult.rows.map(row => row.filename)
    );

    // Read migration files
    const migrationsDir = join(__dirname, '../src/db/migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📁 Found ${migrationFiles.length} migration files`);
    console.log(`✅ Already executed: ${executedMigrations.size} migrations\n`);

    let newMigrations = 0;

    for (const filename of migrationFiles) {
      if (executedMigrations.has(filename)) {
        console.log(`⏭️  Skipping ${filename} (already executed)`);
        continue;
      }

      console.log(`🔄 Executing ${filename}...`);

      const filepath = join(migrationsDir, filename);
      const sql = readFileSync(filepath, 'utf8');

      try {
        await pool.query('BEGIN');
        await pool.query(sql);
        await pool.query('INSERT INTO migrations (filename) VALUES ($1)', [
          filename,
        ]);
        await pool.query('COMMIT');

        console.log(`✅ Completed ${filename}`);
        newMigrations++;
      } catch (error) {
        await pool.query('ROLLBACK');
        throw new Error(`Failed to execute ${filename}: ${error}`);
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   • Total files: ${migrationFiles.length}`);
    console.log(`   • Previously executed: ${executedMigrations.size}`);
    console.log(`   • Newly executed: ${newMigrations}`);

    if (newMigrations === 0) {
      console.log('\n✅ Database is up to date!');
    } else {
      console.log('\n✅ Migrations completed successfully!');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
if (require.main === module) {
  runMigrations();
}

export default runMigrations;
