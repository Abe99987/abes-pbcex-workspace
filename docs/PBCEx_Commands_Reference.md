# 📚 PBCEx Commands Reference

## 🚀 Quick Start Commands

### **🆕 First Time Setup**
```bash
# Complete one-shot setup (recommended for new developers)
npm run first-run

# What it does:
# 1. Environment bootstrap + secret generation
# 2. Strict validation + Docker startup
# 3. Preflight checks + data seeding
# 4. Concurrent backend + frontend startup
```

### **🔄 Daily Development**
```bash
# Quick start for existing setup
npm run dev:all

# What it does:
# 1. Environment validation
# 2. Docker infrastructure startup
# 3. Concurrent dev servers
```

---

## 🔧 Environment Management

### **🚀 Environment Bootstrap**
```bash
# Set up environment files from templates
npm run setup:env

# What it creates:
# - backend/.env (from backend/env-template)
# - frontend/.env.local (from frontend/env-template)
# - Sets required configuration defaults
```

### **🔐 Secrets Generation**
```bash
# Generate secure secrets for development
npm run secrets:set

# What it generates:
# - JWT_SECRET (48 random bytes, base64url)
# - SESSION_SECRET (48 random bytes, base64url)
# - ENCRYPTION_KEY (32 random bytes, 64 hex chars)
```

### **🩺 Environment Validation**
```bash
# Standard environment validation
npm run env:doctor

# Strict validation (production-ready)
npm run env:doctor:strict

# What it checks:
# - Required environment variables
# - Placeholder value detection
# - Configuration categories (Core, Auth, Market, etc.)
```

---

## 🐳 Infrastructure Management

### **🚀 Docker Services**
```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View service status
docker compose ps

# View logs
docker compose logs -f [service-name]

# Restart specific service
docker compose restart [service-name]
```

### **🔍 Preflight Checks**
```bash
# Validate system connectivity
npm run preflight

# What it checks:
# - Environment configuration
# - PostgreSQL connectivity
# - Redis connectivity
```

---

## 🌱 Development Data

### **🌱 Data Seeding**
```bash
# Seed development database
npm run dev:seed

# What it creates:
# - Admin user: admin@pbcex.local
# - Regular user: user@pbcex.local
# - Account balances (USD, PAXG, XAU-s, XAG-s)
# - Shop products (Gold, Silver, Platinum, Palladium, Copper)
```

### **🗄️ Database Management**
```bash
# Run migrations (when implemented)
npm run migrate

# Run test migrations
npm run migrate:test

# Seed database (when implemented)
npm run seed
```

---

## 🧪 Testing Commands

### **🔬 Unit Tests**
```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test categories
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:api           # API tests only
```

### **🔌 Integration Tests**
```bash
# Run API integration tests
npm run test:api

# Run all integration tests
npm run test:integration

# Run specific test files
npm run test -- tests/integration/auth.api.test.ts
```

### **🌐 End-to-End Tests**
```bash
# Run all E2E tests
npm run e2e

# Run E2E tests in headed mode
npm run e2e:headed

# Run specific E2E test
npm run e2e -- auth.e2e.spec.ts
```

### **📊 Contract Tests**
```bash
# Run contract tests (disabled by default)
npm run test:contract

# Enable contract tests
RUN_CONTRACT_TESTS=true npm run test:contract

# Validate OpenAPI spec only
npm run validate:openapi
```

### **⚡ Load Tests**
```bash
# Run k6 load tests
npm run loadtest

# Run specific load test scenario
k6 run loadtests/k6/scenarios/trade_order.js
k6 run loadtests/k6/scenarios/price_polling.js
```

---

## 🚀 Development Servers

### **🔧 Backend Development**
```bash
# Start backend dev server
cd backend && npm run dev

# What it does:
# - TypeScript compilation
# - Hot reload on changes
# - Server on http://localhost:4001
```

### **🌐 Frontend Development**
```bash
# Start frontend dev server
cd frontend && npm run dev

# What it does:
# - Next.js development server
# - Hot reload on changes
# - Server on http://localhost:3000
```

### **🔄 Concurrent Development**
```bash
# Start both servers concurrently
npm run dev:all

# What it does:
# - Backend + frontend simultaneously
# - Colored, prefixed logs
# - Graceful shutdown on Ctrl+C
```

---

## 🧹 Code Quality

### **🔍 Linting**
```bash
# Lint all code
npm run lint

# Lint with auto-fix
npm run lint:fix

# Lint specific directories
npm run lint -- backend/src
npm run lint -- frontend/src
```

### **🔒 Security Audit**
```bash
# Run security audit
npm run audit

# Fix security issues (if possible)
npm audit fix

# Fix security issues (with breaking changes)
npm audit fix --force
```

---

## 📦 Build & Deployment

### **🏗️ Building**
```bash
# Build backend
cd backend && npm run build

# Build frontend
cd frontend && npm run build

# Build for development
npm run build:dev
```

### **🚀 Starting Production**
```bash
# Start production backend
cd backend && npm start

# Start production frontend
cd frontend && npm start
```

---

## 🛠️ Tooling & Utilities

### **📮 API Testing**
```bash
# Show Postman collection paths
npm run postman:open

# Show Thunder Client paths
npm run thunder:open

# What it shows:
# - Collection file locations
# - Environment file locations
# - Import instructions
```

