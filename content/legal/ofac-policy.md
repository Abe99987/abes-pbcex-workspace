# **PBCEx, Inc. — OFAC Sanctions Compliance Policy**

---

## **Sanctions Policy Summary**

- **Commitment to Compliance.** PBCEx, Inc. is fully committed to complying with all U.S. economic sanctions laws. We have implemented a comprehensive sanctions compliance program to ensure we do not engage in any transactions with sanctioned persons, entities, or jurisdictions. This public-facing policy outlines how we adhere to U.S. Treasury’s Office of Foreign Assets Control (OFAC) requirements in our daily operations.

- **Scope of Coverage.** We do not provide services to individuals or entities on OFAC’s Specially Designated Nationals and Blocked Persons (SDN) List, nor to those owned 50% or more by such blocked parties. We also prohibit access from or on behalf of comprehensively sanctioned countries/regions (including Cuba, Iran, North Korea, Syria, and the Crimea/DNR/LNR regions of Ukraine). Robust measures (e.g., identity verification, IP address geolocation blocking, VPN/proxy detection) are in place to geofence these jurisdictions and prevent evasion attempts.

- **Integrated Controls.** Sanctions screening is embedded into PBCEx’s technology and user flows from day one. All users must undergo Know Your Customer (KYC) identity verification at signup, which includes checks against OFAC sanctions lists and other watchlists. We employ advanced blockchain analytics to screen cryptocurrency transactions for any association with illicit actors or sanctioned wallet addresses. Deposits or withdrawals involving flagged addresses (for example, wallets linked to sanctioned hackers or mixers such as Tornado Cash) are paused for review or blocked. We similarly screen fiat payment flows via our banking partners and monitor physical asset shipments for compliance.

- **Ongoing Vigilance.** PBCEx management actively supports a culture of compliance. We regularly train our staff on sanctions obligations and the latest regulations. Our compliance team performs ongoing risk assessments and testing of controls, and we engage independent audits to verify the program’s effectiveness. Any potential sanctions issue is escalated promptly and, if required, reported to OFAC through the mandated electronic reporting system. We maintain detailed records of all transactions and sanctions compliance actions for **at least ten (10) years** in line with current U.S. regulations.

- **Continuous Improvement.** We closely follow updates to sanctions laws and OFAC guidance specific to crypto and digital assets. Our policy is a living document that is updated as needed (for example, to incorporate rule changes on 10-year record retention and mandatory OFAC Reporting System (ORS) e-filing). By proactively addressing emerging risks—from cryptocurrency mixers to VPN abuse—PBCEx ensures that our platform remains fully compliant, secure, and trusted by our customers, partners, and regulators.

---

## **Management Commitment**

**Tone at the Top.** PBCEx’s leadership is unequivocally committed to sanctions compliance as a core element of our business. The company’s founders and senior management have built compliance into the platform’s DNA from the outset, recognizing that a robust sanctions compliance program (SCP) is essential to our long-term success and credibility. This policy is formally approved by the CEO and supported by our Board, signaling top-level commitment to a culture of compliance.

**Resourcing and Responsibility.** Management has allocated appropriate resources to develop, implement, and enforce this Sanctions Compliance Policy. A dedicated Compliance Officer (and team) is responsible for sanctions oversight and reports directly to senior management. This Officer has the authority to escalate issues to the CEO and Board, and to halt or reject any transaction or business engagement that poses a sanctions risk. PBCEx’s leadership ensures compliance staff have the autonomy and budget needed to acquire screening tools, obtain training, and engage external legal counsel for sanctions matters when necessary.

**Integrated Business Processes.** Senior management has woven sanctions considerations into all business decisions and product features. Before launching new products or entering new markets, management requires a sanctions risk review. Strategic partnerships with regulated custodians and payment providers were chosen in part for their strong compliance posture. PBCEx actively oversees and coordinates with partners on sanctions controls.

**Culture and Accountability.** PBCEx’s leadership fosters a company culture where sanctions compliance is everyone’s responsibility. There is zero tolerance for willful violations or “cutting corners” to acquire business in sanctioned markets. Performance evaluations and incentives for key personnel include compliance KPIs (e.g., timely completion of training, absence of significant audit findings). Employees are encouraged to report sanctions-related concerns immediately, without fear of retaliation (whistleblower protection). Disciplinary action, up to termination, may follow any knowing violation.

**Oversight and Review.** Senior management and the Board receive regular reports on the effectiveness of the sanctions compliance program (e.g., potential matches identified, blocked/rejected transactions, training completion, audit results). At least annually, the Board (or its compliance committee) reviews this policy and program performance, directing improvements as needed.

