**PBCEx, Inc. — Record Retention Schedule**

**Effective date:** September 11, 2025

---

## **Purpose**

This document defines how long PBCEx retains various categories of records and how it deletes or archives them once they are no longer needed. The schedule aligns with key legal requirements (BSA/AML, OFAC, GDPR, CPRA, etc.) and is tailored to PBCEx’s architecture. It reflects best practices in secure recordkeeping (encryption, access controls, audit trails) and automated deletion. By following this schedule, PBCEx can demonstrate to regulators that it retains data only as long as necessary and purges it in a timely, controlled manner.

---

## **Scope**

The schedule covers all data repositories in PBCEx’s system — databases, caches, file storage, logs, backups — and all personal data and business records PBCEx handles. It is organized by jurisdiction and by data category. All time periods are counted from the end of the customer relationship or the date of the record. Deletion jobs run daily, so records are typically erased within 24–72 hours after reaching their scheduled deletion date, unless subject to legal hold.

---

## **Baseline Requirements**

- **BSA/FinCEN:** Most records \= 5 years.

- **Travel Rule:** Transmittals of funds \= 5 years.

- **SARs:** 5 years from filing.

- **CTR/Form 8300:** 5 years from filing.

- **OFAC:** 10 years (effective 2025).

- **NYDFS BitLicense:** 7 years (plus rules for abandoned accounts).

- **CPRA/CCPA:** Disclose retention periods, delete within 45 days (extendable to 90).

- **PCI DSS:** Security logs 12 months total, 3 months “hot.”

---

## **Retention Policies by Data Category**

### **Customer Identification (KYC/CIP)**

Includes ID docs, biometrics, addresses, sanctions results, and risk scores. Retained 5 years after account closure (7 years if NY; up to 10 if Swiss). Deleted or anonymized within 30 days after retention end.

_Policy line:_ “We retain verification records for 5–7 years to meet anti-money-laundering laws, then delete or anonymize.”

### **Biometric Data**

Face geometry or liveness data. Destroy once purpose is met, or ≤3 years under Illinois BIPA, ≤1 year under Texas CUBI. Deleted within 30 days.

_Policy line:_ “If we collect biometrics, we keep them no longer than legally permitted (often 1–3 years) and then delete.”

### **Transaction & Ledger Records**

Orders, trades, balances, wallets, custody statements. Retain 5 years (7 in NY; 10 in Switzerland). Deleted or anonymized within 60 days.

_Policy line:_ “We keep transaction and balance records for 5–7 years for compliance.”

### **Travel Rule Messages**

Name, address, account identifiers, originator/beneficiary info. 5 years, then delete within 30 days.

_Policy line:_ “We retain required transfer information for 5 years, then delete.”

### **Suspicious Activity Reports (SARs)**

SAR forms, narratives, workpapers, supporting docs. 5 years from filing, delete within 30 days.

_Policy line:_ “We retain suspicious activity reports and supporting files for 5 years.”

### **Currency Transaction Reports / Form 8300**

CTR copies and IRS Form 8300 filings kept 5 years from filing, then deleted.

_Policy line:_ “We keep federally required cash-report forms for 5 years.”

### **OFAC / Sanctions Records**

Screening logs, blocked property, licenses. 10 years from event, deleted within 60 days.

_Policy line:_ “Sanctions screening and blocked-property records are kept 10 years.”

### **Customer Support Records**

Tickets, attachments, disputes. Retain 5 years baseline, 7 years if AML-related. Deleted within 60 days.

_Policy line:_ “We retain support interactions 5–7 years, then delete.”

### **Email Archives**

Business email retained for 6 years; rolling deletion within 30–60 days after expiry.

_Policy line:_ “Business emails are kept up to 6 years for legal and audit needs.”

### **Security & Application Logs**

Errors, access, API traces, auth events. 12 months total, with 3 months readily accessible. Up to 24 months for critical systems.

