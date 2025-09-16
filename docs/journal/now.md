# Project State — Last updated: 2025-09-15

## Current State

• Placeholder: Core backend services operational
• Placeholder: Frontend deployment pipeline active
• Placeholder: Database migrations up to date
• Placeholder: Test coverage maintaining target thresholds
• Placeholder: CI/CD pipeline healthy and green
• Placeholder: Security audit findings addressed
• Placeholder: Performance baseline established
• Placeholder: Documentation updates in progress
• Handbook submodule bumped to latest MAIN (includes VIBE_CODING_PROMPTS + ADR-0002)
• Merged PR #71 — handbook submodule updated to canonical prompts + ADR-0002 (commit 438ebcb)
• Merged PR #72 — CI path filters live; actionlint isolated. Repo clean for tomorrow.

## Do-First Next Session

• ✅ STAGING_WEB_BASE_URL wiring complete (feat/staging-web-smoke-setup)
<<<<<<< HEAD
• ✅ SSE observability dashboard complete (feat/sse-ops-dashboard)
• ✅ Preflight automation added (chore/preflight-delta-seams)
• Ready: `npm run preflight` - Fast repo status and env verification before each session
• Ready: `/ops/sse` - Live connection stats, leak test widget, admin-only access
• Ready: `npm run smoke:staging` - Trade v1 smoke script with HTML reports
• Pending: DNS/hosting provision actual staging URL value
• Evidence: artifacts/e2e/staging/ (pending staging environment)
• Start Paxos PAXG custody slice (scaffold contracts & guardrails)
=======
<<<<<<< HEAD
• ✅ SSE observability dashboard complete (feat/sse-ops-dashboard)
• Ready: `/ops/sse` - Live connection stats, leak test widget, admin-only access
• Ready: `npm run smoke:staging` - Trade v1 smoke script with HTML reports
• Pending: DNS/hosting provision actual staging URL value
=======
• Pending: DNS/hosting provision actual staging URL value
• Ready: `npm run smoke:staging` - Trade v1 smoke script with HTML reports

> > > > > > > origin/main
> > > > > > > • Evidence: artifacts/e2e/staging/ (pending staging environment)
> > > > > > > • Start Paxos PAXG custody slice (scaffold contracts & guardrails)

## PRs Opened (2025-09-16)

- **PR #73**: [Staging smoke setup](https://github.com/Abe99987/abes-pbcex-workspace/pull/73) - STAGING_WEB_BASE_URL wiring + npm run smoke:staging
- **PR #74**: [SSE ops dashboard](https://github.com/Abe99987/abes-pbcex-workspace/pull/74) - /ops/sse with connection monitoring + leak test
- **PR #75**: [Preflight automation](https://github.com/Abe99987/abes-pbcex-workspace/pull/75) - npm run preflight + session templates + seams-invariants.md
- **PR #76**: [Idempotency panel](https://github.com/Abe99987/abes-pbcex-workspace/pull/76) - /ops/idem with duplicate detection + test widget

**Today's Update**: All PR conflicts resolved - #73 (aef4b43), #74 (531b855), #76 (baed9b6); hygiene PR #77 created; all PRs awaiting CodeRabbit review
**Tomorrow's Do-First**: Merge in order: staging → SSE ops → preflight-delta → idempotency ops; then run staging smoke

## Non-Negotiables

- System constraints documented in [seams-invariants.md](seams-invariants.md)
- Session workflow templates in operator log with delta checklists

## Links

- CI: [Placeholder - build status URL]
- Latest SHA: [Placeholder - commit hash]
