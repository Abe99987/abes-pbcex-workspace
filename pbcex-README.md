# PBCEx - People's Bank & Commodities Exchange

A comprehensive platform for precious metals trading, custody, and fulfillment with institutional-grade security and compliance.

## 🏗️ Architecture Overview

PBCEx is built as a monorepo with three main components:
- **Backend**: Node.js/Express API with TypeScript
- **Frontend**: Next.js web application with Tailwind CSS
- **Mobile**: React Native application (stub)

## 🔐 Security & Environment Variables

**CRITICAL**: Never commit `.env` files or secrets to version control.

### Local Development Setup

1. **Start infrastructure services:**
   ```bash
   docker compose up -d
   ```

2. **Configure environment variables:**
   ```bash
   # Root level
   cp env-template .env

   # Backend
   cp env-template backend/.env

   # Frontend  
   cp env-template frontend/.env.local
   ```

3. **Fill in sandbox/development keys:**
   - Plaid: Use sandbox environment credentials
   - Stripe: Use test mode keys  
   - FedEx: Use developer/testing credentials
   - All other services: Use sandbox/dev credentials where available

4. **Start development servers:**
   ```bash
   # Terminal A - Backend
   cd backend
   npm install
   npm run dev

   # Terminal B - Frontend  
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - API Documentation: http://localhost:4000/api/docs
   - MailDev (email testing): http://localhost:1080

## 🏛️ System Architecture

### Asset Types
- **Gold (PAXG)**: Real custody-backed tokens
- **Silver/Platinum/Palladium/Copper**: Internal synthetics (XAG-s, XPT-s, XPD-s, XCU-s)

### Account Structure
- **Funding Account**: Real assets (PAXG, USD/USDC)
- **Trading Account**: Synthetic assets for active trading
- **1:1 Conversion**: PAXG ↔ XAU-s with mint/burn mechanism

### Core Features
- ✅ KYC/KYB with Plaid Identity Verification
- ✅ Multi-custody partner integration (Paxos, PrimeTrust, Anchorage)
- ✅ Real-time pricing via TradingView (Chainlink ready)
- ✅ Market conversion trading with 0.5% fee
- ✅ Automated hedging via ETFs (SLV, PPLT, PALL, CPER)
- ✅ Physical delivery via JM Bullion / Dillon Gage
- ✅ Insured shipping with FedEx integration
- ✅ Multi-channel notifications (Email, SMS, Support tickets)

## 🛠️ Development

### Backend Scripts
```bash
npm run dev    # Development with hot reload
npm run build  # Build for production
npm run start  # Start production server
npm run test   # Run unit tests
```

### Frontend Scripts
```bash
npm run dev    # Next.js development server
npm run build  # Build for production
npm run start  # Start production server
npm run lint   # ESLint checking
```

### Testing
```bash
# Backend unit tests
cd backend && npm test

