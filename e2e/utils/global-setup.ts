import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';

/**
 * Playwright Global Setup
 * 
 * Prepares the test environment before running E2E tests
 * - Sets up test database
 * - Creates test users with different roles
 * - Stores authentication states for reuse
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Playwright global setup...');
  
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
  
  // Create test data directory
  const storageDir = path.join(__dirname, '../fixtures/auth');
  await fs.mkdir(storageDir, { recursive: true });
  
  // Launch browser for setup operations
  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL,
  });
  
  try {
    // Setup test users with different roles
    await setupTestUsers(context, storageDir);
    console.log('✅ Test users created and authenticated');
    
    // Setup test data
    await setupTestData(context);
    console.log('✅ Test data initialized');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
  
  console.log('✅ Playwright global setup completed');
}

async function setupTestUsers(context: any, storageDir: string) {
  const testUsers = [
    {
      role: 'user',
      email: 'e2euser@example.com',
      password: 'E2EPassword123!',
      firstName: 'John',
      lastName: 'Doe',
      storageFile: 'user-auth.json',
    },
    {
      role: 'admin',
      email: 'e2eadmin@pbcex.com',
      password: 'AdminPassword123!',
      firstName: 'Admin',
      lastName: 'User',
      storageFile: 'admin-auth.json',
    },
    {
      role: 'support',
      email: 'e2esupport@pbcex.com',
      password: 'SupportPassword123!',
      firstName: 'Support',
      lastName: 'Agent',
      storageFile: 'support-auth.json',
    },
    {
      role: 'teller',
      email: 'e2eteller@pbcex.com',
      password: 'TellerPassword123!',
      firstName: 'Bank',
      lastName: 'Teller',
      storageFile: 'teller-auth.json',
    },
  ];
  
  for (const user of testUsers) {
    const page = await context.newPage();
    
    try {
      // Register user
      await page.goto('/auth/register');
      await page.fill('input[name="email"]', user.email);
      await page.fill('input[name="password"]', user.password);
      await page.fill('input[name="confirmPassword"]', user.password);
      await page.fill('input[name="firstName"]', user.firstName);
      await page.fill('input[name="lastName"]', user.lastName);
      await page.check('input[name="acceptTerms"]');
      await page.click('button[type="submit"]');
      
      // Handle email verification (mock in test env)
      await page.waitForURL('/auth/verify-email');
      
      // In test environment, auto-verify email
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', user.email);
      await page.fill('input[name="password"]', user.password);
      await page.click('button[type="submit"]');
      
      // Wait for successful login
      await page.waitForURL('/dashboard');
      
      // For non-user roles, update role via API call (admin operation)
      if (user.role !== 'user') {
        await page.evaluate(async (userData) => {
          // This would be an admin API call to update user role
          await fetch('/api/admin/user/update-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userData.email,
              role: userData.role.toUpperCase(),
            }),
          });
        }, user);
      }
      
      // For user role, complete KYC process
      if (user.role === 'user') {
        await completeKycProcess(page);
      }
      
      // Save authentication state
      const storagePath = path.join(storageDir, user.storageFile);
      await page.context().storageState({ path: storagePath });
      
      console.log(`✅ Created ${user.role} user: ${user.email}`);
      
    } catch (error) {
      console.error(`❌ Failed to create ${user.role} user:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }
}

async function completeKycProcess(page: any) {
  // Navigate to KYC page
  await page.goto('/account/kyc');
  
  // Fill personal information
  await page.fill('input[name="dateOfBirth"]', '1990-01-01');
  await page.fill('input[name="phone"]', '+1-555-0123');
  await page.fill('input[name="ssn"]', '123-45-6789');
  
  // Fill address
  await page.fill('input[name="street"]', '123 Test Street');
  await page.fill('input[name="city"]', 'Test City');
  await page.selectOption('select[name="state"]', 'NY');
  await page.fill('input[name="zipCode"]', '12345');
  await page.selectOption('select[name="country"]', 'US');
  
  // Submit KYC form
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=KYC submission successful');
  
  // In test environment, auto-approve KYC
  await page.evaluate(async () => {
    await fetch('/api/test/kyc/auto-approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  });
  
  console.log('✅ KYC process completed for user');
}

async function setupTestData(context: any) {
  const page = await context.newPage();
  
  try {
    // Setup test products
    await page.evaluate(async () => {
      const testProducts = [
        {
          id: 'e2e-gold-bar-1oz',
          name: '1 oz Gold Bar - Test',
          metal: 'GOLD',
          weight: '1.0',
          format: 'BAR',
          basePrice: '2100.00',
          premium: '85.00',
          inStock: true,
          stockQuantity: 100,
        },
        {
          id: 'e2e-silver-coin-1oz',
          name: '1 oz Silver Coin - Test',
          metal: 'SILVER',
          weight: '1.0',
          format: 'COIN',
          basePrice: '26.50',
          premium: '4.50',
          inStock: true,
          stockQuantity: 500,
        },
      ];
      
      for (const product of testProducts) {
        await fetch('/api/test/products/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        });
      }
    });
    
    // Setup test balances for the main test user
    await page.evaluate(async () => {
      await fetch('/api/test/balances/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'e2euser@example.com',
          balances: {
            USD: '50000.00',
            'XAU-s': '5.0',
            'XAG-s': '100.0',
          },
        }),
      });
    });
    
    // Setup vault inventory (if vault feature enabled)
    await page.evaluate(async () => {
      if (process.env.ENABLE_VAULT_REDEMPTION === 'true') {
        await fetch('/api/test/vault/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inventory: [
              {
                metal: 'GOLD',
                sku: 'GOLD-BAR-1OZ-TEST',
                format: 'BAR',
                weight: '1.0',
                vaultLocation: 'VAULT-MAIN',
                qtyAvailable: 50,
                unitCost: '2100.00',
              },
            ],
          }),
        });
      }
    });
    
    console.log('✅ Test data setup completed');
    
  } catch (error) {
    console.error('❌ Test data setup failed:', error);
    // Don't throw here as test data setup is optional
  } finally {
    await page.close();
  }
}

export default globalSetup;
