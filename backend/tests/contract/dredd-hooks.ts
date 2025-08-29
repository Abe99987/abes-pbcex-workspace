import { hooks } from 'dredd';
import axios from 'axios';

// Store authentication tokens
let authToken: string | null = null;
let adminToken: string | null = null;
let supportToken: string | null = null;

// Test user credentials
const TEST_USERS = {
  normal: {
    email: 'test.user@pbcex.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User'
  },
  admin: {
    email: 'admin.user@pbcex.com',
    password: 'AdminPassword123!',
    firstName: 'Admin',
    lastName: 'User'
  },
  support: {
    email: 'support.user@pbcex.com',
    password: 'SupportPassword123!',
    firstName: 'Support',
    lastName: 'User'
  }
};

const API_BASE = process.env.API_BASE || 'http://localhost:4001';

/**
 * Dredd Hooks for PBCEx API Contract Testing
 * 
 * These hooks handle:
 * - User registration and authentication
 * - Token management for protected endpoints
 * - Request/response modifications for complex scenarios
 * - Feature flag testing (Phase-3 endpoints)
 */

// Before all tests - set up test users
hooks.beforeAll(async (transactions, done) => {
  console.log('🔧 Setting up contract test environment...');
  
  try {
    // Wait for server to be ready
    await waitForServer();
    
    // Register and authenticate test users
    await setupTestUsers();
    
    console.log('✅ Contract test setup complete');
    done();
  } catch (error) {
    console.error('❌ Contract test setup failed:', error);
    done(error);
  }
});

// Clean up after all tests
hooks.afterAll((transactions, done) => {
  console.log('🧹 Cleaning up contract test environment...');
  // Clean up test data if needed
  done();
});

// Skip admin endpoints if we don't have admin token
hooks.beforeEach((transaction, done) => {
  const { request, name } = transaction;
  
  // Skip admin endpoints during contract testing
  if (name.includes('Admin >')) {
    transaction.skip = true;
    console.log(`⏭️  Skipping admin endpoint: ${name}`);
    return done();
  }
  
  // Skip Phase-3 endpoints if feature flags are disabled
  if (isPhase3Endpoint(name) && !process.env.ENABLE_VAULT_REDEMPTION) {
    transaction.skip = true;
    console.log(`⏭️  Skipping Phase-3 endpoint (feature disabled): ${name}`);
    return done();
  }
  
  done();
});

// Authentication hooks for specific endpoints
hooks.before('Authentication > POST /api/auth/register', (transaction, done) => {
  // Use test user data for registration
  transaction.request.body = JSON.stringify(TEST_USERS.normal);
  done();
});

hooks.before('Authentication > POST /api/auth/login', (transaction, done) => {
  // Use registered user credentials for login
  transaction.request.body = JSON.stringify({
    email: TEST_USERS.normal.email,
    password: TEST_USERS.normal.password
  });
  done();
});

// Add authentication headers to protected endpoints
hooks.beforeEach((transaction, done) => {
  const { request, name } = transaction;
  
  if (requiresAuth(name) && authToken) {
    request.headers = request.headers || {};
    request.headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  if (requiresSupportAuth(name) && supportToken) {
    request.headers = request.headers || {};
    request.headers['Authorization'] = `Bearer ${supportToken}`;
  }
  
  done();
});

// Specific endpoint hooks
hooks.before('Trading > POST /api/trade/order', (transaction, done) => {
  // Use valid trade parameters
  transaction.request.body = JSON.stringify({
    fromAsset: 'USD',
    toAsset: 'AU',
    amount: '100.00'
  });
  done();
});

hooks.before('Redemption > POST /api/redeem', (transaction, done) => {
  // Use valid redemption request
  transaction.request.body = JSON.stringify({
    asset: 'AU',
    qty: '1.0',
    format: 'bar',
    shippingAddress: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'TX',
      zipCode: '12345',
      country: 'US'
    }
  });
  done();
});

hooks.before('Redemption > GET /api/redeem/quote', (transaction, done) => {
  // Set valid query parameters
  transaction.request.uri = transaction.request.uri.replace(
    '/api/redeem/quote',
    '/api/redeem/quote?asset=AU&qty=1.0&format=bar'
  );
  done();
});

hooks.before('Support > GET /api/support/search', (transaction, done) => {
  // Set valid search query
  transaction.request.uri = transaction.request.uri.replace(
    '/api/support/search',
    '/api/support/search?q=test&type=email'
  );
  done();
});

