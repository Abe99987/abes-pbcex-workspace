/**
 * Test App Helper
 * Provides the Express app instance for integration tests
 */

import app from '../../src/server';

// Note: Auth middleware is already mocked in __tests__/setup.ts
// The mock expects these specific token formats:
// - 'mock-admin-jwt-token' for admin users
// - 'mock-user-jwt-token' for regular users
// - 'mock-support-jwt-token' for support users
// - 'mock-teller-jwt-token' for teller users

export { app };

// Re-export for convenience
export default app;
