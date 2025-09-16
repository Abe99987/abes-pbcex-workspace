## ARCHIVED — see handbook (canonical)

This file is kept for historical context. Do not update here. For the live versions, use:

- docs/handbook-mount/product-specs/business-plan/2025-09_pbcex_business_plan.md
- docs/handbook-mount/docs/architecture/mvp_technical_architecture.md
- docs/handbook-mount/prompts/cursor/VIBE_CODING_PROMPTS.md

Last reviewed: 2025-09-15 US-ET

---

# PBCEx (People’s Bank & Commodities Exchange) — Project Notes

## Mission

Build a Bare Bones MVP (minimum viable product) exchange that uses real custody for USD/USDC/PAXG and synthetic tokens for metals trading. Goal is to minimize spend and prioritize free/low-cost integrations.

## Development Setup

- Local development: React/Vite TypeScript app
- Dev server: http://localhost:8080
- Current hero copy: "People’s Bank Commodities Exchange"

## Phase Approach

- **Phase 1 MVP**:
  - KYC (know your customer) / fiat rails
  - Custody: USDC & PAXG
  - Trading: synthetic metals
  - Price feeds: TradingView
  - Funding ↔ Trading wallet split
  - Checkout: JM Bullion / Dillon Gage with 10-minute price-lock
- **Later Phases**:
  - Phase 3: bonded vaults, real on-chain token issuance
  - Phase 4: custom L1 blockchain with integrated L2s for payments, logistics, and bonds

## Architecture Targets

- Backend: Node.js / NestJS
- Core services: Synthetic Ledger, Trading Engine, Price Service, Transfers, Checkout, Custody Rails, Hedging, Notifications, Observability
- Data: PostgreSQL + Redis
- Infrastructure: Docker + Terraform on AWS

## Definition of Done (Phase 1)

- Deposits to Funding wallet
- Transfers to Trading wallet
- Mint synthetic assets and trade
- Checkout flow with synthetic tokens burned
- Fee/spread handling
- Price-lock honored
- Append-only ledger
- Monitoring green

## HR / Team Approach

- Start lean (Option B): 1 full-stack, junior frontend, junior backend, fractional DevOps/compliance
- Grow to senior leads later
- Equity guidance:
  - Backend lead: 1.5–3%
  - Frontend lead: 1–2%
  - DevOps/Security: 0.5–1.5%

## Commodities Focus List

- Core: oil, natural gas, gold, silver, copper
- Extended: aluminum, nickel, zinc, tin, platinum, iron/steel, lithium, cobalt, uranium
- Each with exchange feed paths and U.S. counterparties

## Notes to Self

- Build Instructions document assumes React/Next.js for frontend; current repo is React/Vite → reconcile this later.
- Use free or low-cost APIs wherever possible to cut costs.
- Workflows: co-build with Cursor + Claude; all planning and control through Git branches/PRs.

---

👉 For a concise developer-skim version, see [PROJECT_SCOPE.md](./PROJECT_SCOPE.md).
