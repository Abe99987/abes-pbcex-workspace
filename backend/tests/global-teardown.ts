import { closeTestDb, truncateAll } from './helpers/db';

/**
 * Jest Global Teardown
 * Runs once after all test suites complete
 */

export default async function teardown() {
  console.log('🧹 Cleaning up test environment...');

  try {
    // Clean all test data
    await truncateAll();
    
    // Close database connections
    await closeTestDb();

    console.log('✅ Test environment cleanup complete');

  } catch (error) {
    console.error('❌ Test environment cleanup failed:', error);
    // Don't exit with error in teardown - tests have already completed
  }
};
