import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

/**
 * K6 Load Test: Trading Order Placement
 * 
 * Simulates realistic trading load with user authentication,
 * price checking, and order placement under various load conditions.
 */

// Test configuration
export const options = {
  scenarios: {
    // Smoke test - minimal load
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      tags: { test_type: 'smoke' },
    },
    
    // Load test - normal expected load
    load: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '2m', target: 10 },  // Ramp up to 10 users
        { duration: '5m', target: 10 },  // Stay at 10 users
        { duration: '2m', target: 25 },  // Ramp up to 25 users
        { duration: '5m', target: 25 },  // Stay at 25 users
        { duration: '2m', target: 50 },  // Ramp up to 50 users
        { duration: '5m', target: 50 },  // Stay at 50 users
        { duration: '2m', target: 0 },   // Ramp down
      ],
      tags: { test_type: 'load' },
    },
    
    // Stress test - above normal capacity
    stress: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '2m', target: 50 },   // Ramp up to 50 users
        { duration: '5m', target: 50 },   // Stay at 50 users
        { duration: '2m', target: 100 },  // Ramp up to 100 users
        { duration: '5m', target: 100 },  // Stay at 100 users
        { duration: '2m', target: 200 },  // Ramp up to 200 users (stress)
        { duration: '5m', target: 200 },  // Stay at 200 users
        { duration: '2m', target: 0 },    // Ramp down
      ],
      tags: { test_type: 'stress' },
    },
    
    // Spike test - sudden load increase
    spike: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '1m', target: 10 },   // Normal load
        { duration: '30s', target: 200 }, // Sudden spike
        { duration: '2m', target: 200 },  // Maintain spike
        { duration: '30s', target: 10 },  // Drop back to normal
        { duration: '1m', target: 10 },   // Stay normal
        { duration: '30s', target: 0 },   // Ramp down
      ],
      tags: { test_type: 'spike' },
    },
  },
  
  // Performance thresholds
  thresholds: {
    // HTTP request duration should be < 500ms for 95% of requests
    http_req_duration: ['p(95)<500'],
    
    // Login should complete in < 1s for 95% of requests
    'http_req_duration{endpoint:login}': ['p(95)<1000'],
    
    // Price requests should be fast (< 200ms for 95%)
    'http_req_duration{endpoint:prices}': ['p(95)<200'],
    
    // Order placement should complete in < 2s for 95% of requests
    'http_req_duration{endpoint:order}': ['p(95)<2000'],
    
    // HTTP failure rate should be < 1%
    http_req_failed: ['rate<0.01'],
    
    // Login success rate should be > 99%
    'login_success_rate': ['rate>0.99'],
    
    // Order success rate should be > 98%
    'order_success_rate': ['rate>0.98'],
  },
};

// Custom metrics
const loginSuccessRate = new Rate('login_success_rate');
const orderSuccessRate = new Rate('order_success_rate');
const priceUpdateRate = new Rate('price_update_rate');
const tradeLatency = new Trend('trade_latency');
const authErrors = new Counter('auth_errors');
const orderErrors = new Counter('order_errors');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4001';
const TEST_USERS = __ENV.TEST_USERS || 50;
const THINK_TIME = __ENV.THINK_TIME || 1; // seconds between actions

// Test data
const assets = ['XAU-s', 'XAG-s', 'XPT-s', 'XPD-s', 'XCU-s'];
const orderSides = ['BUY', 'SELL'];
const orderTypes = ['MARKET', 'LIMIT'];

// User session data
let authToken = null;
let currentPrices = {};

/**
 * Setup function - runs once per VU before test
 */
