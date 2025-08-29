/**
 * K6 Configuration File for PBCEx Load Tests
 * 
 * Centralized configuration for all k6 load test scenarios
 */

// Environment-specific configurations
export const environments = {
  local: {
    BASE_URL: 'http://localhost:4001',
    WS_URL: 'ws://localhost:4001',
    DATABASE_URL: 'postgresql://user:password@localhost:5432/pbcex_test',
  },
  
  staging: {
    BASE_URL: 'https://api-staging.pbcex.com',
    WS_URL: 'wss://api-staging.pbcex.com',
    DATABASE_URL: process.env.STAGING_DATABASE_URL,
  },
  
  production: {
    BASE_URL: 'https://api.pbcex.com',
    WS_URL: 'wss://api.pbcex.com',
    DATABASE_URL: process.env.PRODUCTION_DATABASE_URL,
  },
};

// Test profiles for different load scenarios
export const testProfiles = {
  smoke: {
    description: 'Minimal load test to verify functionality',
    vus: 1,
    duration: '30s',
    thresholds: {
      http_req_duration: ['p(95)<1000'],
      http_req_failed: ['rate<0.1'],
    },
  },
  
  load: {
    description: 'Normal expected load',
    stages: [
      { duration: '2m', target: 10 },
      { duration: '5m', target: 10 },
      { duration: '2m', target: 25 },
      { duration: '5m', target: 25 },
      { duration: '2m', target: 0 },
    ],
    thresholds: {
      http_req_duration: ['p(95)<500'],
      http_req_failed: ['rate<0.02'],
      login_success_rate: ['rate>0.99'],
      order_success_rate: ['rate>0.98'],
    },
  },
  
  stress: {
    description: 'Above normal capacity',
    stages: [
      { duration: '2m', target: 50 },
      { duration: '5m', target: 50 },
      { duration: '2m', target: 100 },
      { duration: '5m', target: 100 },
      { duration: '2m', target: 200 },
      { duration: '5m', target: 200 },
      { duration: '2m', target: 0 },
    ],
    thresholds: {
      http_req_duration: ['p(95)<1000'],
      http_req_failed: ['rate<0.05'],
      login_success_rate: ['rate>0.95'],
      order_success_rate: ['rate>0.90'],
    },
  },
  
  spike: {
    description: 'Sudden load increase',
    stages: [
      { duration: '1m', target: 10 },
      { duration: '30s', target: 200 },
      { duration: '2m', target: 200 },
      { duration: '30s', target: 10 },
      { duration: '1m', target: 0 },
    ],
    thresholds: {
      http_req_duration: ['p(95)<2000'],
      http_req_failed: ['rate<0.1'],
    },
  },
  
  volume: {
    description: 'High volume sustained load',
    stages: [
      { duration: '5m', target: 100 },
      { duration: '15m', target: 100 },
      { duration: '5m', target: 0 },
    ],
    thresholds: {
      http_req_duration: ['p(95)<800'],
      http_req_failed: ['rate<0.03'],
    },
  },
  
  soak: {
    description: 'Extended duration test',
    vus: 50,
    duration: '60m',
    thresholds: {
      http_req_duration: ['p(95)<600'],
      http_req_failed: ['rate<0.02'],
    },
  },
};

// Asset configuration for trading tests
export const assets = {
  primary: ['XAU-s', 'XAG-s'],
  secondary: ['XPT-s', 'XPD-s', 'XCU-s'],
  all: ['XAU-s', 'XAG-s', 'XPT-s', 'XPD-s', 'XCU-s'],
};

// Test user configuration
export const testUsers = {
  count: parseInt(process.env.TEST_USERS || '100'),
  roles: {
    user: 0.80,    // 80% regular users
    admin: 0.05,   // 5% admin users
    support: 0.10, // 10% support users
    teller: 0.05,  // 5% teller users
  },
};

// Trading simulation parameters
export const tradingParams = {
  orderSizes: {
    small: { min: 0.1, max: 1.0 },
    medium: { min: 1.0, max: 5.0 },
    large: { min: 5.0, max: 20.0 },
  },
  
  orderTypes: {
    market: 0.7,  // 70% market orders
    limit: 0.3,   // 30% limit orders
  },
  
  sides: {
    buy: 0.5,     // 50% buy orders
    sell: 0.5,    // 50% sell orders
  },
  
  // Behavior patterns
  behaviors: {
    scalper: { frequency: 'very_high', orderSize: 'small', assets: 'primary' },
    dayTrader: { frequency: 'high', orderSize: 'medium', assets: 'all' },
    swingTrader: { frequency: 'medium', orderSize: 'medium', assets: 'secondary' },
    investor: { frequency: 'low', orderSize: 'large', assets: 'primary' },
  },
};

