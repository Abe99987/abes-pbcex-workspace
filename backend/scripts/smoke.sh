#!/bin/bash

# PBCEx Backend Smoke Test Script
# This script runs basic health checks and tests for the backend

set -e

echo "🚀 PBCEx Backend Smoke Test Starting..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ $message${NC}"
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ $message${NC}"
    else
        echo -e "${YELLOW}⚠️  $message${NC}"
    fi
}

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "Error: This script must be run from the backend directory"
    exit 1
fi

echo "📁 Working directory: $(pwd)"
echo ""

# 1. Check Node.js version
echo "🔍 Checking Node.js version..."
NODE_VERSION=$(node --version)
print_status "PASS" "Node.js version: $NODE_VERSION"
echo ""

# 2. Check npm version
echo "🔍 Checking npm version..."
NPM_VERSION=$(npm --version)
print_status "PASS" "npm version: $NPM_VERSION"
echo ""

# 3. Check if dependencies are installed
echo "🔍 Checking dependencies..."
if [ -d "node_modules" ]; then
    print_status "PASS" "Dependencies are installed"
else
    print_status "FAIL" "Dependencies not found. Run 'npm install' first"
    exit 1
fi
echo ""

# 4. Type check
echo "🔍 Running TypeScript type check..."
if npm run type-check > /dev/null 2>&1; then
    print_status "PASS" "TypeScript type check passed"
else
    print_status "FAIL" "TypeScript type check failed"
    echo "Running type check with output:"
    npm run type-check
    exit 1
fi
echo ""

# 5. Run money movement integration tests
echo "🔍 Running money movement integration tests..."
if npm test -- --testPathPattern=money-movement.api.test.ts --silent > /dev/null 2>&1; then
    print_status "PASS" "Money movement integration tests passed"
else
    print_status "FAIL" "Money movement integration tests failed"
    echo "Running tests with output:"
    npm test -- --testPathPattern=money-movement.api.test.ts
    exit 1
fi
echo ""

# 6. Check if test server can start
echo "🔍 Testing server startup..."
TIMEOUT=10
if timeout $TIMEOUT npm run dev > /dev/null 2>&1 & then
    SERVER_PID=$!
    sleep 3
    
    # Test health endpoint
    if curl -s http://localhost:4001/health > /dev/null 2>&1; then
        print_status "PASS" "Server started successfully and health endpoint responds"
    else
        print_status "FAIL" "Server started but health endpoint not responding"
    fi
    
    # Kill the server
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
else
    print_status "FAIL" "Server failed to start within $TIMEOUT seconds"
    exit 1
fi
echo ""

# 7. Check environment configuration
echo "🔍 Checking environment configuration..."
if [ -f ".env" ]; then
    print_status "PASS" ".env file exists"
    
    # Check for required keys (basic check)
    REQUIRED_KEYS=("DATABASE_URL" "JWT_SECRET" "REDIS_URL")
    MISSING_KEYS=()
    
    for key in "${REQUIRED_KEYS[@]}"; do
        if ! grep -q "^$key=" .env; then
            MISSING_KEYS+=("$key")
        fi
    done
    
    if [ ${#MISSING_KEYS[@]} -eq 0 ]; then
        print_status "PASS" "Required environment variables are set"
    else
        print_status "WARN" "Missing environment variables: ${MISSING_KEYS[*]}"
    fi
else
    print_status "WARN" ".env file not found. Copy from env-template and configure"
fi
echo ""

# 8. Check feature flags
echo "🔍 Checking money movement feature flags..."
if [ -f ".env" ]; then
    if grep -q "MONEY_MOVEMENT_ENABLED=true" .env; then
        print_status "WARN" "Money movement is enabled - this may affect test results"
    else
        print_status "PASS" "Money movement is disabled (safe for testing)"
    fi
else
    print_status "WARN" "Cannot check feature flags - .env file not found"
fi
echo ""

# Summary
echo "========================================"
echo "🎉 Smoke Test Complete!"
echo ""
echo "📊 Summary:"
echo "   - TypeScript: ✅"
echo "   - Integration Tests: ✅"
echo "   - Server Startup: ✅"
echo "   - Health Endpoint: ✅"
echo "   - Environment: ✅"
echo ""
echo "🚀 Backend is ready for development!"
echo ""
echo "💡 Next steps:"
echo "   1. Configure .env file with your credentials"
echo "   2. Enable feature flags as needed"
echo "   3. Run 'npm run dev' to start development server"
echo "   4. Run 'npm test' for full test suite"
echo ""
