## iOS Wrapper Plan (Step-36 M3–M4)

This document covers running the iOS wrapper locally and patching entitlements.

Steps:

- Add iOS platform locally (do not commit): `npm run cap:add:ios`
- Patch entitlements (idempotent): `npm run ios:patch-entitlements`
- Associated Domains: `applinks:pbcex.com`, `applinks:www.pbcex.com`

Assets (placeholders only):

- `assets/mobile/icon.png` (1024x1024, no alpha)
- `assets/mobile/splash.png` (2732x2732)

Notes:

- AASA is already served by the web app.
- Do not commit `ios/` or `Pods/`.
