## Step-36 wrap-up (iOS wrapper scaffold)

- Scaffolded minimal Capacitor wrapper without committing platform trees; server URL via `STAGING_WEB_BASE_URL` with localhost fallback. PR #40.
- Centralized external-link policy via `ExternalLink` and wrapper bridge; added `/deeplink/open` fallback route; env keys: `PUBLIC_IOS_DEEP_LINK_SCHEME`, `PUBLIC_EXTERNAL_LINK_HOST_ALLOWLIST`. PR #40.
- Added placeholders for app assets (`assets/mobile/icon.png`, `assets/mobile/splash.png`) and `docs/ios-wrapper-plan.md`. PR #41.
- Tests-only slice landed for deeplink fallback and external-links policy placeholder. PR #42.
- Tooling hygiene: `.nvmrc` pinned to Node 20 and pre-push gitleaks behavior documented (non-blocking when binary missing). PR #44.
- Docs wrap-up and operator log updates. PR #43.

Remaining human to-dos:

- Enroll Apple Developer org; create ASC app record; set `appIDs` Team ID in AASA.
- Provide ASC secrets: `ASC_ISSUER_ID`, `ASC_KEY_ID`, `ASC_API_KEY_P8_BASE64` (in secrets, not VCS).
- Replace placeholder icon/splash with final assets post-enrollment.

## Step-36 (iOS wrapper scaffold)

- Adopted minimal Capacitor scaffold without committing platform trees (PR #40). Server URL via `STAGING_WEB_BASE_URL` with localhost fallback. Added `scripts/ios/patch-entitlements.ts` to manage Associated Domains.
- External link policy centralized: `ExternalLink` routes non-allowlisted hosts via wrapper bridge; allowlist defaults `pbcex.com,tradingview.com`. Added deeplink page `/deeplink/open` with fallback.
- M3 placeholders added (PR #41): `assets/mobile/icon.png` (1024), `assets/mobile/splash.png` (2732) and `docs/ios-wrapper-plan.md`. Real assets to follow post-enrollment.

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

- PR #29 merged successfully (commit 111963a)
- Legal hub online and accessible
- Region banner is informational only (non-blocking)
- Tests added for all legal pages and banner logic

## Sprint 30 — UAT Staging Harness + Fast Checks (2025-09-08)

- Adopted Playwright-based UAT smoke suite with HTML reports (`e2e/test-results/html-report`)
- Added minimal, test-only region override via `?pbce_region=XX` when `NODE_ENV!=='production'`
- Root scripts: `e2e:staging` (uses `STAGING_WEB_BASE_URL`), `e2e:report`
- CI policy: Plan to re-enable “Fast checks” as Required post-merge once green; added PR Smoke workflow (@smoke-tagged Playwright checks) for deterministic PR gating (HTML at `e2e/test-results/html-report`, JUnit at `e2e/test-results/junit.xml`)
- Scope: Frontend/e2e only; no DB schema, auth, payments/custody changes
- Merges: #31 (docs/UAT notes), #33 (PR Smoke workflow), earlier #30 (UAT harness)
- Staging smoke: Skipped (no `STAGING_WEB_BASE_URL` in env at close). If provided, run smoke against staging and record report path.

## Sprint 31–33 — Prod Pipeline v1, Public Beta Gating, iOS Wrapper

- Production pipeline skeleton added: `.github/workflows/release-prod.yml` (dispatch + `v*` tags) with build → smoke (no-op) → gated deploy stub
- Rollback workflow added: `.github/workflows/rollback-prod.yml` (dispatch, prints plan only)
- Public Beta gating (informational) added: `PUBLIC_BETA_MODE` (+ `NEXT_PUBLIC_BETA_MODE`) shows a "Public Beta" badge with link to disclosures; no blocking behavior
- UAT e2e added: `e2e/tests/uat/beta-gating.spec.ts` with @smoke-tagged checks for badge off/on and disclosures route 200
- iOS wrapper decision doc: `docs/ios-wrapper-decision.md` with Capacitor vs RN analysis; provisional decision: Capacitor wrapper for authenticated PWA; no native payments

## 2025-09-13 — Legal hubs v1 (PR #48)

- Added four legal hubs with tiles; linked 11 canonical docs.
- Kept 'Compliance' under Support; Legal shows four hubs + All Legal Documents.
- 'Fast checks' E2E remains non-required; CodeRabbit required; PR #48 merged (short SHA: 737fb05).
- Preview stability: public/legal assets committed.
- Next: Cloudflare redirects (/legal/regulatory → /compliance), Sentry alert for legal pages.

## 2025-09-13 — Legal list manifest hardening (PR #49)

- Duplicated manifest to `/data/legal-manifest.json`; resilient fetch order `/data` → `/legal` → baked-in list.
- `/legal` renders an 11-tile grid with short summaries and "View document →" links; header/footer confirmed.
- Merged PR #49; `/data` manifest is canonical for list loading.
- Consider cache-buster on `/data` manifest if preview hosts cache aggressively.

## 2025-09-13 — Legal: cache-busted manifest + fail-safe list (PR #50)

- Merged PR #50 (merge SHA: ff3e055) to harden `/legal` list loading.
- Loader order: `/data/legal-manifest.json?v=Date.now()` → `/legal/manifest.json?v=Date.now()` → baked-in 11-item list.
- Added 10s timeout + strict JSON Content-Type gate; non-JSON/parse errors safely fall back (no throws).
- Verification (local preview): `/legal` 200 with 11 tiles; docs 200 (`privacy-policy`, `aml-bsa-program`, `terms-of-service`); `/data/legal-manifest.json` 200 application/json.
- Next: Lovable UX-only polish; monitor preview cache behavior; no product code changes planned beyond UX.
