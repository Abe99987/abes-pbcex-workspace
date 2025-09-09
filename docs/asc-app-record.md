# App Store Connect App Record — Scaffolding

Capture the initial fields for creating the app record in App Store Connect (ASC). Use placeholders until content is finalized.

## App Information

- App Name: PBCEx
- Subtitle: Precious Metals & Commodities Trading
- Primary Language: English (U.S.)
- Category: Finance (Primary)
- Secondary Category: None (TBD)
- Minimum iOS Version: iOS 13.0 (TBD)
- Bundle ID (Explicit): `com.pbcex.app`
- SKU: `pbcex-app-internal`

## Platforms

- iOS (iPhone, iPad) — Universal

## URLS

- Support URL: `https://www.pbcex.com/support` (placeholder)
- Marketing URL: `https://www.pbcex.com` (optional)
- Privacy Policy URL: `https://www.pbcex.com/legal/privacy`

## Encryption

- Uses encryption: Yes (standard HTTPS; no custom crypto). Final answer TBD based on backend networking; likely "Yes" with Exemption per 5A992.c.
- Export Compliance: Placeholder — complete during submission wizard.

## Age Rating

- Placeholder: Finance app with account access; expected 17+ due to unrestricted web access. Final answers to be set in App Store Connect questionnaire.

## Review Notes (Internal)

- App is a wrapper around a web application with authenticated user flows.
- Universal links configured via `/.well-known/apple-app-site-association` with path prefix `/app`.
- Custom URL scheme: `pbcex://`.

## Contacts and Access

- App Manager(s): TBD
- Developer(s): TBD
- Marketing/Customer Support: TBD

## Next Steps

- Create the App ID with explicit bundle identifier `com.pbcex.app` in Apple Developer portal.
- Link the App ID to the ASC app record.
- Upload app icon and screenshots (later phase).
