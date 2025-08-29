Phase Costs W/ Totals Phase 1 — MVP Scope:

Web + mobile app with KYC/ at rails, USDC support, and PAXG custody (via
Anchorage Digital or Prime Trust). PBCEx synthetic tokens (XAU-s, XAG-s,
XPT-s, XPD-s, XCU-s) are issued internally for trading, while
USD/USDC/PAXG sit in regulated custody. Shop/Realize checkout integrates
JM Bullion and Dillon Gage APIs with a 10-minute price lock. Price feeds
run through TradingView (with Chainlink added later). Key features
include a wallet split (Funding Trading) to separate real tokens from
synthetics. Ful llment is fully insured and shipped via FedEx through JM
Bullion. Support stack includes Intercom, card issuing, and KYC
integrations.

Line Item

Setup (USD)

Frontend build (React/Next.js/ RN) Backend build (Node/Go/ Python)
Hosting & core infra (AWS/ GCP) TradingView license

Monthly (USD)

100,000 –

–

150,000 –

–

5,000

4,000

–

833

Plaid (per KYC) –

500

Stripe

–

–

fi

fi

fl

fi

Custody partner (Anchorage/ – – PrimeTrust) PAXG 100,000 – integration
USDC integration 3,000 – (Circle) Reserve inventory 250,000–500,000 –
(working capital)

fi

Annual (USD)

– – –

Notes

Trading UI + wallet + Shop/ Realize ows API, ledger, trading engine, ops
RDS, Redis, 48,000 autoscaling, backups Charts & price feeds (enterprise
10,000 license placeholder) Per-user 6,000 veri cation Variable: 2.9% +
\$0.30/txn (COGS) Regulated USD/ USDC/PAXG custody Paxos API + smart
routing

–

Treasury ops, payouts

–

For fast IOU ful llment

Setup (USD)

Monthly (USD)

Annual (USD)

Notes

JM Bullion API

–

–

–

Per-order markup (COGS)

FedEx API

–

–

–

Usage (COGS)

Intercom/ Zendesk

–

1,000

Datadog/SIEM

–

500

Vanta/Drata

–

500

Card program (Marqeta/ Galileo) SMS/Email (Twilio/ – SendGrid) Cloud
are/CDN/ – WAF

10,000

12,000 Support center Logs, metrics, security SOC2/PCI 6,000 readiness
6,000

3,000

36,000

+\$1–3 per card (variable)

650

7,800

OTP + noti cations

150

Direct- ll button

5,000 –

Pen-test (annual)

15,000 –

Legal (startup + policies)

25,000 –

Performance + security Provider + admin hooks Pre-launch 15,000 security
test ToS/PP, vendor MSAs 1,800

–

–

Phase 1 Totals

•Setup (USD): \$338,000 + \$250,000–\$500,000 working capital (Possible
UX/AI Savings) •Monthly (USD): \$11,433 •Annual (USD): \$148,800

Phase 1 Takeaway

\$338k xed setup + \$250–500k working-capital reserve (USD/USDC/PAXG) +
~\$11.4k/month xed OPEX. Vaulting/storage costs deferred to Phase 3 by
using custodians only for USD/ USDC/PAXG and internal synthetics for
other metals.

Phase 1 Break-Even Path

fi

fi

fl

•Estimated Setup + Year 1 Ops: \$0.9M ~\$1.35M •Average Revenue per User
(ARPU): ~\$150 from trading fees (assumes \$25k avg. annual trading
volume per user @ 0.6% blended take rate) ~\$50 from spreads + small
custody margin •Total ARPU ≈ \$200/year •Break-even users: ~\$1.35M ÷
\$200 ARPU ≈ 6,750 active customers

fi

fi

Line Item

