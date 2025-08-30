-- Migration 004: Row Level Security and Basic RBAC
-- NOTE: RLS policies are commented out for development safety
-- Enable them when moving to production with proper auth integration

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Development-only: Permissive policies for service role
-- These should be replaced with proper auth.uid() based policies in production

/*
-- Profiles policies (users can only see their own profile)
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Accounts policies (users can only access their own accounts)
CREATE POLICY "Users can view own accounts" ON accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts" ON accounts
    FOR UPDATE USING (auth.uid() = user_id);

-- Balances policies (users can only view balances of their accounts)
CREATE POLICY "Users can view own balances" ON balances
    FOR SELECT USING (
        account_id IN (
            SELECT id FROM accounts WHERE user_id = auth.uid()
        )
    );

-- Transactions policies (users can only view their own transactions)
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Trades policies (users can only view their own trades)
CREATE POLICY "Users can view own trades" ON trades
    FOR SELECT USING (auth.uid() = user_id);
*/

-- For development: Create a service role that can bypass RLS
-- This allows the backend API to operate with full access while we use traditional auth
-- Remove or restrict these in production

-- Grant permissions to authenticated role (for API service)
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON accounts TO authenticated;
GRANT ALL ON balances TO authenticated;
GRANT ALL ON transactions TO authenticated;
GRANT ALL ON trades TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON SEQUENCE balances_id_seq TO authenticated;

-- Create development bypass policies (remove in production)
-- These allow any authenticated connection to access all data
-- In production, replace with proper user-scoped policies

CREATE POLICY "Development: Allow API access to profiles" ON profiles
    FOR ALL USING (true);

CREATE POLICY "Development: Allow API access to accounts" ON accounts
    FOR ALL USING (true);

CREATE POLICY "Development: Allow API access to balances" ON balances
    FOR ALL USING (true);

CREATE POLICY "Development: Allow API access to transactions" ON transactions
    FOR ALL USING (true);

CREATE POLICY "Development: Allow API access to trades" ON trades
    FOR ALL USING (true);