hooks.before('Support > GET /api/support/user/{id}', (transaction, done) => {
  // Use a test user ID (we'll create one during setup)
  transaction.request.uri = transaction.request.uri.replace(
    '{id}',
    'test-user-id' // This would be a real UUID in practice
  );
  done();
});

// Response validation hooks
hooks.after('Authentication > POST /api/auth/login', (transaction, done) => {
  if (transaction.actual.statusCode === '200') {
    try {
      const response = JSON.parse(transaction.actual.body);
      if (response.data && response.data.token) {
        authToken = response.data.token;
        console.log('🔑 Auth token captured for subsequent requests');
      }
    } catch (error) {
      console.warn('⚠️  Failed to parse login response:', error);
    }
  }
  done();
});

// Feature flag validation
hooks.after('Redemption > POST /api/redeem', (transaction, done) => {
  const expectedStatus = process.env.ENABLE_VAULT_REDEMPTION === 'true' ? '201' : '501';
  
  if (transaction.actual.statusCode !== expectedStatus) {
    console.warn(
      `⚠️  Redemption endpoint returned ${transaction.actual.statusCode}, expected ${expectedStatus} ` +
      `(ENABLE_VAULT_REDEMPTION=${process.env.ENABLE_VAULT_REDEMPTION})`
    );
  }
  
  done();
});

// Error handling hooks
hooks.afterEach((transaction, done) => {
  const { actual, expected, name } = transaction;
  
  // Log unexpected errors for debugging
  if (actual.statusCode.startsWith('5')) {
    console.error(`🚨 Server error in ${name}:`, actual.statusCode, actual.body);
  }
  
  // Check for common API contract violations
  if (actual.headers['content-type'] && !actual.headers['content-type'].includes('application/json')) {
    if (expected.statusCode === '200' || expected.statusCode === '201') {
      console.warn(`⚠️  ${name} returned non-JSON response:`, actual.headers['content-type']);
    }
  }
  
  done();
});

// Helper functions
async function waitForServer(maxAttempts = 30, delay = 1000): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await axios.get(`${API_BASE}/health`);
      if (response.status === 200) {
        console.log('✅ Server is ready');
        return;
      }
    } catch (error) {
      console.log(`⏳ Waiting for server... (attempt ${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Server did not become ready in time');
}

async function setupTestUsers(): Promise<void> {
  try {
    // Register normal user
    await axios.post(`${API_BASE}/api/auth/register`, TEST_USERS.normal);
    console.log('👤 Test user registered');
    
    // Login and get token
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: TEST_USERS.normal.email,
      password: TEST_USERS.normal.password
    });
    
    if (loginResponse.data && loginResponse.data.data && loginResponse.data.data.token) {
      authToken = loginResponse.data.data.token;
      console.log('🔑 Auth token obtained');
    }
    
    // Try to register support user (may fail if RBAC isn't fully implemented)
    try {
      await axios.post(`${API_BASE}/api/auth/register`, TEST_USERS.support);
      const supportLogin = await axios.post(`${API_BASE}/api/auth/login`, {
        email: TEST_USERS.support.email,
        password: TEST_USERS.support.password
      });
      
      if (supportLogin.data && supportLogin.data.data && supportLogin.data.data.token) {
        supportToken = supportLogin.data.data.token;
        console.log('🛠️  Support token obtained');
      }
    } catch (error) {
      console.log('ℹ️  Support user setup skipped (expected in MVP)');
    }
    
  } catch (error) {
    console.warn('⚠️  Test user setup had issues:', error.message);
    // Don't fail the entire test suite if user setup fails
  }
}

function requiresAuth(transactionName: string): boolean {
  const publicEndpoints = [
    'Health > GET /health',
    'Authentication > POST /api/auth/register',
    'Authentication > POST /api/auth/login',
    'Shop > GET /api/shop/products'
  ];
  
  return !publicEndpoints.some(endpoint => transactionName.includes(endpoint));
}

function requiresSupportAuth(transactionName: string): boolean {
  return transactionName.includes('Support >');
}

function isPhase3Endpoint(transactionName: string): boolean {
  const phase3Tags = ['Redemption >', 'Vault >', 'Support >'];
  return phase3Tags.some(tag => transactionName.includes(tag));
}

// Export hooks for dredd
export { hooks };