•Exhibit at Bitcoin Conference - budget \$10K–\$30K for booth, speaker
fees travel. O er \$5 PAXG bonus for sign-ups and \$10 gold-back on rst
deposit to drive early adoption. Add \$10 PAXG for direct deposit
setup.Up to limited quantity of 20k PAXG, 10k in Goldbacks. •Leverage
Crypto Banter and similar channels for initial push, potential to
onboard 2,000–3,000 users in rst 90 days (Testing). •Target crypto
traders and gold/silver retail investors via YouTube/Twitter nance
spaces; goal: 1,000 new users/month. •Bonus pool: \$10 PAXG for rst
5,000 accounts to create urgency(including conference). •Use pooled
liquidity + regulated custody (Anchorage or Prime Trust) to deliver a
bank-like UX from day one, reducing churn.

Projected Break-Even Timeline

6–9 months post-launch with aggressive marketing and partnerships. First
3 months focus on high-value pools (precious metals buyers, FX traders,
and crypto investors).

Phase 3 —Own Everything In-House (12–18 months) Scope:

This phase migrates ful llment and custody from retail partners to
institutional vaulting. PBCEx will use Brinks and bonded warehouses
(including the Memphis FedEx hub, Zurich/London, and Singapore Freeport)
to lower costs on shipments, and faster global coverage. As order ow
scales, we will transition into PBCEx owned vaults, eliminating
third-party storage margins and further compressing ful llment times. In
parallel, Phase 3 delivers full tokenization infrastructure of 25
commodities with Large Limit Indicator and Direct Fill. It also
introduces Layer-2 settlement. Together, this allows PBCEx to operate as
a true exchange with complete custody, logistics, and token issuance
in-house.

ff

fi

fi

fi

fi

fi

Aggregate Summary Components 1-5 (Phase 3) Jurisdiction/ Est. One-Time
Component Purpose Compliance Est. Annual Cost Cost Unlocked Nationwide
U.S. 50-State MTL + money All 50 states + \$5M–\$7M (legal ~\$1.5M
renewals/ DC transmission/ DC + bonding) audits custody EU-wide crypto/
EU MICA 27 EU member asset service \$500k–\$1M ~\$200k License (EU)
states license

fi

fl

Fast Acquisition Plan

Component USMCA for NA trade/customs; Brazil Law 14,478/2022; Mexico
Fintech Law/NAFTA Trade Compliance

Est. Annual Cost

Legal crossborder North America commodity trade metals & goods (U.S.,
Canada, export/import Mexico)

\$100k–\$250k

~\$50k

Global — independent of Ethereum/BTC fees

\$1M–\$2.5M

~\$300k maintain

Own settlement Layer-2 network for Blockchain Build tokenized assets

Tokenization Infrastructure

Vaulting Facilities In-House KYC/ KYB System Banking Partnerships

API Ecosystem

Jurisdiction/ Compliance Unlocked

Est. One-Time Cost

Purpose

Smart contracts, audits, custody linkage for 25 top Global —
commodities. compliant RWA \$250k–\$500k Large Limit issuance Indicator
& Direct Fill Own secure U.S. + global with storage for gold, bonded
\$2M–\$4M setup silver, copper, oil warehouse certi cates partners Avoid
per-check Global user \$200k–\$400k Plaid fees onboarding FX, settlement
accounts, cross- Global \$50k–\$150k border wires Direct integrations
with major freight, Global \$150k–\$300k payment, and card networks

~\$100k

~\$500k ops/ insurance ~\$50k maintain Banking spreads only

\$50k maintain

Total Phase 3 Setup Cost: \$9.25M – \$16.1M Total Annual Ops Cost:
\$2.6M – \$3.2M Phase 3 – Break-Even Path

fi

•Estimated Setup + Year 1 Ops: ~\$14.5M (midpoint of \$9.25M–\$16.1M
setup + \$2.75M– \$3.75M ops) •Average Revenue per User (ARPU):

•Full spread capture on metals, FX, and crypto = \$500/year retail.
•Institutional L2 settlement & vault leasing revenue ≈ \$1,000/year
(averaged across base). •Weighted ARPU ≈ \$600/year. •Break-even Users:
•\$14.5M ÷ \$600 = ~24,200 active customers globally.

Acquisition Strategy

