/**
 * Deep link configuration for PBCEx iOS wrapper
 * 
 * Defines the custom URL scheme and route mapping for the iOS app.
 * Used by tests and future wrapper implementation.
 */

export const DEEP_LINK_SCHEME = 'pbcex';

export interface DeepLinkRoute {
  route: string;
  path: string;
  description: string;
}

/**
 * Map of deep link routes to internal Next.js paths
 */
export const DEEP_LINK_ROUTES: DeepLinkRoute[] = [
  {
    route: 'dashboard',
    path: '/dashboard',
    description: 'User dashboard'
  },
  {
    route: 'markets',
    path: '/markets',
    description: 'Markets overview'
  },
  {
    route: 'trade',
    path: '/markets/{symbol}',
    description: 'Trading page for specific symbol (requires symbol param)'
  },
  {
    route: 'wallet.assets',
    path: '/wallet/assets',
    description: 'Wallet assets page'
  },
  {
    route: 'wallet.orders',
    path: '/wallet/orders',
    description: 'Order history page'
  },
  {
    route: 'wallet.transactions',
    path: '/wallet/transactions',
    description: 'Transaction history page'
  },
  {
    route: 'legal.privacy',
    path: '/legal/privacy',
    description: 'Privacy policy page'
  },
  {
    route: 'legal.tos',
    path: '/legal/tos',
    description: 'Terms of service page'
  }
];

/**
 * Parse deep link URL and return internal path
 * 
 * @param deepLinkUrl - Full deep link URL (e.g., "pbcex://open?route=trade&symbol=XAUUSD")
 * @returns Internal path or null if invalid
 */
export function parseDeepLink(deepLinkUrl: string): string | null {
  try {
    const url = new URL(deepLinkUrl);
    
    // Verify scheme
    if (url.protocol !== `${DEEP_LINK_SCHEME}:`) {
      return null;
    }
    
    // Verify host (should be 'open')
    if (url.hostname !== 'open') {
      return null;
    }
    
    const route = url.searchParams.get('route');
    if (!route) return null;
    
    // Find matching route
    const routeConfig = DEEP_LINK_ROUTES.find(r => r.route === route);
    if (!routeConfig) return null;
    
    let path = routeConfig.path;
    
    // Handle parameterized routes
    if (route === 'trade') {
      const symbol = url.searchParams.get('symbol');
      if (symbol) {
        path = path.replace('{symbol}', symbol);
      } else {
        // Default to markets page if no symbol provided
        path = '/markets';
      }
    }
    
    return path;
  } catch {
    return null;
  }
}

/**
 * Generate deep link URL for a given route and parameters
 * 
 * @param route - Route identifier
 * @param params - Optional parameters (e.g., { symbol: 'XAUUSD' })
 * @returns Deep link URL
 */
export function generateDeepLink(route: string, params?: Record<string, string>): string {
  const baseUrl = `${DEEP_LINK_SCHEME}://open?route=${route}`;
  
  if (!params) return baseUrl;
  
  const searchParams = new URLSearchParams(params);
  return `${baseUrl}&${searchParams.toString()}`;
}
