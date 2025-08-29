-- PBCEx Database Initialization Script
-- Creates all required tables for the precious metals trading platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(254) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  kyc_status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED' CHECK (kyc_status IN ('NOT_STARTED', 'IN_PROGRESS', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED')),
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  phone VARCHAR(20),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  last_login_at TIMESTAMPTZ,
  login_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Users indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_kyc_status ON users(kyc_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login ON users(last_login_at) WHERE last_login_at IS NOT NULL;

-- Users updated_at trigger
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Accounts table
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('FUNDING', 'TRADING')),
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  custody_provider VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure each user has only one account of each type
  UNIQUE(user_id, type)
);

-- Accounts indexes
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_custody_provider ON accounts(custody_provider) WHERE custody_provider IS NOT NULL;
CREATE INDEX idx_accounts_created_at ON accounts(created_at);

-- Ensure funding accounts have custody provider
ALTER TABLE accounts ADD CONSTRAINT chk_funding_custody_provider 
  CHECK ((type != 'FUNDING') OR (type = 'FUNDING' AND custody_provider IS NOT NULL));

-- Accounts updated_at trigger
CREATE TRIGGER trigger_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Balances table
CREATE TABLE balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  asset VARCHAR(20) NOT NULL,
  amount DECIMAL(20,8) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  locked_amount DECIMAL(20,8) NOT NULL DEFAULT 0 CHECK (locked_amount >= 0),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one balance per account per asset
  UNIQUE(account_id, asset),
  
  -- Ensure locked amount doesn't exceed total amount
  CHECK (locked_amount <= amount)
);

-- Balances indexes
CREATE INDEX idx_balances_account_id ON balances(account_id);
CREATE INDEX idx_balances_asset ON balances(asset);
CREATE INDEX idx_balances_amount ON balances(amount) WHERE amount > 0;
CREATE INDEX idx_balances_last_updated ON balances(last_updated);

-- Balance changes table for audit trail
CREATE TABLE balance_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  balance_id UUID NOT NULL REFERENCES balances(id) ON DELETE CASCADE,
  change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('CREDIT', 'DEBIT', 'LOCK', 'UNLOCK', 'TRANSFER_IN', 'TRANSFER_OUT', 'TRADE', 'FEE', 'MINT', 'BURN')),
  amount DECIMAL(20,8) NOT NULL,
  previous_amount DECIMAL(20,8) NOT NULL,
  new_amount DECIMAL(20,8) NOT NULL,
  reference VARCHAR(100),
  description VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Balance changes indexes
CREATE INDEX idx_balance_changes_balance_id ON balance_changes(balance_id);
CREATE INDEX idx_balance_changes_type ON balance_changes(change_type);
CREATE INDEX idx_balance_changes_reference ON balance_changes(reference) WHERE reference IS NOT NULL;
CREATE INDEX idx_balance_changes_created_at ON balance_changes(created_at);

-- Balances last_updated trigger
CREATE OR REPLACE FUNCTION update_balance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_balances_last_updated
  BEFORE UPDATE ON balances
  FOR EACH ROW
  EXECUTE FUNCTION update_balance_timestamp();

-- Trades table
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_account_id UUID NOT NULL REFERENCES accounts(id),
  to_account_id UUID NOT NULL REFERENCES accounts(id),
  asset_sold VARCHAR(20) NOT NULL,
  asset_bought VARCHAR(20) NOT NULL,
  amount_sold DECIMAL(20,8) NOT NULL CHECK (amount_sold > 0),
  amount_bought DECIMAL(20,8) NOT NULL CHECK (amount_bought > 0),
  price DECIMAL(20,8) NOT NULL CHECK (price > 0),
  fee_amount DECIMAL(20,8) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  fee_asset VARCHAR(20) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'FILLED', 'CANCELLED', 'FAILED')),
  order_type VARCHAR(20) NOT NULL DEFAULT 'MARKET' CHECK (order_type IN ('MARKET', 'LIMIT')),
  executed_at TIMESTAMPTZ,
  reference VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Business rules
  CHECK (from_account_id != to_account_id),
  CHECK (asset_sold != asset_bought),
  CHECK ((status != 'FILLED') OR (executed_at IS NOT NULL))
);

