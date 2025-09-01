-- Money Movement Tables Migration
-- Adds tables for internal transfers, crypto withdrawals, bank transfers, QR payments, etc.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Beneficiaries table
CREATE TABLE beneficiaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('internal_user', 'bank_swift', 'email_link')),
  display_name VARCHAR(200) NOT NULL,
  details JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payment requests table
CREATE TABLE payment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('internal_user', 'external_link')),
  target JSONB NOT NULL,
  asset VARCHAR(10) NOT NULL,
  amount DECIMAL(20,8) NOT NULL CHECK (amount > 0),
  memo_optional BOOLEAN NOT NULL DEFAULT false,
  allow_partial BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'expired', 'paid', 'cancelled')),
  link_token VARCHAR(100) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Internal transfers table
CREATE TABLE transfers_internal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_internal_account_number VARCHAR(50) NOT NULL,
  asset VARCHAR(10) NOT NULL,
  amount DECIMAL(20,8) NOT NULL CHECK (amount > 0),
  memo TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  audit JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crypto withdrawals table
CREATE TABLE withdrawals_crypto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset VARCHAR(10) NOT NULL,
  network VARCHAR(50) NOT NULL,
  address VARCHAR(255) NOT NULL,
  amount DECIMAL(20,8) NOT NULL CHECK (amount > 0),
  fee_estimate DECIMAL(20,8) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'broadcast', 'failed', 'cancelled')),
  audit JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bank transfers table
CREATE TABLE transfers_bank (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  amount DECIMAL(20,8) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL,
  purpose_code VARCHAR(10),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'submitted', 'failed', 'cancelled')),
  rails VARCHAR(10) NOT NULL CHECK (rails IN ('swift', 'wise')),
  audit JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bill pay payees table
CREATE TABLE bill_pay_payees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  reference VARCHAR(100),
  type VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bill pay bills table
CREATE TABLE bill_pay_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payee_id UUID NOT NULL REFERENCES bill_pay_payees(id) ON DELETE CASCADE,
  amount DECIMAL(20,8) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  frequency VARCHAR(20) CHECK (frequency IN ('one_time', 'monthly', 'quarterly', 'yearly')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recurring rules table
CREATE TABLE recurring_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('internal', 'payment_link', 'bank_swift')),
  source_account_id UUID NOT NULL,
  destination_ref JSONB NOT NULL,
  asset_or_currency VARCHAR(10) NOT NULL,
  amount DECIMAL(20,8) NOT NULL CHECK (amount > 0),
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'custom_cron')),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  on_failure VARCHAR(20) NOT NULL DEFAULT 'skip' CHECK (on_failure IN ('skip', 'retry')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- QR tokens table
CREATE TABLE qr_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('pay', 'receive')),
  payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'used')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Card funding preferences table
CREATE TABLE card_funding_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_ref VARCHAR(100) NOT NULL,
  eligible_assets JSONB NOT NULL DEFAULT '[]',
  selected_asset VARCHAR(10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, card_ref)
);

-- DCA plans table
CREATE TABLE dca_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset VARCHAR(10) NOT NULL,
  contribution_amount DECIMAL(20,8) NOT NULL CHECK (contribution_amount > 0),
  currency VARCHAR(3) NOT NULL,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  time_of_day TIME,
  start_date DATE NOT NULL,
  end_condition VARCHAR(20) NOT NULL DEFAULT 'never' CHECK (end_condition IN ('never', 'until_date', 'occurrences')),
  end_value JSONB,
  source_account_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DCA backtests table
CREATE TABLE dca_backtests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  params JSONB NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log table for money movement operations
CREATE TABLE money_movement_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Outbox table for domain events
CREATE TABLE outbox_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  aggregate_id VARCHAR(100) NOT NULL,
  aggregate_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  delivered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

-- Idempotency table
CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idempotency_key VARCHAR(255) NOT NULL,
  route VARCHAR(100) NOT NULL,
  request_hash VARCHAR(64) NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, idempotency_key, route)
);

-- Indexes for performance
CREATE INDEX idx_beneficiaries_user_id ON beneficiaries(user_id);
CREATE INDEX idx_beneficiaries_type ON beneficiaries(type);
CREATE INDEX idx_beneficiaries_active ON beneficiaries(is_active) WHERE is_active = true;

