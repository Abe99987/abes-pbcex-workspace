import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || process.env.STAGING_WEB_BASE_URL || 'http://localhost:3000';

test.describe('SSE Connection Leak Detection', () => {
  test.skip(!BASE_URL, 'BASE_URL or STAGING_WEB_BASE_URL is required');

  test('should not leak SSE connections during navigation', async ({ page }) => {
    // Set up admin access for stats endpoint (development only)
    await page.addInitScript(() => {
      if (typeof window !== 'undefined') {
        (window as any).ADMIN_OPS_KEY = 'dev-admin-key';
      }
    });

    const adminKey = process.env.NODE_ENV !== 'production' ? 'dev-admin-key' : '';

    // Helper function to get connection stats
    const getSSEStats = async () => {
      const response = await page.evaluate(async (key) => {
        const res = await fetch('/api/ops/sse/stats', {
          headers: {
            'X-Admin-Key': key,
          },
        });
        return res.json();
      }, adminKey);

      return response.data;
    };

    // Step 1: Navigate to ops page and get baseline
    await page.goto(`${BASE_URL}/ops/sse`);
    await expect(page).toHaveTitle(/PBCEx|SSE/i);

    // Wait a moment for page to settle
    await page.waitForTimeout(1000);
    
    const baselineStats = await getSSEStats();
    const baselineConnections = baselineStats.totalActive || 0;

    // Step 2: Open a page that creates SSE connections (markets page likely uses price stream)
    await page.goto(`${BASE_URL}/markets`);
    
    // Wait for SSE connection to be established
    await page.waitForTimeout(2000);

    const afterNavStats = await getSSEStats();
    const connectionsAfterNav = afterNavStats.totalActive || 0;

    // Verify connection was established (should be equal or greater)
    // Note: connections might not increase if markets page doesn't auto-connect to SSE
    console.log(`Baseline: ${baselineConnections}, After nav: ${connectionsAfterNav}`);

    // Step 3: Navigate away from the page
    await page.goto(`${BASE_URL}/about`);
    
    // Wait for connections to be cleaned up
    await page.waitForTimeout(3000);

    const finalStats = await getSSEStats();
    const finalConnections = finalStats.totalActive || 0;

    // Step 4: Verify no connections leaked
    expect(finalConnections).toBeLessThanOrEqual(baselineConnections);
    
    console.log(`Final connections: ${finalConnections}, should be <= ${baselineConnections}`);
  });

  test('should properly track manual SSE connection lifecycle', async ({ page }) => {
    const adminKey = process.env.NODE_ENV !== 'production' ? 'dev-admin-key' : '';

    // Helper function to get connection stats
    const getSSEStats = async () => {
      const response = await page.evaluate(async (key) => {
        const res = await fetch('/api/ops/sse/stats', {
          headers: {
            'X-Admin-Key': key,
          },
        });
        return res.json();
      }, adminKey);

      return response.data;
    };

    // Navigate to ops page 
    await page.goto(`${BASE_URL}/ops/sse`);
    await page.waitForTimeout(1000);

    // Get baseline
    const baselineStats = await getSSEStats();
    const baseline = baselineStats.totalActive || 0;

    // Manually create an SSE connection using page.evaluate
    await page.evaluate(() => {
      (window as any).testEventSource = new EventSource('/api/prices/stream?symbols=XAU,BTC');
    });

    // Wait for connection to register
    await page.waitForTimeout(2000);

    const afterOpenStats = await getSSEStats();
    const afterOpen = afterOpenStats.totalActive || 0;

    // Should have one more connection
    expect(afterOpen).toBeGreaterThan(baseline);

    // Close the connection
    await page.evaluate(() => {
      if ((window as any).testEventSource) {
        (window as any).testEventSource.close();
        delete (window as any).testEventSource;
      }
    });

    // Wait for cleanup
    await page.waitForTimeout(2000);

    const afterCloseStats = await getSSEStats();
    const afterClose = afterCloseStats.totalActive || 0;

    // Should return to baseline or lower
    expect(afterClose).toBeLessThanOrEqual(baseline);

    console.log(`Lifecycle test: ${baseline} -> ${afterOpen} -> ${afterClose}`);
  });

  test('should show connection stats in ops dashboard', async ({ page }) => {
    // Navigate to the ops dashboard
    await page.goto(`${BASE_URL}/ops/sse`);
    
    // Wait for the page to load
    await page.waitForTimeout(2000);

    // Check for key dashboard elements
    await expect(page.getByText('SSE Operations Dashboard')).toBeVisible();
    await expect(page.getByText('Overall Health')).toBeVisible();
    await expect(page.getByText('Active Connections')).toBeVisible();
    await expect(page.getByText('Recent Activity')).toBeVisible();
    
    // Check for leak test widget
    await expect(page.getByText('Connection Leak Test')).toBeVisible();
    await expect(page.getByRole('button', { name: /Run Leak Test/i })).toBeVisible();

    // Test the polling controls
    const stopButton = page.getByRole('button', { name: /Stop Polling/i });
    if (await stopButton.isVisible()) {
      await stopButton.click();
      await expect(page.getByRole('button', { name: /Start Polling/i })).toBeVisible();
    }

    // Test refresh button
    await page.getByRole('button', { name: /Refresh/i }).click();
    await page.waitForTimeout(1000);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Navigate to ops dashboard
    await page.goto(`${BASE_URL}/ops/sse`);
    
    // Mock API failure by intercepting requests
    await page.route('**/api/ops/sse/stats', route => {
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Admin access required'
        }),
      });
    });

    // Trigger a refresh
    await page.getByRole('button', { name: /Refresh/i }).click();
    
    // Should show error message
    await expect(page.getByText(/Admin access required|Failed to fetch/i)).toBeVisible({ timeout: 5000 });
  });
});

