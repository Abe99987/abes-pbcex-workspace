#!/bin/bash
set -euo pipefail

# Idempotent staging seed (READ-ONLY friendly)
# - Inserts a minimal user, accounts, balances, and one trade if they don't exist
# - Requires STAGING_DATABASE_URL to be set (no secrets committed)
# - Wraps changes in a transaction and rolls back on failure

if [[ -z "${STAGING_DATABASE_URL:-}" ]]; then
  echo "STAGING_DATABASE_URL is not set. Aborting." >&2
  exit 2
fi

export PGSSLMODE=require

SQL=$(cat <<'EOSQL'
BEGIN;

-- Create user if not exists
WITH existing AS (
  SELECT id FROM users WHERE email = 'staging-smoke@pbcex.com'
), ins AS (
  INSERT INTO users (
    email, password_hash, role, kyc_status, first_name, last_name, email_verified, is_active
  )
  SELECT 'staging-smoke@pbcex.com',
         '$2b$12$B8qvJgU.SAMPLEHASH.q7eE4jWw3v5J1bZsM3i2', -- placeholder hash
         'USER',
         'APPROVED',
         'Staging', 'Smoke', TRUE, TRUE
  WHERE NOT EXISTS (SELECT 1 FROM existing)
  RETURNING id
)
SELECT 1;

-- Determine user id
WITH u AS (
  SELECT id FROM users WHERE email = 'staging-smoke@pbcex.com'
), funding AS (
  INSERT INTO accounts (user_id, type, name, description, custody_provider)
  SELECT id, 'FUNDING', 'Funding Account', 'Staging funding', 'PAXOS' FROM u
  ON CONFLICT (user_id, type) DO NOTHING
  RETURNING id
), trading AS (
  INSERT INTO accounts (user_id, type, name, description)
  SELECT id, 'TRADING', 'Trading Account', 'Staging trading' FROM u
  ON CONFLICT (user_id, type) DO NOTHING
  RETURNING id
)
SELECT 1;

-- Seed balances if missing
WITH u AS (
  SELECT id FROM users WHERE email = 'staging-smoke@pbcex.com'
), a AS (
  SELECT a.id, a.user_id, a.type FROM accounts a JOIN u ON a.user_id = u.id
)
INSERT INTO balances (account_id, asset, amount)
SELECT a.id,
       CASE WHEN a.type = 'FUNDING' THEN x.asset ELSE y.asset END AS asset,
       CASE WHEN a.type = 'FUNDING' THEN x.amount ELSE y.amount END AS amount
FROM a
JOIN (VALUES ('USD', 10000.00::decimal), ('PAXG', 2.00000000::decimal)) AS x(asset, amount) ON a.type='FUNDING'
JOIN (VALUES ('XAU-s', 1.00000000::decimal)) AS y(asset, amount) ON a.type='TRADING'
ON CONFLICT (account_id, asset) DO NOTHING;

COMMIT;
EOSQL
)

echo "Seeding staging database..."
echo "$SQL" | psql "$STAGING_DATABASE_URL"
echo "Seed completed."


