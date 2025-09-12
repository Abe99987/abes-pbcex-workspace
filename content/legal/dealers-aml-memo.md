# **PBCEx, Inc. — Dealers in Precious Metals AML Memo (Fulfillment Partners)**

**Effective Date:** September 11, 2025

---

## **Purpose**

This memo defines how PBCEx, Inc. (“PBCEx”)—a crypto exchange offering physical precious-metals redemption through third-party wholesalers—recognizes and operationalizes vendor obligations under **31 CFR Part 1027** (Dealers in Precious Metals, Precious Stones, or Jewels — “DPMS”) and aligns our own **Bank Secrecy Act/Anti-Money Laundering (BSA/AML)** controls with those of our fulfillment partners.

It addresses:

1. Applicability notes under Part 1027 and its interim-rule background.

2. How and when PBCEx may rely on a dealer’s AML program, and the hard limits of that reliance.

3. How PBCEx’s monitoring dovetails with a dealer’s risk program.

4. Critical sanctions and supply-chain risks in vendor diligence.

5. Edge cases that trip fintech startups.

6. Integration into PBCEx’s MVP build and compliance stack.

7. Contractual and oversight requirements for dealer partners.

8. A fast-reference “red flag” library.

9. A structured dealer onboarding questionnaire.

10. Minimal Standard Operating Procedures (SOPs) for PBCEx engineering and ops.

11. Appendices for dealer certifications and regulatory references.

---

## **Context**

**Phase-1 operations:** PBCEx integrates with wholesale bullion dealers for real-time pricing and drop-ship fulfillment, with insured shipping via national carriers. Funding rails include PAXG and selected fiat/crypto rails; physical redemption flows are live in the MVP. PBCEx maintains its own BSA/AML program and does not outsource AML obligations.

---

## **1\) Applicability of Part 1027**

### **Who qualifies as a “dealer”?**

A U.S. person **engaged as a business** in buying and selling covered goods—including gold, silver, and platinum-group metals at ≥500 ppt purity, and finished goods where ≥50% of value derives from such materials—**and** who, in the prior calendar/tax year, both **purchased more than $50,000 and sold more than $50,000** of such goods.

### **Key carve-outs and traps**

- **Retailers:** Only treated as “dealers” for **purchases from non-dealers** over $50k; retail sales do not count toward the threshold.

- **Pawnbrokers:** Excluded for pawn transactions.

- **Industrial users:** Purchases of metals embedded in equipment/machinery are out-of-scope.

- **$50k test:** Count **only** the precious-metal portion of finished goods.

- **Timing:** The AML program obligation begins **six months after becoming a dealer** (rule effective since Jan 2006).

### **AML program requirements for DPMS (31 CFR 1027.210)**

- Written, risk-based program

- Risk assessment (products, customers, geographies)

- Procedures to identify and refuse suspicious transactions

- Designated compliance officer

- Training of relevant staff

- Independent testing of the program

### **Reporting/recordkeeping**

- No **SAR** requirement under the DPMS rule (provisions “reserved”)

- **Form 8300** required for cash \>$10,000 in trade or business (e-file mandate in effect)

- Follow **Part 1010** cross-referenced recordkeeping

**Background:** FinCEN’s 2005 interim final rule set thresholds and clarified scope (silver explicitly included) and was codified in Chapter X without substantive change.

---

## **2\) PBCEx vs Dealer AML Responsibilities**

### **PBCEx (MSB obligations — 31 CFR 1022.210 and 1022.320)**

- Maintain a full AML program (KYC/CIP, sanctions, monitoring, training, independent testing)

- **SAR duty** for suspicious transactions ≥$2,000 “conducted by, at, or through” the exchange

- File SARs even where suspicious triggers arise downstream with the dealer

### **Dealers (DPMS obligations — 31 CFR 1027.210)**

- Maintain a written, risk-based AML program with testing and training

- **No SAR duty** under DPMS rule