•Provider- rst marketplace. PBCEx o ers miners, re ners, and national
producers a direct plug-in to global liquidity: automated demand, bonded
storage, insured ful llment, and auditable settlement. We handle rails;
providers focus on supply. •On-the-ground sourcing. We’ll y to key hubs
(China mainland/HK, Singapore Freeport, Zurich/London vault clusters,
Dubai/JAFZA) to strike direct supply agreements. Where strategic, PBCEx
pre-buys inventory into bonded warehouses so trading can start
immediately without export/VAT friction. •Make suppliers into market
makers. Suppliers can quote two-sided prices on PBCEx (tight spreads,
inventory rebates, fee discounts). For thin markets, PBCEx seeds initial
inventory, then invites suppliers to co-market-make with transparent
rules and hedging support. •Industrial buyer pipeline. Outbound sales
team targets large end-users (electronics, EV/ battery, aerospace,
chemicals). RFQs and a Phase-3 Large-Limit Board support group buys and
“Direct Fill” at scale. •Tokenization path. Start with synthetic
exposure + custody hedges; graduate suppliers to PBCEx-issued,
1:1-audited tokens (Phase-3) with Chainlink/TradingView oracles and
proof-ofreserves. •Compliance & resilience. KYC/KYB every supplier,
sanctions/export-control screening, LBMA/ LME/COMEX alignment where
applicable. If supply tightens, PBCEx can freeze new buys while honoring
redemptions and re lling bonded stock. •Break-even timeline. 12–18
months at global scale, faster if institutional vault clients commit
early.

Investor Angle: Scaling Impact •Phase 1: Low-cost, fast launch, early
traction → 6–9 month breakeven. •Phase 2: Institutional credibility +
higher ARPU → bigger deals, fewer customers needed. •Phase 3: Full
control =95% product spread capture (net after rails)

Revenue Boost Potential

•Retain - majority of spread by bringing payment L2 in-house, though
external rails still take a portion. Full spread capture occurs in Phase
4. •No 3rd-party custody fees — all custody fees ow to PBCEx. •New L2
revenue — external participants could pay to settle on your chain.
•Vaulting revenue — lease vault space to other institutions. Phase 3 is
expensive upfront (\$10M+), but it positions PBCEx like Coinbase +
Paxos + Dillon Gage combined, capturing all revenue layers, custody,
spreads, issuance, and storage. The cost savings alone (\$15M+/year at
scale) means breakeven could come in ~1–2 years at moderate transaction
volume, after which margins explode.

Extended Phase 3 Road Map

fi

fi

fl

ff

fl

fi

fi

Scope:

Key Components to Cost Out:

1.State-by-State Money Transmitter Licenses (MTLs) 2.Tokenization
Infrastructure (per commodity token + chain) Large Limit Indicator/
Direct ll. 3.Vaulting & Insurance for physical assets 4.Compliance:
NIST, EU MICA, CISA/USMCA for NA trade/customs; Brazil Law 14,478/2022;
Mexico Fintech Law (imports/exports), cyber standards. 5.Layer-2 or
custom blockchain infrastructure (optional) 6.Regulatory costs (legal,
audits, background checks) 7.Infrastructure enhancements (matching
engine, custody systems, real-timetrading) 8.Full operations — including
insurance, audits, branches, logistics

1.  MONEY TRANSMITTER LICENSE (MTL) NETWORK (50 STATES + DC) Item

Estimate

Notes

Application fees

~\$2k average × 51 = \$100k

Varies by state

Surety bonds

\$100k–\$1M each; assume \$200k avg bond

Total coverage ~\$10M

Bond premiums

2% avg → \$200k/year

Annual

Legal & compliance prep

\$500k

Docs, lings, bond management

Background checks, ngerprints

~\$200 × 5 execs × 51 = \$51k

Renewal every few years

Annual renewals + exams

~\$500/state = \$25k/year

Ongoing

Total Setup for MTLs: ~ \$850k + bond capital Annual OPEX for MTLs: ~
\$225k/year

Excluding bond reserves Fees + premiums + renewals

