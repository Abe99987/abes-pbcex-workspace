# PBCEx - Physical-Backed Commodity Exchange

**Real commodity trading with instant settlement and physical delivery.** PBCEx enables traders to buy, sell, and take delivery of precious metals, oil, and other commodities using both traditional payment methods and cryptocurrency. All transactions are backed by real physical assets with transparent pricing via Chainlink oracles and TradingView data.

## 🚀 How to Run Locally (5 minutes)

```bash
# 1. Clone and install
git clone <YOUR_GIT_URL>
cd abes-pbcex-workspace
npm install --legacy-peer-deps

# 2. Setup environment
cp env-template .env
# Edit .env with your database credentials (see env-template for details)

# 3. Install dependencies for all services
cd backend && npm install --legacy-peer-deps && cd ..
cd frontend && npm install --legacy-peer-deps && cd ..
cd onchain && npm install --legacy-peer-deps && cd ..

# 4. Start all services
npm run dev:all
```

Open [http://localhost:8080](http://localhost:8080) - the app should be running with frontend, backend, and database connected.

## 🏗️ Architecture & Stack

**Frontend**: React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS  
**Backend**: Node.js + Express + TypeScript + PostgreSQL + Redis  
**Database**: Supabase (PostgreSQL) + Upstash (Redis)  
**Blockchain**: Ethereum + Hardhat + Chainlink Price Feeds  
**Infrastructure**: Docker + AWS + FedEx/Maersk APIs

### Key Services

- **Price Service**: Real-time quotes via TradingView + Chainlink oracles
- **Trade Engine**: Order matching with funding/trading account separation  
- **Wallet Service**: Multi-account balances (funding vs trading)
- **Order Management**: Advanced orders (bars/coins/Goldbacks) with physical fulfillment
- **Logistics**: FedEx integration for precious metals, Maersk for bulk commodities

### Service Endpoints

| Service | Endpoint | Description |
|---------|----------|-------------|
| Health | `GET /healthz` | Service health check |
| Prices | `GET /api/prices/XAU` | Real-time commodity pricing |
| Trades | `POST /api/trades/buy` | Execute buy orders |
| Trades | `POST /api/trades/sell` | Execute sell orders |  
| Orders | `POST /api/orders` | Advanced order creation |
| Wallet | `GET /api/wallets/balances` | Account balances |
| Wallet | `POST /api/wallets/deposit` | Deposit funds |
| Wallet | `POST /api/wallets/send` | Send/transfer assets |

## 🎯 Demo Script (Copy-Paste)

```bash
# Terminal 1: Start all services
npm run dev:all

# Terminal 2: Test the API
# Health check
curl http://localhost:4001/healthz

# Get real-time gold price
curl http://localhost:4001/api/prices/XAU

# Simulate a buy order (dry run)
curl -X POST http://localhost:4001/api/trades/buy \
  -H "Content-Type: application/json" \
  -d '{"symbol":"XAU","amount":"1","currency":"USD","dry_run":true}'

# Check wallet balances
curl http://localhost:4001/api/wallets/balances \
  -H "Authorization: Bearer <token>"
```

**Frontend Demo**:
1. Visit [http://localhost:8080](http://localhost:8080)
2. Navigate to Shop → see commodity grid with live prices
3. Click "Buy" on Gold → modal opens with USD/grams + payment methods
4. Click ticker area (XAU) → routes to `/shop/XAU` product page
5. Try "Sell" → realize/withdraw modal opens
6. Try "Order" → advanced order modal (bars/coins/Goldbacks)

## 🔧 Development

### Build & Test

```bash
# Type checking
npm run type-check

# Linting (backend has ESLint configured)
cd backend && npm run lint

# Build all services
npm run build
cd backend && npm run build

# Run tests
cd backend && npm test
cd e2e && npm test
```

### Environment Setup

Copy `env-template` to `.env` and configure:

**Required for basic demo**:
- `DATABASE_URL` - Supabase PostgreSQL connection
- `REDIS_URL` - Upstash Redis connection
- `JWT_SECRET` - Authentication secret

**Optional for full features**:
- `CHAINLINK_FEED_ADDRESS` - Price oracle integration
- `FEDEX_CLIENT_ID` - Shipping integration
- `STRIPE_SECRET_KEY` - Payment processing

See `env-template` for complete configuration options.

## 📁 Project Structure

```
├── src/                   # Frontend (React + TypeScript)
│   ├── components/        # UI components
│   ├── pages/            # Route components
│   └── hooks/            # Custom React hooks
├── backend/              # API server (Node.js + Express)
│   ├── src/              # Server source code
│   ├── tests/            # Backend tests
│   └── dist/             # Compiled JavaScript
├── onchain/              # Smart contracts (Hardhat)
│   ├── contracts/        # Solidity contracts  
│   ├── scripts/          # Deployment scripts
│   └── test/             # Contract tests
├── frontend/             # Next.js frontend (alternative)
├── e2e/                  # End-to-end tests (Playwright)
└── docs/                 # Documentation
```

## 🔗 Related Files

- **[Phase Completion](./PHASE_1_COMPLETION.md)** - Development progress tracking
- **[Project Scope](./docs/PROJECT_SCOPE.md)** - Technical requirements
- **[Integration Notes](./docs/INTEGRATIONS.md)** - External API integrations
- **[Chainlink Setup](./docs/CHAINLINK.md)** - Oracle configuration
- **[Security Notes](./docs/SECURITY_SECRETS.md)** - Security considerations

## 📞 Support

- **Deployment**: Deploy via [Lovable](https://lovable.dev/projects/702a2666-551b-410e-9f61-8cab42ab8b95)
- **Custom Domain**: Project > Settings > Domains → [Domain Guide](https://docs.lovable.dev/tips-tricks/custom-domain)
- **API Testing**: Import `tooling/postman/PBCEx.postman_collection.json` into Postman

---

*Built for YC W25 · Revolutionizing commodity trading with blockchain transparency and physical delivery*