import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || process.env.STAGING_WEB_BASE_URL || 'http://localhost:3000';

test.describe('Idempotency Operations Dashboard', () => {
  test.skip(!BASE_URL, 'BASE_URL or STAGING_WEB_BASE_URL is required');

  test('should display idempotency stats dashboard', async ({ page }) => {
    // Navigate to the idempotency ops dashboard
    await page.goto(`${BASE_URL}/ops/idem`);
    
    // Wait for the page to load
    await page.waitForTimeout(2000);

    // Check for key dashboard elements
    await expect(page.getByText('Idempotency Operations Dashboard')).toBeVisible();
    await expect(page.getByText('5-Minute Window')).toBeVisible();
    await expect(page.getByText('60-Minute Window')).toBeVisible();
    
    // Check for metric tiles
    await expect(page.getByText('Present').first()).toBeVisible();
    await expect(page.getByText('Unique').first()).toBeVisible();
    await expect(page.getByText('Duplicates').first()).toBeVisible();
    await expect(page.getByText('Dupe %').first()).toBeVisible();

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

  test('should run duplicate request test successfully', async ({ page }) => {
    // Navigate to idempotency dashboard
    await page.goto(`${BASE_URL}/ops/idem`);
    await page.waitForTimeout(2000);

    // Only test in non-production
    if (process.env.NODE_ENV === 'production') {
      test.skip();
    }

    const adminKey = process.env.NODE_ENV !== 'production' ? 'dev-admin-key' : '';

    // Helper function to get stats
    const getIdempotencyStats = async () => {
      const response = await page.evaluate(async (key) => {
        const res = await fetch('/api/ops/idem/stats', {
          headers: {
            'X-Admin-Key': key,
          },
        });
        return res.json();
      }, adminKey);
      return response.data;
    };

    // Get baseline stats
    const baselineStats = await getIdempotencyStats();
    
    // Check for duplicate test widget
    await expect(page.getByText('Duplicate Request Test')).toBeVisible();
    
    const testButton = page.getByRole('button', { name: /Run Duplicate Test/i });
    await expect(testButton).toBeVisible();
    
    // Run the duplicate test
    await testButton.click();
    
    // Wait for test to complete
    await page.waitForTimeout(4000);
    
    // Should show test result badge
    const testBadge = page.locator('[class*="bg-green-100"], [class*="bg-red-100"]').first();
    await expect(testBadge).toBeVisible({ timeout: 5000 });
    
    // Get stats after test
    const afterStats = await getIdempotencyStats();
    
    // Verify metrics increased
    expect(afterStats.window5m.present).toBeGreaterThan(baselineStats.window5m.present);
    
    console.log(`Duplicate test results: ${baselineStats.window5m.present} -> ${afterStats.window5m.present} present, ${baselineStats.window5m.dupes} -> ${afterStats.window5m.dupes} dupes`);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Navigate to idempotency dashboard
    await page.goto(`${BASE_URL}/ops/idem`);
    
    // Mock API failure by intercepting requests
    await page.route('**/api/ops/idem/stats', route => {
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

  test('should show correct metric calculations', async ({ page }) => {
    const adminKey = process.env.NODE_ENV !== 'production' ? 'dev-admin-key' : '';

    // Navigate to dashboard
    await page.goto(`${BASE_URL}/ops/idem`);
    await page.waitForTimeout(2000);

    // Get initial stats to understand current state
    const initialStats = await page.evaluate(async (key) => {
      try {
        const res = await fetch('/api/ops/idem/stats', {
          headers: { 'X-Admin-Key': key },
        });
        const data = await res.json();
        return data.success ? data.data : null;
      } catch {
        return null;
      }
    }, adminKey);

    if (initialStats) {
      // Check that percentage calculations are sensible
      const dupePercentage5m = parseFloat(initialStats.window5m.dupePercentage);
      const dupePercentage60m = parseFloat(initialStats.window60m.dupePercentage);
      
      expect(dupePercentage5m).toBeGreaterThanOrEqual(0);
      expect(dupePercentage5m).toBeLessThanOrEqual(100);
      expect(dupePercentage60m).toBeGreaterThanOrEqual(0);
      expect(dupePercentage60m).toBeLessThanOrEqual(100);
      
      // Verify unique + dupes <= present
      expect(initialStats.window5m.unique + initialStats.window5m.dupes).toBeLessThanOrEqual(initialStats.window5m.present);
      expect(initialStats.window60m.unique + initialStats.window60m.dupes).toBeLessThanOrEqual(initialStats.window60m.present);
      
      console.log('Idempotency metrics validation passed:', {
        window5m: initialStats.window5m,
        window60m: initialStats.window60m,
      });
    }
  });

  test('should verify response headers on test endpoint', async ({ page }) => {
    // Only test in non-production
    if (process.env.NODE_ENV === 'production') {
      test.skip();
    }

    const adminKey = process.env.NODE_ENV !== 'production' ? 'dev-admin-key' : '';

    await page.goto(`${BASE_URL}/ops/idem`);

    // Test with idempotency key
    const responseWithKey = await page.evaluate(async (key) => {
      const response = await fetch('/api/ops/idem/test', {
        method: 'POST',
        headers: {
          'X-Admin-Key': key,
          'X-Idempotency-Key': 'test-header-verification-12345',
        },
      });
      
      return {
        status: response.status,
        headers: {
          'x-idempotency-observed': response.headers.get('x-idempotency-observed'),
          'x-idempotency-window': response.headers.get('x-idempotency-window'),
        }
      };
    }, adminKey);

    expect(responseWithKey.status).toBe(204);
    expect(responseWithKey.headers['x-idempotency-observed']).toBe('present');
    expect(responseWithKey.headers['x-idempotency-window']).toBe('5m,60m');

    // Test without idempotency key
    const responseWithoutKey = await page.evaluate(async (key) => {
      const response = await fetch('/api/ops/idem/test', {
        method: 'POST',
        headers: {
          'X-Admin-Key': key,
        },
      });
      
      return {
        status: response.status,
        headers: {
          'x-idempotency-observed': response.headers.get('x-idempotency-observed'),
        }
      };
    }, adminKey);

    expect(responseWithoutKey.status).toBe(204);
    expect(responseWithoutKey.headers['x-idempotency-observed']).toBe('absent');
  });
});

test.describe('Idempotency Metrics Integration', () => {
  test('should track multiple requests with same key correctly', async ({ page }) => {
    const adminKey = process.env.NODE_ENV !== 'production' ? 'dev-admin-key' : '';

    // Only test in non-production
    if (process.env.NODE_ENV === 'production') {
      test.skip();
    }

    await page.goto(`${BASE_URL}/ops/idem`);

    const getStats = async () => {
      return await page.evaluate(async (key) => {
        const res = await fetch('/api/ops/idem/stats', {
          headers: { 'X-Admin-Key': key },
        });
        const data = await res.json();
        return data.data;
      }, adminKey);
    };

    const baselineStats = await getStats();
    const testKey = `integration-test-${Date.now()}`;

    // Send 3 requests with the same key
    for (let i = 0; i < 3; i++) {
      await page.evaluate(async ({ key, testKey }) => {
        await fetch('/api/ops/idem/test', {
          method: 'POST',
          headers: {
            'X-Admin-Key': key,
            'X-Idempotency-Key': testKey,
          },
        });
      }, { key: adminKey, testKey });
    }

    // Wait for metrics to update
    await page.waitForTimeout(1000);
    
    const finalStats = await getStats();

    // Should have 3 more present, 2 more dupes, 1 more unique
    const presentIncrease = finalStats.window5m.present - baselineStats.window5m.present;
    const dupesIncrease = finalStats.window5m.dupes - baselineStats.window5m.dupes;
    const uniqueIncrease = finalStats.window5m.unique - baselineStats.window5m.unique;

    expect(presentIncrease).toBe(3);
    expect(dupesIncrease).toBe(2);
    expect(uniqueIncrease).toBe(1);

    console.log('Multiple request test results:', {
      presentIncrease,
      dupesIncrease,
      uniqueIncrease,
    });
  });
});