_Policy line:_ “We keep security logs \~12 months (3 months readily accessible) for safety and investigations.”

### **Fraud/AML Analytics**

Derived features, device fingerprints, velocity data. Retained 5–7 years, deleted within 60 days.

_Policy line:_ “We retain fraud and AML case data 5–7 years to meet legal duties.”

### **Marketing & Analytics Data**

Campaigns ≤24 months. Suppression lists indefinite (hashed). Analytics/cookies ≤13 months.

_Policy line:_ “We keep marketing preferences as long as needed to honor opt-outs; other marketing data ≤2 years.”

### **Vendor Due Diligence**

Risk reviews, SOC reports. Retained 7 years after termination, deleted within 60 days.

_Policy line:_ “We keep vendor due diligence files 7 years after the relationship ends.”

### **Finance & Tax Records**

Invoices, 1099s, AP/AR data. Retained 7 years, deleted within 60 days.

_Policy line:_ “Financial records are kept up to 7 years for tax and audit compliance.”

### **Unverified Sign-ups**

Partial profiles, failed KYC. Retained ≤12 months (5 years if fraud). Deleted within 30 days.

_Policy line:_ “If you don’t onboard, we purge your sign-up data within \~1 year unless needed for fraud.”

### **Blockchain Address Mapping**

Mapping between user and blockchain addresses. Retained 5 years (7 in NY). Deleted within 60 days.

_Policy line:_ “We keep on-chain attribution for compliance 5–7 years.”

### **Backups**

Routine backups retained for 90 days. Annual compliance archives ≤7 years. Deleted per lifecycle rules.

_Policy line:_ “Backups expire within 90 days; annual compliance archives may last 7 years.”

---

## **Jurisdictional Requirements**

- **U.S. (FinCEN, BSA/AML, OFAC, CPRA):** 5 years baseline; OFAC \= 10 years; CPRA disclosure \+ minimization.

- **EU (GDPR, MiCA):** 5 years AML/MiCA; delete or anonymize afterward.

- **UK:** 5 years minimum; delete afterward.

- **MENA:** 5 years AML retention; stricter deletion under Saudi PDPL.

- **Switzerland:** 10 years for financial records.

- **Singapore:** 5 years under MAS AML; PDPA requires minimization.

- **Canada:** 5 years under FINTRAC.

- **Australia:** 7 years under AUSTRAC.

---

## **Deletion Mechanics & Operational Controls**

- **Deletion triggers:** time-based (retention period ends), event-based (account closure, deletion requests), and legal holds (pause deletions).

- **Backups:** deletions propagate when backups expire (90 days).

- **Anonymization:** used when aggregate stats are needed.

- **Vendor alignment:** contracts require processors to follow PBCEx TTLs and certify deletion.

- **Audit logging:** every deletion event logged with minimal identifiers.

---

## **Privacy Policy Cross-Lines**

- “We keep identity verification and transaction records for 5–7 years to comply with anti-money-laundering and state regulations.”

- “Sanctions-screening records are retained for 10 years.”

- “Security and access logs are retained \~12 months (3 months readily available).”

- “Marketing analytics are retained ≤13 months; email suppression lists indefinitely.”

- “We honor deletion requests within 45 days (extendable to 90\) except where retention is required by law.”

---

## **Implementation Checklist**

- Configure system TTLs (DB: 7 years, Travel Rule store: 5 years, sanctions store: 10 years, logs: 12 months).

- Add retention columns to data inventory and vendor register.

- Link retention schedule in Privacy Policy and Notices at Collection.

- Stand up legal hold workflows.

- Publish biometric destruction policy if applicable.

---

## **Conclusion**

This Record Retention Schedule ensures PBCEx meets or exceeds requirements under BSA/AML, OFAC, GDPR, CPRA, and other global regulations. It balances compliance with user privacy and operational needs. Retention is automated, deletion is secure, and exceptions (like legal holds) are logged. PBCEx will review this policy annually and update as laws or systems change.

---
