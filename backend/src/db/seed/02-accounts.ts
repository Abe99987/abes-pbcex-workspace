/**
 * Development Accounts & Balances Seeder
 * 
 * Creates funding and trading accounts with initial balances for dev users.
 */

export const accountSeedData = [
  // Accounts table
  {
    table: 'accounts',
    data: [
      // Admin user accounts
      {
        id: 'admin-funding-account',
        user_id: 'admin-dev-user-id',
        type: 'funding',
        name: 'Admin Funding Account',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'admin-trading-account', 
        user_id: 'admin-dev-user-id',
        type: 'trading',
        name: 'Admin Trading Account',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      // Test user accounts
      {
        id: 'user-funding-account',
        user_id: 'test-dev-user-id',
        type: 'funding',
        name: 'Test User Funding Account',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'user-trading-account',
        user_id: 'test-dev-user-id', 
        type: 'trading',
        name: 'Test User Trading Account',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ]
  },
  // Balances table
  {
    table: 'balances',
    data: [
      // Admin balances (larger amounts for testing)
      {
        id: 'admin-usd-funding-balance',
        account_id: 'admin-funding-account',
        asset: 'USD',
        available: '50000.00',
        reserved: '0.00',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'admin-paxg-funding-balance',
        account_id: 'admin-funding-account',
        asset: 'PAXG',
        available: '25.000000',
        reserved: '0.000000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'admin-xau-trading-balance',
        account_id: 'admin-trading-account',
        asset: 'XAU-s',
        available: '10.500000',
        reserved: '0.000000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'admin-xag-trading-balance',
        account_id: 'admin-trading-account',
        asset: 'XAG-s',
        available: '500.000000',
        reserved: '0.000000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      // Test user balances (smaller amounts)
      {
        id: 'user-usd-funding-balance',
        account_id: 'user-funding-account',
        asset: 'USD',
        available: '5000.00',
        reserved: '0.00',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'user-paxg-funding-balance',
        account_id: 'user-funding-account',
        asset: 'PAXG',
        available: '2.500000',
        reserved: '0.000000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'user-xau-trading-balance',
        account_id: 'user-trading-account',
        asset: 'XAU-s',
        available: '1.250000',
        reserved: '0.000000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'user-xag-trading-balance',
        account_id: 'user-trading-account',
        asset: 'XAG-s',
        available: '75.000000',
        reserved: '0.000000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ]
  }
];