2.  TOKENIZATION INFRASTRUCTURE & COMPLIANCE PER COMMODITY

Smart contract dev + audits

Estimate \$50k per commodity

Notes Security audits each (~\$10k each)

fi

tem

fi

fi

Phase 3 expands PBCEx beyond gold, silver, copper, platinum, and
palladium into strategic assets such as lithium, cobalt, tungsten, and
rhodium via bonded OTC sourcing and provider integration. Custody and
token issuance move fully in-house, supported by bonded warehouses for
global settlement. This eliminates reliance on third-party custodians,
creates auditable reserves and insured storage, and delivers
institutional-grade infrastructure that can scale across 25+
commodities.

Token issuance platform: PBCEx-owned issuance system with bonded
warehouse integration (Brinks, MalcaAmit, Dillon Gage). Covers

\$500k

Shared across commodities

\$250k

Legal + tech integration per commodity

\$500k

NIST SP800 53/FISMA baseline

\$200k/year

Physical and cyber coverage

transition from synthetics to fully vaulted PBCEx issued tokens with
Large Limit Indicator / Direct Fill. Compliance ( EU MICA, USMCA for NA
trade/ customs; Brazil Law 14,478/2022; Mexico Fintech Law,
export/import) Cybersecurity/hardware vaulting Full insurance (vaulted
metal, tech risk) Total Setup for 25 Commodities: ~\$2.5M + \$950k
compliance/vaulting

Scaled build

Annual OPEX (insurance/compliance): ~\$350k/year 3. CUSTOM BLOCKCHAIN OR
LAYER-2 INFRASTRUCTURE (OPTIONAL)

Item

Estimate

Notes

Full L2 or sidechain build

\$5M

Team, dev, validators, security

Validators or nodes ops

\$50k/month

Hosting + ops

L2 security audits

\$200k

Critical path

L2 Total Setup: ~\$5.2M

Optional; increases autonomy

L2 Annual OPEX: \$600k

Hosting + security updates

4.  VAULTING, LOGISTICS & FULFILLMENT INFRASTRUCTURE

‑

Item

Estimate

Notes

Private vault construction Logistics + Maersk-scale freight integration
Insurance (vault contents + transport)

\$2M

Secure facilities across regions

\$250k

Global supply chain systems

\$500k/year

High-value commodities

“Option to pre-buy large rare commodities (holmium, New Markets

europium, thulium) into bonded warehouses to create tradable markets
where no liquid exchange exists.”

Setup: ~\$2.25M

Vault + systems

Annual OPEX: \$500k

Insurance & operations

5.  REGULATORY & OPERATIONAL BACKBONE Item SOC 1/2 audits, penetration
    testing Cybersecurity (SOC 2, NIST level) Banking relationships
    compliance (RMLO, capital req.)

Estimate

Notes

\$200k/year

Full compliance readiness

\$250k/year

Staff, tooling, monitoring

\$500k/year

Operational compliance

Legal staff + licensing upkeep \$300k/year

Internal counsel

OPEX Total (Regulatory Backing): ~\$1.25M/year

GLOBAL COMPLIANCE & SAVINGS UNLOCKED BY PHASE 3

fi

Region

Compliance Coverage

USA

All states/DC under own MTLs

EU

EU MICA passporting

North America

USMCA for NA trade/ customs; Brazil Law 14,478/2022; Mexico Fintech
Law/NAFTA trade

Notes No third-party custodians; direct crypto+ at custody List and
trade tokenized metals, FX, crypto Ship/import/export commodities with
minimal friction

APAC

Case-by-case licensing

Middle East/Africa

Partnership entry

Global Settlements

Own L2 + SWIFT/FX access

Certain markets (Singapore, HK, Japan) fast to license with existing
compliance Can operate if paired with regional banking partner Speed +
cost control for trades and withdrawals PBCEx can freeze new buys if
supply chain breaks, while

Global Ops / Resilience

Supply chain + inventory safeguards

honoring redemptions and re lling bonded stock. Provides resilience
against shocks while maintaining customer trust.