# Frontend testing
cd frontend && npm run test
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/2fa/setup` - Setup 2FA (stub)

### KYC/Identity
- `POST /api/kyc/submit` - Submit personal KYC
- `POST /api/kyc/kyb/submit` - Submit business KYB  
- `GET /api/kyc/status` - Get KYC status

### Wallet & Accounts
- `GET /api/wallet/balances` - Get account balances
- `POST /api/wallet/transfer` - Transfer between accounts
- `POST /api/wallet/deposit` - Initiate deposit
- `POST /api/wallet/withdraw` - Initiate withdrawal

### Trading
- `POST /api/trade/order` - Place market conversion order
- `GET /api/trade/prices` - Get current spot prices
- `GET /api/trade/history` - Get trade history

### Shop/Fulfillment
- `GET /api/shop/products` - List available products
- `POST /api/shop/lock-quote` - Lock price for 10 minutes
- `POST /api/shop/checkout` - Complete purchase with locked quote

### Admin
- `GET /api/admin/exposure` - View system exposure
- `POST /api/admin/hedge/rebalance` - Trigger hedge rebalancing

## 🔍 Monitoring & Observability

- **Logging**: Winston with structured logs (no PII/secrets logged)
- **Metrics**: Datadog integration for system monitoring
- **Compliance**: Vanta integration for compliance tracking
- **Email Testing**: MailDev for local email testing

## 🚀 Production Deployment

### Environment Variables
Use your platform's secret management:
- **Vercel**: Environment Variables in dashboard
- **AWS/ECS**: Parameter Store or Secrets Manager
- **Render/Railway**: Built-in secret management

### Database Migrations
```bash
# Run migrations (when implemented)
cd backend && npm run migrate
```

### Security Checklist
- [ ] All `.env` files excluded from git
- [ ] Secrets managed via cloud provider
- [ ] Rate limiting enabled on auth endpoints
- [ ] JWT secrets rotated regularly
- [ ] Database connections use SSL in production
- [ ] API endpoints protected with proper authentication

## 📋 Compliance & Legal

### KYC Requirements
- **Personal**: Identity verification, address verification, document upload
- **Business**: Entity verification, UBO identification, licensing validation
- **Ongoing**: AML monitoring, transaction screening

### Regulatory Considerations
- Money transmission licenses (state-by-state)
- Precious metals dealer licensing
- CFTC regulations for commodities trading
- FinCEN reporting requirements
- State sales tax compliance for physical delivery

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Add tests for new functionality
3. Update API documentation in `openapi.yaml`
4. Never commit secrets or credentials
5. Follow security best practices for PII handling

## 📞 Support

- **Development Issues**: Create GitHub issue
- **Security Concerns**: Contact security team directly
- **Production Support**: Use monitoring alerts and escalation procedures

---

**⚠️ Important**: This is financial infrastructure software. All changes must be thoroughly tested and security reviewed before production deployment.

---

# 🚀 Phase-3 Features: Vaulted Tokens & Advanced Operations

**STATUS: SCAFFOLDING COMPLETE - FEATURES DISABLED BY DEFAULT**

Phase-3 introduces advanced vault-backed token functionality, multi-strategy fulfillment, customer service tools, and onchain preparation. All features are **OFF by default** to ensure MVP stability.

## 🏛️ Vaulted Token System

### Overview
- **Physical Backing**: 1:1 tokens backed by physical precious metals in secure vaults
- **Redemption Process**: Users can redeem synthetic tokens for physical delivery
- **Audit Trail**: Complete tracking from minting to redemption with proof of reserves
- **Multi-Location**: Support for multiple vault facilities (Brinks, etc.)

### Vault Inventory Management
```typescript
// Models: VaultInventory, RedemptionRequest
interface VaultInventory {
  metal: 'AU' | 'AG' | 'PT' | 'PD' | 'CU';
  sku: string; // e.g., 'AU-EAGLE-1OZ'
  format: 'BAR' | 'COIN' | 'SHEET' | 'COIL' | 'ROUND';
  qtyAvailable: number;
  qtyReserved: number;
  vaultLocation: string;
  unitCost: string;
}
```

### Database Schema
- **vault_inventory**: Physical inventory tracking
- **redemption_requests**: User redemption requests
- **vault_audit_log**: Complete audit trail of inventory changes

## 🔄 Multi-Strategy Fulfillment System

### Fulfillment Strategies
Configure via `FULFILLMENT_STRATEGY` environment variable:

#### JM Bullion Strategy (Default)
- **Delivery**: 5-7 business days
- **Shipping**: UPS/FedEx options
- **Cost**: Lower shipping fees
- **Cancellation**: 24-hour window

#### Brinks Memphis Strategy
- **Delivery**: 3-4 business days (faster)
- **Shipping**: FedEx only
- **Cost**: Higher fees for premium service
- **Cancellation**: No cancellations once processed

### Auto-Restocking Integration
After every fulfillment, automatic restock triggered via **Dillon Gage**:
- Vault inventory replenishment
- Branch inventory management
- Real-time stock level monitoring
- Automated reorder points

## 🎯 Customer Service & Support Module

### Role-Based Access Control (RBAC)
New user roles for customer operations:

#### SUPPORT Role
- Remote customer service team
- User profile access (balances, KYC, trades, orders)
- Password reset capabilities
- Order adjustment authority
- Internal note management

#### TELLER Role  
- Bank/franchise branch operators
- In-person customer assistance
- Account verification support
- Physical redemption processing
- Branch-specific operations

#### Admin Privileges
- Full system access
- Audit trail viewing
- Support team statistics
- System configuration

### Support Dashboard Features
- **Pending Items**: KYC reviews, redemptions, order issues
- **User Search**: Find customers by email, name, phone, order ID
- **Quick Actions**: Password resets, order expedites, refunds
- **Activity Log**: Track all support actions with full audit trail
- **Performance Metrics**: Response times, resolution rates, satisfaction scores

### Customer Service API Endpoints
```bash
# Support Dashboard
GET /api/support/dashboard

# User Management  
GET /api/support/search?q=john@example.com
GET /api/support/user/:id
POST /api/support/user/:id/reset-password
POST /api/support/user/:id/note

# Order Management
POST /api/support/order/:id/adjust

# Admin Only
GET /api/support/audit/:userId
GET /api/support/stats
```

## 🏦 Vault Operations & Redemptions

### Redemption Process Flow
1. **Quote Request**: User gets redemption quote with fees
2. **Request Submission**: Complete shipping address required
3. **Inventory Allocation**: Physical inventory reserved (24hr lock)
4. **Admin Approval**: Support team reviews and approves
5. **Fulfillment**: Shipping via selected strategy
6. **Delivery Tracking**: Real-time tracking updates

### Vault Management API
```bash
# Admin Vault Operations
GET /api/vault/inventory
GET /api/vault/inventory/summary  
GET /api/vault/inventory/low-stock
POST /api/vault/inventory/restock
POST /api/vault/inventory/auto-restock

# Redemption Management
GET /api/vault/redemptions/pending
POST /api/vault/redemptions/:id/approve
POST /api/vault/redemptions/:id/ship