### **📄 Documentation**
```bash
# Convert PDF to Markdown
npm run pdf2md

# What it does:
# - Processes PDF files in scripts/
# - Converts to readable markdown
# - Useful for documentation updates
```

---

## 🔄 Phase-3 Feature Testing

### **🚩 Feature Flag Testing**
```bash
# Test Phase-3 features (when enabled)
npm run test:phase3

# What it tests:
# - Redemption functionality
# - Fulfillment strategies
# - Support module features
```

### **🔧 Environment-Specific Testing**
```bash
# Test with specific feature flags
ENABLE_VAULT_REDEMPTION=true npm run test:phase3
FULFILLMENT_STRATEGY=BRINKS npm run test:phase3
PHASE=3 npm run test:phase3
```

---

## 🐛 Troubleshooting Commands

### **🔍 Debug Environment**
```bash
# Check environment configuration
npm run env:doctor:strict

# Verify secrets are properly set
npm run secrets:set

# Check Docker service status
docker compose ps
```

### **🔄 Reset Development Environment**
```bash
# Stop all services
docker compose down

# Clean up volumes (WARNING: deletes all data)
docker compose down -v

# Restart from scratch
npm run first-run
```

### **🧹 Clean Dependencies**
```bash
# Clean node_modules
rm -rf node_modules package-lock.json
npm install

# Clean specific package
cd backend && rm -rf node_modules package-lock.json && npm install
cd frontend && rm -rf node_modules package-lock.json && npm install
```

---

## 📊 Monitoring & Logs

### **📝 View Logs**
```bash
# View all service logs
docker compose logs -f

# View specific service logs
docker compose logs -f postgres
docker compose logs -f redis
docker compose logs -f maildev

# View backend logs
cd backend && npm run dev

# View frontend logs
cd frontend && npm run dev
```

### **📈 Performance Monitoring**
```bash
# Run performance tests
npm run loadtest

# Monitor resource usage
docker stats

# Check service health
docker compose ps
```

---

## 🚀 Advanced Usage

### **🔧 Custom Environment Variables**
```bash
# Override environment for specific commands
NODE_ENV=staging npm run env:doctor
ENABLE_VAULT_REDEMPTION=true npm run test:phase3
RUN_CONTRACT_TESTS=true npm run test:contract
```

### **🐳 Docker Compose Overrides**
```bash
# Use custom compose file
docker compose -f docker-compose.override.yml up -d

# Scale specific services
docker compose up -d --scale backend=2

# Use specific profiles
docker compose --profile development up -d
```

### **🧪 Test Environment Setup**
```bash
# Set up test database
npm run migrate:test

# Run tests with test environment
NODE_ENV=test npm run test

# Clean test data
npm run test:cleanup
```

---

## 📚 Command Categories Summary

### **🚀 Setup & Onboarding**
- `npm run first-run` - Complete first-time setup
- `npm run setup:env` - Environment bootstrap
- `npm run secrets:set` - Secret generation

### **🔄 Daily Development**
- `npm run dev:all` - Quick development start
- `npm run dev:seed` - Seed test data
- `npm run preflight` - System validation

### **🧪 Testing & Quality**
- `npm run test` - Unit tests
- `npm run test:integration` - Integration tests
- `npm run e2e` - End-to-end tests
- `npm run lint` - Code quality checks

### **🐳 Infrastructure**
- `docker compose up -d` - Start services
- `docker compose down` - Stop services
- `npm run preflight` - Connectivity checks

### **📦 Build & Deploy**
- `npm run build` - Build applications
- `npm start` - Start production servers
- `npm run audit` - Security checks

---

## 🎯 Best Practices

### **🆕 New Developer Workflow**
1. **Clone & Setup**: `git clone && npm run first-run`
2. **Daily Start**: `npm run dev:all`
3. **Testing**: `npm run test` before committing
4. **Validation**: `npm run env:doctor:strict` before PRs

### **🔄 Daily Development Workflow**
1. **Start Services**: `npm run dev:all`
2. **Make Changes**: Edit code with hot reload
3. **Run Tests**: `npm run test` for changes
4. **Commit**: Use conventional commit format
5. **Stop Services**: Ctrl+C to stop dev servers

### **🚀 Production Deployment**
1. **Environment**: Set production environment variables
2. **Validation**: `npm run env:doctor:strict`
3. **Build**: `npm run build` for all packages
4. **Deploy**: Use deployment scripts/tools
5. **Monitor**: Check logs and health endpoints

---

## 📝 Command Reference Quick Sheet

```bash
# 🚀 Essential Commands
npm run first-run          # Complete setup
npm run dev:all            # Daily development
npm run env:doctor:strict  # Validate environment
npm run test               # Run all tests

# 🐳 Infrastructure
docker compose up -d        # Start services
docker compose down         # Stop services
npm run preflight          # Check connectivity

# 🧪 Testing
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run e2e                # End-to-end tests
npm run lint               # Code quality

# 🔧 Utilities
npm run secrets:set        # Generate secrets
npm run dev:seed           # Seed test data
npm run postman:open       # Show API tools
```

---

**PBCEx Team** - Building the future of commodity trading 🚀

*This command reference is maintained alongside the codebase and updated with each new script or command.*
