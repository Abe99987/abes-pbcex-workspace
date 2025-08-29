# PBCEx Load Testing

This directory contains load testing scenarios and configuration for the PBCEx platform using [k6](https://k6.io/).

## Overview

The load testing suite simulates realistic user behavior across different aspects of the PBCEx platform:

- **Trading Operations**: Order placement, price monitoring, portfolio management
- **Price Feeds**: Real-time price updates, WebSocket connections, chart data
- **Authentication**: User login, session management, token validation
- **Shop/E-commerce**: Product browsing, cart operations, checkout flow

## Test Scenarios

### 1. Trade Order (`trade_order.js`)

Tests the core trading functionality under various load conditions:

- User authentication and session management
- Real-time price monitoring
- Market and limit order placement
- Order status tracking and management
- Portfolio balance checks

**Load Patterns:**
- **Smoke**: 1 VU for 30s (basic functionality)
- **Load**: 1→50 VUs over 20 minutes (normal expected load)
- **Stress**: 1→200 VUs over 25 minutes (above normal capacity)
- **Spike**: 10→200 VUs sudden spike (traffic burst simulation)

### 2. Price Polling (`price_polling.js`)

Tests price feed performance and real-time data delivery:

- HTTP price polling with different intervals
- WebSocket real-time price feeds
- Chart data loading for various timeframes
- Market data burst scenarios

**Load Patterns:**
- **HTTP Polling**: 30 concurrent users polling every 2 seconds
- **WebSocket Feeds**: 50 concurrent WebSocket connections
- **Chart Data**: 5→20 VUs requesting historical data
- **Market Burst**: 10→100 requests/second burst scenarios

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | API base URL | `http://localhost:4001` |
| `WS_URL` | WebSocket URL | `ws://localhost:4001` |
| `TEST_USERS` | Number of test users | `50` |
| `POLL_INTERVAL` | Price polling interval (seconds) | `2` |
| `THINK_TIME` | Delay between user actions (seconds) | `1` |

### Test Profiles

Configure different load profiles in `config.js`:

- **Smoke**: Minimal load for basic functionality verification
- **Load**: Normal expected traffic patterns
- **Stress**: Above-normal capacity testing
- **Spike**: Sudden traffic increase simulation
- **Volume**: High sustained load
- **Soak**: Extended duration testing (60 minutes)

## Performance Targets

### Response Time Targets (95th percentile)

| Endpoint | Target | Critical |
|----------|--------|----------|
| `/api/health` | <50ms | <100ms |
| `/api/auth/login` | <500ms | <1000ms |
| `/api/trade/prices` | <100ms | <200ms |
| `/api/trade/order` | <1000ms | <2000ms |
| `/api/wallet/balances` | <200ms | <500ms |

### Success Rate Targets

| Operation | Target | Critical |
|-----------|--------|----------|
| Overall HTTP | >99% | >98% |
| User Login | >99% | >95% |
| Order Placement | >98% | >95% |
| Price Updates | >99.5% | >99% |

## Running Tests

### Prerequisites

1. **Install k6**:
   ```bash
   # macOS
   brew install k6
   
   # Linux
   sudo apt-get install k6
   
   # Windows
   choco install k6
   ```

2. **Start PBCEx Services**:
   ```bash
   cd backend
   npm run dev  # API server on port 4001
   ```

3. **Set up Test Data** (optional):
   ```bash
   npm run migrate:test
   npm run seed:test-users
   ```

### Basic Test Execution

```bash
# Smoke test - quick functionality check
k6 run --env TEST_PROFILE=smoke scenarios/trade_order.js

# Load test - normal expected traffic
k6 run --env TEST_PROFILE=load scenarios/trade_order.js

# Price polling test
k6 run scenarios/price_polling.js

# Custom configuration
k6 run --env BASE_URL=http://localhost:4001 \
       --env TEST_USERS=100 \
       scenarios/trade_order.js
```

### Advanced Test Execution

```bash
# Stress test with custom thresholds
k6 run --env TEST_PROFILE=stress \
       --threshold http_req_duration=p(95)<1000 \
       --threshold http_req_failed=rate<0.05 \
       scenarios/trade_order.js

# Parallel scenario execution
k6 run --scenario-name=trading scenarios/trade_order.js \
       --scenario-name=pricing scenarios/price_polling.js

# Extended soak test
k6 run --env TEST_PROFILE=soak scenarios/trade_order.js

# Output results to file
k6 run --out json=results.json scenarios/trade_order.js

# Real-time monitoring with InfluxDB
k6 run --out influxdb=http://localhost:8086/k6 scenarios/trade_order.js
```

### CI/CD Integration

```bash
# Automated testing in CI pipeline
k6 run --quiet --no-color --out json=loadtest-results.json scenarios/trade_order.js

# Check exit code for pass/fail
if [ $? -eq 0 ]; then
  echo "Load test passed"
else
  echo "Load test failed"
  exit 1
fi
```

## Test Data Management

### Test User Setup

The tests assume test users exist with the pattern:
- Email: `loadtest{1-N}@example.com`
- Password: `LoadTest123!`
- Roles: Mixed (USER, ADMIN, SUPPORT, TELLER)

Create test users:
```bash
# Backend helper script
npm run create-test-users -- --count 100
```

### Data Cleanup

Clean up test data after runs:
```bash
npm run cleanup-test-data
```

## Monitoring and Analysis

### Real-time Monitoring

1. **k6 Dashboard**: Use `--out web-dashboard` for real-time metrics
2. **Grafana Integration**: Export metrics to Grafana for visualization
3. **Prometheus**: Export to Prometheus for alerting

### Result Analysis

```bash
# View HTML report
k6 run --out web-dashboard scenarios/trade_order.js

# Export to CSV for analysis
k6 run --out csv=results.csv scenarios/trade_order.js

# JSON output for programmatic analysis
k6 run --out json=results.json scenarios/trade_order.js
```

### Key Metrics to Monitor

#### Performance Metrics
- **Response Times**: p50, p95, p99 latencies
- **Throughput**: Requests per second
- **Error Rates**: HTTP failures, timeouts
- **Concurrent Users**: Active VU count

#### Business Metrics
- **Login Success Rate**: Authentication reliability
- **Order Success Rate**: Trading functionality reliability
- **Price Update Rate**: Real-time data delivery
- **WebSocket Connection Success**: Real-time connectivity

#### System Metrics (Monitor Separately)
- CPU usage and memory consumption
- Database connection pool usage
- Cache hit rates (Redis)
- Network bandwidth utilization

## Interpreting Results

### Success Criteria

✅ **Test Passes If**:
- All thresholds are met
- Error rate < 1%
- Response times within targets
- No system crashes or degradation

❌ **Test Fails If**:
- Any threshold exceeded
- Error rate > 5%
- System becomes unresponsive
- Data corruption occurs

### Common Issues and Solutions

#### High Response Times
- Check database query performance
- Review API endpoint optimization
- Verify adequate resources (CPU/Memory)
- Check network latency

#### High Error Rates
- Review application logs
- Check database connection limits
- Verify authentication token management
- Monitor rate limiting configuration

#### WebSocket Issues
- Check connection limits
- Review message queuing
- Monitor memory usage for connections
- Verify proper connection cleanup

## Feature Flag Testing

Some tests validate feature flag behavior:

```bash
# Test with vault redemption enabled
k6 run --env ENABLE_VAULT_REDEMPTION=true scenarios/trade_order.js

# Test with different fulfillment strategy
k6 run --env FULFILLMENT_STRATEGY=BRINKS scenarios/trade_order.js

# Phase 3 features testing
k6 run --env PHASE=3 scenarios/trade_order.js
```

## Performance Optimization

### Backend Optimizations
1. **Database Indexing**: Ensure proper indexes on frequently queried fields
2. **Connection Pooling**: Optimize database connection pool size
3. **Caching**: Implement Redis caching for frequently accessed data
4. **Rate Limiting**: Configure appropriate rate limits

### Load Test Optimizations
1. **Think Time**: Add realistic delays between user actions
2. **Ramp-up Patterns**: Use gradual load increases
3. **Data Variation**: Use diverse test data to avoid cache artifacts
4. **Connection Reuse**: Enable HTTP keep-alive connections

## Troubleshooting

### Common k6 Issues

```bash
# Debug mode for detailed output
k6 run --verbose scenarios/trade_order.js

# Check specific HTTP requests
k6 run --http-debug="full" scenarios/trade_order.js

# Validate JavaScript syntax
k6 run --no-setup scenarios/trade_order.js
```

### System Resource Issues

```bash
# Monitor system resources during tests
htop
iostat -x 1
netstat -an | grep :4001 | wc -l

# Check k6 resource usage
k6 run --max-redirects=10 --batch=20 scenarios/trade_order.js
```

## Best Practices

### Test Design
1. **Realistic Scenarios**: Model actual user behavior patterns
2. **Gradual Ramp-up**: Avoid sudden load spikes unless testing spike scenarios
3. **Think Time**: Include realistic delays between user actions
4. **Data Diversity**: Use varied test data to avoid unrealistic cache hits

### Environment Management
1. **Isolated Environment**: Use dedicated load testing environment
2. **Data Management**: Clean up test data between runs
3. **Monitoring**: Monitor both application and system metrics
4. **Documentation**: Document test scenarios and expected outcomes

### Result Analysis
1. **Trending**: Track performance over time
2. **Correlation**: Correlate load test results with system metrics
3. **Actionable Insights**: Focus on metrics that drive optimization decisions
4. **Regression Testing**: Use consistent test scenarios for comparison

## Integration with CI/CD

Example GitHub Actions workflow:

```yaml
name: Load Tests
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup k6
        uses: grafana/setup-k6-action@v1
      - name: Run Load Tests
        run: |
          k6 run --out json=results.json loadtests/k6/scenarios/trade_order.js
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: results.json
```

## Support

For issues with load testing:

1. Check the [k6 documentation](https://k6.io/docs/)
2. Review PBCEx API documentation
3. Check system logs during test execution
4. Monitor application metrics dashboard

## Contributing

When adding new load test scenarios:

1. Follow existing patterns in `config.js`
2. Include appropriate thresholds
3. Add documentation for new scenarios
4. Test scenarios in isolation first
5. Update this README with new scenarios
