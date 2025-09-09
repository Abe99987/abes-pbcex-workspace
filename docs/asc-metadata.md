# App Store Connect Metadata — PBCEx iOS Wrapper (MVP)

This document captures the intended answers for App Store Connect submission. Values may be refined prior to submission.

## Basic Info

- App Name: PBCEx
- Bundle ID (Explicit): `com.pbcex.app`
- Category: Finance (Primary)
- Secondary Category: None (TBD)
- Primary Language: English (U.S.)
- Intended Age Rating: 4+ (content informational; account features gated on web)

## URLs

- Marketing URL: https://www.pbcex.com
- Support URL: https://www.pbcex.com/support (placeholder)
- Privacy Policy URL: https://www.pbcex.com/disclosures (public disclosures page)

## Export Compliance

- Uses encryption: Yes — standard TLS only
- Exemption path: Qualifies for mass market exemption (5A992.c) — no custom cryptography
- No algorithm details exposed beyond standard TLS in transit

## Privacy

- App Privacy: Data Not Collected (MVP baseline)
- SDK Set: No analytics, crash reporting, ads, or native payments enabled

## Geographic Availability

- Supported Regions (initial): United States

## Contact Information (placeholders)

- Contact Email: support@pbcex.com
- Contact Phone: +1-555-0100

## Notes to Reviewer (internal)

- This is a web-wrapper app. Universal links served at `/.well-known/apple-app-site-association`.
- Deep link scheme: `pbcex://`.
- Disclosures page available at `/disclosures` with Supported Regions and Export text.
