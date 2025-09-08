# Decision Log

## Sprint 27 — Alerts and Error Budgets (PR #28)

- Alert detectors added:
  - Price stall: 30s threshold → `PRICE_STALL` (HIGH)
  - Ledger drift: >$0.01 USD equivalent → `LEDGER_DRIFT_DETECTED` (CRITICAL)
  - Webhook retry-exhausted: 3 attempts → `WEBHOOK_RETRY_EXHAUSTED` (MEDIUM)
- Admin health route: GET `/api/admin/health/ledger-drift`
- Security: Admin-role restriction enforced on admin health endpoints; SAST clean on touched files
- CI: Fast checks currently non-required pending strict TS micro-PR
- Last updated: Sprint 27 (short SHA: f645e12)

## Sprint 28A — Compliance Surface: Legal Hub & Region Gating

- Added frontend legal hub with routes: `/legal`, `/legal/tos`, `/legal/privacy`, `/legal/risk-disclosures`, `/legal/supported-regions` (all marked Draft; include Last updated line)
- Footer updated with legal links and `data-testid` attributes
- Added env-driven, informational region gating banner (no blocking): reads `PUBLIC_REGION_GATING`, `PUBLIC_SUPPORTED_REGIONS`, `PUBLIC_REGION_MESSAGE` (also supports `NEXT_PUBLIC_*` variants)
- Unit/integration tests added for legal pages, footer links, and banner logic; e2e smoke extended to assert legal routes return 200
- No backend, payment, or custody logic changes

## Sprint 28A — Compliance Surface: Legal Hub & Region Gating (2025-09-08)

Added: /legal hub, /legal/tos, /legal/privacy, /legal/risk-disclosures, /legal/supported-regions; footer links; env-driven, non-blocking region banner (PUBLIC_REGION_GATING, PUBLIC_SUPPORTED_REGIONS, PUBLIC_REGION_MESSAGE); tests (unit/integration + light E2E); docs/compliance/readme.md. Scope: frontend-only; no backend or payments changes.
