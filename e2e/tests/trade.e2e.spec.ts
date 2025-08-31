import { test, expect } from '@playwright/test';
import {
  TestHelpers,
  TestDataGenerator,
  E2EAssertions,
} from '../utils/test-helpers';

/**
 * Trading E2E Tests
 *
 * Tests the complete trading experience including:
 * - Price display and updates
 * - Order placement (market and limit)
 * - Order management and cancellation
 * - Portfolio management
 * - Trading history
 * - Real-time updates
 */

test.describe('Trading Experience', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.loginAs('user');
  });

  test.describe('Price Display', () => {
    test('should display current market prices', async ({ page }) => {
      await helpers.navigateToSection('trade');

      // Verify trading page loaded
      await expect(page.locator('h1')).toContainText('Trade');
      await expect(page.locator('[data-testid="price-chart"]')).toBeVisible();

      // Check price display for all assets
      const assets = ['XAU-s', 'XAG-s', 'XPT-s', 'XPD-s', 'XCU-s'];

      for (const asset of assets) {
        const priceCard = page.locator(`[data-testid="price-card-${asset}"]`);
        await expect(priceCard).toBeVisible();

        // Verify price components
        await expect(
          priceCard.locator('[data-testid="bid-price"]')
        ).toBeVisible();
        await expect(
          priceCard.locator('[data-testid="ask-price"]')
        ).toBeVisible();
        await expect(priceCard.locator('[data-testid="spread"]')).toBeVisible();
        await expect(
          priceCard.locator('[data-testid="last-update"]')
        ).toBeVisible();

        // Validate price format
        const bidPrice = await priceCard
          .locator('[data-testid="bid-price"]')
          .textContent();
        const askPrice = await priceCard
          .locator('[data-testid="ask-price"]')
          .textContent();

        E2EAssertions.expectPriceFormat(bidPrice?.replace('$', '') || '0');
        E2EAssertions.expectPriceFormat(askPrice?.replace('$', '') || '0');

        // Ask price should be higher than bid price
        const bid = parseFloat(bidPrice?.replace('$', '') || '0');
        const ask = parseFloat(askPrice?.replace('$', '') || '0');
        expect(ask).toBeGreaterThan(bid);
      }
    });

    test('should update prices in real-time', async ({ page }) => {
      await helpers.navigateToSection('trade');

      const priceCard = page.locator('[data-testid="price-card-XAU-s"]');
      const initialPrice = await priceCard
        .locator('[data-testid="bid-price"]')
        .textContent();

      // Mock price update via WebSocket
      await page.evaluate(() => {
        // Simulate WebSocket price update
        const event = new CustomEvent('priceUpdate', {
          detail: {
            asset: 'XAU-s',
            bid: '2055.25',
            ask: '2065.75',
            timestamp: new Date().toISOString(),
          },
        });
        window.dispatchEvent(event);
      });

      // Wait for price update
      await expect(
        priceCard.locator('[data-testid="bid-price"]')
      ).not.toHaveText(initialPrice || '');

      // Check price change indicator
      await expect(
        priceCard.locator('[data-testid="price-change-indicator"]')
      ).toBeVisible();
    });

    test('should display price history chart', async ({ page }) => {
      await helpers.navigateToSection('trade');

      // Select asset for chart
      await page.click('[data-testid="asset-selector"]');
      await page.click('[data-testid="asset-option-XAU-s"]');

      // Verify chart loaded
      await expect(page.locator('[data-testid="price-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="chart-canvas"]')).toBeVisible();

      // Check timeframe options
      const timeframes = ['1H', '4H', '1D', '1W', '1M'];
      for (const timeframe of timeframes) {
        await expect(
          page.locator(`[data-testid="timeframe-${timeframe}"]`)
        ).toBeVisible();
      }

      // Switch timeframe
      await page.click('[data-testid="timeframe-1D"]');

      // Wait for chart update
      await helpers.waitForLoader();
      await expect(page.locator('[data-testid="chart-loaded"]')).toBeVisible();
    });

    test('should handle price feed errors gracefully', async ({ page }) => {
      await helpers.navigateToSection('trade');

      // Mock price feed error
      await page.route('/api/trade/prices', route => {
        route.fulfill({
          status: 503,
          body: JSON.stringify({
            code: 'PRICE_FEED_UNAVAILABLE',
            message: 'Price feed service temporarily unavailable',
            data: {
              cachedPrices: {
                'XAU-s': {
                  bid: '2040.00',
                  ask: '2050.00',
                  lastUpdate: new Date(Date.now() - 900000).toISOString(),
                  source: 'cached',
                },
              },
            },
          }),
        });
      });

      await page.reload();

      // Should show cached prices with warning
      await expect(
        page.locator('[data-testid="price-feed-warning"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="price-feed-warning"]')
      ).toContainText('Using cached prices');

      // Prices should still be visible
      await expect(
        page.locator('[data-testid="price-card-XAU-s"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="stale-price-indicator"]')
      ).toBeVisible();
    });
  });

  test.describe('Order Placement', () => {
    test('should place market buy order successfully', async ({ page }) => {
      await helpers.navigateToSection('trade');

      // Place market buy order
      const orderId = await helpers.placeTrade('BUY', 'XAU-s', '1.5', 'MARKET');

      // Verify order confirmation
      await helpers.waitForToast('success');
      await expect(
        page.locator('[data-testid="order-confirmation"]')
      ).toContainText('Order placed successfully');

      // Check order details in confirmation
      await expect(
        page.locator('[data-testid="confirmed-order-id"]')
      ).toContainText(orderId);
      await expect(
        page.locator('[data-testid="confirmed-side"]')
      ).toContainText('BUY');
      await expect(
        page.locator('[data-testid="confirmed-asset"]')
      ).toContainText('XAU-s');
      await expect(
        page.locator('[data-testid="confirmed-quantity"]')
      ).toContainText('1.5');

      // Verify balance update
      await helpers.navigateToSection('wallet');
      const xauBalance = await helpers.getBalance('XAU-s');
      expect(parseFloat(xauBalance)).toBeGreaterThan(0);
    });

    test('should place market sell order successfully', async ({ page }) => {
      await helpers.navigateToSection('trade');

      // Place market sell order
      const orderId = await helpers.placeTrade(
        'SELL',
        'XAU-s',
        '0.5',
        'MARKET'
      );

      // Verify order confirmation
      await helpers.waitForToast('success');
      await expect(
        page.locator('[data-testid="order-confirmation"]')
      ).toContainText('Order placed successfully');

      // Check order was filled immediately (market order)
      await helpers.expectOrderStatus(orderId, 'FILLED');
    });

    test('should place limit order successfully', async ({ page }) => {
      await helpers.navigateToSection('trade');

      // Get current market price
      const currentPrice = await page
        .locator('[data-testid="price-card-XAU-s"] [data-testid="bid-price"]')
        .textContent();
      const price = parseFloat(currentPrice?.replace('$', '') || '0');
      const limitPrice = (price * 0.95).toFixed(2); // 5% below market

      // Place limit buy order
      await page.click('[data-testid="asset-selector"]');
      await page.click('[data-testid="asset-option-XAU-s"]');
      await page.click('[data-testid="side-buy"]');
      await page.fill('[data-testid="quantity-input"]', '1.0');
      await page.selectOption('[data-testid="order-type-select"]', 'LIMIT');
      await page.fill('[data-testid="limit-price-input"]', limitPrice);

      await page.click('[data-testid="place-order-button"]');

      // Verify limit order created as pending
      await helpers.waitForToast('success');
      const orderId = await helpers.getLatestOrderId();
      await helpers.expectOrderStatus(orderId, 'PENDING');

      // Check order in open orders list
      await page.goto('/trade/orders?status=PENDING');
      const orderRow = page.locator(`[data-order-id="${orderId}"]`);
      await expect(orderRow).toBeVisible();
      await expect(
        orderRow.locator('[data-testid="order-type"]')
      ).toContainText('LIMIT');
      await expect(
        orderRow.locator('[data-testid="limit-price"]')
      ).toContainText(limitPrice);
    });

    test('should validate sufficient balance', async ({ page }) => {
      await helpers.navigateToSection('trade');

      // Try to place order larger than available balance
      await page.click('[data-testid="asset-selector"]');
      await page.click('[data-testid="asset-option-XAU-s"]');
      await page.click('[data-testid="side-buy"]');
      await page.fill('[data-testid="quantity-input"]', '1000'); // Large quantity

      await page.click('[data-testid="place-order-button"]');

      // Should show insufficient balance error
      await helpers.waitForToast('error');
      await expect(
        page.locator('[data-testid="insufficient-balance-error"]')
      ).toContainText('Insufficient USD balance');

      // Should show available balance
      await expect(
        page.locator('[data-testid="available-balance"]')
      ).toBeVisible();
    });

    test('should validate minimum order size', async ({ page }) => {
      await helpers.navigateToSection('trade');

      // Try to place order below minimum
      await page.click('[data-testid="asset-selector"]');
      await page.click('[data-testid="asset-option-XAU-s"]');
      await page.click('[data-testid="side-buy"]');
      await page.fill('[data-testid="quantity-input"]', '0.001'); // Below minimum

      await page.click('[data-testid="place-order-button"]');

      // Should show minimum order error
      await expect(
        page.locator('[data-testid="error-quantity"]')
      ).toContainText('Minimum order quantity');
    });

    test('should validate maximum order size', async ({ page }) => {
      await helpers.navigateToSection('trade');

      // Try to place order above maximum
      await page.click('[data-testid="asset-selector"]');
      await page.click('[data-testid="asset-option-XAU-s"]');
      await page.click('[data-testid="side-buy"]');
      await page.fill('[data-testid="quantity-input"]', '1000'); // Above maximum

      await page.click('[data-testid="place-order-button"]');

      // Should show maximum order error
      await expect(
        page.locator('[data-testid="error-quantity"]')
      ).toContainText('Maximum order quantity');
    });

    test('should show order preview before submission', async ({ page }) => {
      await helpers.navigateToSection('trade');

      // Fill order form
      await page.click('[data-testid="asset-selector"]');
      await page.click('[data-testid="asset-option-XAU-s"]');
      await page.click('[data-testid="side-buy"]');
      await page.fill('[data-testid="quantity-input"]', '1.0');

      await page.click('[data-testid="place-order-button"]');

      // Should show order preview modal
      await helpers.waitForModal('order-preview');

      // Verify preview details
      await expect(page.locator('[data-testid="preview-asset"]')).toContainText(
        'XAU-s'
      );
      await expect(page.locator('[data-testid="preview-side"]')).toContainText(
        'BUY'
      );
      await expect(
        page.locator('[data-testid="preview-quantity"]')
      ).toContainText('1.0');
      await expect(
        page.locator('[data-testid="preview-estimated-price"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="preview-fee"]')).toBeVisible();
      await expect(page.locator('[data-testid="preview-total"]')).toBeVisible();

      // Confirm order
      await page.click('[data-testid="confirm-order"]');

      await helpers.waitForToast('success');
    });

    test('should handle order placement errors', async ({ page }) => {
      await helpers.navigateToSection('trade');

      // Mock order placement failure
      await page.route('/api/trade/order', route => {
        route.fulfill({
          status: 400,
          body: JSON.stringify({
            code: 'ORDER_REJECTED',
            message: 'Order rejected due to high market volatility',
            data: {
              reason: 'VOLATILITY_PROTECTION',
              currentVolatility: '15.5%',
              retryAfter: 300,
            },
          }),
        });
      });

      // Try to place order
      await helpers.placeTrade('BUY', 'XAU-s', '1.0');

      // Should show specific error message
      await helpers.waitForToast('error');
      await expect(page.locator('[data-testid="order-error"]')).toContainText(
        'high market volatility'
      );
      await expect(page.locator('[data-testid="retry-timer"]')).toBeVisible();
    });
  });

  test.describe('Order Management', () => {
    let pendingOrderId: string;

    test.beforeEach(async ({ page }) => {
      // Create a pending limit order for testing
      await helpers.navigateToSection('trade');

      // Place limit order below market price
      const currentPrice = await page
        .locator('[data-testid="price-card-XAU-s"] [data-testid="bid-price"]')
        .textContent();
      const price = parseFloat(currentPrice?.replace('$', '') || '0');
      const limitPrice = (price * 0.95).toFixed(2);

      pendingOrderId = await helpers.placeTrade(
        'BUY',
        'XAU-s',
        '1.0',
        'LIMIT',
        limitPrice
      );
    });

    test('should display open orders', async ({ page }) => {
      await page.goto('/trade/orders?status=PENDING');

      // Verify orders page loaded
      await expect(page.locator('h2')).toContainText('Open Orders');

      // Check pending order is displayed
      const orderRow = page.locator(`[data-order-id="${pendingOrderId}"]`);
      await expect(orderRow).toBeVisible();

      // Verify order details
      await expect(
        orderRow.locator('[data-testid="order-side"]')
      ).toContainText('BUY');
      await expect(
        orderRow.locator('[data-testid="order-asset"]')
      ).toContainText('XAU-s');
      await expect(
        orderRow.locator('[data-testid="order-quantity"]')
      ).toContainText('1.0');
      await expect(
        orderRow.locator('[data-testid="order-status"]')
      ).toContainText('PENDING');
    });

    test('should cancel pending order', async ({ page }) => {
      await page.goto('/trade/orders?status=PENDING');

      const orderRow = page.locator(`[data-order-id="${pendingOrderId}"]`);

      // Cancel order
      await orderRow.locator('[data-testid="cancel-order"]').click();

      // Confirm cancellation
      await page.click('[data-testid="confirm-cancel"]');

      // Verify order cancelled
      await helpers.waitForToast('success');
      await expect(
        page.locator('[data-testid="order-cancelled"]')
      ).toContainText('Order cancelled successfully');

      // Check order status updated
      await helpers.expectOrderStatus(pendingOrderId, 'CANCELLED');

      // Order should no longer appear in open orders
      await page.reload();
      await expect(
        page.locator(`[data-order-id="${pendingOrderId}"]`)
      ).not.toBeVisible();
    });

    test('should not cancel filled orders', async ({ page }) => {
      // Create a filled order first
      const filledOrderId = await helpers.placeTrade(
        'BUY',
        'XAU-s',
        '0.5',
        'MARKET'
      );

      await page.goto(`/trade/order/${filledOrderId}`);

      // Cancel button should not be present for filled orders
      await expect(
        page.locator('[data-testid="cancel-order"]')
      ).not.toBeVisible();
      await expect(
        page.locator('[data-testid="order-filled-notice"]')
      ).toContainText('This order has been filled');
    });

    test('should display order history with filters', async ({ page }) => {
      await page.goto('/trade/orders');

      // Verify order history loaded
      await expect(page.locator('h2')).toContainText('Order History');

      // Check filter options
      await expect(page.locator('[data-testid="status-filter"]')).toBeVisible();
      await expect(page.locator('[data-testid="asset-filter"]')).toBeVisible();
      await expect(page.locator('[data-testid="date-filter"]')).toBeVisible();

      // Filter by status
      await page.selectOption('[data-testid="status-filter"]', 'FILLED');

      // Check filtered results
      const orderRows = page.locator('[data-testid="order-row"]');
      const orderCount = await orderRows.count();

      for (let i = 0; i < orderCount; i++) {
        await expect(
          orderRows.nth(i).locator('[data-testid="order-status"]')
        ).toContainText('FILLED');
      }
    });

    test('should show detailed order view', async ({ page }) => {
      await page.goto(`/trade/order/${pendingOrderId}`);

      // Verify order details page
      await expect(page.locator('h1')).toContainText('Order Details');

      // Check order information
      await expect(page.locator('[data-testid="order-id"]')).toContainText(
        pendingOrderId
      );
      await expect(page.locator('[data-testid="order-side"]')).toContainText(
        'BUY'
      );
      await expect(page.locator('[data-testid="order-asset"]')).toContainText(
        'XAU-s'
      );
      await expect(
        page.locator('[data-testid="order-quantity"]')
      ).toContainText('1.0');
      await expect(page.locator('[data-testid="order-type"]')).toContainText(
        'LIMIT'
      );
      await expect(page.locator('[data-testid="order-status"]')).toContainText(
        'PENDING'
      );

      // Check timestamps
      await expect(page.locator('[data-testid="created-at"]')).toBeVisible();
      E2EAssertions.expectTimestamp(
        (await page
          .locator('[data-testid="created-at"]')
          .getAttribute('datetime')) || ''
      );
    });
  });

  test.describe('Portfolio Management', () => {
    test('should display current portfolio', async ({ page }) => {
      await page.goto('/trade/portfolio');

      // Verify portfolio page loaded
      await expect(page.locator('h1')).toContainText('Portfolio');

      // Check portfolio summary
      await expect(page.locator('[data-testid="total-value"]')).toBeVisible();
      await expect(page.locator('[data-testid="daily-change"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="daily-change-percent"]')
      ).toBeVisible();

      // Check asset breakdown
      const portfolioAssets = page.locator('[data-testid="portfolio-asset"]');
      const assetCount = await portfolioAssets.count();

      expect(assetCount).toBeGreaterThan(0);

      for (let i = 0; i < assetCount; i++) {
        const asset = portfolioAssets.nth(i);
        await expect(asset.locator('[data-testid="asset-name"]')).toBeVisible();
        await expect(
          asset.locator('[data-testid="asset-balance"]')
        ).toBeVisible();
        await expect(
          asset.locator('[data-testid="asset-value"]')
        ).toBeVisible();
        await expect(
          asset.locator('[data-testid="asset-allocation"]')
        ).toBeVisible();
      }
    });

    test('should show portfolio performance chart', async ({ page }) => {
      await page.goto('/trade/portfolio');

      // Check performance chart
      await expect(
        page.locator('[data-testid="performance-chart"]')
      ).toBeVisible();

      // Check timeframe options
      const timeframes = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];
      for (const timeframe of timeframes) {
        await expect(
          page.locator(`[data-testid="portfolio-timeframe-${timeframe}"]`)
        ).toBeVisible();
      }

      // Switch timeframe
      await page.click('[data-testid="portfolio-timeframe-1W"]');
      await helpers.waitForLoader();
      await expect(page.locator('[data-testid="chart-updated"]')).toBeVisible();
    });

    test('should calculate profit/loss correctly', async ({ page }) => {
      // Place some trades to create P&L
      await helpers.placeTrade('BUY', 'XAU-s', '1.0', 'MARKET');
      await helpers.placeTrade('SELL', 'XAU-s', '0.5', 'MARKET');

      await page.goto('/trade/portfolio');

      // Check P&L display
      await expect(
        page.locator('[data-testid="unrealized-pnl"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="realized-pnl"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-pnl"]')).toBeVisible();

      // Verify P&L calculation
      const unrealizedPnl = await page
        .locator('[data-testid="unrealized-pnl"]')
        .textContent();
      const realizedPnl = await page
        .locator('[data-testid="realized-pnl"]')
        .textContent();
      const totalPnl = await page
        .locator('[data-testid="total-pnl"]')
        .textContent();

      // All should have proper currency formatting
      expect(unrealizedPnl).toMatch(/[+-]?\$\d+\.\d{2}/);
      expect(realizedPnl).toMatch(/[+-]?\$\d+\.\d{2}/);
      expect(totalPnl).toMatch(/[+-]?\$\d+\.\d{2}/);
    });

    test('should export portfolio data', async ({ page }) => {
      await page.goto('/trade/portfolio');

      // Click export button
      await page.click('[data-testid="export-portfolio"]');

      // Check export options
      await expect(page.locator('[data-testid="export-csv"]')).toBeVisible();
      await expect(page.locator('[data-testid="export-pdf"]')).toBeVisible();

      // Export CSV
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv"]');
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toContain('portfolio');
      expect(download.suggestedFilename()).toContain('.csv');
    });
  });

  test.describe('Trading Charts and Analysis', () => {
    test('should display interactive price charts', async ({ page }) => {
      await helpers.navigateToSection('trade');

      // Select asset
      await page.click('[data-testid="asset-selector"]');
      await page.click('[data-testid="asset-option-XAU-s"]');

      // Verify chart interface
      await expect(page.locator('[data-testid="trading-chart"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="chart-controls"]')
      ).toBeVisible();

      // Check chart type options
      const chartTypes = ['LINE', 'CANDLESTICK', 'AREA'];
      for (const type of chartTypes) {
        await expect(
          page.locator(`[data-testid="chart-type-${type}"]`)
        ).toBeVisible();
      }

      // Switch chart type
      await page.click('[data-testid="chart-type-CANDLESTICK"]');
      await expect(
        page.locator('[data-testid="candlestick-chart"]')
      ).toBeVisible();
    });

    test('should show technical indicators', async ({ page }) => {
      await helpers.navigateToSection('trade');

      // Open indicators panel
      await page.click('[data-testid="indicators-button"]');

      // Check available indicators
      const indicators = ['SMA', 'EMA', 'RSI', 'MACD', 'BOLLINGER_BANDS'];
      for (const indicator of indicators) {
        await expect(
          page.locator(`[data-testid="indicator-${indicator}"]`)
        ).toBeVisible();
      }

      // Enable RSI indicator
      await page.check('[data-testid="indicator-RSI"]');
      await expect(page.locator('[data-testid="rsi-indicator"]')).toBeVisible();
    });

    test('should display market depth', async ({ page }) => {
      await helpers.navigateToSection('trade');

      // Check order book
      await expect(page.locator('[data-testid="order-book"]')).toBeVisible();
      await expect(page.locator('[data-testid="bids-table"]')).toBeVisible();
      await expect(page.locator('[data-testid="asks-table"]')).toBeVisible();

      // Check bid/ask entries
      const bidEntries = page.locator('[data-testid="bid-entry"]');
      const askEntries = page.locator('[data-testid="ask-entry"]');

      expect(await bidEntries.count()).toBeGreaterThan(0);
      expect(await askEntries.count()).toBeGreaterThan(0);

      // Verify price ordering (bids descending, asks ascending)
      const firstBid = await bidEntries
        .first()
        .locator('[data-testid="price"]')
        .textContent();
      const secondBid = await bidEntries
        .nth(1)
        .locator('[data-testid="price"]')
        .textContent();

      expect(parseFloat(firstBid || '0')).toBeGreaterThan(
        parseFloat(secondBid || '0')
      );
    });
  });

  test.describe('Trading Restrictions and Limits', () => {
    test('should enforce daily trading limits', async ({ page }) => {
      // Mock hitting daily limit
      await page.route('/api/trade/order', route => {
        route.fulfill({
          status: 400,
          body: JSON.stringify({
            code: 'DAILY_LIMIT_EXCEEDED',
            message: 'Daily trading limit exceeded',
            data: {
              dailyLimit: '100000.00',
              currentDailyVolume: '95000.00',
              remainingLimit: '5000.00',
            },
          }),
        });
      });

      await helpers.navigateToSection('trade');

      // Try to place large order
      await page.click('[data-testid="asset-selector"]');
      await page.click('[data-testid="asset-option-XAU-s"]');
      await page.click('[data-testid="side-buy"]');
      await page.fill('[data-testid="quantity-input"]', '10.0');

      await page.click('[data-testid="place-order-button"]');

      // Should show limit exceeded error
      await helpers.waitForToast('error');
      await expect(
        page.locator('[data-testid="limit-exceeded"]')
      ).toContainText('Daily trading limit exceeded');
      await expect(
        page.locator('[data-testid="remaining-limit"]')
      ).toContainText('$5,000.00');
    });

    test('should block trading during market closure', async ({ page }) => {
      // Mock market closure
      await page.route('/api/trade/prices', route => {
        route.fulfill({
          status: 503,
          body: JSON.stringify({
            code: 'MARKET_CLOSED',
            message: 'Market is currently closed',
            data: {
              nextOpenTime: '2024-01-02T09:00:00Z',
              reason: 'Weekend closure',
            },
          }),
        });
      });

      await helpers.navigateToSection('trade');

      // Should show market closed notice
      await expect(page.locator('[data-testid="market-closed"]')).toBeVisible();
      await expect(page.locator('[data-testid="market-closed"]')).toContainText(
        'Market is currently closed'
      );
      await expect(
        page.locator('[data-testid="next-open-time"]')
      ).toBeVisible();

      // Trading form should be disabled
      await expect(
        page.locator('[data-testid="place-order-button"]')
      ).toBeDisabled();
    });

    test('should handle position limits', async ({ page }) => {
      // Mock position limit check
      await page.route('/api/trade/order', route => {
        route.fulfill({
          status: 400,
          body: JSON.stringify({
            code: 'POSITION_LIMIT_EXCEEDED',
            message: 'Order would exceed maximum position limit',
            data: {
              currentPosition: '95.5',
              positionLimit: '100.0',
              orderQuantity: '10.0',
            },
          }),
        });
      });

      await helpers.navigateToSection('trade');

      await helpers.placeTrade('BUY', 'XAU-s', '10.0');

      // Should show position limit error
      await helpers.waitForToast('error');
      await expect(
        page.locator('[data-testid="position-limit-error"]')
      ).toContainText('exceed maximum position limit');
    });
  });

  test.describe('Mobile Trading Experience', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await helpers.navigateToSection('trade');

      // Check mobile-specific elements
      await expect(
        page.locator('[data-testid="mobile-trade-tabs"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="mobile-price-ticker"]')
      ).toBeVisible();

      // Chart should be collapsible on mobile
      await page.click('[data-testid="toggle-chart"]');
      await expect(page.locator('[data-testid="price-chart"]')).toBeHidden();

      // Trade form should be optimized for mobile
      await expect(
        page.locator('[data-testid="mobile-trade-form"]')
      ).toBeVisible();
    });

    test('should support touch gestures on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await helpers.navigateToSection('trade');

      // Test swipe gesture on price cards
      const priceCard = page.locator('[data-testid="price-card-XAU-s"]');

      // Simulate swipe left
      await priceCard.dispatchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 100 }],
      });
      await priceCard.dispatchEvent('touchmove', {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      await priceCard.dispatchEvent('touchend');

      // Should show additional price details
      await expect(
        page.locator('[data-testid="extended-price-info"]')
      ).toBeVisible();
    });
  });

  test.describe('Performance and Real-time Updates', () => {
    test('should handle high-frequency price updates', async ({ page }) => {
      await helpers.navigateToSection('trade');

      // Simulate rapid price updates
      for (let i = 0; i < 10; i++) {
        await page.evaluate(updateIndex => {
          const event = new CustomEvent('priceUpdate', {
            detail: {
              asset: 'XAU-s',
              bid: (2050 + updateIndex * 0.25).toFixed(2),
              ask: (2060 + updateIndex * 0.25).toFixed(2),
              timestamp: new Date().toISOString(),
            },
          });
          window.dispatchEvent(event);
        }, i);

        await page.waitForTimeout(100); // 100ms between updates
      }

      // Price should update smoothly without flickering
      await expect(
        page.locator('[data-testid="price-card-XAU-s"]')
      ).toBeVisible();

      // Check that UI doesn't become unresponsive
      await page.click('[data-testid="asset-selector"]');
      await expect(
        page.locator('[data-testid="asset-dropdown"]')
      ).toBeVisible();
    });

    test('should load trade page quickly', async ({ page }) => {
      const loadTime = await helpers.measurePageLoad('/trade');

      expect(loadTime).toBeLessThan(3000);
      console.log(`Trade page loaded in ${loadTime}ms`);
    });

    test('should execute trades quickly', async ({ page }) => {
      await helpers.navigateToSection('trade');

      const tradeTime = await helpers.measureActionTime(async () => {
        await helpers.placeTrade('BUY', 'XAU-s', '0.5', 'MARKET');
      });

      expect(tradeTime).toBeLessThan(2000);
      console.log(`Trade executed in ${tradeTime}ms`);
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await helpers.navigateToSection('trade');

      // Simulate network failure during order placement
      await page.route('/api/trade/order', route => {
        route.abort();
      });

      await helpers.placeTrade('BUY', 'XAU-s', '1.0');

      // Should show network error message
      await helpers.waitForToast('error');
      await expect(page.locator('[data-testid="network-error"]')).toContainText(
        'Network error'
      );
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

      // Retry should work after network recovers
      await page.route('/api/trade/order', route => route.continue());
      await page.click('[data-testid="retry-button"]');

      await helpers.waitForToast('success');
    });

    test('should handle server errors gracefully', async ({ page }) => {
      await helpers.navigateToSection('trade');

      // Mock server error
      await page.route('/api/trade/order', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({
            code: 'INTERNAL_ERROR',
            message: 'Trading service temporarily unavailable',
          }),
        });
      });

      await helpers.placeTrade('BUY', 'XAU-s', '1.0');

      // Should show server error with helpful message
      await helpers.waitForToast('error');
      await expect(page.locator('[data-testid="server-error"]')).toContainText(
        'Trading service temporarily unavailable'
      );

      // Should offer alternative actions
      await expect(
        page.locator('[data-testid="contact-support"]')
      ).toBeVisible();
    });

    test('should handle session timeouts during trading', async ({ page }) => {
      await helpers.navigateToSection('trade');

      // Fill trade form
      await page.click('[data-testid="asset-selector"]');
      await page.click('[data-testid="asset-option-XAU-s"]');
      await page.fill('[data-testid="quantity-input"]', '1.0');

      // Mock session timeout
      await page.route('/api/trade/order', route => {
        route.fulfill({
          status: 401,
          body: JSON.stringify({
            code: 'SESSION_EXPIRED',
            message: 'Your session has expired',
          }),
        });
      });

      await page.click('[data-testid="place-order-button"]');

      // Should redirect to login with session expired message
      await expect(
        page.locator('[data-testid="session-expired"]')
      ).toBeVisible();
      await helpers.expectUrl('/auth/login');

      // Form data should be preserved for after login
      const preservedData = await page.evaluate(() => {
        return localStorage.getItem('pendingTradeData');
      });

      expect(preservedData).toBeTruthy();
    });
  });
});
