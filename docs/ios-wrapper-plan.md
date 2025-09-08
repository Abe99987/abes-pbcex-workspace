# iOS Wrapper Plan - PBCEx Mobile App

## Overview

This document outlines the plan for wrapping the PBCEx web application in an iOS native shell using Capacitor, enabling distribution through the Apple App Store.

## Wrapper Choice and Rationale

**Technology**: Capacitor by Ionic  
**Rationale**:

- Capacitor provides seamless integration between web applications and native iOS APIs
- Maintains existing web app functionality while adding native capabilities
- Minimal changes required to existing codebase
- Strong community support and documentation
- Future-proof with regular updates and iOS compatibility

**Key Benefits**:

- Preserve existing React/Next.js web application
- Access to native iOS features when needed
- Simplified deployment and maintenance
- Consistent user experience across platforms

## Architecture

```
┌─────────────────────────────────────┐
│           iOS Native Shell          │
│  (Capacitor + Native Plugins)       │
├─────────────────────────────────────┤
│        PBCEx Web Application        │
│     (React/Next.js Frontend)        │
├─────────────────────────────────────┤
│          Backend APIs               │
│    (Authentication, Trading, etc)   │
└─────────────────────────────────────┘
```

## Deep Link Scheme and Route Mapping

**Custom URL Scheme**: `pbcex://`

### Supported Deep Link Routes

| Deep Link                                | Internal Path          | Description                      |
| ---------------------------------------- | ---------------------- | -------------------------------- |
| `pbcex://open?route=dashboard`           | `/dashboard`           | User dashboard                   |
| `pbcex://open?route=markets`             | `/markets`             | Markets overview                 |
| `pbcex://open?route=trade&symbol=XAUUSD` | `/markets/XAUUSD`      | Trading page for specific symbol |
| `pbcex://open?route=wallet.assets`       | `/wallet/assets`       | Wallet assets page               |
| `pbcex://open?route=wallet.orders`       | `/wallet/orders`       | Order history page               |
| `pbcex://open?route=wallet.transactions` | `/wallet/transactions` | Transaction history page         |
| `pbcex://open?route=legal.privacy`       | `/legal/privacy`       | Privacy policy page              |
| `pbcex://open?route=legal.tos`           | `/legal/tos`           | Terms of service page            |

### Implementation Details

- Deep link parsing handled by `frontend/config/deeplinks.ts`
- Route mapping supports parameterized routes (e.g., symbol parameter for trading pages)
- Fallback to default routes when parameters are missing
- Invalid routes are rejected gracefully

## External Links Policy

### Centralized Policy Enforcement

All external links are handled through the `ExternalLink` component with the following policies:

**Security Measures**:

- All external links include `rel="noopener noreferrer"` attributes
- Configurable target policy (default: `_blank`)
- Host allowlist enforcement from environment configuration

**Default Allowlist**:

- `tradingview.com` (for chart widgets and external analysis)
- `pbcex.com` (for help documentation and support)

**Environment Configuration**:

```bash
PUBLIC_EXTERNAL_LINK_HOST_ALLOWLIST=tradingview.com,pbcex.com
```

**Behavior**:

- Allowed hosts: Links open normally with security attributes
- Disallowed hosts: Blocked with user notification
- Invalid URLs: Blocked with error message

### Future iOS-Specific Handling

When the wrapper is active (`PUBLIC_IOS_WRAPPER=true`):

- External links may open in in-app browser (SFSafariViewController)
- Enhanced security policies for App Store compliance
- Native sharing capabilities integration

## Logging Abstraction

### Interface Design

```typescript
interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}
```

### Available Adapters

1. **Web Console Logger** (default): Logs to browser console with prefixed messages
2. **Noop Logger**: Silent logger for production/disabled modes
3. **iOS Native Logger** (planned): Will integrate with native iOS logging when wrapper is implemented

### Usage

```typescript
import { getLogger } from '@/utils/app-logger';

const logger = getLogger({ enabled: true });
logger.info('User authenticated successfully');
```

## Native Payments Policy

**Current Status**: **DISABLED**

All payment processing continues through existing web-based flows:

- Stripe integration remains web-based
- No native iOS payment methods implemented
- Apple Pay integration deferred to future phases
- In-App Purchases not applicable for financial trading app

This approach simplifies initial App Store approval and reduces compliance complexity.

## Next Steps Checklist

### When Apple Credentials Arrive

- [ ] **Development Environment Setup**
  - [ ] Install Xcode (latest stable version)
  - [ ] Configure Apple Developer account
  - [ ] Set up iOS development certificates
  - [ ] Configure App ID and provisioning profiles

- [ ] **Capacitor Integration**
  - [ ] Install Capacitor dependencies: `@capacitor/core`, `@capacitor/ios`, `@capacitor/cli`
  - [ ] Initialize Capacitor: `npx cap init`
  - [ ] Configure `capacitor.config.ts` with app details
  - [ ] Add iOS platform: `npx cap add ios`

- [ ] **Build Configuration**
  - [ ] Update Next.js config for static export compatibility
  - [ ] Configure build scripts for iOS deployment
  - [ ] Set up environment-specific builds (staging, production)

- [ ] **Native Features Implementation**
  - [ ] Implement deep link handling in iOS
  - [ ] Configure URL scheme in Info.plist
  - [ ] Add splash screen and app icons
  - [ ] Implement push notification capabilities (if needed)

- [ ] **Testing and Deployment**
  - [ ] Test deep links on physical iOS devices
  - [ ] Validate external link policies in iOS environment
  - [ ] Perform App Store compliance review
  - [ ] Submit for TestFlight beta testing
  - [ ] Prepare App Store submission materials

### File Dependencies

- `frontend/components/ExternalLink.tsx` - Ready for iOS-specific enhancements
- `frontend/config/deeplinks.ts` - Deep link parsing and routing
- `frontend/utils/app-logger.ts` - Logging abstraction ready for iOS adapter
- `e2e/tests/uat/external-links.policy.spec.ts` - Policy validation tests
- `e2e/tests/uat/deeplinks.sanity.spec.ts` - Deep link functionality tests

### Environment Variables

Required for iOS wrapper activation:

```bash
PUBLIC_IOS_WRAPPER=true
PUBLIC_IOS_DEEP_LINK_SCHEME=pbcex
PUBLIC_EXTERNAL_LINK_HOST_ALLOWLIST=tradingview.com,pbcex.com
```

## Risk Mitigation

**Technical Risks**:

- iOS version compatibility issues
- App Store review rejection
- Performance differences between web and native

**Mitigation Strategies**:

- Comprehensive testing on multiple iOS versions
- Early App Store pre-submission consultation
- Performance monitoring and optimization
- Staged rollout through TestFlight

**Compliance Considerations**:

- Financial app regulations compliance
- Data privacy and security requirements
- Apple's App Store Review Guidelines adherence

## Success Metrics

- Successful App Store approval and publication
- Deep link functionality working across all supported routes
- External link policy enforcement without user friction
- Performance parity with web application
- User adoption and engagement metrics post-launch