- File **Form 8300** when receiving \>$10,000 in cash/covered instruments

- Apply red-flag controls and refuse suspicious transactions

**Bottom line:**

- **PBCEx owns** KYC/CIP, sanctions screening, behavioral monitoring, and **SAR** obligations.

- **Dealers own** DPMS risk controls, product chain-of-custody, shipping/payment anomalies, and **Form 8300** filings.

- Controls must **overlap**; PBCEx **cannot outsource** AML.

---

## **3\) Dovetail Model — Aligning Controls**

### **PBCEx risk data**

Onboarding (documentary/non-documentary KYC), sanctions/PEP screens, IP/device telemetry, asset funding methods, trade velocity/concentration, high-risk geographies, and behavioral patterns.

### **Dealer risk data**

Payment instrument anomalies, inventory validation, shipping/consignee red flags, supplier vetting, third-party payers/wires, mismatched addresses.

### **Operational handshake**

- **Pre-order (PBCEx):** Block high-risk orders before dealer handoff.

- **Order handoff:** Send **minimum necessary PII** plus structured **risk tags** and order identifiers.

- **Dealer shipment checks:** Validate consignee, address, insured vs declared value, and high-risk address types.

- **Feedback loop:** Dealers send **refusal/hold codes** and incident signals; PBCEx triages for **SAR** determination.

- **Information sharing:** Use **314(b)** safe harbor for suspected ML/TF information exchanges between eligible institutions.

---

## **4\) Sanctions & Supply-Chain Gotchas**

- **Russian-origin gold:** Prohibited (e.g., EO 14068). Require supplier attestations and controls.

- **Diamonds (if relevant):** Kimberley Process compliance and evolving G7 origin-transparency rules.

- **Third-country processing risk:** Refining in a non-sanctioned country does **not** cleanse a prohibited origin; require HS code/origin proof and auditable trails.

---

## **5\) Edge Cases & Startup Traps**

- **PBCEx becomes DPMS:** If buying from the public or holding retail inventory \>$50k, PBCEx may itself be DPMS.

- **Retailer scope trap:** Do not accept “retailer-only” AML attestations where wholesale thresholds are met.

- **SAR mismatch:** Dealers don’t file SARs; refusals/holds must escalate into PBCEx’s **SAR queue**.

- **Form 8300 e-file:** Dealers must e-file; confirm procedures and timeliness.

- **Shipping fraud:** Freight forwarders, P.O. boxes, virtual mailboxes, lockers, mismatched consignee—flag and suppress.

- **Foreign wholesalers:** If “engaged in business in the U.S.,” DPMS obligations apply; require U.S.-law addendum and service of process.

---

## **6\) Integration into PBCEx MVP Build**

- **Checkout:** Risk tags and denial codes are first-class fields in the order schema and APIs.

- **KYC/CIP stack:** Provider risk signals (e.g., document mismatch, device anomalies) create **SAR candidates**.

- **Hedging engine:** No metal ships unless AML checks pass **and** hedging coverage is confirmed.

---

## **7\) Contractual Requirements for Dealers**

- Warrant and maintain a written **DPMS AML program** compliant with 31 CFR 1027.210.

- Provide **annual executive certification** and **independent test** summaries.

- Maintain **OFAC/sanctions** compliance; provide **Russian-origin** attestations and supplier documentation.

- Provide **real-time refusal/hold codes** and incident signaling in a structured format (API or secure feed).

- Cooperate under **314(b)** where applicable.

- **Right-to-audit** with remediation **SLAs** and evidence of closure.

- **Form 8300** policies and e-file readiness, including TIN collection and aggregation controls.

**Oversight cadence:** Onboarding review → 90-day check-in → annual certification → deep-dive if refusal/SAR spikes.

---

## **8\) Red-Flag Library (Quick Reference)**

- Large, unusual, or rapid-repeat orders from newly opened accounts

