# Release Runbook — Staging to Production

This runbook defines the release process for promoting builds from staging to production, including approvals, freeze windows, rollback criteria, and verification steps.

## Promotion Path

- Staging → Production
- Build artifacts produced by `Release Production` workflow (`.github/workflows/release-prod.yml`).
- Rollback plan defined by `Rollback Production` workflow (`.github/workflows/rollback-prod.yml`).

## Approvals

- Required approver: Release Manager (production environment gate)
- Optional approvers: Backend Lead, Frontend Lead

## Freeze Window

- Avoid releases Friday 17:00–Monday 08:00 UTC unless emergency
- No schema migrations during freeze without explicit approval

## Rollback Decision Matrix

- UI outage or 5xx spike > 1% sustained 5 min → rollback
- P0 security finding related to release → rollback
- Contract/API regressions failing smoke or health checks → rollback
- Payments/custody anomalies (balances drift) → rollback

## Commands (Examples)

- Trigger production release: Git tag `vX.Y.Z` push or manual `workflow_dispatch`
- Trigger rollback: Run `Rollback Production` with input `release_tag=vX.Y.Z`

## Blast Radius Checks

- Check error budget and alert dashboard for anomalies
- Verify DB connections healthy and migrations (if any) completed
- Cache/CDN headers sane; no infinite caching on dynamic routes

## Post-Release Verification

- Backend health endpoint 200
- Frontend legal pages and home route 200
- E2E PR smoke analogs pass locally against production (read-only checks)
- Logs clean; no elevated error rates

## Artifact Locations

- Frontend: `web-build` artifact (Next.js `.next`)
- Backend: `api-build` artifact (`backend/dist`)
- Release notes: `release-notes` artifact

## Notes

- Initial version is a no-op deploy gate. Future versions will wire real deploy steps.