# User Redemption Interface
GET /api/redeem/quote?asset=XAU-s&amount=1.0&format=COIN
POST /api/redeem
GET /api/redeem/history
GET /api/redeem/status/:id
POST /api/redeem/:id/cancel
```

### Inventory Monitoring
- **Low Stock Alerts**: Automatic notifications when inventory drops below thresholds
- **Restock Automation**: Triggered restock orders via Dillon Gage integration
- **Audit Compliance**: Daily inventory reconciliation and reporting
- **Multi-Location Support**: Track inventory across multiple vault facilities

## ⛓️ Onchain Infrastructure (Preparation Only)

### Smart Contract Architecture
**⚠️ STUB IMPLEMENTATION - NOT PRODUCTION READY**

Located in `/onchain/` directory with Hardhat framework:

#### ERC20VaultToken.sol
- Vault-backed ERC20 tokens for synthetic precious metals
- Mint/burn only by authorized backend services
- Compliance controls (blacklisting, daily limits)
- Emergency pause functionality
- Full audit trail of physical backing

#### ProofOfReserves.sol
- Cryptographic proof system for vault backing verification
- Merkle tree proofs for individual vault holdings
- Integration with Chainlink oracles for price verification
- Time-locked reserve updates for security
- External auditor integration

### Development Setup
```bash
cd onchain/
npm install
npm run compile
npm run test
npm run deploy:localhost
```

**CRITICAL**: These contracts require security audit before any production deployment.

## 🔧 Feature Flag Configuration

### Environment Variables
```bash
# Phase Control
PHASE=1                          # 1=MVP, 2=Enhanced, 3=Full
ENABLE_VAULT_REDEMPTION=false    # Enable redemption system
ENABLE_ONCHAIN=false             # Enable smart contracts
FULFILLMENT_STRATEGY=JM          # JM | BRINKS

# Service Integration  
DILLON_GAGE_API_KEY=            # Inventory restocking
BRINKS_API_KEY=                 # Alternative fulfillment
JM_BULLION_API_KEY=             # Primary fulfillment
```

### Runtime Behavior
- **PHASE=1**: All Phase-3 features return `501 Not Implemented`
- **ENABLE_VAULT_REDEMPTION=false**: Redemption endpoints return `501`
- **ENABLE_ONCHAIN=false**: Smart contracts not deployed
- **FULFILLMENT_STRATEGY**: Controls which fulfillment provider is used

### Gradual Rollout Strategy
```bash
# Stage 1: Internal Testing
PHASE=3 ENABLE_VAULT_REDEMPTION=true FULFILLMENT_STRATEGY=JM

# Stage 2: Beta Users
# Enable for specific user cohort with feature flags

# Stage 3: Full Production
# Enable all features after thorough testing
```

## 🧪 Comprehensive Testing Strategy

PBCEx implements a multi-layered testing approach covering unit, integration, E2E, contract, load, security, and A/B testing. For detailed information, see [TESTPLAN.md](./TESTPLAN.md).

### Quick Start Testing

```bash
# Setup test environment
cd backend && npm ci
createdb pbcex_test
npm run migrate:test

# Run all tests
npm test

# Test with coverage
npm run test:coverage
```

### Testing Commands Summary

#### Core Test Suites
```bash
# Unit tests (90%+ coverage target)
npm run test:unit

# Integration tests with real services
npm run test:integration

# API integration tests
npm run test:api

# End-to-end tests
cd e2e && npm test

# Watch mode for development
npm run test:watch
```

#### Specialized Testing
```bash
# Contract testing (OpenAPI validation)
npm run validate:openapi
npm run test:contract

# Security audit & vulnerability scan
npm run audit
npm test tests/unit/security.test.ts

# Load testing (requires k6)
npm run loadtest
k6 run loadtests/k6/scenarios/trade_order.js

# A/B experiment testing
npm test tests/unit/experimentService.test.ts
npm test tests/integration/api/analytics.api.test.ts
```

### Feature Flag Testing

| Flag | Default | Test Command | Expected Result |
|------|---------|--------------|-----------------|
| `ENABLE_VAULT_REDEMPTION=false` | ✅ | `npm run test:api` | 501 responses for redemption |
| `ENABLE_VAULT_REDEMPTION=true` | ❌ | `ENABLE_VAULT_REDEMPTION=true npm run test:api` | Full redemption processing |
| `FULFILLMENT_STRATEGY=JM` | ✅ | `npm test tests/unit/fulfillment.test.ts` | JM Bullion fulfillment |
| `FULFILLMENT_STRATEGY=BRINKS` | ❌ | `FULFILLMENT_STRATEGY=BRINKS npm test tests/unit/fulfillment.test.ts` | Brinks fulfillment |

### Testing Phase-3 Features

#### Vault Redemption Testing
```bash
# Test disabled state (returns 501)
npm run test:api

# Test enabled state
PHASE=3 ENABLE_VAULT_REDEMPTION=true npm run dev

# Test redemption API
curl -X POST http://localhost:4001/api/redeem \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "asset": "AU",
    "qty": "1.0",
    "format": "bar",
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Dallas",
      "state": "TX", 
      "zipCode": "75201",
      "country": "US"
    }
  }'
```

#### Support Module Testing
```bash
# Test support endpoints (requires SUPPORT role)
curl -X GET "http://localhost:4001/api/support/search?q=john@example.com" \
  -H "Authorization: Bearer SUPPORT_TOKEN"

# Run support-specific tests
npm test src/__tests__/support.test.ts
```

#### A/B Experiment Testing
```bash
# Test experiment assignment consistency
node -e "
const exp = require('./backend/src/services/ExperimentService');
console.log('User A:', exp.ExperimentService.assignVariant('user-a', 'test_exp'));
console.log('User A again:', exp.ExperimentService.assignVariant('user-a', 'test_exp'));
"