- Crypto-funded purchases flipped quickly to physical delivery or third-party addresses

- Cashier’s checks/money orders **just under** thresholds; aggregation evasion patterns

- Multiple or frequently changing shipping addresses

- Freight-forwarding or virtual mailbox destinations

- Buyer/consignee mismatch; requests to refund to unrelated third parties

- Orders tied to sanctioned geographies, shell entities, or opaque UBOs

---

## **9\) Dealer Onboarding Questionnaire**

**Section A — Thresholds & Program**

1. Confirm dealer status (\>$50k buys and \>$50k sells in prior year); provide supporting financials.

2. Provide current written AML program with management approval page.

3. Identify compliance officer; provide last independent test date, findings, and remediation evidence.

4. Provide training content, frequency, and staff attestation process.

**Section B — Transaction Risk Controls**

5\. Describe customer/supplier vetting, beneficial-owner procedures, and sanctions screening tools.

6\. List accepted payment methods and controls against structuring/third-party payers.

7\. Provide Form 8300 procedures, e-file readiness, and aggregation logic.

8\. Describe shipping/address controls (no-reroute policy, high-risk address suppression, signature/insurance thresholds).

9\. Define real-time order-risk signals and **refusal/hold codes** provided to PBCEx.

**Section C — Sanctions & Origin**

10\. Outline OFAC screening and list management; false-positive clearance process.

11\. Provide Russian-origin gold prohibition controls and supplier attestations.

12\. Provide Kimberley Process procedures (if applicable) and documentary retention.

**Section D — Operations & Incident Handling**

13\. Average fulfillment times, carriers, insurance practices, and loss-claim playbooks.

14\. Buyback policies (public/scrap buys) and KYC for those flows.

15\. Incident reporting/escalation to PBCEx (timelines, contacts, secure channel).

16\. Independent testing/audit cooperation and evidence delivery timelines.

---

## **10\) SOPs for PBCEx Engineering & Operations**

- **Pre-dispatch blocks:** Suppress risky orders prior to dealer API handoff; log rule and evidence.

- **Denial-code pipeline:** Ingest dealer refusal/hold codes; auto-create **SAR review** cases with artifacts.

- **Shipping telemetry:** Persist tracking IDs, scan events, signatures, and discrepancy notes for SAR narratives.

- **Origin attestations:** Store supplier attestations, invoices, HS codes, and origin proofs with the order record.

- **314(b) workflow:** Legal pre-clears counterparties; engineering logs all information exchanges with immutable audit trails.

- **Data retention:** Retain AML evidence per PBCEx’s Record Retention Schedule (e.g., 5–7 years; 10 years for sanctions records).

---

## **Appendix A — Dealer AML Certification (Attach to MSA/SOW)**

**Certification:**

We certify that **\[Dealer Legal Name\]** maintains and will maintain a written AML program compliant with **31 CFR 1027.210**, including risk assessment, procedures to identify/refuse suspicious transactions, a designated compliance officer, training, and independent testing. We will comply with **Form 8300** obligations, screen parties and shipments against **OFAC**, prohibit **Russian-origin gold**, and provide PBCEx with real-time refusal/hold codes, escalation of suspected ML/TF, and **annual AML certifications/test summaries**. We agree to right-to-audit and timely remediation SLAs.

Authorized Signatory: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ Title: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_\_\_\_\_

---

## **Appendix B — Regulatory Sources (Reference)**

- **31 CFR 1027.210** (DPMS AML program requirements)

- **FinCEN Interim Final Rule (2005)** — thresholds/scope (silver included)

- **Form 8300** guidance and e-file mandate

- **31 CFR 1022.210 & 1022.320** (MSB AML & SAR duties)

- **Executive Order 14068** (Russian-origin gold)

- **Kimberley Process** & G7 guidance on diamond origin (if applicable)

- **31 CFR Part 1010** (BSA recordkeeping cross-references)

---
