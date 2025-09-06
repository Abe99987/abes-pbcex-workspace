-- Double-entry ledger core
-- Tables: ledger_journal, ledger_entries, ledger_balances

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Journal header
CREATE TABLE IF NOT EXISTS ledger_journal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reference VARCHAR(100),
  description VARCHAR(500),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Journal entries (legs)
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_id UUID NOT NULL REFERENCES ledger_journal(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  asset VARCHAR(20) NOT NULL,
  direction VARCHAR(6) NOT NULL CHECK (direction IN ('DEBIT','CREDIT')),
  amount DECIMAL(20,8) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Materialized balances computed from entries
CREATE TABLE IF NOT EXISTS ledger_balances (
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  asset VARCHAR(20) NOT NULL,
  balance DECIMAL(20,8) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (account_id, asset)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ledger_entries_journal ON ledger_entries(journal_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account_asset ON ledger_entries(account_id, asset);
CREATE INDEX IF NOT EXISTS idx_ledger_journal_ts ON ledger_journal(ts);
-- Enforce idempotency on reference; allow many NULLs, unique when provided
CREATE UNIQUE INDEX IF NOT EXISTS ux_ledger_journal_reference
  ON ledger_journal(reference)
  WHERE reference IS NOT NULL;

-- Helper view for trial balance by asset
CREATE OR REPLACE VIEW ledger_trial_balance AS
SELECT asset,
       SUM(CASE WHEN direction = 'DEBIT' THEN amount ELSE 0 END) AS total_debits,
       SUM(CASE WHEN direction = 'CREDIT' THEN amount ELSE 0 END) AS total_credits,
       (SUM(CASE WHEN direction = 'DEBIT' THEN amount ELSE 0 END) -
        SUM(CASE WHEN direction = 'CREDIT' THEN amount ELSE 0 END)) AS difference
FROM ledger_entries
GROUP BY asset;

-- Upsert procedure for balances (re-materialize per account+asset)
CREATE OR REPLACE FUNCTION ledger_materialize_balances()
RETURNS VOID AS $$
BEGIN
  -- Rebuild from scratch for simplicity; small dataset expected initially
  DELETE FROM ledger_balances;

  INSERT INTO ledger_balances (account_id, asset, balance, updated_at)
  SELECT account_id,
         asset,
         ROUND(
           SUM(CASE WHEN direction = 'DEBIT' THEN amount ELSE -amount END)::numeric
         , 8) AS balance,
         NOW()
  FROM ledger_entries
  GROUP BY account_id, asset;
END;
$$ LANGUAGE plpgsql;