# Test analytics integration
npm test tests/integration/api/analytics.api.test.ts
```

### CI/CD Integration

Our GitHub Actions pipeline runs:

1. **Lint & Code Quality** - ESLint, TypeScript compilation
2. **Unit Tests** - Jest with 90%+ coverage requirement  
3. **Integration Tests** - API tests with PostgreSQL/Redis
4. **Contract Tests** - OpenAPI specification validation
5. **Security Audit** - Vulnerability scanning
6. **Build & Package** - Application builds
7. **E2E Tests** - Playwright browser testing
8. **Load Tests** - k6 performance validation (optional)

#### CI Commands
```bash
# Simulate full CI pipeline locally
npm run ci:local

# Pre-commit validation
npm run pre-commit

# Production readiness check
npm run production:preflight
```

#### Test Artifacts
- JUnit XML test results
- Code coverage reports (HTML, LCOV, JSON)
- Security audit reports
- Load test performance metrics
- E2E test screenshots/videos
- Contract validation reports

### Performance Targets

| Metric | Target (95th percentile) | Critical Threshold |
|--------|-------------------------|--------------------|
| Authentication | <200ms | <1000ms |
| Price Feeds | <100ms | <500ms |
| Trading Operations | <300ms | <1500ms |
| Shop/Checkout | <400ms | <2000ms |
| Admin Operations | <500ms | <2500ms |

### Test Data & Privacy

- **Synthetic Data Only**: No real customer data in tests
- **GDPR Compliant**: All test data anonymized/generated
- **Automated Cleanup**: Test data purged after 30 days
- **Access Control**: Test environment access requires explicit permissions

## 📮 API Collections (Postman/Thunder Client)

PBCEx provides comprehensive API testing collections for both Postman and Thunder Client, covering all MVP and Phase-3 endpoints with automatic token management and response validation.

### Quick Start

#### Postman Setup
1. **Import Collection**: Import `tooling/postman/PBCEx.postman_collection.json`
2. **Import Environment**: Import `tooling/postman/PBCEx.local.postman_environment.json` (or staging)
3. **Get Tokens**: Run `Auth → Login User` and `Auth → Admin Login` to populate tokens
4. **Test API**: Execute requests or use Collection Runner for automated testing

#### Thunder Client Setup  
1. **Import Collection**: Import `tooling/thunder/thunder-collection_PBCEx.json`
2. **Import Environment**: Import `tooling/thunder/thunder-environment_local.json` (or staging)
3. **Get Tokens**: Run authentication requests to populate tokens automatically
4. **Test API**: Execute individual requests or full collection

### Collection Structure

#### 📁 **Auth** - Authentication & User Management
- `GET /health` - Health check (no auth required)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login → sets `{{userToken}}`
- `POST /api/auth/login` - Admin login → sets `{{adminToken}}`
- `GET /api/auth/me` - Current user profile

#### 📁 **KYC** - Know Your Customer
- `POST /api/kyc/submit` - Submit personal information
- `GET /api/kyc/status` - Check KYC verification status

#### 📁 **Wallet** - Balance Management
- `GET /api/wallet/balances` - View funding and trading balances
- `POST /api/wallet/transfer` - Transfer PAXG → XAU-s between accounts

#### 📁 **Trade** - Asset Trading
- `GET /api/trade/prices?asset=AU` - Get current precious metal prices
- `POST /api/trade/order` - Place market conversion orders

#### 📁 **Shop** - Physical Products
- `GET /api/shop/products?metal=AU&category=BARS` - Browse product catalog
- `POST /api/shop/lock-quote` - Lock price quote → sets `{{quoteId}}`
- `POST /api/shop/checkout` - Purchase with locked quote

#### 📁 **Admin** - Administrative Operations
- `GET /api/admin/exposure` - System risk exposure (admin only)

#### 📁 **Phase-3** - Feature-Gated Endpoints
- `POST /api/redeem` - Request physical asset redemption
- `GET /api/redeem/status/{id}` - Track redemption progress
- `GET /api/redeem/quote` - Get redemption pricing
- `GET /api/vault/inventory` - View vault inventory (admin only)

**Note**: Phase-3 endpoints return `501 Not Implemented` when features are disabled

#### 📁 **Experiments & Analytics** - A/B Testing
- `GET /api/analytics/experiments/assignments` - Get user's experiment variants
- `POST /api/analytics/experiments/assign` - Assign specific experiments
- `POST /api/analytics/event` - Track user events and interactions
- `POST /api/analytics/performance` - Log performance metrics

### Environment Variables

| Variable | Local | Staging | Purpose |
|----------|-------|---------|---------|
| `{{baseUrl}}` | `http://localhost:4001` | `https://api.staging.pbcex.com` | API base URL |
| `{{userToken}}` | Auto-filled | Auto-filled | JWT for regular users |
| `{{adminToken}}` | Auto-filled | Auto-filled | JWT for admin users |
| `{{quoteId}}` | Auto-filled | Auto-filled | Price quote ID for checkout |
| `{{redemptionId}}` | Auto-filled | Auto-filled | Redemption request ID |

### Testing Workflows

#### 🧪 **MVP Smoke Test** (Collection Runner)
1. Health Check → Register → Login → Get Profile
2. Submit KYC → Check Status
3. Get Balances → Transfer Assets  
4. Get Prices → Place Trade
5. Browse Products → Lock Quote → Checkout
6. Admin: Check Exposure

#### 🔬 **Phase-3 Feature Testing**
1. **Enable Features**: Set `ENABLE_VAULT_REDEMPTION=true` in backend
2. **Restart Backend**: `cd backend && npm run dev`
3. **Test Redemption Flow**: 
   - Get Quote → Request Redemption → Check Status
   - Admin: View Inventory → Process Requests