COST SAVINGS PER CUSTOMER (ANNUALIZED) Expense Avoided

Typical Cost/User

Annual Savings @ 50k Users

IF FIREBLOCKS Custody

~\$3/user/mo

\$1.8M

IF ANCHORAGE Custody

~\$5/user/mo

\$3M

Paxos PAXG Spreads

~\$1–\$3/trade

\$2.4M–\$7.2M

Plaid KYC

\$2.50 per user

\$125k

Metal Vendor Margins

1%–2%

\$10M+ (on \$500M metals volume)

FX Spread Sharing

10–20 bps shared

\$2M+

Phase 4 — Custom L1 settlement layer with three specialized L2s Scope:

fi

Why Phase 4 is Necessary in a Fast-Growth Path ? As user adoption
scales, transaction volumes will eventually push the limits of current
settlement layers. At that point, owning a purpose-built L1 with three
specialized L2s becomes essential to maintain speed, cost control, and
predictable scaling. This is not an experiment, it’s a calculated,
second-mover advantage. We’re following proven high-throughput models
that already work at global scale, adapting them directly to PBCEx’s
needs. That means no wasted R&D cycles, no reinvention, and minimal
execution risk. We know exactly what to build, how to build it, and how
it directly drives revenue across payments, logistics, and bonds, making
Phase 4 a strategic upgrade, not a speculative leap. We will implement
proven modules (consensus, networking, bridging) and audit heavily
before cutover. This ensures investor

capital goes toward proven, revenue-linked scaling steps rather than
speculative tech development.

Throughput / Cost Triggers PBCEx will only invest in building a custom
L1 when external settlement layers become too costly or congested.
1.Cost Threshold: If average settlement fees on external L1s exceed
\$0.02 per transaction for 30 consecutive days, indicating rising costs
for high volume settlement. 2.Volume Threshold: If PBCEx processes more
than 100,000 daily transactions (≈100K+ active users trading or
redeeming daily), sustaining this level for 14 days. 3.Capacity
Threshold: If blockspace utilization on external rails exceeds 60% for
two weeks, meaning network congestion could cause delays or price
slippage.

Line Item L1 Blockchain Development L2 – Payments Settlement L2 –
Logistics & Escrow Settlement

Setup (USD)

Monthly (USD)

Annual (USD)

7,500,000 —

—

2,000,000 —

—

2,000,000 —

—

Notes Purpose-built for PBCEx, modeled on proven high-TPS chains
Eliminates third-party payment rails Handles freight, RWA custody,
automated BoL Tokenized bonds & lending settlement. Note: Per deal
issuance costs (legal, trustee, transfer agent,

L2 – Bonds & Financing Layer

1,500,000 —

DTC, optional ratings) remain per

—

bond: \$255k–\$660k one time + 5% risk retention and 1–3% underwriting;
ongoing ~\$90k–\$250k/yr for trustee/ TA/reporting. See Bond Program
plan.

‑

‑

‑

Validator / Node Infrastructure Security Audits (3 rounds) Tokenization
Engine Integration (native)

1,500,000

150,000

1,800,000

Includes global node network + redundancy

750,000 —

—

External code audits

750,000 —

—

Direct on-chain asset tokenization

Line Item

Setup (USD)

Monthly (USD)

500,000

50,000

Institutional Gateway / Custody API Governance & Compliance Module SOC2
/ ISO27001 Compliance

500,000 —

Annual (USD)

Notes

600,000 Institutional & OTC onboarding KYC, AML, MTL integration for all
nodes

—

250,000 —

250,000 Annual renewals

Phase 4 Totals (excl. state MTLs & partner nodes):

Setup: \$17,250,000 Monthly: \$200,000 Annual: \$2,650,000

Phase 4 — Break-Even Path

