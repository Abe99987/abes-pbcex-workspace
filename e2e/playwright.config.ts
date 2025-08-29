import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for PBCEx
 * 
 * Configures end-to-end testing across multiple browsers and devices
 * with proper test environment setup and CI integration
 */
export default defineConfig({
  // Test directory
  testDir: './tests',
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    process.env.CI ? ['github'] : ['list'],
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Global test timeout
    actionTimeout: 10000,
    
    // Navigation timeout
    navigationTimeout: 30000,
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile tests
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    
    // Tablet tests
    {
      name: 'tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],

  // Test match patterns
  testMatch: '**/*.e2e.spec.ts',
  
  // Global setup and teardown
  globalSetup: require.resolve('./utils/global-setup.ts'),
  globalTeardown: require.resolve('./utils/global-teardown.ts'),
  
  // Output directory for test artifacts
  outputDir: 'test-results/artifacts',
  
  // Run your local dev server before starting the tests
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3000,
    cwd: '../',
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
  
  // Test timeout
  timeout: 30000,
  
  // Expect timeout for assertions
  expect: {
    timeout: 5000,
    toHaveScreenshot: { threshold: 0.2, mode: 'pixel' },
    toMatchScreenshot: { threshold: 0.2, mode: 'pixel' },
  },
  
  // Maximum time one test can run for
  maxFailures: process.env.CI ? 10 : undefined,
  
  // Metadata
  metadata: {
    project: 'PBCEx E2E Tests',
    version: '1.0.0',
  },
  
  // Test directory structure
  testIgnore: ['**/fixtures/**', '**/utils/**'],
  
  // Forbid test hooks in describe blocks
  forbidOnlyTestsInCI: true,
});