---

## **Risk Assessment**

PBCEx conducts ongoing risk assessments to identify and mitigate the specific sanctions risks arising from our business model, products, customers, and geography. The assessment is reviewed at least annually and upon major business changes.

**Business & Product Risk.**

- **Digital Asset Exchange.** Crypto and tokenized commodity activity may attract sanctioned actors. We assess the risk of SDN or embargoed-jurisdiction access, account opening, trading, or withdrawal.

- **Tokenized Commodities & Physical Redemption.** Risks include shipments or asset delivery to blocked persons or embargoed destinations; we consider export/sanctions controls, 50 Percent Rule issues, and chain-of-custody risks.

- **Bank-like Features.** Fiat on/off ramps and spending features introduce wire/card/ACH sanctions risks; we align controls with AML/BSA requirements and bank-partner obligations.

**Customer Risk.**

- **Location & Nationality.** Phase rollout focuses on permitted jurisdictions; comprehensive geofencing blocks embargoed regions.

- **PEPs/High-Risk Entities.** EDD applies where risk is elevated.

- **Entities & UBOs.** For entities (as enabled), we identify and screen beneficial owners; any ≥50% SDN ownership results in blocking.

**Transactional & Technological Risk.**

- **Crypto.** Address screening and tracing for SDN exposure, mixers/tumblers, darknet markets, and “hop” proximity to illicit sources.

- **Fiat.** Partner screening covers sanctioned banks/regions; PBCEx applies added controls on linking and settlement.

- **Physical Handling.** Screening of recipients/addresses; proxy and freight-forwarder risk control; vendor coordination for sanctions-safe fulfillment.

**Geographic Risk.**

- **Access Controls.** IP geoblocking, device/location monitoring, and VPN/proxy detection prevent/surface prohibited access.

- **Expansion Readiness.** Local sanctions regimes (EU/UK/UAE, etc.) are integrated before serving those markets.

**Evolving Landscape.**

- **List/Program Changes.** Rapid ingestion of new designations, sectoral sanctions, and SDN crypto addresses; immediate impact analysis and control updates.

- **Industry Lessons.** Incorporation of enforcement “lessons learned” to prevent known failure modes.

---

## **Internal Controls**

PBCEx maintains policies, procedures, and technical measures to identify, interdict, escalate, report, and record any activity prohibited by OFAC sanctions. Key controls include:

### **Policies & Procedures**

- Written policy and detailed SOPs/playbooks for onboarding screening, potential match handling, crypto/fiat screening, physical fulfillment screening, and response to confirmed hits (freeze, block, report).

- Rapid updates following sanctions program changes or internal/external testing results.

- Clear escalation chains and audit trails; deviations require Compliance approval.

### **KYC & Sanctions Screening**

- **Onboarding KYC.** Legal name, DOB, address, government ID, selfie/liveness, phone/email verification; SSN/Tax ID for U.S. persons.

- **Name Screening.** SDN and Consolidated Lists at onboarding and continuously; fuzzy matching and alias/transliteration logic; compliance-only clearance of potential matches; documentation retained ≥10 years.

- **UBO Screening.** For entities (as enabled), ≥50% ownership aggregation enforced.

- **Geolocation Controls.** Proof-of-address checks; IP and device geofencing (sanctioned-region IPs blocked); VPN/proxy detection; improbable travel locks; continuous updates for new embargoes.

- **Ongoing Screening.** Automated re-screening on list updates; quarterly full scans; behavior-based escalation for refresh.

### **Transaction & Wallet Screening (Crypto & Fiat)**

- **Blockchain Analytics.**
  - **Inbound.** Trace deposits for SDN exposure; direct Tornado Cash/other sanctioned addresses → reject/freeze; short-hop proximity triggers enhanced review; long-hop de minimis exposure handled via risk-based approach.

  - **Outbound.** Destination screening; blacklist enforcement; auto-reject to prohibited addresses; freeze/report attempted prohibited transfers.

  - **Address Hygiene.** Unique deposit addressing; non-reuse; clustering analysis; never reassign addresses linked to blocked persons.

- **Fiat Channels.** Partner screening (Stripe/Plaid/BaaS bank) plus PBCEx linkage controls; name/account consistency checks.

### **Monitoring & Behavioral Analytics**

- Risk scoring; structuring/in-out layering; abnormal counterparties; device/IP overlaps; travel anomalies; cross-asset obfuscation; collusion patterns; immediate escalation and case management.

