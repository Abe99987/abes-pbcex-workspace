# PBCEx Alert System & SLOs

## Overview

This document defines Service Level Objectives (SLOs) and alerting mechanisms for critical PBCEx platform operations.

## SLO Definitions

### 1. Price Feed Freshness

- **Objective**: Price updates must be received within 30 seconds
- **Measurement**: Time since last price update for each tracked asset
- **Alert Threshold**: No price update received in >30 seconds
- **Alert Event**: `PRICE_STALL`
- **Severity**: HIGH - Stale prices can lead to incorrect trades

### 2. Ledger Materialization

- **Objective**: Balance aggregations must not drift >$0.01 from journal sum
- **Measurement**: Difference between balances table and sum of balance_changes
- **Alert Threshold**: Drift >$0.01 USD equivalent for any account+asset
- **Alert Event**: `LEDGER_DRIFT_DETECTED`
- **Severity**: CRITICAL - Financial integrity issue

### 3. Webhook Delivery

- **Objective**: Webhooks must succeed within 3 retry attempts
- **Measurement**: Failed webhook deliveries after max retries
- **Alert Threshold**: Webhook exhausts all retry attempts
- **Alert Event**: `WEBHOOK_RETRY_EXHAUSTED`
- **Severity**: MEDIUM - User notifications/integrations may fail

## Alert Routing

### Current Implementation (v1)

- **Log Sink**: All alerts logged at `INFO` level with structured metadata
- **Metric Sink**: Counters incremented for each alert type
- **TODO**: Future integration with PagerDuty, Slack, or other alerting systems

### Alert Metadata Structure

```typescript
interface AlertEvent {
  type: 'PRICE_STALL' | 'LEDGER_DRIFT_DETECTED' | 'WEBHOOK_RETRY_EXHAUSTED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
  metadata: Record<string, unknown>;
  resolved?: Date;
}
```

## Implementation Components

### 1. Price Stall Detector

- **Location**: `PriceFeedService.ts`
- **Method**: Heartbeat check comparing `lastUpdate` timestamps
- **Frequency**: Every 15 seconds
- **Threshold**: 30 seconds without update

### 2. Ledger Drift Monitor

- **Location**: `AdminController.ts` → `GET /api/admin/health/ledger-drift`
- **Method**: SQL query comparing balance sums with journal totals
- **Frequency**: On-demand (admin endpoint)
- **Threshold**: >$0.01 USD equivalent drift

### 3. Webhook Failure Tracker

- **Location**: `NotificationService.ts`
- **Method**: Retry counter with exponential backoff
- **Frequency**: Per webhook attempt
- **Threshold**: 3 failed retries

## Monitoring Queries

### Price Staleness Check

```sql
SELECT asset,
       EXTRACT(EPOCH FROM (NOW() - last_price_update)) as seconds_stale
FROM price_cache
WHERE last_price_update < NOW() - INTERVAL '30 seconds';
```

### Ledger Drift Detection

```sql
SELECT b.account_id, b.asset,
       b.amount as balance_amount,
       COALESCE(SUM(bc.amount), 0) as journal_sum,
       ABS(b.amount - COALESCE(SUM(bc.amount), 0)) as drift
FROM balances b
LEFT JOIN balance_changes bc ON bc.balance_id = b.id
GROUP BY b.id, b.account_id, b.asset, b.amount
HAVING ABS(b.amount - COALESCE(SUM(bc.amount), 0)) > 0.01;
```

### Webhook Failure Rate

```sql
SELECT DATE_TRUNC('hour', created_at) as hour,
       COUNT(*) as total_attempts,
       SUM(CASE WHEN retry_count >= 3 THEN 1 ELSE 0 END) as exhausted_retries
FROM webhook_delivery_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;
```

## Escalation Matrix

| Alert Type              | First Response        | Escalation (15m) | Critical Escalation (1h) |
| ----------------------- | --------------------- | ---------------- | ------------------------ |
| PRICE_STALL             | Engineering Slack     | On-call Engineer | Platform Lead            |
| LEDGER_DRIFT            | Finance + Engineering | CFO + CTO        | Executive Team           |
| WEBHOOK_RETRY_EXHAUSTED | Support Team          | Engineering      | -                        |

## Testing & Validation

### SLO Validation Tests

- Unit tests for each detector with edge cases
- Integration tests for admin health endpoints
- Load tests to verify alert performance under stress

### Alert Testing

- Synthetic alerts for testing escalation paths
- Regular "fire drill" exercises
- Monitoring of alert fatigue and false positives

---

**Last Updated**: Sprint 27 implementation  
**Next Review**: Post-deployment + 30 days