-- Trades indexes
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_from_account ON trades(from_account_id);
CREATE INDEX idx_trades_to_account ON trades(to_account_id);
CREATE INDEX idx_trades_asset_sold ON trades(asset_sold);
CREATE INDEX idx_trades_asset_bought ON trades(asset_bought);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_created_at ON trades(created_at);
CREATE INDEX idx_trades_executed_at ON trades(executed_at) WHERE executed_at IS NOT NULL;
CREATE INDEX idx_trades_reference ON trades(reference) WHERE reference IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX idx_trades_user_status_created ON trades(user_id, status, created_at);
CREATE INDEX idx_trades_asset_pair_created ON trades(asset_sold, asset_bought, created_at);

-- Trades updated_at trigger
CREATE TRIGGER trigger_trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Orders table (for physical metals)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_code VARCHAR(50) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  product_category VARCHAR(20) NOT NULL CHECK (product_category IN ('COINS', 'BARS', 'ROUNDS', 'JEWELRY')),
  metal VARCHAR(2) NOT NULL CHECK (metal IN ('AU', 'AG', 'PT', 'PD', 'CU')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price > 0),
  locked_price DECIMAL(10,2) NOT NULL CHECK (locked_price > 0),
  lock_expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'QUOTE_LOCKED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED')),
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('BALANCE', 'STRIPE_CARD')),
  payment_reference VARCHAR(100),
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  shipping JSONB NOT NULL,
  special_instructions TEXT,
  fulfillment_provider VARCHAR(20) NOT NULL CHECK (fulfillment_provider IN ('JM_BULLION', 'DILLON_GAGE')),
  provider_order_id VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_metal ON orders(metal);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_lock_expires ON orders(lock_expires_at) WHERE status = 'QUOTE_LOCKED';

-- Orders updated_at trigger
CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- KYC Records table
CREATE TABLE kyc_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('PERSONAL', 'BUSINESS')),
  status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED')),
  provider_ref VARCHAR(100),
  submission_data JSONB NOT NULL,
  review_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One KYC record per user per type
  UNIQUE(user_id, type)
);

-- KYC Records indexes
CREATE INDEX idx_kyc_records_user_id ON kyc_records(user_id);
CREATE INDEX idx_kyc_records_status ON kyc_records(status);
CREATE INDEX idx_kyc_records_type ON kyc_records(type);
CREATE INDEX idx_kyc_records_provider_ref ON kyc_records(provider_ref) WHERE provider_ref IS NOT NULL;

-- KYC Records updated_at trigger
CREATE TRIGGER trigger_kyc_records_updated_at
  BEFORE UPDATE ON kyc_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Hedge Positions table
CREATE TABLE hedge_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset VARCHAR(10) NOT NULL CHECK (asset IN ('XAG-s', 'XPT-s', 'XPD-s', 'XCU-s')),
  hedge_type VARCHAR(20) NOT NULL CHECK (hedge_type IN ('ETF', 'UNALLOCATED', 'FUTURES')),
  hedge_instrument VARCHAR(50) NOT NULL,
  quantity DECIMAL(20,8) NOT NULL CHECK (quantity > 0),
  entry_price DECIMAL(20,8) NOT NULL CHECK (entry_price > 0),
  current_price DECIMAL(20,8),
  unrealized_pnl DECIMAL(20,2),
  exposure DECIMAL(20,8) NOT NULL CHECK (exposure > 0),
  hedge_ratio DECIMAL(5,4) NOT NULL CHECK (hedge_ratio >= 0 AND hedge_ratio <= 1),
  brokerage VARCHAR(50),
  brokerage_account_id VARCHAR(100),
  brokerage_position_id VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CHECK ((is_active = FALSE) OR (closed_at IS NULL)),
  CHECK ((is_active = TRUE) OR (closed_at IS NOT NULL))
);

