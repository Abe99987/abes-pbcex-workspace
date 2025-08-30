# PBCEx Backend API

## Overview

The PBCEx (People's Bank & Commodities Exchange) backend provides API services for precious metals trading, wallet management, and user authentication. This service is designed to handle both real asset custody (PAXG) and synthetic asset trading.

## Quick Start

### Prerequisites

- Node.js 18+
- npm/pnpm package manager
- PostgreSQL (for production) or in-memory storage (for development)
- Redis (for production) or mock service (for development)

### Development Setup

1. **Install dependencies:**

   ```bash
   cd backend
   npm install
   ```

2. **Set up environment:**

   ```bash
   cp env-template .env
   # Edit .env with your configuration
   ```

3. **Seed development data:**

   ```bash
   npm run seed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:4000`

### Available Scripts

| Script                     | Description                              |
| -------------------------- | ---------------------------------------- |
| `npm run dev`              | Start development server with hot reload |
| `npm run build`            | Build for production                     |
| `npm run start`            | Start production server                  |
| `npm run test`             | Run test suite                           |
| `npm run test:unit`        | Run unit tests only                      |
| `npm run test:integration` | Run integration tests only               |
| `npm run seed`             | Seed development data                    |
| `npm run reset:db`         | Reset database and reseed                |
| `npm run lint`             | Run ESLint                               |
| `npm run lint:fix`         | Fix linting errors                       |

## API Endpoints

### Core Endpoints

#### Health Check

- **GET** `/health` - Service health status
- **GET** `/metrics` - Prometheus-style metrics

#### Authentication

- **POST** `/api/auth/register` - User registration
- **POST** `/api/auth/login` - User login
- **POST** `/api/auth/logout` - User logout
- **GET** `/api/auth/me` - Get current user profile

#### Wallet Management

- **GET** `/api/wallet/balances` - Get user account balances
- **GET** `/api/wallet/transactions` - Get transaction history
- **POST** `/api/wallet/transfer` - Transfer between accounts
- **POST** `/api/wallet/deposit` - Initiate deposit
- **POST** `/api/wallet/withdraw` - Initiate withdrawal

#### Trading

- **GET** `/api/trade/prices` - Get current asset prices
- **POST** `/api/trade/order` - Place market order
- **POST** `/api/trade/quote` - Get trading quote
- **GET** `/api/trade/history` - Get trade history
- **GET** `/api/trade/pairs` - Get trading pairs

### Response Format

All API responses follow this structure:

```json
{
  "code": "SUCCESS",
  "message": "Optional message",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Responses

```json
{
  "code": "ERROR_CODE",
  "message": "Error description",
  "errors": [
    {
      "path": "field.name",
      "message": "Field-specific error"
    }
  ]
}
```

## Response Examples

### GET /api/wallet/balances

```json
{
  "code": "SUCCESS",
  "data": {
    "funding": {
      "id": "funding-account-id",
      "type": "FUNDING",
      "balances": [
        {
          "asset": "PAXG",
          "amount": "2.5000",
          "usdValue": "5125.00"
        },
        {
          "asset": "USD",
          "amount": "10000.00",
          "usdValue": "10000.00"
        }
      ],
      "totalUsdValue": "15125.00"
    },
    "trading": {
      "id": "trading-account-id",
      "type": "TRADING",
      "balances": [
        {
          "asset": "XAU-s",
          "amount": "1.2500",
          "usdValue": "2562.50"
        }
      ],
      "totalUsdValue": "2562.50"
    }
  }
}
```

### GET /api/trade/prices

```json
{
  "code": "SUCCESS",
  "data": {
    "AU": {
      "price": "2050.25",
      "change24h": "+1.25%",
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    },
    "AG": {
      "price": "24.75",
      "change24h": "-0.50%",
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### GET /api/wallet/transactions

```json
{
  "code": "SUCCESS",
  "data": {
    "transactions": [
      {
        "id": "tx-id",
        "type": "CREDIT",
        "asset": "USD",
        "amount": "10000.00",
        "accountType": "FUNDING",
        "description": "Initial USD deposit",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 10,
    "limit": 50,
    "offset": 0
  }
}
```

## Environment Configuration

### Required Environment Variables

```bash
# Core Application
NODE_ENV=development
PORT=4000
DATABASE_URL=postgres://user:pass@localhost:5432/pbcex
REDIS_URL=redis://localhost:6379

# Authentication & Security
JWT_SECRET=your-32-character-secret-key
SESSION_SECRET=your-32-character-session-secret
ENCRYPTION_KEY=your-32-character-encryption-key

# Development Settings
DEV_FAKE_LOGIN=true
PRICE_UPDATE_MS=3000
LOG_LEVEL=info
```

### Optional Integration Variables

```bash
# Market Data
TRADINGVIEW_API_KEY=your-tradingview-key

# KYC & Identity
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret

# Custody Partners
PAXOS_API_KEY=your-paxos-key
PAXOS_API_SECRET=your-paxos-secret

# Payments
STRIPE_SECRET_KEY=your-stripe-key

# Communications
SENDGRID_API_KEY=your-sendgrid-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# Monitoring
DATADOG_API_KEY=your-datadog-key
```

## Development Features

### DEV_FAKE_LOGIN

When `DEV_FAKE_LOGIN=true` and `NODE_ENV=development`, the authentication middleware bypasses JWT verification and uses a fake dev user:

- **User ID:** `dev-user-id`
- **Email:** `dev@local.test`
- **Role:** `USER`
- **KYC Status:** `APPROVED`

This allows frontend development without requiring real authentication.

### Development Data Seeding

The seed script creates realistic test data:

- **Dev User:** Complete user with approved KYC
- **Accounts:** Funding and trading accounts
- **Balances:** Realistic holdings across multiple assets
- **Transactions:** Historical transaction data
- **Trades:** Sample trading history

Run seeding with:

```bash
npm run seed
```

## Testing

### Test Coverage

- **Unit Tests:** Price service, utilities, models
- **Integration Tests:** API endpoints, authentication, CORS
- **Contract Tests:** OpenAPI specification validation

### Running Tests

```bash
# All tests
npm run test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage
npm run test:coverage
```

### Test Environment

Tests run with:

- In-memory data storage
- Mock external services
- Seeded test data
- DEV_FAKE_LOGIN enabled

## Ready for Integrations Checklist

### ✅ Backend Foundation

- [x] Health: `/health` returns 200 with `db=true, redis=true`
- [x] Scripts: `migrate`, `seed`, `reset:db`, `dev:all`
- [x] Data: Dev user + holdings + activity seeded
- [x] Prices: Stub service + `/api/prices` endpoint
- [x] Contracts: FE ↔ BE response shapes locked and documented
- [x] Tests: Unit + integration green (`npm test`)
- [x] Logging: Structured logs at INFO in dev, ERROR stack traces visible
- [x] Env: Template complete, secure defaults, no vendor keys committed

### ✅ API Readiness

- [x] Authentication: JWT + DEV_FAKE_LOGIN bypass
- [x] CORS: Configured for `localhost:3000` with credentials
- [x] Rate Limiting: Configured with bypass for dev
- [x] Error Handling: Consistent error responses
- [x] Validation: Request/response validation with Zod
- [x] Documentation: OpenAPI/Swagger available at `/api/docs`

### ✅ Data Management

- [x] Balances: Real-time balance tracking
- [x] Transactions: Complete audit trail
- [x] Trades: Market order execution simulation
- [x] Prices: Live price updates every 5 seconds
- [x] Sessions: In-memory user session management

### 🔄 Integration Preparation

- [ ] Database: PostgreSQL connection (currently in-memory)
- [ ] Redis: Session/cache storage (currently mock)
- [ ] TradingView: Real price feeds (currently mock)
- [ ] Paxos: PAXG custody integration
- [ ] Stripe: Payment processing
- [ ] SendGrid: Email notifications
- [ ] Twilio: SMS verification

### 📋 External Provider Integration Steps

1. **Price Feeds (TradingView)**
   - Set `TRADINGVIEW_API_KEY`
   - Configure WebSocket connection
   - Update `PriceFeedService.initializeTradingView()`

2. **Custody (Paxos)**
   - Set `PAXOS_API_KEY` and `PAXOS_API_SECRET`
   - Implement PAXG balance synchronization
   - Configure webhook handlers

3. **Payments (Stripe)**
   - Set `STRIPE_SECRET_KEY`
   - Configure payment intent creation
   - Add webhook signature validation

4. **Database (PostgreSQL)**
   - Update `DATABASE_URL` to real instance
   - Run migrations: `npm run migrate`
   - Disable in-memory storage

5. **Cache (Redis)**
   - Update `REDIS_URL` to real instance
   - Migrate session storage from memory
   - Configure cache invalidation

## Architecture

### Service Layer

- **AuthController:** User authentication and authorization
- **WalletController:** Account and balance management
- **TradeController:** Trading operations and price feeds
- **PriceFeedService:** Real-time price data management
- **NotificationService:** Email/SMS communications

### Data Models

- **User:** Authentication and profile data
- **Account:** Funding and trading account separation
- **Balance:** Asset holdings with audit trail
- **Trade:** Trading execution records
- **BalanceChange:** Transaction history

### Security

- JWT token authentication
- Request rate limiting
- Input validation and sanitization
- CORS protection
- Helmet security headers

## Monitoring

### Health Endpoints

- `/health` - Service health with dependency status
- `/metrics` - Prometheus-compatible metrics

### Logging

- Structured JSON logging
- Request/response correlation IDs
- Error tracking with stack traces
- Performance monitoring

### Metrics Tracked

- HTTP request rates and latencies
- Active user sessions
- Price update frequencies
- Trade execution rates
- Error rates by endpoint

## Support

### Documentation

- API documentation: `/api/docs`
- Health status: `/health`
- This README for setup and configuration

### Development

- Hot reload with `npm run dev`
- Comprehensive test suite
- ESLint + Prettier for code quality
- TypeScript for type safety

---

**Last Updated:** Generated during backend branch fixes
**Version:** 1.0.0
**Maintainer:** PBCEx Development Team
