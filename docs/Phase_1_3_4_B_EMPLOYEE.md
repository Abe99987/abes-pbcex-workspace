# PBCEx Phase 1-3-4-B Employee Reference Document

## Phase 1 — MVP Scope

- Web + mobile app with KYC/AML, fiat rails, USDC support, and PAXG custody (via Anchorage Digital or Prime Trust).
- Synthetic tokens (XAU-s, XAG-s, XPT-s, XPD-s, XCU-s) issued internally for trading.
- USD/USDC/PAXG sit in regulated custody.
- Shop/Realize checkout integrates JM Bullion and Dillon Gage APIs with a 10-minute price lock.
- Price feeds via TradingView (Chainlink redundancy added later).
- Wallet split (Funding / Trading) to separate real tokens from synthetics.
- Fulfillment fully insured, shipped via FedEx/JM Bullion.
- Support stack: Intercom, card issuing, KYC integrations.

### Phase 1 Costs (Text Format)

- Setup (USD): $338,000 + $250,000–$500,000 working capital
- Monthly (USD): ~$11,433
- Annual (USD): ~$148,800

### Phase 1 Takeaway

- Lean launch using custodians for USD/USDC/PAXG, synthetic metals for the rest.
- ~6–9 month breakeven at ~6,750 active users.

---

## Phase 3 — Own Everything In-House (12–18 months)

- Migration from retail custody/fulfillment to institutional vaulting.
- Brinks + bonded warehouses (Memphis FedEx hub, Zurich/London, Singapore Freeport).
- Transition into PBCEx-owned vaults, tokenization infra for 25 commodities.
- Introduce Layer-2 settlement.

### Phase 3 Costs (Text Format)

- Setup: ~$9.25M – $16.1M
- Annual Ops: ~$2.6M – $3.2M
- Break-even: ~24,200 global customers.

### Phase 3 Key Gains

- Full spread capture on metals, FX, crypto (~$500/year ARPU retail).
- Institutional L2 settlement & vault leasing (~$1,000/year ARPU).
- Weighted ARPU ≈ $600.

---

## Phase 4 — Custom L1 + Three Specialized L2s

- Purpose-built blockchain to handle payments, logistics, and bonds.
- Triggered when transaction volumes/costs exceed thresholds.

### Phase 4 Costs (Text Format)

- Setup: ~$17M – $25M
- Annual Ops: ~$2.65M – $3.5M
- Break-even: ~150K–250K high-value users in ~12 months.

---

## Team Structure (High Level)

- **Front-End**: React/Next.js, Vite, UI/UX.
- **Back-End**: Node.js/NestJS, Postgres, Redis.
- **Blockchain Development**: Synthetic ledger, custody, tokenization, hedging.
- **Infrastructure & Security**: AWS, Docker, Terraform, Observability.

---

## Hedging Strategy & Algorithms

- **Market Neutral Hedging**: using ETFs and unallocated accounts.
- **Synthetic Exposure Controls**: trigger hedges once exposure crosses thresholds.
- **Algorithms**:
  - Delta-neutral hedging.
  - Moving average crossover.
  - Co-market making with providers.

---

## Glossary of Features & Terms

- **MVP (Minimum Viable Product)**: Lean first launch of the platform.
- **ARPU (Average Revenue per User)**: Revenue metric for break-even analysis.
- **KYC/AML (Know Your Customer / Anti-Money Laundering)**: Required compliance.
- **Synthetic Tokens**: Internal representations of metals until vaulting.
- **Direct Fill**: Automated supplier-based order fulfillment.
- **Large Limit Indicator**: Marker for institutional/bulk trades.
- **Custody**: Regulated storage of USD, USDC, PAXG.
- **Vaulting**: Insured physical storage of metals.

---

## Closing Note

PBCEx grows in phases:

- Phase 1 is lean, synthetic-heavy, custodial.
- Phase 3 moves to bonded vaults + tokenization across 25+ commodities.
- Phase 4 adds a custom L1 with specialized L2s for global scaling.

This ensures a capital-efficient model that scales with demand while keeping operations risk-neutral.
