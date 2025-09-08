import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';

/**
 * Playwright E2E Test Configuration for PBCEx
 * 
 * Configures end-to-end testing across multiple browsers and devices
 * with proper test environment setup and CI integration
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    process.env.CI ? ['github'] : ['list'],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || process.env.BASE_URL || process.env.STAGING_WEB_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
    { name: 'tablet', use: { ...devices['iPad Pro'] } },
  ],
  testMatch: ['**/*.e2e.spec.ts', 'uat/**/*.spec.ts'],
  globalSetup: fileURLToPath(new URL('./utils/global-setup.min.ts', import.meta.url)),
  globalTeardown: fileURLToPath(new URL('./utils/global-teardown.ts', import.meta.url)),
  outputDir: 'test-results/artifacts',
  webServer: process.env.CI ? undefined : {
    command: 'bash scripts/dev-e2e.sh',
    port: 3000,
    cwd: '../',
    timeout: 180000,
    reuseExistingServer: true,
    env: {
      E2E_TEST_ENABLED: 'true',
      DEV_FAKE_LOGIN: 'true',
      // Pass region gating vars through for local dev UAT
      PUBLIC_REGION_GATING: process.env.PUBLIC_REGION_GATING || 'off',
      PUBLIC_SUPPORTED_REGIONS: process.env.PUBLIC_SUPPORTED_REGIONS || 'US,CA,GB',
      PUBLIC_REGION_MESSAGE: process.env.PUBLIC_REGION_MESSAGE || 'Service availability varies by region. See Supported Regions & Disclosures.',
    },
  },
  timeout: 30000,
  expect: {
    timeout: 5000,
    toHaveScreenshot: { threshold: 0.2 },
    toMatchSnapshot: { threshold: 0.2 },
  },
  maxFailures: process.env.CI ? 10 : undefined,
  metadata: { project: 'PBCEx E2E Tests', version: '1.0.0' },
  testIgnore: ['**/fixtures/**', '**/utils/**'],
});