•Estimated Setup + Year 1 Ops: ~\$20M (including setup + rst-year
operations) •Annual Savings: ~\$15M+ by replacing all third-party
settlement rails (payments, freight, bond markets) and monetizing every
transaction. •Throughput Target: High‑throughput, sub‑second nality
architecture with headroom for millions of daily transactions and
10k–100k TPS bursts; capacity scales horizontally with additional
validators growth without future migrations. •Execution Advantage:
Purpose-built for PBCEx’s known business model, leveraging secondmover
advantage to avoid R&D risks — fast deployment using proven
architectures. •Break-even Users: Occur with current transaction
projections at 150K–250K high-value users (active in payments,
logistics, and bonds) to recover cost in ~12 months. •Growth Trigger:
Activated in Fast Growth Phase 4 Protocol scenario — when user base
accelerates past 100K+ with high throughput demands, making L1 migration
a necessity for scale and fee elimination.

PBCEx - Three Phase Growth Plan – Costs & Capabilities Table 1 – Core
Phase Financials Phase

Setup Cost (Est.)

Annual Ops Cost (Est.)

Duration to Launch

Break-even Time

\$0.5M – \$0.9M

0–6 months

6–9 months (7k users)

2 – (Removed unless needed)

—

—

—

fi

—

fi

1 – MVP Launch \$0.8M – \$1.5M

fi

Phase

Setup Cost (Est.)

Annual Ops Cost (Est.)

Duration to Launch

Break-even Time

22K users triggers 3– savings of 12 -18 months (or Infrastructure
~\$15M/year; \$9.25M – \$16.1M \$2.75M – \$3.75M sooner in fast Control
(Own break-even ~12– track) Everything) 18 months after launch 150K–250K
high4 – Phase 4 value users; or 12–18 months Protocol (L1 + 3 \$15M –
\$25M \$2.65M – \$3.5M throughput-driven (post-Phase 3) L2s) upgrade;
breakeven ~12 months Table 2 – Capabilities, Milestones & Revenue
Potential Phas Revenue & Savings Key Capabilities Gained Key Milestones
e Potential Web & mobile app, Anchorage custody, Trading fees on metals,
pooled liquidity, tokenized gold/silver, MVP live, partnerships FX,
crypto; bank-like 1 at rails, basic KYC/AML, charting, signed, tokenized
UX; early large-client order blocks, FedEx API, customer metals trading
active onboarding service platform (Removed unless needed – branch ops,
2 — — freight integration, extra RWA feeds) Retains the full spread on
payment and FX transactions, with Global compliance, own L2 blockchain,
Global compliance partial retention on tokenization infra for 25
commodities, achieved, own L2 live, 3 other services until vaulting &
insurance, in-house KYC/ vault/tokenize top 25 Phase 4. \$15M+/yr in
KYB, direct bank partnerships commodities vendor & custody fees; new
L2/vault revenue; global scale Eliminate all settlement fees;
Purpose-built L1 with 3 integrated L2s L1 + 3 L2s live; monetize every
tx (payments, logistics, bonds), full 4 seamless migration across
payments/ settlement control, throughput capacity from Phase 3 infra
logistics/bonds; in millions of tx/day maximum scalability; predictable
costs

Tax Strategy Tax-E cient Structure – Cap Table & Strategy (Three-Point
Architecture) Optional Strategy: We operate a three-point structure
designed for tax e ciency, IP protection, and global scalability:
1.Delaware C-Corp (HoldCo) – Investor-facing entity for equity issuance,
QSBS eligibility, and corporate governance. This is the primary vehicle
for VC, YC, and institutional capital. 2.Wyoming IP/Operating Co – Owns
all trademarks, software code, platform architecture, patents, and
franchise rights. All royalties, tech fees, and licensing payments from
franchisees and online customers ow here. Wyoming has zero state
corporate income tax, protecting pro ts and keeping IP insulated from
operational risk. 3.Texas Operating HQ (C-Suite + Programming Division)
– Executive team and programmers physically based in Texas for low cost
of living and no state income tax on personal earnings. The Texas entity
does not own IP; it simply provides operational and development services
under contract from the Wyoming entity. This triangular architecture
ensures maximum after-tax returns, keeps ownership and IP secure, and
provides a clean separation between investor entity, IP holder, and
operational headquarters. It also scales e ciently for global licensing.

