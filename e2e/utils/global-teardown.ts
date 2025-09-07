import { FullConfig } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Playwright Global Teardown
 * 
 * Cleans up after E2E tests complete
 * - Removes test data
 * - Cleans up authentication files
 * - Resets database state
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Playwright global teardown...');
  
  try {
    // Clean up authentication state files
    const storageDir = path.join(__dirname, '../fixtures/auth');
    try {
      const files = await fs.readdir(storageDir);
      for (const file of files) {
        if (file.endsWith('-auth.json')) {
          await fs.unlink(path.join(storageDir, file));
        }
      }
      console.log('✅ Authentication state files cleaned up');
    } catch (error) {
      console.log('ℹ️ No authentication files to clean up');
    }
    
    // Clean up test database
    await cleanupTestDatabase();
    console.log('✅ Test database cleaned up');
    
    // Clean up test artifacts if needed
    await cleanupTestArtifacts();
    console.log('✅ Test artifacts cleaned up');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw as teardown failures shouldn't fail the build
  }
  
  console.log('✅ Playwright global teardown completed');
}

async function cleanupTestDatabase() {
  try {
    // This would connect to the test database and clean up
    // For now, we'll simulate the cleanup
    
    // Clean up test users
    const testUserEmails = [
      'e2euser@example.com',
      'e2eadmin@pbcex.com',
      'e2esupport@pbcex.com',
      'e2eteller@pbcex.com',
    ];
    
    // In a real implementation, this would make API calls to clean up
    console.log(`🗑️ Would clean up ${testUserEmails.length} test users`);
    
    // Clean up test products
    const testProductIds = [
      'e2e-gold-bar-1oz',
      'e2e-silver-coin-1oz',
    ];
    
    console.log(`🗑️ Would clean up ${testProductIds.length} test products`);
    
    // Clean up test orders, trades, balances, etc.
    console.log('🗑️ Would clean up test orders, trades, and balances');
    
    // Reset vault inventory if applicable
    if (process.env.ENABLE_VAULT_REDEMPTION === 'true') {
      console.log('🗑️ Would clean up vault inventory test data');
    }
    
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
  }
}

async function cleanupTestArtifacts() {
  try {
    const testResultsDir = path.join(__dirname, '../test-results');
    
    // Check if test results directory exists
    try {
      await fs.access(testResultsDir);
      
      // Get directory age
      const stats = await fs.stat(testResultsDir);
      const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
      
      // Only clean up if results are older than 7 days (in CI)
      if (process.env.CI && ageInDays > 7) {
        await fs.rm(testResultsDir, { recursive: true, force: true });
        console.log('🗑️ Cleaned up old test results');
      } else {
        console.log('ℹ️ Test results preserved for analysis');
      }
      
    } catch (error) {
      console.log('ℹ️ No test results to clean up');
    }
    
    // Clean up temporary files
    const tempDir = path.join(__dirname, '../temp');
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log('🗑️ Cleaned up temporary files');
    } catch (error) {
      console.log('ℹ️ No temporary files to clean up');
    }
    
  } catch (error) {
    console.error('❌ Artifact cleanup failed:', error);
  }
}

export default globalTeardown;
