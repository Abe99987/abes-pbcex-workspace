-- DCA Rules Migration Rollback
-- Removes DCA rules table and related objects

-- Drop table (cascades to indexes and triggers)
DROP TABLE IF EXISTS dca_rules;

-- Drop custom types
DROP TYPE IF EXISTS dca_cadence;
DROP TYPE IF EXISTS dca_account_source;

-- Remove migration record
DELETE FROM schema_migrations WHERE version = '007_dca_rules';
