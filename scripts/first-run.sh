#!/usr/bin/env bash

# PBCEx First-Run Orchestrator 🚀
#
# One-shot setup that handles everything from zero to running development servers:
# 1. Environment bootstrap and secret generation
# 2. Strict environment validation
# 3. Docker infrastructure startup
# 4. Database connectivity checks
# 5. Development data seeding
# 6. Concurrent backend + frontend startup
#
# Usage: npm run first-run
#
# POSIX-safe with proper error handling and graceful shutdown

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
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

log_step() {
    echo -e "\n${BLUE}🚀 $1${NC}"
    echo -e "${BLUE}${2//?/─}${NC}"
}

# Cleanup function to ensure Docker is stopped on script exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down PBCEx development environment...${NC}"
    
    # Stop Docker Compose services
    if [ -f docker-compose.yml ]; then
        log_info "Stopping Docker Compose services..."
        docker compose down --remove-orphans || true
        log_success "Docker services stopped"
    fi
    
    echo -e "${GREEN}✅ PBCEx development environment shutdown complete${NC}"
    echo -e "${BLUE}💡 To restart: npm run first-run${NC}"
}

# Set up trap to call cleanup on script exit
trap cleanup EXIT INT TERM

# Header
echo -e "\n${BLUE}🚀 PBCEx First-Run Setup${NC}"
echo -e "${BLUE}========================${NC}"
echo -e "${CYAN}One-shot development environment setup${NC}\n"

# Step 1: Environment Bootstrap
log_step "Step 1/7: Environment Bootstrap" "Setting up configuration files..."
if npm run setup:env; then
    log_success "Environment bootstrap completed"
else
    log_error "Environment bootstrap failed"
    exit 1
fi

# Step 2: Secrets Generation
log_step "Step 2/7: Secrets Generation" "Generating secure secrets..."
if npm run secrets:set; then
    log_success "Secrets generation completed"
else
    log_error "Secrets generation failed"
    exit 1
fi

# Step 3: Strict Environment Validation
log_step "Step 3/7: Environment Validation" "Running strict validation..."
if npm run env:doctor:strict; then
    log_success "Environment validation passed"
else
    log_error "Environment validation failed"
    log_info "Please fix the configuration issues above and try again"
    exit 1
fi

# Step 4: Docker Infrastructure
log_step "Step 4/7: Infrastructure Setup" "Starting Docker services..."

# Check Docker availability
if ! command -v docker >/dev/null 2>&1; then
    log_error "Docker is not installed or not in PATH"
    log_info "Please install Docker Desktop and ensure it's running"
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    log_error "Docker daemon is not running"
    log_info "Please start Docker Desktop"
    exit 1
fi

log_success "Docker is available and running"

# Start Docker Compose services
if [ -f docker-compose.yml ]; then
    log_info "Starting Docker Compose services in detached mode..."
    if docker compose up -d; then
        log_success "Docker services started successfully"
        
        # Wait a moment for services to be ready
        log_info "Waiting for services to be ready..."
        sleep 5
    else
        log_error "Failed to start Docker Compose services"
        exit 1
    fi
else
    log_warn "No docker-compose.yml found, skipping infrastructure setup"
fi

# Step 5: Preflight Checks
log_step "Step 5/7: Preflight Checks" "Validating system connectivity..."
if npm run preflight; then
    log_success "All preflight checks passed"
else
    log_error "Preflight checks failed"
    log_info "Please ensure Docker services are running and try again"
    exit 1
fi

# Step 6: Development Data Seeding
log_step "Step 6/7: Data Seeding" "Seeding development database..."
if npm run dev:seed; then
    log_success "Development data seeded successfully"
else
    log_error "Data seeding failed"
    log_warn "Continuing without seeded data..."
fi

# Step 7: Development Servers
log_step "Step 7/7: Development Servers" "Starting backend and frontend..."

# Check if concurrently is available
if ! command -v concurrently >/dev/null 2>&1 && ! npx concurrently --version >/dev/null 2>&1; then
    log_info "Installing concurrently..."
    npm install --save-dev concurrently
fi

# Install dependencies and start servers
log_info "Installing dependencies and starting development servers..."

# Use concurrently to run both dev servers
concurrently \
    --kill-others-on-fail \
    --prefix "[{name}]" \
    --prefix-colors "${CYAN},${MAGENTA}" \
    --raw \
    "cd backend && npm install --legacy-peer-deps && npm run dev" \
    "cd frontend && npm install --legacy-peer-deps && npm run dev"

# Note: The script will exit when concurrently finishes or when interrupted
# The cleanup trap will handle Docker shutdown
