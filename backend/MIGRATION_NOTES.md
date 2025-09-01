# Money Movement Backend Migration Notes

## Overview

This document outlines the database migrations and new tables added for the money movement, accounts, and DCA features.

## New Database Tables

### Core Money Movement Tables

#### `beneficiaries`

- **Purpose**: Store bank transfer beneficiaries and internal user references
- **Key Fields**: `user_id`, `type` (internal_user|bank_swift|email_link), `display_name`, `details` (JSONB)
- **Indexes**: `user_id`, `type`, `display_name`

#### `payment_requests`

- **Purpose**: Store payment requests for internal users and external links
- **Key Fields**: `user_id`, `mode` (internal_user|external_link), `target` (JSONB), `asset`, `amount`, `link_token`
- **Indexes**: `user_id`, `link_token`, `status`, `expires_at`

#### `transfers_internal`

- **Purpose**: Store internal transfers between users
- **Key Fields**: `from_user_id`, `to_internal_account_number`, `asset`, `amount`, `memo`, `status`
- **Indexes**: `from_user_id`, `to_internal_account_number`, `status`, `created_at`

#### `withdrawals_crypto`

- **Purpose**: Store crypto withdrawal requests
- **Key Fields**: `user_id`, `asset`, `network`, `address`, `amount`, `fee_estimate`, `status`
- **Indexes**: `user_id`, `asset`, `network`, `status`, `created_at`

#### `transfers_bank`

- **Purpose**: Store bank transfer requests (SWIFT/WISE)
- **Key Fields**: `user_id`, `beneficiary_id`, `amount`, `currency`, `rails` (swift|wise), `status`
- **Indexes**: `user_id`, `beneficiary_id`, `status`, `created_at`

### Recurring and DCA Tables

#### `recurring_rules`

- **Purpose**: Store recurring transfer rules
- **Key Fields**: `user_id`, `kind` (internal|payment_link|bank_swift), `frequency`, `start_at`, `next_run_at`
- **Indexes**: `user_id`, `enabled`, `next_run_at`

#### `dca_plans`

- **Purpose**: Store Dollar-Cost Averaging plans
- **Key Fields**: `user_id`, `asset`, `contribution_amount`, `frequency`, `start_date`, `next_run_at`
- **Indexes**: `user_id`, `status`, `next_run_at`

#### `dca_backtests`

- **Purpose**: Store DCA backtest results
- **Key Fields**: `user_id`, `params` (JSONB), `results` (JSONB)
- **Indexes**: `user_id`, `created_at`

### QR and Card Funding Tables

#### `qr_tokens`

- **Purpose**: Store QR payment/receive tokens
- **Key Fields**: `user_id`, `direction` (pay|receive), `payload` (JSONB), `expires_at`
- **Indexes**: `token`, `user_id`, `status`, `expires_at`

#### `card_funding_preferences`

- **Purpose**: Store card funding preferences
- **Key Fields**: `user_id`, `card_ref`, `eligible_assets` (JSONB), `selected_asset`
- **Indexes**: `user_id`, `card_ref`

### Audit and Infrastructure Tables

#### `money_movement_audit`

- **Purpose**: Audit trail for all money movement operations
- **Key Fields**: `user_id`, `operation`, `resource_type`, `resource_id`, `changes` (JSONB)
- **Indexes**: `user_id`, `operation`, `resource_type`, `created_at`

#### `outbox_events`

- **Purpose**: Domain events for eventual consistency
- **Key Fields**: `event_type`, `payload` (JSONB), `aggregate_id`, `delivered`
- **Indexes**: `event_type`, `delivered`, `created_at`

#### `idempotency_keys`

- **Purpose**: Store idempotency keys for write operations
- **Key Fields**: `user_id`, `route_path`, `idempotency_key`, `request_hash`
- **Indexes**: `user_id`, `route_path`, `idempotency_key` (UNIQUE)

## Environment Variables

### Feature Flags

````bash
# Enable/disable money movement features
MONEY_MOVEMENT_ENABLED=true
DCA_ENABLED=true

# Individual feature toggles
INTERNAL_TRANSFERS_ENABLED=true
CRYPTO_WITHDRAWALS_ENABLED=true
BANK_TRANSFERS_ENABLED=true
QR_PAYMENTS_ENABLED=true
PAYMENT_REQUESTS_ENABLED=true
BILL_PAY_ENABLED=true
RECURRING_TRANSFERS_ENABLED=true
CARD_FUNDING_ENABLED=true
DCA_BACKTESTING_ENABLED=true

# Security features

### Database SSL Configuration
```bash
# Database SSL settings
DATABASE_SSL=true                    # Enable SSL (default: false in dev/test)
DATABASE_SSL_REJECT_UNAUTHORIZED=true # Reject unauthorized certificates (default: true in prod)
````

**SSL Configuration Behavior:**

- **Development/Test**: SSL disabled by default unless `DATABASE_SSL=true`
- **Production**: SSL enabled by default with `rejectUnauthorized=true` unless explicitly disabled
- **Local Development**: Allows insecure SSL (`rejectUnauthorized=false`) for local database connections
  TWO_FACTOR_AUTH_ENABLED=true
  KYC_REQUIRED=true
  ADVANCED_SECURITY_ENABLED=false

````

### Rate Limiting
```bash
# Rate limit configurations
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_MONEY_MOVEMENT_MAX=20
RATE_LIMIT_DCA_MAX=15
````

## Migration Steps

1. **Run the migration**:

   ```bash
   npm run migrate
   ```

2. **Verify tables created**:

   ```sql
   \dt beneficiaries
   \dt payment_requests
   \dt transfers_internal
   \dt withdrawals_crypto
   \dt transfers_bank
   \dt recurring_rules
   \dt dca_plans
   \dt dca_backtests
   \dt qr_tokens
   \dt card_funding_preferences
   \dt money_movement_audit
   \dt outbox_events
   \dt idempotency_keys
   ```

3. **Check indexes**:
   ```sql
   \d+ beneficiaries
   \d+ payment_requests
   -- ... check other tables
   ```

## Backward Compatibility

- All new tables use UUIDs as primary keys
- Existing tables are not modified
- New features are feature-flagged and disabled by default
- All new endpoints are under `/api` prefix
- Existing shop/trade endpoints remain unchanged

## Data Migration Notes

- No data migration required for existing features
- New tables start empty and populate as features are used
- Audit trails begin from migration date
- Idempotency keys are automatically cleaned up after 24 hours

## Performance Considerations

- All tables include appropriate indexes for common queries
- JSONB fields are used for flexible data storage
- Audit table includes automatic cleanup (90 days retention)
- Outbox events include automatic cleanup (30 days retention)
- Rate limiting is implemented at the middleware level

## Security Notes

- All sensitive data (account numbers, addresses) are masked in logs
- PII is hashed for correlation without storing raw values
- KYC tier requirements are enforced at the middleware level
- 2FA requirements are configurable per operation
- Rate limiting prevents abuse of write endpoints
