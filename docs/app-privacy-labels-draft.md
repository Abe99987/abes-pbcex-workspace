# App Privacy Labels Draft - PBCEx iOS App

## Overview

This document outlines the privacy labels required for the PBCEx iOS app submission to the Apple App Store, based on current data collection practices and planned iOS wrapper functionality.

## Data Collection Summary (MVP Baseline)

For the initial iOS wrapper MVP, we will declare **Data Not Collected** in App Store Connect. All data collection toggles are OFF by default. Future phases may enable optional services below.

| Data Category           | Examples               | Current State                      |
| ----------------------- | ---------------------- | ---------------------------------- |
| Contact Info            | Email, phone           | Not Collected                      |
| Financial Info          | Payments, balances     | Not Collected (no native payments) |
| Identifiers             | User/device IDs        | Not Collected                      |
| Usage Data              | Product interaction    | Not Collected                      |
| Diagnostics             | Crash/performance logs | Not Collected                      |
| Location                | Precise/coarse         | Not Collected                      |
| Contacts                | Address book           | Not Collected                      |
| User Content            | Photos, videos, audio  | Not Collected                      |
| Browsing/Search History | Web/app history        | Not Collected                      |
| Sensitive Info          | Health, biometrics     | Not Collected                      |

### Future Optional Toggles (OFF by default)

- Sentry (crash/error logs) — OFF
- Analytics (GA/Mixpanel/etc.) — OFF
- Native payments (Apple Pay/IAP) — DISABLED; web-based payments only

## Third-Party Data Sharing (MVP)

- No third‑party analytics or ad tracking enabled
- No native payments; web-based checkout only

## Data Retention and Deletion (MVP)

- No diagnostic/analytics collection; nothing retained beyond standard web session data

## Data Security Measures

### Encryption

- **Data in Transit**: TLS 1.3 encryption for all API communications
- **Data at Rest**: Database encryption for sensitive financial information
- **Local Storage**: Minimal local data storage, primarily session tokens

### Access Controls

- **Authentication**: Multi-factor authentication available
- **Authorization**: Role-based access controls
- **API Security**: JWT tokens with expiration

### Compliance

- **SOC 2 Type II**: Backend infrastructure compliance
- **Financial Regulations**: Compliance with applicable financial data protection requirements

## iOS-Specific Data Handling (MVP)

- No native permissions requested
- No push notifications

## Privacy Policy Links

- Privacy URL (placeholder): https://pbcex.com/disclosures
- Terms of Service: https://pbcex.com/legal/tos

## Tracking Disclosure (MVP)

- No cross‑app tracking; ATT not applicable

## Age Rating and Geographic Scope (MVP)

- Intended age rating: 4+ (App Store Connect target) — app content is informational; trading features gated by web account eligibility
- Supported Regions (app wrapper scope): United States (initial)

## Updates and Changes

### Privacy Label Updates

- Privacy labels will be updated with each App Store submission if data practices change
- Users will be notified of significant privacy policy changes

### Review Schedule

- Quarterly review of data collection practices
- Annual privacy policy review and updates

## Implementation Notes

### Current Status

- **Web Application**: Privacy practices based on current web app implementation
- **iOS Wrapper**: Additional considerations for native iOS functionality

### Future Considerations

- **Push Notifications**: If implemented, will require additional privacy disclosures
- **Native Features**: Any new native iOS features will require privacy label updates
- **Third-Party Integrations**: New service integrations will require privacy assessment

## Compliance Checklist

- [ ] Privacy policy updated for iOS app specifics
- [ ] Data collection audit completed
- [ ] Third-party service agreements reviewed
- [ ] Age verification process implemented
- [ ] Regional restrictions configured
- [ ] Data retention policies documented
- [ ] Security measures verified
- [ ] App Store privacy labels configured
- [ ] Legal review completed

## Contact Information

For privacy-related inquiries:

- **Email**: privacy@pbcex.com
- **Support**: Available through in-app customer support
- **Legal**: Available through privacy policy contact information
