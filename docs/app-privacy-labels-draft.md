# App Privacy Labels Draft - PBCEx iOS App

## Overview

This document outlines the privacy labels required for the PBCEx iOS app submission to the Apple App Store, based on current data collection practices and planned iOS wrapper functionality.

## Data Collection Summary

### Data Linked to User Identity

#### Contact Info

- **Email Addresses**: ✅ Collected
  - **Purpose**: Account creation, authentication, support communications
  - **Linked to User**: Yes
  - **Used for Tracking**: No

#### Financial Info

- **Financial Info**: ✅ Collected
  - **Purpose**: Trading account management, transaction history, portfolio tracking
  - **Types**: Account balances, transaction records, trading positions
  - **Linked to User**: Yes
  - **Used for Tracking**: No

#### Identifiers

- **User ID**: ✅ Collected
  - **Purpose**: Account identification, session management
  - **Linked to User**: Yes
  - **Used for Tracking**: No

#### Usage Data

- **Product Interaction**: ✅ Collected
  - **Purpose**: App functionality, user experience improvement
  - **Types**: Trading actions, page views, feature usage
  - **Linked to User**: Yes
  - **Used for Tracking**: No

#### Diagnostics

- **Crash Data**: ✅ Collected
  - **Purpose**: App stability and performance improvement
  - **Linked to User**: No
  - **Used for Tracking**: No

- **Performance Data**: ✅ Collected
  - **Purpose**: App optimization and debugging
  - **Linked to User**: No
  - **Used for Tracking**: No

- **Other Diagnostic Data**: ✅ Collected
  - **Purpose**: Error logging and system diagnostics
  - **Linked to User**: No
  - **Used for Tracking**: No

### Data NOT Linked to User Identity

#### Location

- **Precise Location**: ❌ Not Collected
- **Coarse Location**: ❌ Not Collected

#### Sensitive Info

- **Sensitive Info**: ❌ Not Collected
  - **Note**: Financial data is collected but handled under "Financial Info" category

#### Health & Fitness

- **Health**: ❌ Not Collected
- **Fitness**: ❌ Not Collected

#### Contacts

- **Contacts**: ❌ Not Collected

#### User Content

- **Photos or Videos**: ❌ Not Collected
- **Audio Data**: ❌ Not Collected
- **Gameplay Content**: ❌ Not Collected
- **Customer Support**: ✅ May be Collected
  - **Purpose**: Customer service and support
  - **Linked to User**: Yes (when user initiates support request)

#### Search History

- **Search History**: ❌ Not Collected

#### Browsing History

- **Browsing History**: ❌ Not Collected

## Third-Party Data Sharing

### Analytics and Performance

- **No third-party analytics tracking**: Currently no Google Analytics, Mixpanel, or similar services actively collecting data
- **TradingView widgets**: External chart widgets may collect usage data per their privacy policy
- **Supabase**: Authentication and database services - data processed per service agreement

### Advertising

- **No advertising networks**: App does not display third-party advertisements
- **No advertising tracking**: No advertising identifiers collected or shared

### Payment Processing

- **Stripe**: Payment processing handled through web interface
- **No native payments**: iOS app does not implement Apple Pay or In-App Purchases

## Data Retention and Deletion

### User Account Data

- **Retention Period**: Retained while account is active plus regulatory requirements (typically 7 years for financial records)
- **Deletion Process**: Users can request account deletion through customer support

### Diagnostic Data

- **Retention Period**: 90 days for crash logs and performance data
- **Automatic Deletion**: Diagnostic data automatically purged after retention period

### Session Data

- **Retention Period**: 30 days for active sessions
- **Automatic Cleanup**: Session data cleared on logout or expiration

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

## iOS-Specific Data Handling

### Native iOS Features

- **Keychain**: Secure storage for authentication tokens
- **Background App Refresh**: Limited to essential data updates
- **Push Notifications**: If implemented, will require user consent

### Permissions

- **Camera**: Not requested
- **Microphone**: Not requested
- **Location**: Not requested
- **Contacts**: Not requested
- **Photos**: Not requested

## Privacy Policy Links

### App Store Submission

- **Privacy Policy URL**: https://pbcex.com/legal/privacy
- **Terms of Service URL**: https://pbcex.com/legal/tos

### In-App Links

- Privacy policy accessible through app settings
- Terms of service accessible during account creation and in app footer

## Tracking Disclosure

### Cross-App Tracking

- **Status**: Does NOT track users across apps and websites owned by other companies
- **App Tracking Transparency**: Not applicable as no cross-app tracking occurs

### First-Party Tracking

- **Internal Analytics**: Limited to app functionality and user experience improvement
- **No Behavioral Profiling**: Data not used for behavioral advertising or profiling

## Age Rating and Restrictions

### Age Rating

- **Minimum Age**: 18+ (financial services restriction)
- **Age Verification**: Required during account creation

### Geographic Restrictions

- **Supported Regions**: US, CA, GB (configurable via environment variables)
- **Compliance**: Regional financial regulations compliance

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
