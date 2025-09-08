# Compliance Surface (Sprint 28A)

This sprint introduces a visible legal surface and simple, env-driven region gating banner for review readiness.

## Pages (Frontend)

- /legal — Legal Hub (Draft)
- /legal/tos — Terms of Service (Draft)
- /legal/privacy — Privacy Policy (Draft)
- /legal/risk-disclosures — Risk Disclosures (Draft)
- /legal/supported-regions — Supported Regions & Disclosures (Draft)

Each page includes a unique <title>, <h1>, meta description, and a "Last updated: YYYY-MM-DD" line.

## Footer

Footer includes links for Terms of Service, Privacy Policy, Risk Disclosures, and Supported Regions with data-testid attributes for testing. Mobile layout preserved.

## Region Gating Banner (Informational)

A non-blocking, sticky top banner can be enabled via environment variables. Behavior:

- Reads env flags (client-side):
  - PUBLIC_REGION_GATING=on|off
  - PUBLIC_SUPPORTED_REGIONS — CSV of ISO country codes (e.g., US,CA,GB)
  - PUBLIC_REGION_MESSAGE — Short notice text
- If gating is on and the user-selected region is not in the allowlist, show a sticky banner with a link to /legal/supported-regions.
- Region selection is a simple dropdown stored in localStorage (userRegion). Default: US.
- Informational only; does not block access.

Note: Also supports Next.js-prefixed variants NEXT_PUBLIC_REGION_GATING, NEXT_PUBLIC_SUPPORTED_REGIONS, NEXT_PUBLIC_REGION_MESSAGE without additional config changes.

### Example .env.local (frontend)

PUBLIC_REGION_GATING=on
PUBLIC_SUPPORTED_REGIONS=US,CA,GB
PUBLIC_REGION_MESSAGE=Service availability varies by region. See Supported Regions & Disclosures.

## Tests

- Unit/Integration (Jest):
  - Footer renders all four legal links with correct hrefs.
  - Each legal page renders h1/meta and "Last updated".
  - Banner appears when gating on and region not allowed; hidden otherwise.
- E2E (Playwright):
  - Smoke test asserts /legal/\* endpoints return 200.

## Notes

- No backend schema, payment, or custody logic changes.
- Node policy: repo root uses Node 20.x; frontend engines >=18 supported; tests run under local CI scripts.