#### 📊 **A/B Testing Validation**
1. **Get Assignments**: Check current experiment variants
2. **Assign Experiments**: Request specific experiment assignments
3. **Track Events**: Log user interactions and conversions
4. **Performance Metrics**: Monitor page load times and API response times

### Feature Flag Testing

| Feature Flag | Default | Test Behavior | Collection Requests |
|--------------|---------|---------------|-------------------|
| `ENABLE_VAULT_REDEMPTION=false` | ✅ | Returns `501 Not Implemented` | Redemption, Vault folders |
| `ENABLE_VAULT_REDEMPTION=true` | ❌ | Full redemption processing | All Phase-3 requests work |
| `FULFILLMENT_STRATEGY=JM` | ✅ | Uses JM Bullion fulfillment | Shop checkout behavior |
| `FULFILLMENT_STRATEGY=BRINKS` | ❌ | Uses Brinks fulfillment | Shop checkout behavior |

### Response Validation

All collection requests include automated tests that verify:
- ✅ **Status Codes**: 2xx for success, 501 for disabled features, 4xx for client errors
- ✅ **Response Structure**: Required fields present and correct types
- ✅ **Token Management**: Automatic token extraction and environment variable updates
- ✅ **Performance**: Response time under acceptable thresholds
- ✅ **Business Logic**: Correct data flow between requests (quote → checkout)

### Convenience Commands

```bash
# Display collection file paths
npm run postman:open
npm run thunder:open

# Example output:
# 📮 Postman Collection: tooling/postman/PBCEx.postman_collection.json
# 🌍 Local Environment: tooling/postman/PBCEx.local.postman_environment.json
# 🏢 Staging Environment: tooling/postman/PBCEx.staging.postman_environment.json
```

### Advanced Usage

#### **Newman CLI** (Postman Command Line)
```bash
# Install Newman
npm install -g newman

# Run collection with local environment
newman run tooling/postman/PBCEx.postman_collection.json \
  --environment tooling/postman/PBCEx.local.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export test-results.json

# Run only MVP smoke tests
newman run tooling/postman/PBCEx.postman_collection.json \
  --environment tooling/postman/PBCEx.local.postman_environment.json \
  --folder "Auth" --folder "Wallet" --folder "Trade" --folder "Shop"
```

#### **CI/CD Integration**
```yaml
# GitHub Actions example
- name: API Contract Testing
  run: |
    newman run tooling/postman/PBCEx.postman_collection.json \
      --environment tooling/postman/PBCEx.staging.postman_environment.json \
      --reporters junit \
      --reporter-junit-export api-test-results.xml
    
- name: Upload Test Results
  uses: actions/upload-artifact@v4
  with:
    name: api-test-results
    path: api-test-results.xml
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| `401 Unauthorized` | Run Auth/Login to refresh tokens |
| `501 Not Implemented` | Enable Phase-3 features in backend |
| `Connection Refused` | Start backend: `cd backend && npm run dev` |
| Missing Variables | Re-import environment file and run login |
| Expired Quotes | Re-run Lock Quote before Checkout |

## 🩺 Environment Doctor

The Environment Doctor is a comprehensive configuration validation tool that ensures all required environment variables are properly set before application startup. This prevents runtime failures and provides clear guidance for configuration issues.

### Features

- ✅ **Backend Validation**: Uses the same Zod schema as runtime for accurate validation
- 🌐 **Frontend Validation**: Validates all `NEXT_PUBLIC_*` environment variables
- 📊 **Categorized Output**: Groups variables by functionality (Core, Auth, Market, etc.)
- 🎨 **Color-Coded Results**: Green for configured, red for missing, yellow for optional
- 📈 **Statistics**: Shows configuration completion percentage and detailed summary
- 🔒 **Security**: Masks sensitive values in output (shows first/last chars only)
- 🤖 **CI/CD Ready**: Exits with proper codes for automated pipeline integration

### Usage

#### Quick Start
```bash
# 1. Bootstrap environment (automated setup)
npm run setup:env

# 2. Validate configuration
npm run env:doctor

# 3. For production deployments, use strict mode
npm run env:doctor:strict
```

#### Manual Setup (Alternative)
```bash
# 1. Copy environment templates manually
cp env-template .env
cp backend/env-template backend/.env
cp frontend/env-template frontend/.env.local

# 2. Fill in required values in the .env files
# Edit .env, backend/.env, and frontend/.env.local

# 3. Run the Environment Doctor
npm run env:doctor
```

#### Bootstrap Environment 🚀

The automated environment bootstrap handles the tedious setup work for you:

```bash
# One command to set up everything
npm run setup:env

# What it does:
# 1. 📄 Copies template files if missing
# 2. 🔐 Generates secure random secrets (JWT_SECRET, etc.)
# 3. ⚙️  Sets required configuration defaults
# 4. 🛡️  Preserves existing real values (won't overwrite)
```

**Generated Secrets:**
- `JWT_SECRET`: 48 random bytes (base64url encoded)
- `SESSION_SECRET`: 48 random bytes (base64url encoded)  
- `ENCRYPTION_KEY`: 32 random bytes (64 hex characters)

**Configured Defaults:**
- `NODE_ENV=development`
- `PORT=4001` (backend API port)
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pbcex`
- `REDIS_URL=redis://localhost:6379`
- `NEXT_PUBLIC_APP_NAME=PBCEx`
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:4001`

**Safety Features:**
- Won't overwrite existing real configuration values
- Detects and replaces placeholder values (`replace_me`, `changeme`, etc.)
- Creates files from templates or generates minimal configuration
- Shows summary of all changes made

**Example Output:**
```bash
🚀 PBCEx Environment Bootstrap

