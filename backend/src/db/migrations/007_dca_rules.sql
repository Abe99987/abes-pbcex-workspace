-- DCA Rules Migration
-- Creates table for Dollar Cost Averaging rules with schedule policy support

-- Create cadence enum
CREATE TYPE dca_cadence AS ENUM ('daily', 'weekly', 'monthly');

-- Create account source enum  
CREATE TYPE dca_account_source AS ENUM ('funding', 'trading');

-- Create DCA rules table
CREATE TABLE dca_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  base_symbol VARCHAR(10) NOT NULL,
  quote_symbol VARCHAR(10) NOT NULL,
  cadence dca_cadence NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency_symbol VARCHAR(10) NOT NULL,
  execution_time_utc TIME NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_day SMALLINT CHECK (monthly_day >= 1 AND monthly_day <= 28),
  from_account dca_account_source NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  next_run_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Business rules
  CHECK (
    (cadence != 'monthly') OR 
    (cadence = 'monthly' AND monthly_day IS NOT NULL)
  ),
  CHECK (end_date IS NULL OR end_date > start_date)
);

-- Indexes for performance
CREATE INDEX idx_dca_rules_user_id ON dca_rules(user_id);
CREATE INDEX idx_dca_rules_active ON dca_rules(active) WHERE active = true;
CREATE INDEX idx_dca_rules_next_run ON dca_rules(next_run_at) WHERE active = true;
CREATE INDEX idx_dca_rules_user_active ON dca_rules(user_id, active) WHERE active = true;

-- Partial unique index to prevent duplicate active rules
CREATE UNIQUE INDEX idx_dca_rules_unique_active 
ON dca_rules(user_id, base_symbol, quote_symbol, cadence, 
             COALESCE(monthly_day, 0), execution_time_utc, from_account) 
WHERE active = true;

-- Updated_at trigger
CREATE TRIGGER trigger_dca_rules_updated_at
  BEFORE UPDATE ON dca_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Comments for documentation
COMMENT ON TABLE dca_rules IS 'Dollar Cost Averaging rules for automated trading';
COMMENT ON COLUMN dca_rules.amount_minor IS 'Amount in minor currency units (e.g., cents for USD)';
COMMENT ON COLUMN dca_rules.execution_time_utc IS 'Time of day to execute in UTC (converted from ET)';
COMMENT ON COLUMN dca_rules.monthly_day IS 'Day of month (1-28) for monthly cadence, required when cadence=monthly';
COMMENT ON COLUMN dca_rules.next_run_at IS 'Next scheduled execution time in UTC';

-- Migration metadata
INSERT INTO schema_migrations (version, applied_at) 
VALUES ('007_dca_rules', NOW())
ON CONFLICT (version) DO NOTHING;