// Test with multiple rapid connections to stress test tracking
test.describe('SSE Stress Testing', () => {
  test('should handle multiple rapid connections without leaking', async ({ page }) => {
    const adminKey = process.env.NODE_ENV !== 'production' ? 'dev-admin-key' : '';

    const getSSEStats = async () => {
      const response = await page.evaluate(async (key) => {
        const res = await fetch('/api/ops/sse/stats', {
          headers: {
            'X-Admin-Key': key,
          },
        });
        return res.json();
      }, adminKey);
      return response.data;
    };

    await page.goto(`${BASE_URL}/ops/sse`);
    await page.waitForTimeout(1000);

    const baselineStats = await getSSEStats();
    const baseline = baselineStats.totalActive || 0;

    // Create multiple connections rapidly
    await page.evaluate(() => {
      (window as any).testConnections = [];
      for (let i = 0; i < 3; i++) {
        const es = new EventSource(`/api/prices/stream?symbols=XAU,BTC,ETH&test=${i}`);
        (window as any).testConnections.push(es);
      }
    });

    // Wait for connections to register
    await page.waitForTimeout(3000);

    const afterOpenStats = await getSSEStats();
    const afterOpen = afterOpenStats.totalActive || 0;

    // Should have more connections
    expect(afterOpen).toBeGreaterThan(baseline);

    // Close all connections
    await page.evaluate(() => {
      if ((window as any).testConnections) {
        (window as any).testConnections.forEach((es: EventSource) => es.close());
        delete (window as any).testConnections;
      }
    });

    // Wait for cleanup
    await page.waitForTimeout(3000);

    const afterCloseStats = await getSSEStats();
    const afterClose = afterCloseStats.totalActive || 0;

    // Should return to baseline
    expect(afterClose).toBeLessThanOrEqual(baseline + 1); // Allow small margin for timing

    console.log(`Stress test: ${baseline} -> ${afterOpen} -> ${afterClose}`);
  });
});
