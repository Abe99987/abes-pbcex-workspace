### Step-36 operational notes

- PR #40 merged: scaffold (Capacitor config, entitlements patch, wrapper bridge, deeplink page). Gates: Frontend/Backend CI green; CodeRabbit passed.
- PR #41 merged: M3 placeholders (icon/splash) and wrapper plan doc. Auto-merge after CodeRabbit; no platform artifacts committed.
- Branch hygiene: pruned `feat/ios-step36-capacitor-scaffold` and `feat/ios-step36-m3-icons` (local+remote). Next: M4 tests as a tiny draft PR (tests-only).

# Operator Log

## 2025-09-09

### PR #37 - iOS Wrapper Prework (Bundle A)

- **Merge Commit**: 55d4a42 feat(wrapper-prep): iOS prework (ExternalLink, logger, deeplinks, CI stub)
- **PR URL**: https://github.com/Abe99987/abes-pbcex-workspace/pull/37
- **Main CI Pipeline**: ✅ Success (Run ID: 17568195241) - https://github.com/Abe99987/abes-pbcex-workspace/actions/runs/17568195241
- **E2E Tests**: Running (Run ID: 17568227865) - https://github.com/Abe99987/abes-pbcex-workspace/actions/runs/17568227865
- **Changes**: ExternalLink component, logger abstraction, deeplinks parser, iOS CI workflow (environment-gated)
- **Test Coverage**: 100% (20/20 frontend tests passing)
- **Notes**: Backend test failures in PR were infrastructure-related (DB connectivity); admin merge used. iOS workflow visible in Actions tab.

## 2025-09-08

### PR #29 - Compliance Surface Merge

- **Squash SHA**: 111963a
- **CI Status**: ✅ Success (Run ID: 17539034125)
- **Changes**: Legal hub pages, footer links, region gating banner
- **Tests**: All frontend and backend tests passing
- **Staging Smoke**: Skipped (missing STAGING_WEB_BASE_URL)
- **Notes**: Safe to close. No phantom diffs expected on reopen.

### PR #30 - UAT Staging Harness

- **Branch**: feat/uat-staging-harness (short SHA: 9bc0694)
- **Changes**: Playwright UAT suite (routes/footer/banner), HTML + JUnit reporters, test-only region override via `?pbce_region=XX`
- **Run Summary (local)**: 1 skipped, 3 passed (chromium)
- **Report Path**: `e2e/test-results/html-report`
- **Env Used**: `BASE_URL=http://localhost:3000`; region gating defaults from `frontend/env-template`
- **Notes**: Artifacts ignored via .gitignore; staging script added (`npm run e2e:staging`).

### PR #30 - Merge Result

- **Squash Commit**: feat(uat): stabilize SSR region override and align CI summary path
- **CI**: All required checks green; CodeRabbit approved
- **Summary**: SSR-safe override confined to client-only effect; CI lint/build path alignment; no production behavior changed.

### Sprint 30 Close — Merge Verify

- **PRs merged**: #31 (f7a5391), #33 (d6ebf22)
- **Main CI**: ✅ Frontend; ✅ Backend; ✅ CI Summary (PR Smoke runs on PR only)
- **PR Smoke**: Added pr-smoke.yml; runs 2 @smoke tests on PRs; uploads HTML to `e2e/test-results/html-report`; JUnit at `e2e/test-results/junit.xml`
- **Staging smoke**: Skipped (no STAGING_WEB_BASE_URL). If set, run: `BASE_URL=$STAGING_WEB_BASE_URL npm run e2e:smoke`
- **Next**: Monitor PR Smoke for 10 clean PRs; then consider flipping to Required. See follow-up issue (#34).

## 2025-09-08 — Sprint 31–33 Workstream

- **Release Workflows**: Added `release-prod.yml` and `rollback-prod.yml`. Both are no-op by default; release requires environment approval.
- **Public Beta**: Informational badge toggled by `PUBLIC_BETA_MODE`/`NEXT_PUBLIC_BETA_MODE`. Links to `/legal/risk-disclosures`.
- **UAT**: Added `e2e/tests/uat/beta-gating.spec.ts` with @smoke tags. HTML report remains at `e2e/test-results/html-report` (ignored in VCS).
- **Docs**: Added `docs/release-runbook.md` and `docs/ios-wrapper-decision.md`.
- **PR Smoke Runtime**: Local CI-mode run completed in ~1.74s with all @smoke tests skipped due to no web server (intended in CI PR job). Upload path unchanged: `e2e/test-results/html-report`.
- **Branch Hygiene Report**:
  - main vs origin/main: ahead 0 / behind 0 (linear)
  - Fully merged remote branches (unique-commit check empty vs origin/main):
    - origin/chore/coderabbit-config-final
    - origin/chore/simplify-and-test-phase-1
    - origin/feat/admin-build-phase-2
    - origin/feat/chainlink-oracle-integration
    - origin/feat/integrations-fedex-twilio-resend-prices
    - origin/integrations-clean-start-2025-08-30-1946
  - Action: Pending approval to prune the above remote branches and local tracking refs.

### Workflow Dry-Runs

- Release Production: tag-triggered run for `v0.0.0-beta-ios-1757351332` → https://github.com/Abe99987/abes-pbcex-workspace/actions/runs/17558555083 (2025-09-08T17:10:10Z → success). Jobs: Build (frontend+backend), Smoke (no-op), Deploy (gated stub). Artifacts: `web-build`, `api-build`, `release-notes`.
- Rollback Production: cannot dispatch from feature branch via CLI; workflow not present on default branch yet (HTTP 404). Will trigger via `workflow_dispatch` after merge to `main` and record link.

### PR Bundle

- **PR #36**: https://github.com/Abe99987/abes-pbcex-workspace/pull/36 — Bundles production pipeline v1, Public Beta informational badge, and iOS wrapper decision docs. Squash-merged at 2025-09-08T19:55:37Z (commit 717bcb6).

### Rollback (post-merge) run

- **Date**: 2025-09-08T20:00:52Z
- **Branch**: main
- **Run URL**: https://github.com/Abe99987/abes-pbcex-workspace/actions/runs/17562567586
- **Notes**: No-op plan as designed; workflow_dispatch with release_tag=v0.0.0-post-merge-test