### **Ledger & Technical Controls**

- Freeze at Funding/Trading layers; block conversions/redemptions for flagged users; global circuit breakers; privileged actions restricted (MFA/admin approvals); multi-signature on large withdrawals.

### **Vendor & Partner Controls**

- **Anchorage (Custody).** OFAC-program alignment; joint freeze/escalation process; annual diligence and certifications.

- **Paxos (PAXG).** NYDFS-regulated; redemption coordination and immobilization of blocked property when required.

- **Stripe/Plaid/BaaS.** OFAC compliance embedded; reciprocal alerting and remediation.

- **JM Bullion/Dillon Gage (Fulfillment).** Domestic shipping only (current model); name/address screening by PBCEx; no third-party pickups; high-value reconfirmation; known freight-forwarder suppression; export-control readiness for future international shipments.

- **Cloud/Communications.** Sanctions screening of vendors; data residency constraints; alerts on anomalous geo access.

### **Recordkeeping**

- **Retention.** All sanctions-relevant records (screening logs, alerts, investigations, filings, communications, analytics, ledgers) retained **≥10 years**.

- **Security.** Role-based access; encryption at rest/in transit; immutable logs; legal holds honored.

---

## **Testing and Auditing**

**Internal Testing & Self-Audits.**

- Monthly QA sampling of onboarding screening; “known-bad” test cases; immediate remediation.

- Crypto lookbacks after new SDN address designations; root-cause analysis for any misses.

- Geolocation control tests (sanctioned-region IPs, VPNs, improbable travel).

- Record retrieval drills to validate 10-year retention and accessibility.

**Independent Audits.**

- Annual external sanctions audit by qualified third parties; scope includes OFAC Framework elements, control effectiveness, reporting compliance (e.g., blocked property reports via ORS), partner integration, and recordkeeping.

- Written findings to senior management/Board; time-bound remediation plans; evidence of closure retained.

- Regulator examinations fully supported; feedback integrated promptly.

**Continuous Improvement.**

- Audit/testing results feed risk assessment, SOP updates, and training enhancements.

- Ad-hoc spot checks triggered by industry enforcement actions or internal incidents.

- Periodic review of OFAC “root causes” and industry best practices.

---

## **Training and Compliance Culture**

**All-Staff Training.**

- Mandatory sanctions training at onboarding and annually; strict-liability awareness; real-world case studies.

**Role-Specific Training.**

- **Support/Onboarding:** ID handling, match-handling scripts, non-tipping communications.

- **Compliance/Analysts:** Advanced OFAC/crypto guidance, tools mastery, 50% rule nuances, ORS filings.

- **Engineering/DevOps:** Access control, data residency, geo controls, compliance-by-design.

- **Franchise/Branch:** In-person KYC and address screening protocols; escalation playbooks.

**Frequency & Updates.**

- Annual refresh minimum; rapid updates on regulatory changes (e.g., ORS e-filing, retention extensions).

- Short memos/newsletters for high-profile changes; knowledge checks/attestations.

**Tracking & Records.**

- Completion logs retained ≥10 years; escalation for overdue training; Board oversight of training KPIs.

**Culture.**

- Open-door Q\&A, scenario workshops, compliance checkpoints in product meetings, monitored compliance channel for questions.

---

## **Reporting a Sanctions Concern**

To report a suspected sanctions issue, blocked property, or to request assistance with accessibility/alternative channels:

**Compliance & Support (Public):** support@pbcex.com

**General Inquiries:** contact@pbcex.com

**Mailing Address:** PBCEx, Inc., 2923 Penn Ave, Pittsburgh, PA 15201, USA

**Toll-Free:** \+1-833-43-PBCEX

(When required, PBCEx files blocked property and rejected transaction reports to OFAC via ORS within the applicable timelines.)

---

## **Conclusion**

PBCEx is committed to maintaining a world-class OFAC Sanctions Compliance Program fully integrated into our operations and technology. By following OFAC’s framework—management commitment, risk assessment, internal controls, testing/auditing, and training—and tailoring these elements to a crypto-tokenized commodities platform, PBCEx enables innovation without compromising sanctions laws. This policy is reviewed regularly and updated for new regulations, guidance, or business activities. Stakeholders can be confident that PBCEx conducts its business with the utmost respect for U.S. and international sanctions, upholding both legal obligations and ethical standards. Compliance is an ongoing commitment, and PBCEx’s management and staff are dedicated to continuous improvement—guarding the platform against misuse and contributing to the broader fight against illicit finance and sanctioned activities.
