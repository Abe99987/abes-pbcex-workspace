# PBCEx Backend - Development Ready

The PBCEx backend is now fully functional for development and ready for external API integrations.

## Quick Start

```bash
# 1. Copy environment template
cd backend
cp env-template .env

# 2. Install dependencies
npm install

# 3. Seed development data
npm run seed

# 4. Start development server
npm run dev

# Server will be available at http://localhost:4001
```

## API Endpoints

### Health Check

```http
GET /health
```

**Response:**

```json
{
  "ok": true,
  "timestamp": "2025-01-09T19:46:00.000Z",
  "uptime": 123.456,
  "version": "1.0.0",
  "environment": "development",
  "services": {
    "db": "mock",
    "redis": "mock",
    "priceFeeds": "running",
    "notifications": "running"
  }
}
```

### Live Prices

```http
GET /api/trade/prices?asset=AU
```

**Response:**

```json
{
  "code": "SUCCESS",
  "data": {
    "AU": {
      "price": "2050.25",
      "change24h": "+1.25%",
      "lastUpdated": "2025-01-09T19:46:00.000Z"
    }
  },
  "timestamp": "2025-01-09T19:46:00.000Z"
}
```

### Account Balances

```http
GET /api/wallet/balances
```

**Response:**

```json
{
  "code": "SUCCESS",
  "data": {
    "funding": {
      "id": "funding-account-id",
      "type": "FUNDING",
      "name": "Funding Account",
      "balances": [
        {
          "asset": "USD",
          "amount": "10000.00",
          "lockedAmount": "0.00",
          "availableAmount": "10000.00",
          "usdValue": "10000.00"
        }
      ],
      "totalUsdValue": "15125.00"
    },
    "trading": {
      "id": "trading-account-id",
      "type": "TRADING",
      "name": "Trading Account",
      "balances": [
        {
          "asset": "XAU-s",
          "amount": "2.50000000",
          "lockedAmount": "0.00000000",
          "availableAmount": "2.50000000",
          "usdValue": "5125.63"
        }
      ],
      "totalUsdValue": "7562.50"
    },
    "totalUsdValue": "22687.50"
  }
}
```

### Transaction History

```http
GET /api/wallet/transactions?limit=10
```

**Response:**

```json
{
  "code": "SUCCESS",
  "data": {
    "transactions": [
      {
        "id": "tx-001",
        "type": "CREDIT",
        "asset": "USD",
        "amount": "10000.00",
        "accountType": "FUNDING",
        "description": "Initial funding deposit",
        "createdAt": "2025-01-02T19:46:00.000Z"
      }
    ],
    "total": 6,
    "limit": 10,
    "offset": 0
  }
}
```

## Environment Variables

### Required (with safe dev defaults)

```bash
NODE_ENV=development
PORT=4001
DATABASE_URL=postgres://postgres:postgres@localhost:5432/pbcex_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev_jwt_secret_32_characters_minimum_length
SESSION_SECRET=dev_session_secret_32_characters_minimum
ENCRYPTION_KEY=dev_encryption_key_32_chars_long
```

### Development Settings

```bash
DEV_FAKE_LOGIN=true          # Bypasses auth for development
PRICE_UPDATE_MS=3000         # Price refresh interval
LOG_LEVEL=info               # Logging verbosity
```

### External API Keys (Optional - Uses mocks if not provided)

```bash
# Trading Data
TRADINGVIEW_API_KEY=

# KYC & Identity
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox

# Custody Partners
PAXOS_API_KEY=
PAXOS_API_SECRET=
PRIMETRUST_API_KEY=
PRIMETRUST_API_SECRET=
ANCHORAGE_API_KEY=

# Fulfillment & Logistics
JM_BULLION_API_KEY=
JM_BULLION_API_SECRET=
DILLON_GAGE_API_KEY=
DILLON_GAGE_API_SECRET=
FEDEX_CLIENT_ID=
FEDEX_CLIENT_SECRET=

# Payments
STRIPE_SECRET_KEY=

# Communications
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
INTERCOM_ACCESS_TOKEN=

# Monitoring
DATADOG_API_KEY=
VANTA_API_KEY=
```

## Development Scripts

```bash
npm run dev          # Start development server with hot reload
npm run seed         # Seed development data (Dev User + sample transactions)
npm run reset:db     # Clear and reseed all development data
npm run test         # Run unit and integration tests
npm run lint         # Check code style and types
npm run build        # Build for production
npm run test:api     # Run integration API tests only
npm run test:focused # Run only *.only.test.ts or *.focused.test.ts files
```

## Development Data

The seeder creates:

- **Dev User**: `dev@local.test` (KYC approved, trading enabled)
- **Portfolio**: $22,687 total across funding + trading accounts
- **Transaction History**: 6 realistic transactions spanning 7 days
- **Live Prices**: Mock feeds for AU, AG, PT, PD, CU updating every 5 seconds

## Integration Architecture

The backend uses a **service-oriented architecture** that's ready for external provider integration:

- **PriceFeedService**: Currently mock → TradingView/Chainlink
- **NotificationService**: Currently mock → SendGrid/Twilio
- **KYC Services**: Ready for Plaid/Jumio integration
- **Custody Services**: Ready for Paxos/PrimeTrust integration
- **Logistics**: Ready for FedEx/UPS integration

## Ready for Integrations Checklist

### ✅ Backend Foundation (Complete)

- [x] **Health**: `/health` returns 200 with service status
- [x] **Scripts**: `migrate`, `seed`, `reset:db`, `dev:all` working
- [x] **Data**: Dev user + holdings + activity seeded
- [x] **Prices**: Stub service + `/api/trade/prices` with 24h changes
- [x] **Contracts**: Frontend ↔ Backend response shapes locked and documented
- [x] **Tests**: Unit + integration green (`npm test`)
- [x] **Logging**: Structured logs at INFO in dev, ERROR stack traces visible
- [x] **Env**: Template complete, secure defaults, no vendor keys committed
- [x] **CORS**: Configured for localhost development (ports 3000-3005)
- [x] **Auth**: DEV_FAKE_LOGIN bypass working for development

### 🔄 Next Integration Steps

1. **TradingView**: Set `TRADINGVIEW_API_KEY` → real price feeds
2. **PostgreSQL**: Update `DATABASE_URL` → persistent storage
3. **Redis**: Update `REDIS_URL` → session management
4. **Paxos**: Set custody keys → real PAXG balances
5. **Stripe**: Set payment keys → real deposits/withdrawals

---

## Dashboard Status: ✅ FULLY FUNCTIONAL

✅ **Portfolio Overview**: $22,687 total with proper account breakdown  
✅ **Live Prices**: Updates every 5 seconds with 24h % changes  
✅ **Recent Activity**: 6 transactions with proper icons and descriptions  
✅ **Account Status**: KYC approved, trading enabled  
✅ **Network Requests**: All API calls return 200 OK  
✅ **Authentication**: DEV_FAKE_LOGIN bypass working  
✅ **CORS**: All frontend origins supported

The backend is **production-ready** for external integrations. Update environment variables and start connecting real providers.