📄 Copying Template Files
──────────────────────────────────────────────────
   ✅ Created Backend Environment → backend/.env

🔧 Backend Environment Configuration
──────────────────────────────────────────────────
   ✅ Generated JWT_SECRET (JSON Web Token signing secret)
   ✅ Generated SESSION_SECRET (Session cookie signing secret)
   ✅ Generated ENCRYPTION_KEY (Data encryption key)
   ✅ Set NODE_ENV = development
   ✅ Set DATABASE_URL = postgresql://postgres:postgres@localhost:5432/pbcex

📊 Bootstrap Summary
=====================================
✅ Bootstrap completed successfully
📝 Actions performed (5):
   1. Created Backend Environment from template
   2. Generated secure JWT_SECRET
   3. Generated secure SESSION_SECRET
   4. Generated secure ENCRYPTION_KEY
   5. Set NODE_ENV to development

🚀 Next Steps
─────────────
• All preflight checks passed
• Ready to start development servers
  npm run dev:all
```

#### Expected Output
```bash
🩺 PBCEx Environment Doctor

Validating configuration for reliable startup...

🔧 Backend Environment Variables
──────────────────────────────────────────────────

📂 Core
   Essential application settings
   ✅ NODE_ENV = development
   ✅ PORT = 4001
   ✅ DATABASE_URL = postgres://user:****@localhost:5432/pbcex
   ✅ REDIS_URL = redis://localhost:6379

📂 Auth/Security
   Authentication and security configuration
   ✅ JWT_SECRET = abcd****wxyz
   ✅ SESSION_SECRET = 1234****5678
   ✅ ENCRYPTION_KEY = key1****key9

📂 Market
   Market data and pricing
   ⚠️  TRADINGVIEW_API_KEY (optional, not set)

🌐 Frontend Environment Variables
──────────────────────────────────────────────────

📂 Frontend Core
   Essential frontend configuration
   ✅ NEXT_PUBLIC_APP_NAME = PBCEx
   ✅ NEXT_PUBLIC_API_BASE_URL = http://localhost:4001

📊 Environment Doctor Summary
==================================================
✅ DIAGNOSIS: HEALTHY
   All critical environment variables are properly configured.

📈 Configuration Statistics:
   ✅ Configured: 28/34 (82%)
   ⚠️  Missing Optional: 6

💡 Recommendations:
   • Configure optional integrations as needed for full functionality

📁 Configuration Files:
   • Root: .env
   • Backend: backend/.env
   • Frontend: frontend/.env.local
```

### Variable Categories

#### 🔧 **Backend Variables**

| Category | Variables | Required | Description |
|----------|-----------|----------|-------------|
| **Core** | NODE_ENV, PORT, DATABASE_URL, REDIS_URL | ✅ Yes | Essential application settings |
| **Auth/Security** | JWT_SECRET, SESSION_SECRET, ENCRYPTION_KEY | ✅ Yes | Authentication and security |
| **Market** | TRADINGVIEW_API_KEY | ⚠️ Optional | Market data and pricing |
| **KYC/Custody** | PLAID_*, PAXOS_*, PRIMETRUST_*, ANCHORAGE_* | ⚠️ Optional | Identity verification & custody |
| **Fulfillment/Logistics** | JM_BULLION_*, DILLON_GAGE_*, FEDEX_* | ⚠️ Optional | Physical asset fulfillment |
| **Payments** | STRIPE_SECRET_KEY | ⚠️ Optional | Payment processing |
| **Messaging/Support** | SENDGRID_*, TWILIO_*, INTERCOM_* | ⚠️ Optional | Communication services |
| **Monitoring** | DATADOG_API_KEY, VANTA_API_KEY | ⚠️ Optional | Observability and compliance |
| **Feature Flags** | PHASE, ENABLE_*, FULFILLMENT_STRATEGY | ⚠️ Optional | Phase-3 and experimental features |

#### 🌐 **Frontend Variables**

| Category | Variables | Required | Description |
|----------|-----------|----------|-------------|
| **Frontend Core** | NEXT_PUBLIC_APP_NAME, NEXT_PUBLIC_API_BASE_URL | ✅ Yes | Essential frontend config |
| **Frontend Features** | NEXT_PUBLIC_ENABLE_* | ⚠️ Optional | Feature toggles |
| **Frontend Integrations** | NEXT_PUBLIC_STRIPE_*, NEXT_PUBLIC_GOOGLE_* | ⚠️ Optional | Third-party integrations |

### Environment File Locations

```
pbcex/
├── .env                     # Root environment (shared)
├── backend/
│   └── .env                 # Backend-specific variables
├── frontend/
│   └── .env.local           # Frontend-specific variables
└── scripts/
    └── envDoctor.ts         # Environment Doctor tool
