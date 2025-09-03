-- Admin Terminal Performance Indexes
-- Optimizes queries for admin terminal operations

BEGIN;

-- ===== EXISTING TABLE INDEXES =====

-- Users table indexes (if not already exist)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Trades table indexes (if not already exist)
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at);
CREATE INDEX IF NOT EXISTS idx_trades_asset ON trades(asset);
CREATE INDEX IF NOT EXISTS idx_trades_type ON trades(type);

-- Orders table indexes (if not already exist)  
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_asset ON orders(asset);

-- Wallets table indexes (if not already exist)
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_asset ON wallets(asset);
CREATE INDEX IF NOT EXISTS idx_wallets_updated_at ON wallets(updated_at);

-- ===== ADMIN TERMINAL SPECIFIC INDEXES =====

-- Compound indexes for common admin queries
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, kyc_status);
CREATE INDEX IF NOT EXISTS idx_trades_user_status ON trades(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

-- Time-based indexes for admin analytics
CREATE INDEX IF NOT EXISTS idx_trades_created_date ON trades(DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_orders_created_date ON orders(DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_users_created_date ON users(DATE(created_at));

-- Amount/value indexes for financial queries
CREATE INDEX IF NOT EXISTS idx_trades_amount ON trades(amount);
CREATE INDEX IF NOT EXISTS idx_trades_fee ON trades(fee);
CREATE INDEX IF NOT EXISTS idx_wallets_balance ON wallets(balance) WHERE balance > 0;

-- Admin search and filtering indexes
CREATE INDEX IF NOT EXISTS idx_users_email_trgm ON users USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trades_id_user ON trades(id, user_id);
CREATE INDEX IF NOT EXISTS idx_orders_id_user ON orders(id, user_id);

-- Performance indexes for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_trades_daily_volume ON trades(DATE(created_at), asset, amount);
CREATE INDEX IF NOT EXISTS idx_users_monthly_signups ON users(DATE_TRUNC('month', created_at));

-- Risk and compliance indexes
CREATE INDEX IF NOT EXISTS idx_trades_large_amounts ON trades(amount) WHERE amount > 10000;
CREATE INDEX IF NOT EXISTS idx_users_high_risk ON users(id) WHERE kyc_status IN ('flagged', 'suspended');

-- ===== PARTIAL INDEXES FOR ADMIN EFFICIENCY =====

-- Only index active/recent records for better performance
CREATE INDEX IF NOT EXISTS idx_active_trades ON trades(created_at, status) 
    WHERE status IN ('completed', 'pending') AND created_at > CURRENT_DATE - INTERVAL '30 days';

CREATE INDEX IF NOT EXISTS idx_active_orders ON orders(created_at, status)
    WHERE status IN ('open', 'partial') AND created_at > CURRENT_DATE - INTERVAL '7 days';

CREATE INDEX IF NOT EXISTS idx_recent_users ON users(created_at, role)
    WHERE created_at > CURRENT_DATE - INTERVAL '90 days';

-- ===== FUNCTIONAL INDEXES FOR ADMIN QUERIES =====

-- Case-insensitive email search
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));

-- JSON indexes for metadata searches (if columns exist)
-- CREATE INDEX IF NOT EXISTS idx_trades_metadata ON trades USING gin (metadata) WHERE metadata IS NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_users_profile ON users USING gin (profile) WHERE profile IS NOT NULL;

-- ===== MATERIALIZED VIEW INDEXES =====
-- (These would be created after materialized views are defined)

-- Admin KPI materialized view indexes
-- CREATE INDEX IF NOT EXISTS idx_admin_kpis_date ON admin_daily_kpis(date DESC);
-- CREATE INDEX IF NOT EXISTS idx_admin_kpis_metric ON admin_daily_kpis(metric_name);

COMMIT;

-- ===== ANALYZE TABLES =====
-- Update table statistics for query planner
ANALYZE users;
ANALYZE trades; 
ANALYZE orders;
ANALYZE wallets;
