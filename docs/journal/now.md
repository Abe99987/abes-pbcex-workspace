# Development Journal

## 2025-09-17

- Handbook vault created and wired: pbcex-handbook/chatgpt-vault (index, templates, daily, specs, lists).
- VIBE_CODING prompt suite refreshed for vault-first journaling; `.obsidian/**` ignored; `.gitattributes` added in handbook.
- Policy: vault (`chatgpt-vault/**`) can update on MAIN time; code-repo journals remain mainline-only post-merge.
- Next build slice concrete:\n  - `/prices` service v0 skeleton (`backend/services/price-service/` with `premium.config.yaml` and `firm-sizes.yaml`.\n  - Risk module v0 (circuit breakers/collars/mode switch) behind feature flag.\n  - Supplier-Guard schema + validator CLI.
- Do-First for next session: draft `/prices` OpenAPI + TypeBox, service skeleton, and unit test stubs.
\n---
