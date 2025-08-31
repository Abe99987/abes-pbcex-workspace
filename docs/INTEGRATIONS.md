# PBCEx Integrations Documentation

This document provides comprehensive integration documentation for all external services used by PBCEx (People's Bank & Commodities Exchange).

## Overview

PBCEx integrates with multiple third-party services to provide email, SMS verification, shipping, pricing, and vendor capabilities. All integrations are production-ready with proper error handling, rate limiting, and caching.

## Environment Variables

All integrations are configured via environment variables. Copy `backend/env-template` to `backend/.env` and fill in the required values:

```bash
# Core configuration
EMAIL_FROM=contact@pbcex.com
API_BASE_URL=http://localhost:3000
APP_BASE_URL=http://localhost:8080
COINGECKO_BASE_URL=https://api.coingecko.com/api/v3
PRICELOCK_SPREAD_BPS=50

# Email Service (Resend)
RESEND_API_KEY=

# SMS/2FA Service (Twilio)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=
TWILIO_MESSAGING_SERVICE_SID=

# Shipping Service (FedEx)
FEDEX_CLIENT_ID=
FEDEX_CLIENT_SECRET=
FEDEX_ACCOUNT_NUMBER=
FEDEX_BASE_URL=https://apis-sandbox.fedex.com

# Cache & Database
REDIS_URL=redis://localhost:6379
```

---

## 1. Resend Email Service

**Purpose:** Production email delivery using Resend API  
**Status:** ✅ Implemented  
**Endpoints:** `/api/email/`

### Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `EMAIL_FROM` | Yes | From email address (contact@pbcex.com) |
| `RESEND_API_KEY` | Yes | Resend API key from dashboard |

### Test Endpoints (Development Only)

```bash
# Send test email
POST /api/email/test
{
  "to": "dev@pbcex.com"
}

# Check service health
GET /api/email/health
```

### Usage Example

```typescript
import { EmailService } from '@/services/EmailService';

// Send transactional email
const result = await EmailService.sendTransactionalEmail(
  'user@example.com',
  'Welcome to PBCEx',
  '<h1>Welcome!</h1><p>Your account is ready.</p>'
);

if (result.success) {
  console.log('Email sent:', result.messageId);
}
```

### DNS Configuration

⚠️ **Important:** Configure DNS records before sending production emails.  
See [DNS_NOTES.md](./DNS_NOTES.md#resend-dns) for Resend DNS configuration.

---

## 2. Twilio Verify (2FA)

**Purpose:** SMS-based two-factor authentication  
**Status:** ✅ Implemented  
**Endpoints:** `/api/auth/verify/`

### Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Yes | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Yes | Twilio Auth Token |
| `TWILIO_VERIFY_SERVICE_SID` | Yes | Verify Service SID from Console |
| `TWILIO_MESSAGING_SERVICE_SID` | No | Optional Messaging Service |

### Verification Flow

1. **Start Verification**
   ```bash
   POST /api/auth/verify/start
   {
     "phone": "+15555551234",
     "channel": "sms"  # optional, defaults to sms
   }
   ```

2. **Check Verification Code**
   ```bash
   POST /api/auth/verify/check
   {
     "phone": "+15555551234",
     "code": "123456"
   }
   ```

### Code Configuration

- **Recommended length:** 6 digits minimum
- **Validity:** 10 minutes (Twilio default)
- **Rate limiting:** 5 attempts per 2 minutes per phone number
- **Channels:** SMS (primary), Voice (fallback)

### Mock Mode (Development)

When Twilio is not configured, the service operates in mock mode:
- Codes ending in `00` are automatically approved
- Test codes: `123456`, `000000`, `111111`

### Test Endpoints

```bash
# Service status
GET /api/auth/verify/status

# Send test verification (dev only)
POST /api/auth/verify/test
{
  "phone": "+15555551234"  # optional, uses test number
}
```

### Setup Instructions

1. Create Twilio account and project
2. Create a Verify Service in Console
3. Copy Service SID to `TWILIO_VERIFY_SERVICE_SID`
4. Optional: Create Messaging Service for fallback messaging

---

## 3. FedEx Shipping Integration

**Purpose:** OAuth, rate quotes, service availability, and label generation  
**Status:** ✅ Implemented  
**Endpoints:** `/api/fedex/`

### Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `FEDEX_CLIENT_ID` | Yes | FedEx Developer App Client ID |
| `FEDEX_CLIENT_SECRET` | Yes | FedEx Developer App Client Secret |
| `FEDEX_ACCOUNT_NUMBER` | Yes | FedEx Account Number (for billing) |
| `FEDEX_BASE_URL` | Yes | API Base URL (sandbox/production) |

### API Endpoints

#### Get Shipping Rates
```bash
POST /api/fedex/rates
{
  "shipperAddress": {
    "streetLines": ["1600 Amphitheatre Parkway"],
    "city": "Mountain View",
    "stateOrProvinceCode": "CA",
    "postalCode": "94043",
    "countryCode": "US"
  },
  "recipientAddress": {
    "streetLines": ["1 Hacker Way"],
    "city": "Menlo Park", 
    "stateOrProvinceCode": "CA",
    "postalCode": "94025",
    "countryCode": "US"
  },
  "packages": [{
    "weight": { "value": 5, "units": "LB" },
    "dimensions": { "length": 12, "width": 8, "height": 6, "units": "IN" }
  }]
}
```

#### Check Service Availability
```bash
POST /api/fedex/availability
# Same request format as rates
```

#### Generate Shipping Label
```bash
POST /api/fedex/ship/label
{
  "shipper": {
    "address": { /* address object */ },
    "contact": {
      "personName": "John Doe",
      "companyName": "PBCEx",
      "phoneNumber": "555-123-4567",
      "emailAddress": "shipping@pbcex.com"
    }
  },
  "recipient": { /* same structure as shipper */ },
  "packages": [{ /* package details */ }],
  "serviceType": "FEDEX_GROUND"
}
```

### Development Testing

Run the smoke test script to validate integration:

```bash
cd backend
npm run dev:fedex-smoke
```

This script tests:
- OAuth token retrieval
- Rate calculations
- Service availability  
- Label generation (saves to `backend/tmp/labels/`)

### Supported Service Types

- `FEDEX_GROUND` - Ground delivery (1-5 business days)
- `FEDEX_EXPRESS_SAVER` - Express (3 business days)
- `FEDEX_2_DAY` - 2 business days
- `STANDARD_OVERNIGHT` - Next business day
- `PRIORITY_OVERNIGHT` - Next business day by 10:30 AM

### Production Label Validation Process

⚠️ **Required before production use:**

1. **Generate Test Labels**
   - Use dev environment to create sample labels
   - Generate labels to real addresses within your region

2. **Complete Cover Sheet**
   - Download FedEx Label Validation Cover Sheet
   - Fill out all required fields
   - Include sample labels

3. **Submit for Review**
   - Email to your regional FedEx contact:
     - **US:** developer@fedex.com
     - **Canada:** developerca@fedex.com  
     - **Europe:** developereu@fedex.com
     - **Asia Pacific:** developerapac@fedex.com

4. **Wait for Approval**
   - Typically 3-5 business days
   - FedEx will notify when approved

5. **Switch to Production**
   - Update `FEDEX_BASE_URL=https://apis.fedex.com`
   - Update credentials to production keys
   - Test with small volume initially

### OAuth Token Caching

- Tokens cached in Redis with 5-minute safety margin
- Automatic refresh when expired
- Fallback to mock mode if service unavailable

---

## 4. Price Service

**Purpose:** Real-time price feeds with Redis caching  
**Status:** ✅ Implemented  
**Endpoints:** `/api/prices/`

### Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `COINGECKO_BASE_URL` | Yes | CoinGecko API base URL |
| `REDIS_URL` | Yes | Redis connection string |

### Supported Symbols

- `PAXG` - PAX Gold (physical gold-backed token)
- `USDC` - USD Coin (stablecoin)

### Cache Strategy

- **TTL:** 45 seconds (30-60 second range as specified)
- **Key pattern:** `price:{SYMBOL}:USD`
- **Cache-first strategy:** Return cached data if available
- **Automatic refresh:** Fetch from CoinGecko on cache miss
- **Fallback:** Mock prices if API unavailable

### API Endpoints

```bash
# Get single price
GET /api/prices/PAXG

# Get multiple prices
POST /api/prices/batch
{
  "symbols": ["PAXG", "USDC"]
}

# Get supported symbols
GET /api/prices/symbols

# Service health
GET /api/prices/health

# Clear cache (dev only)
DELETE /api/prices/cache/PAXG
```

### Usage Example

```typescript
import { PricesService } from '@/services/PricesService';

// Get single price
const result = await PricesService.getTicker('PAXG');
if (result.success) {
  console.log(`PAXG: $${result.data.usd} (${result.data.source})`);
}

// Get multiple prices
const results = await PricesService.getMultipleTickers(['PAXG', 'USDC']);
```

### USDC Sanity Check

The service automatically validates USDC prices:
- Expected range: $0.95 - $1.05 (±5%)
- Logs warnings if outside range
- Continues operation (doesn't fail)

### Rate Limiting

- Single price: 60 requests/minute
- Batch requests: 10 requests/minute
- Bypass in dev: `x-admin-bypass: true` header

---

## 5. Checkout Price-Lock Service

**Purpose:** Price-lock quotes for precious metals purchases  
**Status:** ✅ Implemented (Stub)  
**Endpoints:** `/api/checkout/`

### Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `PRICELOCK_SPREAD_BPS` | No | Spread in basis points (default: 50 = 0.5%) |

### Price-Lock Flow

1. **Request Quote**
   ```bash
   POST /api/checkout/price-lock/quote
   {
     "symbol": "PAXG",
     "quantity": 1.5,
     "side": "buy",
     "userId": "optional-user-id"
   }
   ```

2. **Confirm Purchase**
   ```bash
   POST /api/checkout/confirm
   {
     "quoteId": "uuid-from-quote-response"
   }
   ```

### Lock Window

- **Duration:** 10 minutes (600 seconds)
- **Storage:** Redis with TTL expiration
- **Key pattern:** `pricelock:{quoteId}`

### Vendor Mapping (Stub)

Current stub implementation maps symbols to vendors:
- `PAXG` → JM Bullion
- `XAU`, `XAG` → Dillon Gage

### Price Calculation

1. Fetch base price from PricesService
2. Apply configurable spread (basis points)
3. For buys: `lockedPrice = basePrice + spread`  
4. For sells: `lockedPrice = basePrice - spread`
5. Calculate total: `totalAmount = lockedPrice × quantity`

### Switching to Real Vendors

To integrate with actual vendor APIs:

1. **Update CheckoutService.emitConfirmationEvent()**
   - Replace stub logging with real API calls
   - Add vendor-specific authentication
   - Handle different request/response formats

2. **Add vendor configurations:**
   ```bash
   # JM Bullion
   JM_BULLION_API_KEY=
   JM_BULLION_API_SECRET= 
   JM_BULLION_BASE_URL=

   # Dillon Gage  
   DILLON_GAGE_API_KEY=
   DILLON_GAGE_API_SECRET=
   DILLON_GAGE_BASE_URL=
   ```

3. **Implement vendor-specific logic:**
   - Order placement APIs
   - Inventory checks
   - Fulfillment status updates

### Test Endpoints

```bash
# Get quote details
GET /api/checkout/quote/{quoteId}

# Service health
GET /api/checkout/health
```

---

## Development & Testing

### Dev Integration Test Page

Access the development test interface:
```
http://localhost:3000/dev/integrations
```

This page provides forms to test all integration endpoints and is automatically excluded from production builds.

### Service Health Monitoring

All services provide health endpoints:
- `/api/email/health`
- `/api/auth/verify/status`
- `/api/fedex/health`  
- `/api/prices/health`
- `/api/checkout/health`

### Rate Limiting Bypass

In development, add header to bypass rate limits:
```
x-admin-bypass: true
```

### Mock Mode Behavior

When external services are unavailable:
- **Email:** Logs mock sends, doesn't actually deliver
- **Verify:** Uses predetermined test codes
- **FedEx:** Returns realistic mock rates and labels
- **Prices:** Generates realistic mock prices
- **Checkout:** Full functionality with mock prices

---

## Production Checklist

### Pre-Production

- [ ] Configure all required environment variables
- [ ] Set up DNS records (see DNS_NOTES.md)
- [ ] Complete FedEx label validation process
- [ ] Test Twilio Verify with real phone numbers
- [ ] Verify Resend email delivery
- [ ] Set `NODE_ENV=production`
- [ ] Switch FedEx to production URL
- [ ] Configure production Redis instance

### Security

- [ ] All API keys stored in secure environment variables
- [ ] No credentials in code or logs
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] CORS configured for production domains

### Monitoring

- [ ] Health endpoints configured in load balancer
- [ ] Log aggregation set up
- [ ] Error alerting configured
- [ ] Cache performance monitoring

---

## Support & Troubleshooting

### Common Issues

**Email not sending:**
- Check DNS records are configured
- Verify Resend API key is valid
- Check from domain matches DNS setup

**SMS verification failing:**
- Verify Twilio credentials
- Check phone number format (E.164)
- Ensure Verify Service is active

**FedEx errors:**
- Check account number is correct
- Verify credentials match environment (sandbox/prod)
- Ensure addresses are complete and valid

**Price service issues:**
- Check Redis connectivity
- Verify CoinGecko API availability
- Monitor rate limiting

### Debug Mode

Enable detailed logging:
```bash
LOG_LEVEL=debug
```

### Getting Help

- Check service health endpoints first
- Review application logs for correlation IDs
- Use development test page to isolate issues
- Refer to vendor documentation for API-specific errors

---

## API Documentation

For detailed API documentation, visit:
```
http://localhost:3000/api/docs
```

Swagger/OpenAPI documentation is available for all integration endpoints with request/response examples and authentication requirements.