// Performance expectations
export const performanceTargets = {
  endpoints: {
    '/api/health': { p95: 50, p99: 100 },
    '/api/auth/login': { p95: 500, p99: 1000 },
    '/api/trade/prices': { p95: 100, p99: 200 },
    '/api/trade/order': { p95: 1000, p99: 2000 },
    '/api/wallet/balances': { p95: 200, p99: 500 },
    '/api/shop/products': { p95: 300, p99: 600 },
  },
  
  availability: {
    overall: 99.9,
    login: 99.5,
    trading: 99.8,
    prices: 99.9,
  },
  
  throughput: {
    trades_per_second: 50,
    price_updates_per_second: 1000,
    concurrent_users: 500,
  },
};

// Error handling configuration
export const errorHandling = {
  retries: {
    max: 3,
    backoff: 'exponential',
    initialDelay: 1000,
  },
  
  circuitBreaker: {
    failureThreshold: 5,
    timeout: 60000,
    resetTimeout: 30000,
  },
  
  rateLimit: {
    requestsPerSecond: 100,
    burstSize: 200,
  },
};

// Monitoring and alerting
export const monitoring = {
  metrics: {
    custom: [
      'login_success_rate',
      'order_success_rate',
      'price_update_rate',
      'ws_connection_success',
      'market_data_availability',
    ],
  },
  
  alerts: {
    errorRate: {
      threshold: 0.05,
      window: '5m',
      severity: 'critical',
    },
    responseTime: {
      p95Threshold: 1000,
      window: '2m',
      severity: 'warning',
    },
    availability: {
      threshold: 0.99,
      window: '1m',
      severity: 'critical',
    },
  },
};

// Test data management
export const testData = {
  cleanup: {
    enabled: true,
    retentionDays: 7,
  },
  
  generation: {
    users: testUsers.count,
    orders: testUsers.count * 10,
    trades: testUsers.count * 5,
  },
  
  isolation: {
    useTestDatabase: true,
    testDataPrefix: 'loadtest_',
  },
};

/**
 * Get configuration for specific environment
 */
export function getConfig(env = 'local') {
  const environment = environments[env] || environments.local;
  
  return {
    ...environment,
    testProfiles,
    assets,
    testUsers,
    tradingParams,
    performanceTargets,
    errorHandling,
    monitoring,
    testData,
  };
}

/**
 * Get test profile by name
 */
export function getTestProfile(profileName = 'load') {
  return testProfiles[profileName] || testProfiles.load;
}

/**
 * Generate test user credentials
 */
export function generateTestUser(index) {
  const roles = Object.keys(testUsers.roles);
  let cumulativeProbability = 0;
  const random = Math.random();
  
  let role = 'user'; // default
  for (const [roleName, probability] of Object.entries(testUsers.roles)) {
    cumulativeProbability += probability;
    if (random <= cumulativeProbability) {
      role = roleName;
      break;
    }
  }
  
  return {
    email: `loadtest${index}@example.com`,
    password: 'LoadTest123!',
    role: role.toUpperCase(),
    firstName: `Load${index}`,
    lastName: 'Test',
  };
}

/**
 * Get random asset based on trading focus
 */
export function getRandomAsset(focus = 'all') {
  const assetList = assets[focus] || assets.all;
  return assetList[Math.floor(Math.random() * assetList.length)];
}

/**
 * Generate realistic order parameters
 */
export function generateOrderParams() {
  const behaviorTypes = Object.keys(tradingParams.behaviors);
  const behavior = tradingParams.behaviors[
    behaviorTypes[Math.floor(Math.random() * behaviorTypes.length)]
  ];
  
  const orderSize = tradingParams.orderSizes[behavior.orderSize];
  const quantity = (Math.random() * (orderSize.max - orderSize.min) + orderSize.min).toFixed(2);
  
  const side = Math.random() < tradingParams.sides.buy ? 'BUY' : 'SELL';
  const orderType = Math.random() < tradingParams.orderTypes.market ? 'MARKET' : 'LIMIT';
  const asset = getRandomAsset(behavior.assets);
  
  return {
    side,
    asset,
    quantity,
    orderType,
    behavior: behavior,
  };
}

export default getConfig();
