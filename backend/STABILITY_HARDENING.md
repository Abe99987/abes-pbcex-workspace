# Jest/CI Stability Hardening Guide

## Overview

This document outlines the permanent "no-stall" hardening implemented to prevent Jest wedging issues and CI instability.

## Node/Package Hygiene ✅

### Version Pinning

- **`.nvmrc`**: Pinned to `20.12.2`
- **`package.json engines`**: `"node": "20.x", "npm": ">=10.0.0"`
- **CI**: Uses exact version `20.12.2` in `NODE_VERSION`

### Package Management

- **CI**: Always uses `npm ci --prefer-offline --no-audit --no-fund`
- **Lockfile**: Single `package-lock.json` committed
- **Scripts disabled**: `NPM_CONFIG_IGNORE_SCRIPTS=true` in CI

## Jest Stability Flags ✅

### Configuration (`jest.config.js`)

```javascript
testTimeout: 20000,                           // 20s timeout vs 10s
detectOpenHandles: false,                     // Disabled for stability
forceExit: true,                             // Prevent hanging
maxWorkers: process.env.CI ? 1 : '50%',      // Single worker in CI
```

### Script Flags (`package.json`)

```bash
# All test scripts now include:
--runInBand --ci --no-cache --detectOpenHandles=false --forceExit
```

## Process Cleanup & Timeouts ✅

### Pre-Test Cleanup (Automatic)

```bash
# pretest script runs automatically:
pkill -f "node.*jest" 2>/dev/null || true && npx jest --clearCache
```

### CI Job Timeout

```yaml
timeout-minutes: 15 # Hard timeout prevents indefinite hangs
```

### Manual Unstick Kit

```bash
# Quick unstick command:
npm run unstick

# Or manually:
pkill -f "node.*jest" 2>/dev/null || true
npx jest --clearCache
npm ci --prefer-offline --no-audit --no-fund
```

## CI Workflow Guardrails ✅

### Job Environment (Stable)

```yaml
env:
  TEST_NO_DB: '1' # DB-less mode always
  NPM_CONFIG_IGNORE_SCRIPTS: 'true' # No postinstall scripts
  DATABASE_URL: 'postgresql://test:test@localhost/test' # Required for validation
  REDIS_URL: 'redis://localhost:6379'
  JWT_SECRET: 'test-jwt-secret-32-characters-long'
  SESSION_SECRET: 'test-session-secret-32-characters-long'
  ENCRYPTION_KEY: 'test-encryption-key-32-chars-long'
```

### Step Ordering (Stable)

1. `actions/checkout@v4`
2. `actions/setup-node@v4` (with cache: 'npm')
3. `npm ci --prefer-offline --no-audit --no-fund`
4. **Process cleanup + cache clear** ← NEW
5. `npm run lint:check`
6. `npm run type-check`
7. `npm run build`
8. `npm run build:check`
9. **Stable test run** with environment

## Available Scripts ✅

### New Convenience Scripts

```bash
npm run unstick              # Full unstick routine
npm run test:admin-dbless    # Admin API tests with unstick
npm run pretest              # Auto cleanup (runs before any test)
```

### Updated Scripts (All have stability flags)

```bash
npm run test                 # Main test with all flags
npm run test:unit            # Unit tests only
npm run test:integration     # Integration tests with flags
npm run test:ci              # CI-optimized test run
```

## Branch-Specific Behavior

### PR #14 (`feat/stubs-integrations-phase-1-3-4-B`)

- Runs **only** Admin API tests: `tests/integration/api/admin.api.test.ts`
- Uses `TEST_NO_DB=1` and all stability flags
- Single-process execution in CI

### All Other Branches

- Runs full `npm run test:unit` suite
- Uses all stability flags and process cleanup
- Standard test coverage and reporting

## Troubleshooting

### If Tests Still Hang

```bash
# Emergency unstick:
pkill -f "node.*jest" 2>/dev/null || true
pkill -f "node.*ts-node" 2>/dev/null || true
npx jest --clearCache
rm -rf node_modules/.cache
npm ci --prefer-offline --no-audit --no-fund
```

### If CI Fails on Environment

- Check that all required env vars are set in job environment
- Verify `TEST_NO_DB=1` is set globally for the job
- Confirm Node version matches `.nvmrc`

### Enable Diagnostics (Temporarily)

```bash
# In jest.config.js, temporarily change:
detectOpenHandles: true,     # Enable to see what's hanging
forceExit: false,           # Disable to see full error traces

# Then run:
npm run test:admin-dbless
```

## Force-Push Policy ✅

- **Disabled** for active PR branches to prevent cache invalidation
- Use normal pushes and let GitHub handle merge conflicts
- Force-push only when absolutely necessary (rebase conflicts)

## Files Modified

- `.nvmrc` - Node version pinning
- `package.json` - Engines, scripts, stability flags
- `backend/package.json` - Engines, scripts, stability flags
- `backend/jest.config.js` - Timeouts, worker limits, stability
- `.github/workflows/ci.yml` - Environment, ordering, timeouts
- `STABILITY_HARDENING.md` - This documentation

## Success Criteria

- ✅ No hanging Jest processes
- ✅ Consistent CI behavior across runs
- ✅ Fast local test execution with cleanup
- ✅ Branch-scoped test behavior (PR #14)
- ✅ Easy unstick recovery when needed
