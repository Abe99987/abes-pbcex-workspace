#!/bin/bash

# PBCEx Development Environment Startup Script
# 
# This script provides a one-command development environment setup that:
# 1. Validates environment configuration
# 2. Starts required infrastructure (Docker)
# 3. Installs dependencies and starts all services concurrently
#
# Usage: npm run dev:all (or directly: ./scripts/dev.sh)

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Header
echo -e "\n${BLUE}🚀 PBCEx Development Environment${NC}"
echo -e "${BLUE}=================================${NC}\n"

# Step 1: Environment bootstrap and validation
log_info "Step 1/5: Setting up environment configuration..."
if npm run setup:env; then
    log_success "Environment configuration setup complete"
else
    log_error "Environment setup failed"
    exit 1
fi

log_info "Step 2/5: Running preflight checks..."
if npm run preflight; then
    log_success "All preflight checks passed"
else
    log_error "Preflight checks failed"
    log_info "Please fix the issues above and try again"
    exit 1
fi

# Step 3: Check for Docker
log_info "Step 3/5: Checking Docker availability..."
if ! command -v docker >/dev/null 2>&1; then
    log_error "Docker is not installed or not in PATH"
    log_info "Please install Docker Desktop and try again"
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    log_error "Docker daemon is not running"
    log_info "Please start Docker Desktop and try again"
    exit 1
fi

log_success "Docker is available and running"

# Step 4: Start infrastructure services
log_info "Step 4/5: Starting infrastructure services..."
if [ -f docker-compose.yml ]; then
    log_info "Starting Docker Compose services in detached mode..."
    docker compose up -d
    log_success "Infrastructure services started"
    
    # Wait a moment for services to initialize
    log_info "Waiting for services to initialize..."
    sleep 3
else
    log_warn "No docker-compose.yml found, skipping infrastructure setup"
fi

# Step 5: Start development servers
log_info "Step 5/5: Starting development servers..."

# Check if concurrently is available
if ! command -v concurrently >/dev/null 2>&1 && ! npx concurrently --version >/dev/null 2>&1; then
    log_error "concurrently is not available"
    log_info "Installing concurrently..."
    npm install --save-dev concurrently
fi

log_info "Starting backend and frontend development servers..."
log_info "Press Ctrl+C to stop all services"

# Use concurrently to run backend and frontend
npx concurrently \
    --prefix "[{name}]" \
    --names "backend,frontend" \
    --prefix-colors "cyan,magenta" \
    --kill-others \
    --kill-others-on-fail \
    "cd backend && npm install && npm run dev" \
    "cd frontend && npm install && npm run dev"

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down development environment...${NC}"
    
    # Stop Docker services if they were started by this script
    if [ -f docker-compose.yml ]; then
        log_info "Stopping Docker Compose services..."
        docker compose down
        log_success "Infrastructure services stopped"
    fi
    
    echo -e "${GREEN}👋 Development environment shut down successfully${NC}"
}

# Set up cleanup on script exit
trap cleanup EXIT

# This shouldn't be reached due to concurrently, but just in case
log_success "Development environment is running!"
log_info "Access your applications at:"
log_info "  • Backend API: http://localhost:4001"
log_info "  • Frontend: http://localhost:3000"
log_info "  • Press Ctrl+C to stop all services"