```

### CI/CD Integration

The Environment Doctor runs automatically in GitHub Actions CI/CD pipeline:

```yaml
- name: Environment Doctor
  run: npm run env:doctor
  env:
    # Basic required variables for CI validation
    NODE_ENV: test
    PORT: 4001
    DATABASE_URL: postgresql://testuser:testpass@localhost:5432/pbcex_test
    REDIS_URL: redis://localhost:6379
    JWT_SECRET: test-jwt-secret-key-must-be-32-characters-long
    # ... other required variables
```

**Pipeline Behavior:**
- ✅ **Exit Code 0**: All critical variables configured - pipeline continues
- ❌ **Exit Code 1**: Missing critical variables - pipeline fails
- 🔄 **Warnings**: Optional variables missing - pipeline continues with warnings

### Security Features

- **🔐 Value Masking**: Sensitive values (containing SECRET, KEY, TOKEN, etc.) are automatically masked
- **📊 Safe Logging**: Only first and last 4 characters shown for secrets
- **🚫 No Exposure**: Full values never logged or displayed
- **✅ Validation Only**: Tool validates presence and format, not actual values

### Troubleshooting

| Issue | Solution |
|-------|----------|
| `❌ Missing required variables` | Copy env-template files and fill required values |
| `Command not found: ts-node` | Run `npm install` to install dependencies |
| `Cannot find module 'zod'` | Run `npm install` in root and backend directories |
| `Database connection string invalid` | Check DATABASE_URL format: `postgresql://user:pass@host:port/db` |
| `JWT_SECRET too short` | Use at least 32 characters for all secret keys |

### Advanced Usage

#### Custom Validation
```bash
# Run with specific environment files
NODE_ENV=production npm run env:doctor

# Check specific environment
cd backend && NODE_ENV=staging npm run env:doctor
```

#### One-Shot Setup 🚀

The ultimate first-run experience that handles everything from zero to running:

```bash
# One command to set up everything from scratch
npm run first-run

# What it does:
# 1. 🚀 Environment bootstrap (setup:env)
# 2. 🔐 Secrets generation (secrets:set)
# 3. ✈️  Strict environment validation (env:doctor:strict)
# 4. 🐳 Docker infrastructure startup
# 5. 🔍 Preflight connectivity checks
# 6. 🌱 Development data seeding
# 7. 🔄 Concurrent backend + frontend startup
```

**Perfect for:**
- 🆕 New developers joining the project
- 🖥️ Fresh machine setup
- 🔄 Complete environment reset
- 🚀 Zero-to-running in one command

**Requirements:**
- Docker Desktop installed and running
- Node.js 18+ and npm

**What you get:**
- ✅ Backend API running on http://localhost:4001
- ✅ Frontend UI running on http://localhost:3000
- ✅ PostgreSQL database on localhost:5432
- ✅ Redis cache on localhost:6379
- ✅ Seeded development data (admin/user accounts, products)
- ✅ Hot reload for both backend and frontend

**How to stop:**
- Press `Ctrl+C` to stop all services
- Docker services will be automatically stopped

**Example Output:**
```bash
🚀 PBCEx First-Run Setup
========================
One-shot development environment setup

🚀 Step 1/7: Environment Bootstrap
──────────────────────────────────
✅ Environment bootstrap completed

🚀 Step 2/7: Secrets Generation
───────────────────────────────
✅ Generated JWT_SECRET (JSON Web Token signing secret)
✅ Generated SESSION_SECRET (Session cookie signing secret)
✅ Generated ENCRYPTION_KEY (Data encryption key)

🚀 Step 3/7: Environment Validation
────────────────────────────────────
✅ Environment validation passed

🚀 Step 4/7: Infrastructure Setup
─────────────────────────────────
✅ Docker services started successfully

🚀 Step 5/7: Preflight Checks
─────────────────────────────
✅ All preflight checks passed

🚀 Step 6/7: Data Seeding
─────────────────────────
✅ Development data seeded successfully

🚀 Step 7/7: Development Servers
────────────────────────────────
[backend] Server running on http://localhost:4001
[frontend] Ready - started server on 0.0.0.0:3000
```

#### One Command Development 🚀

For subsequent development sessions (after first-run):

```bash
# Quick start for existing setup
npm run dev:all

# What it does:
# 1. 🚀 Environment bootstrap (setup:env)
# 2. ✈️  Preflight checks (preflight) 
# 3. 🐳 Docker availability check
# 4. 📦 Infrastructure startup  
# 5. 🔄 Concurrent dev servers
```

**Use this when:**
- ✅ Environment is already set up
- ✅ Docker services are available
- 🚀 Quick development session start

#### Development Workflow
```bash
# 1. Clone repository
git clone <repo-url>
cd pbcex

# 2. Set up environment
npm run env:doctor  # Will show missing variables

# 3. Configure environment
cp env-template .env
# Fill in required values...

# 4. Validate configuration
npm run env:doctor  # Should show ✅ HEALTHY

# 5. Start development
npm run dev
```

#### Strict Mode 🚫

For production deployments, use **strict mode** to catch placeholder values that might have been forgotten:

```bash
# Run strict validation
npm run env:doctor:strict

# Or via environment variable
ENV_DOCTOR_STRICT=true npm run env:doctor

# Or directly with ts-node
ts-node --esm scripts/envDoctor.ts --strict
```

**Strict Mode Detects:**
- Empty or whitespace-only values (`""`, `" "`)
- Common placeholders (`replace_me`, `changeme`)
- Pattern placeholders (`your_api_key_here`, `your_secret_here`)
- Test Stripe keys in production (`sk_test_*` when `NODE_ENV=production`)

