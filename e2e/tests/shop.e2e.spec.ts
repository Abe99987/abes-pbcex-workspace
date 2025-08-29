import { test, expect } from '@playwright/test';
import { TestHelpers, TestDataGenerator, E2EAssertions } from '../utils/test-helpers';

/**
 * Shop/E-commerce E2E Tests
 * 
 * Tests the complete e-commerce experience including:
 * - Product browsing and filtering
 * - Shopping cart management
 * - Quote generation with timer
 * - Checkout process with multiple fulfillment strategies
 * - Order tracking and management
 */

test.describe('Shop Experience', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.loginAs('user');
  });

  test.describe('Product Browsing', () => {
    test('should display product catalog', async ({ page }) => {
      await helpers.navigateToSection('shop');

      // Verify shop page loaded
      await expect(page.locator('h1')).toContainText('Precious Metals Shop');
      await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();

      // Check product categories
      await expect(page.locator('[data-testid="category-gold"]')).toBeVisible();
      await expect(page.locator('[data-testid="category-silver"]')).toBeVisible();
      await expect(page.locator('[data-testid="category-platinum"]')).toBeVisible();

      // Verify products are displayed
      const products = page.locator('[data-testid="product-card"]');
      const productCount = await products.count();
      expect(productCount).toBeGreaterThan(0);

      // Check first product details
      const firstProduct = products.first();
      await expect(firstProduct.locator('[data-testid="product-name"]')).toBeVisible();
      await expect(firstProduct.locator('[data-testid="product-image"]')).toBeVisible();
      await expect(firstProduct.locator('[data-testid="product-price"]')).toBeVisible();
      await expect(firstProduct.locator('[data-testid="product-premium"]')).toBeVisible();
      await expect(firstProduct.locator('[data-testid="stock-status"]')).toBeVisible();

      // Verify pricing format
      const price = await firstProduct.locator('[data-testid="product-price"]').textContent();
      E2EAssertions.expectPriceFormat(price?.replace('$', '') || '0');
    });

    test('should filter products by category', async ({ page }) => {
      await helpers.navigateToSection('shop');

      // Filter by gold category
      await page.click('[data-testid="category-gold"]');

      // Wait for filter to apply
      await helpers.waitForLoader();

      // All displayed products should be gold
      const products = page.locator('[data-testid="product-card"]');
      const productCount = await products.count();

      for (let i = 0; i < productCount; i++) {
        const metal = await products.nth(i).locator('[data-testid="product-metal"]').textContent();
        expect(metal).toContain('Gold');
      }

      // Active filter should be highlighted
      await expect(page.locator('[data-testid="category-gold"]')).toHaveClass(/active/);
    });

    test('should filter products by price range', async ({ page }) => {
      await helpers.navigateToSection('shop');

      // Set price range filter
      await page.fill('[data-testid="price-min"]', '1000');
      await page.fill('[data-testid="price-max"]', '5000');
      await page.click('[data-testid="apply-price-filter"]');

      await helpers.waitForLoader();

      // Check filtered results
      const products = page.locator('[data-testid="product-card"]');
      const productCount = await products.count();

      for (let i = 0; i < productCount; i++) {
        const priceText = await products.nth(i).locator('[data-testid="product-price"]').textContent();
        const price = parseFloat(priceText?.replace(/[$,]/g, '') || '0');
        expect(price).toBeGreaterThanOrEqual(1000);
        expect(price).toBeLessThanOrEqual(5000);
      }
    });

    test('should sort products by different criteria', async ({ page }) => {
      await helpers.navigateToSection('shop');

      // Sort by price (low to high)
      await page.selectOption('[data-testid="sort-selector"]', 'price_asc');
      await helpers.waitForLoader();

      // Check sorting
      const products = page.locator('[data-testid="product-card"]');
      const firstPrice = await products.first().locator('[data-testid="product-price"]').textContent();
      const secondPrice = await products.nth(1).locator('[data-testid="product-price"]').textContent();

      const first = parseFloat(firstPrice?.replace(/[$,]/g, '') || '0');
      const second = parseFloat(secondPrice?.replace(/[$,]/g, '') || '0');
      expect(first).toBeLessThanOrEqual(second);

      // Sort by popularity
      await page.selectOption('[data-testid="sort-selector"]', 'popularity');
      await helpers.waitForLoader();
      
      // Popular badge should be visible on first product
      await expect(products.first().locator('[data-testid="popular-badge"]')).toBeVisible();
    });

    test('should search products', async ({ page }) => {
      await helpers.navigateToSection('shop');

      // Search for gold bars
      await page.fill('[data-testid="product-search"]', 'gold bar');
      await page.click('[data-testid="search-button"]');

      await helpers.waitForLoader();

      // Results should contain gold bars
      const products = page.locator('[data-testid="product-card"]');
      const productCount = await products.count();

      expect(productCount).toBeGreaterThan(0);

      for (let i = 0; i < Math.min(3, productCount); i++) {
        const productName = await products.nth(i).locator('[data-testid="product-name"]').textContent();
        expect(productName?.toLowerCase()).toMatch(/gold.*bar|bar.*gold/);
      }

      // Search results count should be displayed
      await expect(page.locator('[data-testid="search-results-count"]')).toContainText(`${productCount} results`);
    });

    test('should handle out of stock products', async ({ page }) => {
      await helpers.navigateToSection('shop');

      // Mock out of stock product
      await page.route('/api/shop/products', route => {
        const response = {
          code: 'SUCCESS',
          data: {
            products: [
              {
                id: 'out-of-stock-item',
                name: 'Out of Stock Gold Bar',
                inStock: false,
                stockQuantity: 0,
                basePrice: '2100.00',
                premium: '85.00',
                totalPrice: '2185.00',
              }
            ]
          }
        };
        route.fulfill({ status: 200, body: JSON.stringify(response) });
      });

      await page.reload();

      const outOfStockProduct = page.locator('[data-testid="product-out-of-stock-item"]');
      
      // Should show out of stock indicator
      await expect(outOfStockProduct.locator('[data-testid="out-of-stock-badge"]')).toBeVisible();
      
      // Add to cart button should be disabled
      await expect(outOfStockProduct.locator('[data-testid="add-to-cart"]')).toBeDisabled();
      
      // Should show notify when available option
      await expect(outOfStockProduct.locator('[data-testid="notify-when-available"]')).toBeVisible();
    });
  });

  test.describe('Product Details', () => {
    test('should display detailed product information', async ({ page }) => {
      await helpers.navigateToSection('shop');

      // Click on first product
      await page.click('[data-testid="product-card"]');

      // Verify product detail page
      await expect(page.locator('[data-testid="product-detail"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-gallery"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-info"]')).toBeVisible();

      // Check product information sections
      await expect(page.locator('[data-testid="product-description"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-specifications"]')).toBeVisible();
      await expect(page.locator('[data-testid="shipping-info"]')).toBeVisible();

      // Check product specifications
      await expect(page.locator('[data-testid="spec-weight"]')).toBeVisible();
      await expect(page.locator('[data-testid="spec-purity"]')).toBeVisible();
      await expect(page.locator('[data-testid="spec-dimensions"]')).toBeVisible();
      await expect(page.locator('[data-testid="spec-brand"]')).toBeVisible();
    });

    test('should show product image gallery', async ({ page }) => {
      await helpers.navigateToSection('shop');
      await page.click('[data-testid="product-card"]');

      // Check image gallery
      const gallery = page.locator('[data-testid="product-gallery"]');
      await expect(gallery.locator('[data-testid="main-image"]')).toBeVisible();
      await expect(gallery.locator('[data-testid="thumbnail-images"]')).toBeVisible();

      // Click thumbnail to change main image
      const thumbnails = gallery.locator('[data-testid="thumbnail"]');
      const thumbnailCount = await thumbnails.count();

      if (thumbnailCount > 1) {
        const secondThumbnail = thumbnails.nth(1);
        const thumbnailSrc = await secondThumbnail.getAttribute('src');
        
        await secondThumbnail.click();
        
        // Main image should update
        const mainImage = gallery.locator('[data-testid="main-image"]');
        await expect(mainImage).toHaveAttribute('src', thumbnailSrc || '');
      }
    });

    test('should display real-time pricing', async ({ page }) => {
      await helpers.navigateToSection('shop');
      await page.click('[data-testid="product-card"]');

      // Check pricing components
      await expect(page.locator('[data-testid="spot-price"]')).toBeVisible();
      await expect(page.locator('[data-testid="premium"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-price"]')).toBeVisible();
      await expect(page.locator('[data-testid="price-last-updated"]')).toBeVisible();

      // Check pricing calculation
      const spotPrice = await page.locator('[data-testid="spot-price"]').textContent();
      const premium = await page.locator('[data-testid="premium"]').textContent();
      const totalPrice = await page.locator('[data-testid="total-price"]').textContent();

      const spot = parseFloat(spotPrice?.replace(/[$,]/g, '') || '0');
      const prem = parseFloat(premium?.replace(/[$,]/g, '') || '0');
      const total = parseFloat(totalPrice?.replace(/[$,]/g, '') || '0');

      expect(total).toBeCloseTo(spot + prem, 2);
    });

    test('should show shipping information', async ({ page }) => {
      await helpers.navigateToSection('shop');
      await page.click('[data-testid="product-card"]');

      // Check shipping info
      await expect(page.locator('[data-testid="shipping-options"]')).toBeVisible();
      await expect(page.locator('[data-testid="delivery-estimate"]')).toBeVisible();
      await expect(page.locator('[data-testid="insurance-info"]')).toBeVisible();

      // Check shipping rates
      await expect(page.locator('[data-testid="standard-shipping"]')).toContainText(/\$\d+\.\d{2}/);
      await expect(page.locator('[data-testid="expedited-shipping"]')).toContainText(/\$\d+\.\d{2}/);
      
      // Free shipping threshold should be mentioned
      await expect(page.locator('[data-testid="free-shipping-threshold"]')).toContainText(/free.*shipping.*\$1000/i);
    });
  });

  test.describe('Shopping Cart', () => {
    test('should add product to cart', async ({ page }) => {
      await helpers.addToCart('e2e-gold-bar-1oz', 2);

      // Verify cart updated
      await expect(page.locator('[data-testid="cart-count"]')).toContainText('2');
      await helpers.waitForToast('success');

      // Open cart
      await page.click('[data-testid="cart-button"]');

      // Verify cart contents
      const cartItems = page.locator('[data-testid="cart-item"]');
      await expect(cartItems).toHaveCount(1);

      const cartItem = cartItems.first();
      await expect(cartItem.locator('[data-testid="item-name"]')).toContainText('Gold Bar');
      await expect(cartItem.locator('[data-testid="item-quantity"]')).toContainText('2');
      await expect(cartItem.locator('[data-testid="item-total"]')).toBeVisible();
    });

    test('should update cart quantities', async ({ page }) => {
      await helpers.addToCart('e2e-gold-bar-1oz', 1);
      await page.click('[data-testid="cart-button"]');

      const cartItem = page.locator('[data-testid="cart-item"]');
      
      // Increase quantity
      await cartItem.locator('[data-testid="increase-quantity"]').click();
      await expect(cartItem.locator('[data-testid="item-quantity"]')).toContainText('2');

      // Decrease quantity
      await cartItem.locator('[data-testid="decrease-quantity"]').click();
      await expect(cartItem.locator('[data-testid="item-quantity"]')).toContainText('1');

      // Direct quantity input
      await cartItem.locator('[data-testid="quantity-input"]').fill('3');
      await cartItem.locator('[data-testid="update-quantity"]').click();
      await expect(cartItem.locator('[data-testid="item-quantity"]')).toContainText('3');
    });

    test('should remove items from cart', async ({ page }) => {
      await helpers.addToCart('e2e-gold-bar-1oz', 1);
      await helpers.addToCart('e2e-silver-coin-1oz', 10);
      
      await page.click('[data-testid="cart-button"]');

      // Should have 2 items
      const cartItems = page.locator('[data-testid="cart-item"]');
      await expect(cartItems).toHaveCount(2);

      // Remove first item
      await cartItems.first().locator('[data-testid="remove-item"]').click();
      
      // Confirm removal
      await page.click('[data-testid="confirm-remove"]');

      // Should have 1 item left
      await expect(cartItems).toHaveCount(1);
      await expect(page.locator('[data-testid="cart-count"]')).toContainText('10');
    });

    test('should calculate cart totals correctly', async ({ page }) => {
      await helpers.addToCart('e2e-gold-bar-1oz', 2);
      await helpers.addToCart('e2e-silver-coin-1oz', 10);
      
      await page.click('[data-testid="cart-button"]');

      // Check cart totals
      await expect(page.locator('[data-testid="cart-subtotal"]')).toBeVisible();
      await expect(page.locator('[data-testid="cart-shipping"]')).toBeVisible();
      await expect(page.locator('[data-testid="cart-taxes"]')).toBeVisible();
      await expect(page.locator('[data-testid="cart-total"]')).toBeVisible();

      // Verify calculation
      const subtotal = await page.locator('[data-testid="cart-subtotal"]').textContent();
      const shipping = await page.locator('[data-testid="cart-shipping"]').textContent();
      const taxes = await page.locator('[data-testid="cart-taxes"]').textContent();
      const total = await page.locator('[data-testid="cart-total"]').textContent();

      const sub = parseFloat(subtotal?.replace(/[$,]/g, '') || '0');
      const ship = parseFloat(shipping?.replace(/[$,]/g, '') || '0');
      const tax = parseFloat(taxes?.replace(/[$,]/g, '') || '0');
      const tot = parseFloat(total?.replace(/[$,]/g, '') || '0');

      expect(tot).toBeCloseTo(sub + ship + tax, 2);
    });

    test('should save cart across sessions', async ({ page }) => {
      await helpers.addToCart('e2e-gold-bar-1oz', 1);
      
      // Logout and login again
      await helpers.logout();
      await helpers.loginAs('user');
      
      // Cart should be preserved
      await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
      
      await page.click('[data-testid="cart-button"]');
      const cartItems = page.locator('[data-testid="cart-item"]');
      await expect(cartItems).toHaveCount(1);
    });
  });

  test.describe('Quote Generation', () => {
    test('should generate quote with timer', async ({ page }) => {
      await helpers.addToCart('e2e-gold-bar-1oz', 2);
      await helpers.proceedToCheckout();

      // Should show quote generation
      await expect(page.locator('[data-testid="generating-quote"]')).toBeVisible();
      await helpers.waitForLoader();

      // Quote should be generated
      await expect(page.locator('[data-testid="quote-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="quote-timer"]')).toBeVisible();

      // Check quote timer (10 minutes)
      const timerText = await page.locator('[data-testid="quote-timer"]').textContent();
      expect(timerText).toMatch(/09:[5-6]\d/); // Should be around 9:5x minutes

      // Verify quote details
      await expect(page.locator('[data-testid="quote-items"]')).toBeVisible();
      await expect(page.locator('[data-testid="quote-subtotal"]')).toBeVisible();
      await expect(page.locator('[data-testid="quote-shipping"]')).toBeVisible();
      await expect(page.locator('[data-testid="quote-insurance"]')).toBeVisible();
      await expect(page.locator('[data-testid="quote-total"]')).toBeVisible();
    });

    test('should handle quote expiration', async ({ page }) => {
      await helpers.addToCart('e2e-gold-bar-1oz', 1);
      await helpers.proceedToCheckout();

      // Mock expired quote
      await page.evaluate(() => {
        // Simulate quote expiration
        const event = new CustomEvent('quoteExpired', {
          detail: { quoteId: 'quote-12345' }
        });
        window.dispatchEvent(event);
      });

      // Should show expiration notice
      await expect(page.locator('[data-testid="quote-expired"]')).toBeVisible();
      await expect(page.locator('[data-testid="quote-expired"]')).toContainText('quote has expired');
      
      // Should offer to generate new quote
      await expect(page.locator('[data-testid="generate-new-quote"]')).toBeVisible();
    });

    test('should show quote with different shipping options', async ({ page }) => {
      await helpers.addToCart('e2e-silver-coin-1oz', 1); // Small order
      await helpers.proceedToCheckout();

      await helpers.waitForLoader();

      // Should show shipping options
      const shippingOptions = page.locator('[data-testid="shipping-option"]');
      await expect(shippingOptions).toHaveCountGreaterThan(1);

      // Check standard vs expedited shipping
      await expect(page.locator('[data-testid="shipping-standard"]')).toContainText('Standard');
      await expect(page.locator('[data-testid="shipping-expedited"]')).toContainText('Expedited');

      // Prices should be different
      const standardPrice = await page.locator('[data-testid="shipping-standard"] [data-testid="price"]').textContent();
      const expeditedPrice = await page.locator('[data-testid="shipping-expedited"] [data-testid="price"]').textContent();

      const standard = parseFloat(standardPrice?.replace(/[$,]/g, '') || '0');
      const expedited = parseFloat(expeditedPrice?.replace(/[$,]/g, '') || '0');
      expect(expedited).toBeGreaterThan(standard);
    });

    test('should apply free shipping threshold', async ({ page }) => {
      await helpers.addToCart('e2e-gold-bar-1oz', 5); // Large order over $1000
      await helpers.proceedToCheckout();

      await helpers.waitForLoader();

      // Shipping should be free
      await expect(page.locator('[data-testid="free-shipping-applied"]')).toBeVisible();
      await expect(page.locator('[data-testid="quote-shipping"]')).toContainText('$0.00');
    });

    test('should calculate insurance for high-value orders', async ({ page }) => {
      await helpers.addToCart('e2e-gold-bar-1oz', 3); // High value order
      await helpers.proceedToCheckout();

      await helpers.waitForLoader();

      // Insurance should be required and calculated
      await expect(page.locator('[data-testid="insurance-required"]')).toBeVisible();
      await expect(page.locator('[data-testid="quote-insurance"]')).not.toContainText('$0.00');
      
      // Insurance should be percentage of order value
      const insurance = await page.locator('[data-testid="quote-insurance"]').textContent();
      const insuranceAmount = parseFloat(insurance?.replace(/[$,]/g, '') || '0');
      expect(insuranceAmount).toBeGreaterThan(0);
    });
  });

  test.describe('Checkout Process', () => {
    test('should complete checkout successfully', async ({ page }) => {
      await helpers.addToCart('e2e-gold-bar-1oz', 1);
      
      const shippingAddress = TestDataGenerator.validShippingAddress();
      const orderId = await helpers.completeCheckout(shippingAddress, 'ACCOUNT_BALANCE');

      // Verify order confirmation
      await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-id"]')).toContainText(orderId || '');
      await expect(page.locator('[data-testid="confirmation-message"]')).toContainText('Order placed successfully');

      // Check order details
      await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
      await expect(page.locator('[data-testid="shipping-address"]')).toContainText(shippingAddress.street);
      await expect(page.locator('[data-testid="estimated-delivery"]')).toBeVisible();
    });

    test('should validate shipping address', async ({ page }) => {
      await helpers.addToCart('e2e-gold-bar-1oz', 1);
      await helpers.proceedToCheckout();

      // Try to proceed without address
      await page.click('[data-testid="proceed-to-payment"]');

      // Should show validation errors
      await expect(page.locator('[data-testid="error-firstName"]')).toContainText('First name is required');
      await expect(page.locator('[data-testid="error-street"]')).toContainText('Street address is required');
      await expect(page.locator('[data-testid="error-city"]')).toContainText('City is required');
      await expect(page.locator('[data-testid="error-zipCode"]')).toContainText('ZIP code is required');
    });

    test('should show different fulfillment strategies', async ({ page }) => {
      // Test with JM strategy (default)
      await helpers.addToCart('e2e-gold-bar-1oz', 1);
      await helpers.proceedToCheckout();

      await helpers.waitForLoader();
      await expect(page.locator('[data-testid="fulfillment-provider"]')).toContainText('JM Bullion');

      // Mock Brinks strategy
      await page.evaluate(() => {
        localStorage.setItem('mockFulfillmentStrategy', 'BRINKS');
      });

      await page.reload();
      await helpers.waitForLoader();
      
      await expect(page.locator('[data-testid="fulfillment-provider"]')).toContainText('Brinks');
      await expect(page.locator('[data-testid="secure-delivery-badge"]')).toBeVisible();
    });

    test('should handle insufficient account balance', async ({ page }) => {
      // Mock insufficient balance
      await page.route('/api/wallet/balances', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            code: 'SUCCESS',
            data: {
              balances: [
                { asset: 'USD', balance: '100.00', availableBalance: '100.00' }
              ]
            }
          })
        });
      });

      await helpers.addToCart('e2e-gold-bar-1oz', 1); // Costs more than $100
      await helpers.proceedToCheckout();

      const shippingAddress = TestDataGenerator.validShippingAddress();
      await helpers.fillForm(shippingAddress);
      
      await page.click('[data-testid="complete-purchase"]');

      // Should show insufficient balance error
      await helpers.waitForToast('error');
      await expect(page.locator('[data-testid="insufficient-balance"]')).toContainText('Insufficient account balance');
      
      // Should show funding options
      await expect(page.locator('[data-testid="fund-account-button"]')).toBeVisible();
    });

    test('should handle payment method selection', async ({ page }) => {
      await helpers.addToCart('e2e-gold-bar-1oz', 1);
      await helpers.proceedToCheckout();

      // Check available payment methods
      await expect(page.locator('[data-testid="payment-account-balance"]')).toBeVisible();
      
      // In a real implementation, there might be other payment methods
      const paymentMethods = page.locator('[data-testid^="payment-"]');
      const methodCount = await paymentMethods.count();
      expect(methodCount).toBeGreaterThanOrEqual(1);
    });

    test('should apply promo codes', async ({ page }) => {
      await helpers.addToCart('e2e-gold-bar-1oz', 1);
      await helpers.proceedToCheckout();

      // Apply promo code
      await page.fill('[data-testid="promo-code-input"]', 'SAVE10');
      await page.click('[data-testid="apply-promo-code"]');

      // Mock promo code response
      await page.route('/api/shop/promo-code/apply', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            code: 'SUCCESS',
            data: {
              discount: '218.50', // 10% off
              discountPercent: '10',
              validCode: true,
            }
          })
        });
      });

      await helpers.waitForToast('success');
      await expect(page.locator('[data-testid="promo-discount"]')).toContainText('$218.50');
      await expect(page.locator('[data-testid="promo-code-applied"]')).toContainText('SAVE10 applied');
    });

    test('should handle international shipping', async ({ page }) => {
      await helpers.addToCart('e2e-gold-bar-1oz', 1);
      await helpers.proceedToCheckout();

      // Fill international address
      await helpers.fillForm({
        firstName: 'John',
        lastName: 'Doe',
        street: '123 International St',
        city: 'Toronto',
        state: 'ON',
        zipCode: 'M5V 3A8',
        country: 'CA', // Canada
        phone: '+1-416-555-0123',
      });

      // Should show international shipping notice
      await expect(page.locator('[data-testid="international-shipping"]')).toBeVisible();
      await expect(page.locator('[data-testid="customs-notice"]')).toContainText('customs duties');
      
      // Shipping cost should be higher
      const shippingCost = await page.locator('[data-testid="quote-shipping"]').textContent();
      const cost = parseFloat(shippingCost?.replace(/[$,]/g, '') || '0');
      expect(cost).toBeGreaterThan(50); // International shipping is more expensive
    });
  });

  test.describe('Order Management', () => {
    let orderId: string;

    test.beforeEach(async ({ page }) => {
      // Create test order
      await helpers.addToCart('e2e-gold-bar-1oz', 1);
      const shippingAddress = TestDataGenerator.validShippingAddress();
      orderId = await helpers.completeCheckout(shippingAddress) || 'test-order-123';
    });

    test('should display order history', async ({ page }) => {
      await page.goto('/shop/orders');

      // Verify orders page
      await expect(page.locator('h1')).toContainText('Order History');
      
      // Should show recent order
      const orderRows = page.locator('[data-testid="order-row"]');
      await expect(orderRows).toHaveCountGreaterThan(0);

      const firstOrder = orderRows.first();
      await expect(firstOrder.locator('[data-testid="order-id"]')).toBeVisible();
      await expect(firstOrder.locator('[data-testid="order-status"]')).toBeVisible();
      await expect(firstOrder.locator('[data-testid="order-total"]')).toBeVisible();
      await expect(firstOrder.locator('[data-testid="order-date"]')).toBeVisible();
    });

    test('should show detailed order information', async ({ page }) => {
      await page.goto(`/shop/order/${orderId}`);

      // Verify order details page
      await expect(page.locator('h1')).toContainText('Order Details');
      await expect(page.locator('[data-testid="order-id-display"]')).toContainText(orderId);

      // Check order sections
      await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
      await expect(page.locator('[data-testid="shipping-address"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-timeline"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-method"]')).toBeVisible();

      // Check order timeline
      const timelineItems = page.locator('[data-testid="timeline-item"]');
      await expect(timelineItems).toHaveCountGreaterThan(0);
      
      // First item should be order confirmation
      await expect(timelineItems.first().locator('[data-testid="timeline-status"]')).toContainText('Confirmed');
    });

    test('should show order tracking information', async ({ page }) => {
      // Mock order with tracking
      await page.route(`/api/shop/order/${orderId}`, route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            code: 'SUCCESS',
            data: {
              order: {
                id: orderId,
                status: 'SHIPPED',
                tracking: {
                  carrier: 'FedEx',
                  trackingNumber: '1234567890123456',
                  status: 'IN_TRANSIT',
                  estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                  trackingUrl: 'https://fedex.com/track/1234567890123456',
                }
              }
            }
          })
        });
      });

      await page.goto(`/shop/order/${orderId}`);

      // Check tracking information
      await expect(page.locator('[data-testid="tracking-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="tracking-number"]')).toContainText('1234567890123456');
      await expect(page.locator('[data-testid="carrier"]')).toContainText('FedEx');
      await expect(page.locator('[data-testid="tracking-status"]')).toContainText('In Transit');
      await expect(page.locator('[data-testid="estimated-delivery"]')).toBeVisible();
      
      // Track package link should work
      await expect(page.locator('[data-testid="track-package-link"]')).toHaveAttribute('href', 'https://fedex.com/track/1234567890123456');
    });

    test('should allow order cancellation for eligible orders', async ({ page }) => {
      // Mock order that can be cancelled
      await page.route(`/api/shop/order/${orderId}`, route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            code: 'SUCCESS',
            data: {
              order: {
                id: orderId,
                status: 'PROCESSING',
                canCancel: true,
              }
            }
          })
        });
      });

      await page.goto(`/shop/order/${orderId}`);

      // Should show cancel button
      await expect(page.locator('[data-testid="cancel-order-button"]')).toBeVisible();
      
      // Cancel order
      await page.click('[data-testid="cancel-order-button"]');
      
      // Confirm cancellation
      await page.fill('[data-testid="cancellation-reason"]', 'Changed mind');
      await page.click('[data-testid="confirm-cancellation"]');

      await helpers.waitForToast('success');
      await expect(page.locator('[data-testid="order-cancelled"]')).toContainText('Order cancelled successfully');
    });

    test('should not allow cancellation of shipped orders', async ({ page }) => {
      // Mock shipped order
      await page.route(`/api/shop/order/${orderId}`, route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            code: 'SUCCESS',
            data: {
              order: {
                id: orderId,
                status: 'SHIPPED',
                canCancel: false,
              }
            }
          })
        });
      });

      await page.goto(`/shop/order/${orderId}`);

      // Cancel button should not be visible
      await expect(page.locator('[data-testid="cancel-order-button"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="cannot-cancel-notice"]')).toContainText('cannot be cancelled');
    });
  });

  test.describe('Feature Flag Integration', () => {
    test('should skip vault redemption features when disabled', async ({ page }) => {
      const isVaultEnabled = await helpers.checkFeatureEnabled('VAULT_REDEMPTION');
      
      if (!isVaultEnabled) {
        await helpers.navigateToSection('shop');
        
        // Vault redemption options should not be visible
        await expect(page.locator('[data-testid="vault-redemption-option"]')).not.toBeVisible();
        await expect(page.locator('[data-testid="physical-delivery-tab"]')).not.toBeVisible();
      }
    });

    test('should show different fulfillment options based on strategy', async ({ page }) => {
      await helpers.navigateToSection('shop');
      await helpers.addToCart('e2e-gold-bar-1oz', 1);
      await helpers.proceedToCheckout();

      // Check fulfillment strategy indicator
      const fulfillmentProvider = page.locator('[data-testid="fulfillment-provider"]');
      await expect(fulfillmentProvider).toBeVisible();

      const provider = await fulfillmentProvider.textContent();
      
      if (provider?.includes('JM')) {
        await expect(page.locator('[data-testid="jm-bullion-branding"]')).toBeVisible();
        await expect(page.locator('[data-testid="estimated-processing"]')).toContainText('3-5 business days');
      } else if (provider?.includes('Brinks')) {
        await expect(page.locator('[data-testid="brinks-branding"]')).toBeVisible();
        await expect(page.locator('[data-testid="secure-transport-badge"]')).toBeVisible();
        await expect(page.locator('[data-testid="estimated-processing"]')).toContainText('2-4 business days');
      }
    });
  });

  test.describe('Performance and UX', () => {
    test('should load shop page quickly', async ({ page }) => {
      const loadTime = await helpers.measurePageLoad('/shop');
      
      expect(loadTime).toBeLessThan(3000);
      console.log(`Shop page loaded in ${loadTime}ms`);
    });

    test('should handle product search efficiently', async ({ page }) => {
      await helpers.navigateToSection('shop');

      const searchTime = await helpers.measureActionTime(async () => {
        await page.fill('[data-testid="product-search"]', 'gold');
        await page.click('[data-testid="search-button"]');
        await helpers.waitForLoader();
      });

      expect(searchTime).toBeLessThan(1500);
      console.log(`Product search completed in ${searchTime}ms`);
    });

    test('should optimize cart operations', async ({ page }) => {
      const cartTime = await helpers.measureActionTime(async () => {
        await helpers.addToCart('e2e-gold-bar-1oz', 1);
      });

      expect(cartTime).toBeLessThan(1000);
      console.log(`Add to cart completed in ${cartTime}ms`);
    });

    test('should handle mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await helpers.navigateToSection('shop');

      // Mobile-specific elements should be visible
      await expect(page.locator('[data-testid="mobile-product-grid"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-filter-button"]')).toBeVisible();
      
      // Cart should be accessible on mobile
      await expect(page.locator('[data-testid="mobile-cart-button"]')).toBeVisible();
    });

    test('should provide good accessibility', async ({ page }) => {
      await helpers.navigateToSection('shop');

      // Product cards should be keyboard navigable
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      
      // Should be able to navigate through products
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        const currentFocus = page.locator(':focus');
        
        // Should focus on interactive elements
        const tagName = await currentFocus.evaluate(el => el.tagName.toLowerCase());
        expect(['button', 'a', 'input', 'select'].includes(tagName)).toBe(true);
      }

      // Products should have proper ARIA labels
      const firstProduct = page.locator('[data-testid="product-card"]').first();
      await expect(firstProduct).toHaveAttribute('role', 'article');
      
      const productLink = firstProduct.locator('a').first();
      await expect(productLink).toHaveAttribute('aria-label');
    });
  });
});