CREATE INDEX idx_payment_requests_user_id ON payment_requests(user_id);
CREATE INDEX idx_payment_requests_status ON payment_requests(status);
CREATE INDEX idx_payment_requests_expires_at ON payment_requests(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_payment_requests_link_token ON payment_requests(link_token) WHERE link_token IS NOT NULL;

CREATE INDEX idx_transfers_internal_from_user_id ON transfers_internal(from_user_id);
CREATE INDEX idx_transfers_internal_to_account ON transfers_internal(to_internal_account_number);
CREATE INDEX idx_transfers_internal_status ON transfers_internal(status);
CREATE INDEX idx_transfers_internal_created_at ON transfers_internal(created_at);

CREATE INDEX idx_withdrawals_crypto_user_id ON withdrawals_crypto(user_id);
CREATE INDEX idx_withdrawals_crypto_status ON withdrawals_crypto(status);
CREATE INDEX idx_withdrawals_crypto_asset_network ON withdrawals_crypto(asset, network);
CREATE INDEX idx_withdrawals_crypto_created_at ON withdrawals_crypto(created_at);

CREATE INDEX idx_transfers_bank_user_id ON transfers_bank(user_id);
CREATE INDEX idx_transfers_bank_beneficiary_id ON transfers_bank(beneficiary_id);
CREATE INDEX idx_transfers_bank_status ON transfers_bank(status);
CREATE INDEX idx_transfers_bank_rails ON transfers_bank(rails);

CREATE INDEX idx_bill_pay_payees_user_id ON bill_pay_payees(user_id);
CREATE INDEX idx_bill_pay_bills_user_id ON bill_pay_bills(user_id);
CREATE INDEX idx_bill_pay_bills_payee_id ON bill_pay_bills(payee_id);
CREATE INDEX idx_bill_pay_bills_scheduled_at ON bill_pay_bills(scheduled_at);

CREATE INDEX idx_recurring_rules_user_id ON recurring_rules(user_id);
CREATE INDEX idx_recurring_rules_enabled ON recurring_rules(enabled) WHERE enabled = true;
CREATE INDEX idx_recurring_rules_next_run_at ON recurring_rules(next_run_at) WHERE next_run_at IS NOT NULL;

CREATE INDEX idx_qr_tokens_user_id ON qr_tokens(user_id);
CREATE INDEX idx_qr_tokens_status ON qr_tokens(status);
CREATE INDEX idx_qr_tokens_expires_at ON qr_tokens(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_card_funding_preferences_user_id ON card_funding_preferences(user_id);
CREATE INDEX idx_card_funding_preferences_card_ref ON card_funding_preferences(card_ref);

CREATE INDEX idx_dca_plans_user_id ON dca_plans(user_id);
CREATE INDEX idx_dca_plans_status ON dca_plans(status);
CREATE INDEX idx_dca_plans_next_run_at ON dca_plans(next_run_at) WHERE next_run_at IS NOT NULL;

CREATE INDEX idx_dca_backtests_user_id ON dca_backtests(user_id);
CREATE INDEX idx_dca_backtests_created_at ON dca_backtests(created_at);

CREATE INDEX idx_money_movement_audit_user_id ON money_movement_audit(user_id);
CREATE INDEX idx_money_movement_audit_operation ON money_movement_audit(operation);
CREATE INDEX idx_money_movement_audit_resource ON money_movement_audit(resource_type, resource_id);
CREATE INDEX idx_money_movement_audit_created_at ON money_movement_audit(created_at);

CREATE INDEX idx_outbox_events_delivered ON outbox_events(delivered) WHERE delivered = false;
CREATE INDEX idx_outbox_events_aggregate ON outbox_events(aggregate_type, aggregate_id);
CREATE INDEX idx_outbox_events_created_at ON outbox_events(created_at);

CREATE INDEX idx_idempotency_keys_user_route ON idempotency_keys(user_id, route);
CREATE INDEX idx_idempotency_keys_created_at ON idempotency_keys(created_at);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_beneficiaries_updated_at
  BEFORE UPDATE ON beneficiaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_payment_requests_updated_at
  BEFORE UPDATE ON payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_transfers_internal_updated_at
  BEFORE UPDATE ON transfers_internal
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_withdrawals_crypto_updated_at
  BEFORE UPDATE ON withdrawals_crypto
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_transfers_bank_updated_at
  BEFORE UPDATE ON transfers_bank
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_bill_pay_payees_updated_at
  BEFORE UPDATE ON bill_pay_payees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_bill_pay_bills_updated_at
  BEFORE UPDATE ON bill_pay_bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_recurring_rules_updated_at
  BEFORE UPDATE ON recurring_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_card_funding_preferences_updated_at
  BEFORE UPDATE ON card_funding_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_dca_plans_updated_at
  BEFORE UPDATE ON dca_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
