import { runMigrations } from '../scripts/migrate-test.js';
import { connectTestDb, healthCheck } from './helpers/db';

/**
 * Jest Global Setup
 * Runs once before all test suites
 */

export default async function setup() {
  console.log('🚀 Setting up test environment...');

  try {
    // Load test environment variables
    require('dotenv').config({ path: '.env.test' });

    // Connect to test database
    await connectTestDb();
    
    // Verify database health
    const health = await healthCheck();
    if (!health.healthy) {
      throw new Error(`Database health check failed: ${health.message}`);
    }

    // Run migrations
    console.log('🔄 Running test database migrations...');
    await runMigrations();

    console.log('✅ Test environment setup complete');

  } catch (error) {
    console.error('❌ Test environment setup failed:', error);
    process.exit(1);
  }
};
