# Seams & Invariants - Non-Negotiable Constraints

**Tripwire documentation for PBCEx system boundaries and invariants that must never be violated.**

## 🔄 Idempotency

- **Orders/Trades**: All trade endpoints require `X-Idempotency-Key` header
- **Server Deduplication**: Backend prevents duplicate side-effects within key TTL window
- **Client Responsibility**: UI generates unique request IDs for retry-safe operations
- **Key Format**: Use nanoid(16) or UUID for idempotency keys, never sequential IDs

## 📡 SSE Hygiene

- **Connection Limit**: Maximum one EventSource per page/component
- **Cleanup Discipline**: Close connections on route change, component unmount
- **Heartbeat Health**: Connections must heartbeat ≤30s, TTL cleanup for stale connections
- **Observability**: `/ops/sse` dashboard must remain live for leak detection
- **No Accumulation**: Navigation/refresh cycles must not accumulate ghost connections

## 🏦 Custody Boundaries

- **Adapter Pattern**: All custody/PAXG flows via service adapters, never direct API calls from UI
- **Vendor Isolation**: Frontend never calls Paxos/Anchorage/custody vendors directly
- **Event-Driven Updates**: Ledger updates triggered by custody events, not polling
- **Reconciliation**: Daily batch reconciliation between ledger and custody balances

## 📊 Ledger Invariants

- **Double-Entry**: Every journal entry has balanced debits/credits, no exceptions
- **Materialized Balances**: Account balances computed from journal, cached for performance
- **Non-Negative Enforcement**: No withdrawal operations that result in negative balances
- **Audit Trail**: All balance changes must have traceable journal entries with references
- **Nightly Reconciliation**: Automated job verifies ledger integrity and custody alignment

## 🔧 Configuration Invariants

- **Central API URLs**: Single source of truth for API base URLs, no hard-coded endpoints
- **Environment Separation**: Staging/production secrets never cross-contaminate
- **URL Hygiene**: Zero hard-coded `http(s)://` URLs in `src/**` (verified by preflight)
- **Environment Variables**: All external service URLs via env vars, not constants

## 🔐 Security Invariants

- **Rate Limiting**: All public endpoints protected by rate limits
- **Admin Auditing**: Admin operations logged with IP, timestamp, and action details
- **PII Exclusion**: No personally identifiable information in application logs
- **Token Rotation**: API keys and tokens have defined rotation schedules

## ⚡ Error Budgets & Alerts

- **Price Stall Detection**: Alert when price feeds stale >2 minutes
- **Ledger Drift Monitoring**: Reconciliation failures trigger immediate alerts
- **Webhook Failure Handling**: Custody webhook failures retry with exponential backoff
- **Threshold Documentation**: All alert thresholds documented with business rationale
- **SLA Definitions**: Clear uptime and response time expectations per component

---

**⚠️ Violation Protocol**: Any violation of these invariants triggers immediate investigation and hotfix deployment. These constraints protect system integrity and user funds - they are not negotiable for performance or convenience.\*\*

_Last Updated: 2025-09-16_