export function setup() {
  console.log(`Starting load test against ${BASE_URL}`);
  console.log(`Test configuration: ${TEST_USERS} virtual users`);
  
  // Health check
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  
  check(healthCheck, {
    'health check passes': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  if (healthCheck.status !== 200) {
    console.error('Health check failed - aborting test');
    return;
  }
  
  console.log('Health check passed - proceeding with load test');
  
  return {
    baseUrl: BASE_URL,
    startTime: new Date().toISOString(),
  };
}

/**
 * Main test function - runs for each VU iteration
 */
export default function(data) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'k6-load-test/1.0',
    },
  };
  
  group('User Authentication', () => {
    authenticateUser(params);
  });
  
  if (authToken) {
    group('Price Monitoring', () => {
      checkPrices(params);
    });
    
    group('Order Placement', () => {
      placeRandomOrder(params);
    });
    
    group('Order Management', () => {
      checkOrderStatus(params);
    });
  }
  
  // Think time between iterations
  sleep(THINK_TIME);
}

/**
 * User authentication flow
 */
function authenticateUser(params) {
  const userIndex = Math.floor(Math.random() * TEST_USERS) + 1;
  const credentials = {
    email: `loadtest${userIndex}@example.com`,
    password: 'LoadTest123!',
  };
  
  const loginStart = Date.now();
  
  const loginResponse = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify(credentials),
    { ...params, tags: { endpoint: 'login' } }
  );
  
  const loginSuccess = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response has token': (r) => r.json('data.accessToken') !== undefined,
    'login response time < 1s': (r) => r.timings.duration < 1000,
  });
  
  loginSuccessRate.add(loginSuccess);
  
  if (loginSuccess && loginResponse.json('data.accessToken')) {
    authToken = loginResponse.json('data.accessToken');
    params.headers['Authorization'] = `Bearer ${authToken}`;
  } else {
    authErrors.add(1);
    console.log(`Login failed for ${credentials.email}: ${loginResponse.status}`);
  }
  
  tradeLatency.add(Date.now() - loginStart, { operation: 'login' });
}

/**
 * Price monitoring simulation
 */
function checkPrices(params) {
  const priceStart = Date.now();
  
  const priceResponse = http.get(
    `${BASE_URL}/api/trade/prices`,
    { ...params, tags: { endpoint: 'prices' } }
  );
  
  const priceCheck = check(priceResponse, {
    'prices status is 200': (r) => r.status === 200,
    'prices response has data': (r) => r.json('data.prices') !== undefined,
    'prices response time < 200ms': (r) => r.timings.duration < 200,
    'prices include all assets': (r) => {
      const prices = r.json('data.prices');
      return prices && assets.every(asset => prices[asset]);
    },
  });
  
  priceUpdateRate.add(priceCheck);
  
  if (priceCheck && priceResponse.json('data.prices')) {
    currentPrices = priceResponse.json('data.prices');
  }
  
  tradeLatency.add(Date.now() - priceStart, { operation: 'price_check' });
}

/**
 * Random order placement simulation
 */
function placeRandomOrder(params) {
  if (Object.keys(currentPrices).length === 0) {
    console.log('No current prices available - skipping order placement');
    return;
  }
  
  const asset = assets[Math.floor(Math.random() * assets.length)];
  const side = orderSides[Math.floor(Math.random() * orderSides.length)];
  const orderType = orderTypes[Math.floor(Math.random() * orderTypes.length)];
  const quantity = (Math.random() * 2 + 0.1).toFixed(2); // 0.1 to 2.1
  
  const orderData = {
    side,
    asset,
    quantity,
    orderType,
  };
  
  // Add limit price for limit orders
  if (orderType === 'LIMIT' && currentPrices[asset]) {
    const currentPrice = parseFloat(side === 'BUY' ? currentPrices[asset].bid : currentPrices[asset].ask);
    const priceAdjustment = side === 'BUY' ? 0.95 : 1.05; // 5% away from market
    orderData.limitPrice = (currentPrice * priceAdjustment).toFixed(2);
  }
  
  const orderStart = Date.now();
  
  const orderResponse = http.post(
    `${BASE_URL}/api/trade/order`,
    JSON.stringify(orderData),
    { ...params, tags: { endpoint: 'order' } }
  );
  
  const orderSuccess = check(orderResponse, {
    'order placement status is 201': (r) => r.status === 201,
    'order response has order ID': (r) => r.json('data.order.id') !== undefined,
    'order response time < 2s': (r) => r.timings.duration < 2000,
    'order has correct side': (r) => r.json('data.order.side') === side,
    'order has correct asset': (r) => r.json('data.order.asset') === asset,
  });
  
  orderSuccessRate.add(orderSuccess);
  
  if (!orderSuccess) {
    orderErrors.add(1);
    console.log(`Order placement failed: ${orderResponse.status} - ${orderResponse.body}`);
  }
  
  tradeLatency.add(Date.now() - orderStart, { operation: 'place_order' });
  
  // Store order ID for later status check
  if (orderSuccess && orderResponse.json('data.order.id')) {
    const orderId = orderResponse.json('data.order.id');
    
    // 20% chance to check order status immediately
    if (Math.random() < 0.2) {
      sleep(0.5); // Brief pause before status check
      
      const statusResponse = http.get(
        `${BASE_URL}/api/trade/order/${orderId}`,
        { ...params, tags: { endpoint: 'order_status' } }
      );
      
      check(statusResponse, {
        'order status check successful': (r) => r.status === 200,
        'order status response has order': (r) => r.json('data.order') !== undefined,
      });
    }
  }
}