Phase Integration

•Phase 1: Incorporate Delaware C-Corp, form Wyoming IP entity, establish
Texas operating presence, execute intercompany agreements. •Phase 2:
Expand U.S. franchise network; Wyoming collects royalties; Texas
operates core dev and exec teams. •Phase 3: Add o shore IP entity for
non-U.S. royalties; maintain U.S. structure for domestic revenues.

Tax Advantage

Why It Matters

Investor-friendly

Delaware is the VC/YC standard; clean governance and equity issuance.

State tax-ef cient

Royalties & service income ow to zero-tax Wyoming.

Scalable

Easy to add offshore IP arm for non-U.S. royalties later.

Operational clarity

Clear separation between investor entity, IP holder, and ops HQ.

ffi

Core IP isolated in Wyoming, insulated from operational liabilities.

ffi

IP protection

fl

Up to \$10M+ federal capital gains exclusion per holder.

fl

QSBS potential

ff

fi

ffi

fi

No personal state tax Texas HQ means executives/programmers pay no state
income tax.

Cap Table Shareholder / Allocation

Percent

YC + Seed Investors

10%

Option Pool Pre Money (Key Hires)

15%

Strategic Partner/Advisor

3%

Series A

10%

M&A / Acquisition Pool

10%

Founder

52%

Total

100%

Ownership, Valuation & Scaling

Our cap table preserves strong founder control (52%) while allocating a
pre-money option pool (15%) for key hires and 10% for M&A/strategic
partnerships. This structure ensures exibility to attract senior talent,
raise growth capital, and pursue targeted acquisitions. To justify a
\$200M valuation for Series A Phase 3/4, we anchor to ARPU and user
growth: •Phase 1 ARPU: ~\$200/user/year → ~100,000 users required •Phase
3 ARPU: ~\$600/user/year → ~33,000 users required •Phase 4 ARPU:
~\$1,000+/user/year → ~20,000 users required At Phase 3 levels (~\$600
ARPU), PBCEx requires ~33,000 active customers to reach \$20M ARR, which
at a 10× multiple supports a \$200M valuation. This aligns directly with
our plan to raise \$20M for 10% to fund Phase 3 and the transition
toward Phase 4. Beyond organic growth, we’ve reserved 10% of equity for
strategic M&A and bank integration partnerships. This optionality
provides a pre-approved “currency” for roll-ups or embedding PBCEx rails
directly into nancial institutions, a scaling lever that can accelerate
licensing access, branch footprint, and user acquisition globally.

Closing Note – Capital-Efficient Inventory & Hedging Development costs
for Phase 1 MVP - including frontend, backend, integrations, hosting,
and support features - total ~\$338,000, excluding the working capital
reserve for inventory. Instead of committing the full \$250k–\$500k
upfront for PAXG, USDC, crypto, and FX tokens, PBCEx will run a dual
strategy: 1.Rolling OTC Acquisition: Assets are purchased just-in-time
via reputable OTC desks (Cumberland DRW, Genesis OTC, Kraken OTC, Dillon
Gage, APMEX) to secure institutional pricing, reduce slippage, and
minimize idle capital.

fl

fi

2.Synthetic + Hedge Layer: PBCEx synthetic tokens (XAU-s, XAG-s, XPT-s,
XPD-s, XCU-s) are issued internally for trading, backed by automated
hedging once exposure passes set

thresholds. Hedging is executed with unallocated metal accounts or ETFs,
and with no leverage ensuring liabilities remain fully covered while
keeping custody/storage costs near zero until Phase 3 vaulting.

fi

ffi

This approach applies through Phases 1–3–4, even as more assets are
brought on-chain. Phase 1 is lean and capital-light; Phase 3 adds bonded
vaults and tokenization of up to 25 commodities; Phase 4 migrates
settlement to PBCEx’s custom L1 with specialized L2s. The result is a
consistent, capital-e cient model that scales with user demand,
preserves liquidity, and ensures risk-neutral order ful llment at every
growth stage.


