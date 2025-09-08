# iOS Wrapper Decision — Capacitor vs React Native Shell

## Context

We need an iOS wrapper for the authenticated PWA, with App Store compliance, minimal native surface, and privacy alignment.

## Options

- Capacitor (WebView wrapper)
  - Pros: Minimal code, reuses web app, good plugin ecosystem, easy deep links
  - Cons: WebView limits, push requires native plugin configuration
- React Native Shell
  - Pros: Strong native modules ecosystem, performance for heavy-native UIs
  - Cons: Higher maintenance, dual UI stacks, more complex build/install

## Apple Policy Notes

- PWA-in-a-shell is acceptable when app provides value and uses native capabilities appropriately
- Avoid duplicative experience with no native affordances
- Ensure data handling and privacy labels match behaviors

## Data Handling

- All analytics behind explicit consent
- No background location or device fingerprinting
- Use secure storage for session where needed; prefer web auth flows

## Push/Notifications

- Use Capacitor Push Notifications plugin if needed (opt-in only)
- Respect quiet hours and granular categories

## Deep Links

- Universal Links to key routes (login, dashboard, trade, support)

## Review Constraints

- Do not ship native payments; use web-based flows only
- Provide contact and support URL; privacy policy link

## Provisional Decision

- Choose Capacitor wrapper for authenticated PWA
- Keep native surface minimal; prioritize web functionality
- Explicitly avoid native in-app payments to reduce App Store review risk

## Next Steps (Step-2 Spike)

- Prototype Capacitor shell with:
  1. Universal links/deep links
  2. File picker/attachments where needed
  3. Review App Store policy notes (no native payments), and confirm privacy labels
- Exercise auth/session flows and external URL handling
- Document build pipeline for iOS CI
