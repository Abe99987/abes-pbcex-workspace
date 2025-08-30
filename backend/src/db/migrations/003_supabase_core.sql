-- Migration 003: Supabase Core Tables
-- Core Supabase-compatible schema for user profiles, accounts, balances, transactions, and trades

-- User profiles table (compatible with Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    phone TEXT,
    kyc_status TEXT DEFAULT 'APPROVED' CHECK (kyc_status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User accounts (FUNDING and TRADING)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('FUNDING', 'TRADING')),
    label TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, type, label)
);

-- Account balances
CREATE TABLE IF NOT EXISTS balances (
    id SERIAL PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    asset TEXT NOT NULL,
    amount NUMERIC(36,18) DEFAULT 0,
    usd_value NUMERIC(36,2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, asset)
);

-- Transaction history
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    ts TIMESTAMPTZ DEFAULT NOW(),
    asset TEXT NOT NULL,
    amount NUMERIC(36,18) NOT NULL,
    usd_value NUMERIC(36,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'TRADE', 'CONVERSION', 'SPENDING', 'TRANSFER_IN', 'TRANSFER_OUT')),
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    fee_usd NUMERIC(36,2) DEFAULT 0,
    reference TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade orders and history
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    ts TIMESTAMPTZ DEFAULT NOW(),
    pair TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
    order_type TEXT NOT NULL CHECK (order_type IN ('MARKET', 'LIMIT', 'STOP_LOSS')),
    price NUMERIC(36,8) NOT NULL,
    amount NUMERIC(36,18) NOT NULL,
    filled NUMERIC(36,18) DEFAULT 0,
    fee NUMERIC(36,8) DEFAULT 0,
    fee_asset TEXT DEFAULT 'USD',
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_balances_account_asset ON balances(account_id, asset);
CREATE INDEX IF NOT EXISTS idx_transactions_user_ts ON transactions(user_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_trades_user_ts ON trades(user_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_pair ON trades(pair);

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at 
    BEFORE UPDATE ON accounts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_balances_updated_at ON balances;
CREATE TRIGGER update_balances_updated_at 
    BEFORE UPDATE ON balances 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trades_updated_at ON trades;
CREATE TRIGGER update_trades_updated_at 
    BEFORE UPDATE ON trades 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