/**
 * Order status checking simulation
 */
function checkOrderStatus(params) {
  // Get user's orders
  const ordersResponse = http.get(
    `${BASE_URL}/api/trade/orders?limit=5`,
    { ...params, tags: { endpoint: 'orders' } }
  );
  
  check(ordersResponse, {
    'orders list status is 200': (r) => r.status === 200,
    'orders response has data': (r) => r.json('data.orders') !== undefined,
  });
}

/**
 * Portfolio check simulation
 */
function checkPortfolio(params) {
  const portfolioResponse = http.get(
    `${BASE_URL}/api/wallet/balances`,
    { ...params, tags: { endpoint: 'balances' } }
  );
  
  check(portfolioResponse, {
    'portfolio status is 200': (r) => r.status === 200,
    'portfolio has balances': (r) => r.json('data.balances') !== undefined,
  });
}

/**
 * Teardown function - runs once at end of test
 */
export function teardown(data) {
  console.log('\nLoad test completed');
  console.log(`Test duration: ${new Date().toISOString()} - ${data.startTime}`);
  
  // Final health check
  const finalHealth = http.get(`${data.baseUrl}/api/health`);
  
  console.log(`Final health check: ${finalHealth.status}`);
  
  if (finalHealth.status !== 200) {
    console.error('WARNING: Service appears to be degraded after load test');
  } else {
    console.log('Service appears healthy after load test');
  }
}

/**
 * Utility function to generate realistic trade scenarios
 */
function generateTradeScenario() {
  const scenarios = [
    // Day trader - frequent small orders
    {
      frequency: 'high',
      orderSize: 'small',
      assets: ['XAU-s', 'XAG-s'],
      behavior: 'momentum',
    },
    
    // Swing trader - medium frequency, medium size
    {
      frequency: 'medium',
      orderSize: 'medium',
      assets: ['XAU-s', 'XPT-s', 'XPD-s'],
      behavior: 'contrarian',
    },
    
    // Position trader - low frequency, large size
    {
      frequency: 'low',
      orderSize: 'large',
      assets: ['XAU-s'],
      behavior: 'trend_following',
    },
  ];
  
  return scenarios[Math.floor(Math.random() * scenarios.length)];
}

/**
 * Error handling helper
 */
function handleApiError(response, operation) {
  if (response.status >= 400) {
    console.log(`${operation} error: ${response.status} - ${response.body.substring(0, 200)}`);
    
    // Track specific error types
    if (response.status === 401) {
      authErrors.add(1);
    } else if (response.status >= 500) {
      // Server errors
      console.log(`Server error during ${operation}: ${response.status}`);
    } else if (response.status === 429) {
      // Rate limiting
      console.log(`Rate limited during ${operation}`);
      sleep(5); // Back off for rate limiting
    }
  }
}
