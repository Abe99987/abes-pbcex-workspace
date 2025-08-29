import { Page, expect } from '@playwright/test';
import path from 'path';

/**
 * E2E Test Helper Functions
 * 
 * Provides reusable utilities for Playwright E2E tests
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Authentication helpers
   */
  async loginAs(role: 'user' | 'admin' | 'support' | 'teller') {
    const storageFile = path.join(__dirname, `../fixtures/auth/${role}-auth.json`);
    
    try {
      await this.page.context().addCookies(require(storageFile).cookies || []);
      await this.page.goto('/dashboard');
      
      // Verify login was successful
      await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible();
      
    } catch (error) {
      console.error(`Failed to login as ${role}:`, error);
      throw error;
    }
  }

  async logout() {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="logout-button"]');
    await expect(this.page).toHaveURL('/auth/login');
  }

  /**
   * Navigation helpers
   */
  async navigateToSection(section: string) {
    const navigationMap = {
      'dashboard': '/dashboard',
      'wallet': '/wallet',
      'trade': '/trade',
      'shop': '/shop',
      'account': '/account',
      'kyc': '/account/kyc',
      'admin': '/admin',
      'support': '/support',
    };

    const url = navigationMap[section as keyof typeof navigationMap];
    if (!url) {
      throw new Error(`Unknown section: ${section}`);
    }

    await this.page.goto(url);
  }

  /**
   * Form helpers
   */
  async fillForm(formData: Record<string, string | number | boolean>) {
    for (const [field, value] of Object.entries(formData)) {
      const selector = `[name="${field}"], [data-testid="${field}"]`;
      
      if (typeof value === 'boolean') {
        if (value) {
          await this.page.check(selector);
        } else {
          await this.page.uncheck(selector);
        }
      } else {
        await this.page.fill(selector, String(value));
      }
    }
  }

  async submitForm(formSelector = 'form', submitButtonSelector = 'button[type="submit"]') {
    await this.page.click(submitButtonSelector);
    
    // Wait for form submission to complete
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Waiting helpers
   */
  async waitForToast(type: 'success' | 'error' | 'info' = 'success', timeout = 5000) {
    const selector = `[data-testid="toast-${type}"]`;
    await expect(this.page.locator(selector)).toBeVisible({ timeout });
  }

  async waitForLoader(timeout = 10000) {
    await expect(this.page.locator('[data-testid="loading-spinner"]')).toBeHidden({ timeout });
  }

  async waitForModal(modalTestId: string, timeout = 5000) {
    await expect(this.page.locator(`[data-testid="${modalTestId}"]`)).toBeVisible({ timeout });
  }

  async closeModal(modalTestId: string) {
    await this.page.click(`[data-testid="${modalTestId}"] [data-testid="close-button"]`);
    await expect(this.page.locator(`[data-testid="${modalTestId}"]`)).toBeHidden();
  }

  /**
   * Trading helpers
   */
  async placeTrade(side: 'BUY' | 'SELL', asset: string, quantity: string, orderType: 'MARKET' | 'LIMIT' = 'MARKET', limitPrice?: string) {
    await this.navigateToSection('trade');
    
    // Select asset
    await this.page.click('[data-testid="asset-selector"]');
    await this.page.click(`[data-testid="asset-option-${asset}"]`);
    
    // Select side
    await this.page.click(`[data-testid="side-${side.toLowerCase()}"]`);
    
    // Enter quantity
    await this.page.fill('[data-testid="quantity-input"]', quantity);
    
    // Select order type
    await this.page.selectOption('[data-testid="order-type-select"]', orderType);
    
    // Enter limit price if needed
    if (orderType === 'LIMIT' && limitPrice) {
      await this.page.fill('[data-testid="limit-price-input"]', limitPrice);
    }
    
    // Submit order
    await this.page.click('[data-testid="place-order-button"]');
    
    // Wait for confirmation
    await this.waitForToast('success');
    
    return await this.getLatestOrderId();
  }

  async getLatestOrderId(): Promise<string> {
    // Navigate to order history and get the latest order ID
    await this.page.goto('/trade/orders');
    const latestOrder = this.page.locator('[data-testid="order-row"]').first();
    return await latestOrder.getAttribute('data-order-id') || '';
  }

  /**
   * Shop helpers
   */
  async addToCart(productId: string, quantity = 1) {
    await this.navigateToSection('shop');
    await this.page.click(`[data-testid="product-${productId}"] [data-testid="add-to-cart"]`);
    
    if (quantity > 1) {
      await this.page.fill('[data-testid="quantity-selector"]', String(quantity));
    }
    
    await this.page.click('[data-testid="add-to-cart-confirm"]');
    await this.waitForToast('success');
  }

  async proceedToCheckout() {
    await this.page.click('[data-testid="cart-button"]');
    await this.page.click('[data-testid="proceed-to-checkout"]');
  }

  async completeCheckout(shippingAddress: any, paymentMethod = 'ACCOUNT_BALANCE') {
    // Fill shipping address
    await this.fillForm(shippingAddress);
    
    // Select payment method
    await this.page.selectOption('[data-testid="payment-method"]', paymentMethod);
    
    // Complete purchase
    await this.page.click('[data-testid="complete-purchase"]');
    await this.waitForToast('success');
    
    // Get order confirmation
    await expect(this.page.locator('[data-testid="order-confirmation"]')).toBeVisible();
    return await this.page.locator('[data-testid="order-id"]').textContent();
  }

  /**
   * Wallet helpers
   */
  async convertPaxgToXau(amount: string) {
    await this.navigateToSection('wallet');
    await this.page.click('[data-testid="convert-paxg-to-xau"]');
    await this.page.fill('[data-testid="conversion-amount"]', amount);
    await this.page.click('[data-testid="confirm-conversion"]');
    await this.waitForToast('success');
  }

  async getBalance(asset: string): Promise<string> {
    await this.navigateToSection('wallet');
    const balanceElement = this.page.locator(`[data-testid="balance-${asset}"]`);
    await expect(balanceElement).toBeVisible();
    return await balanceElement.textContent() || '0';
  }

  /**
   * Admin helpers
   */
  async approveKyc(userId: string, notes = 'KYC approved by E2E test') {
    await this.navigateToSection('admin');
    await this.page.goto(`/admin/user/${userId}`);
    await this.page.click('[data-testid="approve-kyc-button"]');
    await this.page.fill('[data-testid="kyc-notes"]', notes);
    await this.page.click('[data-testid="confirm-kyc-approval"]');
    await this.waitForToast('success');
  }

  async rejectKyc(userId: string, reason: string, notes: string) {
    await this.navigateToSection('admin');
    await this.page.goto(`/admin/user/${userId}`);
    await this.page.click('[data-testid="reject-kyc-button"]');
    await this.page.selectOption('[data-testid="rejection-reason"]', reason);
    await this.page.fill('[data-testid="kyc-notes"]', notes);
    await this.page.click('[data-testid="confirm-kyc-rejection"]');
    await this.waitForToast('success');
  }

  /**
   * Support helpers
   */
  async searchUser(email: string) {
    await this.navigateToSection('support');
    await this.page.fill('[data-testid="user-search"]', email);
    await this.page.click('[data-testid="search-button"]');
    await this.waitForLoader();
    
    const userResult = this.page.locator('[data-testid="user-search-result"]').first();
    await expect(userResult).toBeVisible();
    
    return await userResult.getAttribute('data-user-id');
  }

  async resetUserPassword(userId: string, reason: string) {
    await this.page.goto(`/support/user/${userId}`);
    await this.page.click('[data-testid="reset-password-button"]');
    await this.page.fill('[data-testid="reset-reason"]', reason);
    await this.page.click('[data-testid="confirm-password-reset"]');
    await this.waitForToast('success');
  }

  /**
   * Validation helpers
   */
  async expectBalance(asset: string, expectedBalance: string) {
    const actualBalance = await this.getBalance(asset);
    expect(actualBalance).toBe(expectedBalance);
  }

  async expectOrderStatus(orderId: string, expectedStatus: string) {
    await this.page.goto(`/trade/order/${orderId}`);
    const statusElement = this.page.locator('[data-testid="order-status"]');
    await expect(statusElement).toHaveText(expectedStatus);
  }

  async expectUrl(expectedUrl: string | RegExp) {
    await expect(this.page).toHaveURL(expectedUrl);
  }

  async expectVisible(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async expectHidden(selector: string) {
    await expect(this.page.locator(selector)).toBeHidden();
  }

  async expectText(selector: string, expectedText: string | RegExp) {
    await expect(this.page.locator(selector)).toHaveText(expectedText);
  }

  /**
   * Screenshot helpers
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  async takeElementScreenshot(selector: string, name: string) {
    const element = this.page.locator(selector);
    await element.screenshot({ 
      path: `test-results/screenshots/${name}.png` 
    });
  }

  /**
   * Performance helpers
   */
  async measurePageLoad(url: string): Promise<number> {
    const startTime = Date.now();
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
    return Date.now() - startTime;
  }

  async measureActionTime(action: () => Promise<void>): Promise<number> {
    const startTime = Date.now();
    await action();
    return Date.now() - startTime;
  }

  /**
   * Feature flag helpers
   */
  async checkFeatureEnabled(feature: string): Promise<boolean> {
    try {
      const response = await this.page.request.get('/api/feature-flags');
      const data = await response.json();
      return data.features[feature]?.enabled || false;
    } catch {
      return false;
    }
  }

  async skipIfFeatureDisabled(feature: string, testName: string) {
    const isEnabled = await this.checkFeatureEnabled(feature);
    if (!isEnabled) {
      console.log(`⏭️ Skipping test "${testName}" - feature "${feature}" is disabled`);
      return true;
    }
    return false;
  }
}

/**
 * Test data generators
 */
export class TestDataGenerator {
  static randomEmail(prefix = 'test'): string {
    return `${prefix}+${Date.now()}+${Math.random().toString(36).substr(2, 9)}@example.com`;
  }

  static randomString(length = 10): string {
    return Math.random().toString(36).substr(2, length);
  }

  static randomNumber(min = 1, max = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randomPrice(min = 1, max = 10000, decimals = 2): string {
    const price = Math.random() * (max - min) + min;
    return price.toFixed(decimals);
  }

  static validShippingAddress() {
    return {
      firstName: 'John',
      lastName: 'Doe',
      street: '123 Test Street',
      city: 'Test City',
      state: 'NY',
      zipCode: '12345',
      country: 'US',
      phone: '+1-555-0123',
    };
  }

  static validKycData() {
    return {
      dateOfBirth: '1990-01-01',
      phone: '+1-555-0123',
      ssn: '123-45-6789',
      street: '123 Test Street',
      city: 'Test City',
      state: 'NY',
      zipCode: '12345',
      country: 'US',
    };
  }
}

/**
 * Custom assertions
 */
export class E2EAssertions {
  static async expectApiSuccess(page: Page, apiCall: () => Promise<any>) {
    const response = await apiCall();
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.code).toBe('SUCCESS');
    return data;
  }

  static async expectApiError(page: Page, apiCall: () => Promise<any>, expectedErrorCode: string) {
    const response = await apiCall();
    expect(response.status()).toBeGreaterThanOrEqual(400);
    const data = await response.json();
    expect(data.code).toBe(expectedErrorCode);
    return data;
  }

  static expectPriceFormat(price: string) {
    expect(price).toMatch(/^\d+\.\d{2}$/);
    expect(parseFloat(price)).toBeGreaterThan(0);
  }

  static expectTimestamp(timestamp: string) {
    expect(new Date(timestamp)).toBeInstanceOf(Date);
    expect(new Date(timestamp).getTime()).toBeGreaterThan(0);
  }

  static expectUuid(uuid: string) {
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  }
}
