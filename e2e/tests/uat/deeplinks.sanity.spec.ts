import { test, expect } from '@playwright/test';
import { parseDeepLink, generateDeepLink, DEEP_LINK_ROUTES } from '../../../frontend/config/deeplinks';

test.describe('Deep Links Sanity', () => {
  test.skip(
    () => process.env.PUBLIC_IOS_WRAPPER !== 'true', 
    'Skipped until iOS wrapper is active (PUBLIC_IOS_WRAPPER=true)'
  );

  test('should parse valid deep link URLs correctly', async () => {
    // Test basic routes
    expect(parseDeepLink('pbcex://open?route=dashboard')).toBe('/dashboard');
    expect(parseDeepLink('pbcex://open?route=markets')).toBe('/markets');
    expect(parseDeepLink('pbcex://open?route=wallet.assets')).toBe('/wallet/assets');
    expect(parseDeepLink('pbcex://open?route=legal.privacy')).toBe('/legal/privacy');
    
    // Test parameterized route
    expect(parseDeepLink('pbcex://open?route=trade&symbol=XAUUSD')).toBe('/markets/XAUUSD');
    expect(parseDeepLink('pbcex://open?route=trade&symbol=XAGUSD')).toBe('/markets/XAGUSD');
    
    // Test trade route without symbol (should default to markets)
    expect(parseDeepLink('pbcex://open?route=trade')).toBe('/markets');
  });

  test('should reject invalid deep link URLs', async () => {
    // Wrong scheme
    expect(parseDeepLink('https://open?route=dashboard')).toBeNull();
    expect(parseDeepLink('myapp://open?route=dashboard')).toBeNull();
    
    // Wrong host
    expect(parseDeepLink('pbcex://invalid?route=dashboard')).toBeNull();
    
    // Missing route parameter
    expect(parseDeepLink('pbcex://open')).toBeNull();
    expect(parseDeepLink('pbcex://open?')).toBeNull();
    
    // Invalid route
    expect(parseDeepLink('pbcex://open?route=nonexistent')).toBeNull();
    
    // Malformed URLs
    expect(parseDeepLink('not-a-url')).toBeNull();
    expect(parseDeepLink('')).toBeNull();
  });

  test('should generate deep link URLs correctly', async () => {
    expect(generateDeepLink('dashboard')).toBe('pbcex://open?route=dashboard');
    expect(generateDeepLink('markets')).toBe('pbcex://open?route=markets');
    
    // With parameters
    expect(generateDeepLink('trade', { symbol: 'XAUUSD' }))
      .toBe('pbcex://open?route=trade&symbol=XAUUSD');
    
    expect(generateDeepLink('trade', { symbol: 'XAGUSD', extra: 'param' }))
      .toBe('pbcex://open?route=trade&symbol=XAGUSD&extra=param');
  });

  test('should have all expected routes defined', async () => {
    const expectedRoutes = [
      'dashboard',
      'markets', 
      'trade',
      'wallet.assets',
      'wallet.orders',
      'wallet.transactions',
      'legal.privacy',
      'legal.tos'
    ];

    const definedRoutes = DEEP_LINK_ROUTES.map(r => r.route);
    
    for (const expectedRoute of expectedRoutes) {
      expect(definedRoutes).toContain(expectedRoute);
    }
    
    // Verify each route has required fields
    for (const route of DEEP_LINK_ROUTES) {
      expect(route.route).toBeTruthy();
      expect(route.path).toBeTruthy();
      expect(route.description).toBeTruthy();
    }
  });
});