**When to Use Strict Mode:**
- ✅ **Production deployments** - Ensures no placeholders slip through
- ✅ **Staging environments** - Validates realistic configuration
- ✅ **CI/CD pipelines** - Automated production readiness checks
- ❌ **Local development** - May be too restrictive for dev placeholders

**Example Strict Mode Output:**
```bash
🩺 PBCEx Environment Doctor
⚡ STRICT MODE: Checking for placeholder values

📂 Auth/Security
   🚫 JWT_SECRET = replace_me (placeholder value "replace_me")
   ✅ SESSION_SECRET = abcd****wxyz

📊 Environment Doctor Summary
❌ DIAGNOSIS: UNHEALTHY
   1 placeholder value(s) detected in strict mode.

🚫 Strict Mode Violations:
   • JWT_SECRET: placeholder value "replace_me"

💡 Recommendations:
   1. Replace placeholder values with actual configuration
   2. Ensure no test keys are used in production environments
   3. Run with --strict flag again to verify fixes
```

The Environment Doctor ensures reliable application startup by catching configuration issues early, before they cause runtime failures! 🚀

## 🔐 Security & Compliance Updates

### Enhanced RBAC
- **New Roles**: SUPPORT, TELLER with specific permissions
- **Admin Controls**: Audit trail access, system statistics
- **Action Logging**: All support actions logged with full context
- **Authorization Checks**: Role-based endpoint access

### Data Protection
- **PII Handling**: Support interactions properly log-safe
- **Audit Trail**: Complete record of all system changes
- **Access Controls**: Strict role-based access to sensitive data
- **Compliance Reporting**: Ready for regulatory examination

### API Security
- **Rate Limiting**: All new endpoints properly rate-limited
- **Input Validation**: Zod schemas for all request/response data
- **Error Handling**: Consistent error responses without data leakage
- **Authentication**: JWT-based auth for all protected endpoints

## 📊 Operational Dashboards

### Support Team Dashboard
- **Pending Queue**: KYC reviews, redemptions, escalations
- **Performance Metrics**: Response times, resolution rates, CSAT
- **Quick Actions**: Common support tasks streamlined
- **Team Statistics**: Agent performance and workload distribution

### Admin Vault Dashboard
- **Inventory Levels**: Real-time stock across all locations
- **Restock Alerts**: Automated notifications for low inventory
- **Redemption Pipeline**: Track requests from submission to delivery
- **Financial Metrics**: Total vault value, redemption volume

### Fulfillment Analytics
- **Strategy Performance**: JM vs Brinks delivery metrics
- **Cost Analysis**: Shipping fees, success rates, customer satisfaction
- **Volume Trends**: Fulfillment demand patterns
- **Error Tracking**: Failed deliveries, damaged shipments

## 🚀 Deployment & Operations

### Production Readiness Checklist
- [ ] Feature flags properly configured
- [ ] Database migrations tested
- [ ] External service integrations validated  
- [ ] RBAC permissions verified
- [ ] Audit logging enabled
- [ ] Monitoring alerts configured
- [ ] Security review completed
- [ ] Performance testing passed

### Monitoring & Alerting
**New Metrics to Monitor:**
- Vault inventory levels
- Redemption processing times
- Support ticket resolution rates
- Fulfillment success rates
- Feature flag usage patterns
- API error rates for new endpoints

### Backup & Recovery
- **Database**: Include new vault and redemption tables
- **Audit Logs**: Ensure support action logs are backed up
- **Inventory Data**: Critical for compliance and operations
- **Smart Contract State**: If/when onchain features are enabled

## 📈 Business Impact

### Revenue Streams
- **Redemption Fees**: 1% fee on physical redemption value
- **Premium Fulfillment**: Higher margins on Brinks expedited service
- **Vault Services**: Storage fees for long-term holdings
- **Branch Operations**: Teller services for franchise network

### Operational Efficiency
- **Automated Restocking**: Reduces manual inventory management
- **Support Tools**: Streamlined customer service operations
- **Multi-Strategy Fulfillment**: Optimized cost vs speed options
- **Compliance Automation**: Built-in audit trails and reporting

### Risk Management
- **Inventory Controls**: Real-time tracking prevents overselling
- **Dual Fulfillment**: Reduces single-point-of-failure risk
- **Audit Trail**: Complete compliance documentation
- **Feature Flags**: Safe deployment and quick rollback capability

---

## ⚠️ Phase-3 Important Notes

### Production Deployment
1. **Start with ALL features disabled** (default configuration)
2. **Test extensively** in staging environment
3. **Enable features gradually** with careful monitoring  
4. **Smart contracts require security audit** before any deployment
5. **Compliance review required** for new customer service features

### Support Team Training Required
- **New Dashboard**: Support agents need training on new interface
- **RBAC System**: Understanding role permissions and limitations
- **Redemption Process**: Physical fulfillment workflow
- **Escalation Procedures**: When to involve admins vs handle directly

### Technical Dependencies
- **Vault Provider Integration**: Brinks API setup required for secondary fulfillment
- **Dillon Gage Integration**: Automated restocking system configuration
- **Database Scaling**: New tables may require index optimization
- **Monitoring Updates**: New metrics and alerts configuration

**Next Steps**: Phase-3 scaffolding is complete. Enable features gradually with thorough testing and monitoring.