-- Hedge Positions indexes
CREATE INDEX idx_hedge_positions_asset ON hedge_positions(asset);
CREATE INDEX idx_hedge_positions_active ON hedge_positions(is_active, asset) WHERE is_active = TRUE;
CREATE INDEX idx_hedge_positions_hedge_type ON hedge_positions(hedge_type);
CREATE INDEX idx_hedge_positions_instrument ON hedge_positions(hedge_instrument);
CREATE INDEX idx_hedge_positions_brokerage ON hedge_positions(brokerage) WHERE brokerage IS NOT NULL;
CREATE INDEX idx_hedge_positions_opened_at ON hedge_positions(opened_at);

-- Hedge Positions updated_at trigger  
CREATE TRIGGER trigger_hedge_positions_updated_at
  BEFORE UPDATE ON hedge_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create initial admin user (password: 'admin123')
INSERT INTO users (
  email, 
  password_hash, 
  role, 
  kyc_status, 
  first_name, 
  last_name, 
  email_verified,
  is_active
) VALUES (
  'admin@pbcex.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewwNkXgs.W5s6FJS', -- bcrypt hash of 'admin123'
  'ADMIN',
  'APPROVED',
  'Admin',
  'User',
  TRUE,
  TRUE
);

-- Get admin user ID for creating accounts
DO $$
DECLARE
    admin_id UUID;
    funding_account_id UUID;
    trading_account_id UUID;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_id FROM users WHERE email = 'admin@pbcex.com';
    
    -- Create admin funding account
    INSERT INTO accounts (
        user_id, 
        type, 
        name, 
        description, 
        custody_provider
    ) VALUES (
        admin_id,
        'FUNDING',
        'Admin Funding Account',
        'Admin account for real assets (PAXG, USD, USDC)',
        'PAXOS'
    ) RETURNING id INTO funding_account_id;
    
    -- Create admin trading account
    INSERT INTO accounts (
        user_id,
        type,
        name,
        description
    ) VALUES (
        admin_id,
        'TRADING',
        'Admin Trading Account', 
        'Admin account for synthetic assets (XAU-s, XAG-s, XPT-s, XPD-s, XCU-s)'
    ) RETURNING id INTO trading_account_id;
    
    -- Create initial balances for admin
    INSERT INTO balances (account_id, asset, amount) VALUES
    -- Funding account balances
    (funding_account_id, 'USD', 100000.00),
    (funding_account_id, 'USDC', 50000.000000),
    (funding_account_id, 'PAXG', 10.00000000),
    
    -- Trading account balances  
    (trading_account_id, 'XAU-s', 5.00000000),
    (trading_account_id, 'XAG-s', 100.00000000),
    (trading_account_id, 'XPT-s', 2.00000000),
    (trading_account_id, 'XPD-s', 1.50000000),
    (trading_account_id, 'XCU-s', 500.00000000);
    
    RAISE NOTICE 'Admin user and accounts created successfully';
END $$;

-- Create some sample hedge positions for testing
INSERT INTO hedge_positions (
    asset,
    hedge_type,
    hedge_instrument,
    quantity,
    entry_price,
    current_price,
    exposure,
    hedge_ratio,
    brokerage
) VALUES
('XAG-s', 'ETF', 'SLV', 50.00000000, 22.50, 23.75, 100.00000000, 0.8000, 'Interactive Brokers'),
('XPT-s', 'ETF', 'PPLT', 1.50000000, 95.25, 97.80, 2.00000000, 0.7500, 'Interactive Brokers'),
('XCU-s', 'ETF', 'CPER', 200.00000000, 25.30, 26.15, 500.00000000, 0.8500, 'Interactive Brokers');

COMMIT;
