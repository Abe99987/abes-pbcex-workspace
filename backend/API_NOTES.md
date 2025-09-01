# PBCEx Backend API Notes

## Local Development Setup

### Authentication for Local Smoke Testing

The backend uses JWT-based authentication. For local development and testing:

1. **Generate a test JWT token**:

   ```bash
   # Using the test helper (if available)
   npm run generate-test-token

   # Or manually create one with a test secret
   node -e "console.log(require('jsonwebtoken').sign({userId: 'test-user', email: 'test@example.com'}, 'test-secret'))"
   ```

2. **Use in requests**:

   ```bash
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
        -H "Content-Type: application/json" \
        http://localhost:4001/api/transfers/internal
   ```

3. **Test server endpoints**:
   - Health: `GET /health` (no auth required)
   - Money movement: All require valid JWT token
   - Admin endpoints: Require admin role in JWT claims

### Environment Configuration

Copy `env-template` to `.env` and configure:

```bash
# Required for basic operation
DATABASE_URL=postgresql://user:pass@localhost:5432/pbcex
JWT_SECRET=your-secret-key-here
REDIS_URL=redis://localhost:6379

# Feature flags (all disabled by default for safety)
MONEY_MOVEMENT_ENABLED=false
DCA_ENABLED=false
CRYPTO_ENABLED=false
QR_ENABLED=false

# Rate limiting (conservative defaults)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX_REQUESTS=200
```

## Feature Flag Matrix

| Feature                   | Flag Name                | Default | Description                          | Dependencies    |
| ------------------------- | ------------------------ | ------- | ------------------------------------ | --------------- |
| **Money Movement Core**   | `MONEY_MOVEMENT_ENABLED` | `false` | Enables all money movement endpoints | Database, Redis |
| **Dollar Cost Averaging** | `DCA_ENABLED`            | `false` | DCA plans and backtesting            | Money Movement  |
| **Cryptocurrency**        | `CRYPTO_ENABLED`         | `false` | Crypto withdrawals and networks      | Money Movement  |
| **QR Payments**           | `QR_ENABLED`             | `false` | QR code payment tokens               | Money Movement  |
| **Recurring Transfers**   | `RECURRING_ENABLED`      | `false` | Scheduled transfer rules             | Money Movement  |
| **Card Funding**          | `CARD_FUNDING_ENABLED`   | `false` | Card funding preferences             | Money Movement  |

### Enabling Features Safely

1. **Start with core**: Enable `MONEY_MOVEMENT_ENABLED` first
2. **Test incrementally**: Enable one feature at a time
3. **Monitor logs**: Check for any startup errors
4. **Run smoke tests**: Use `./scripts/smoke.sh` to validate

## API Endpoint Groups

### Core Money Movement

- **Transfers**: Internal and external money transfers
- **Beneficiaries**: Transfer recipient management
- **Payment Requests**: Request-based payment flows

### Advanced Features

- **Recurring**: Scheduled transfer automation
- **DCA**: Dollar cost averaging strategies
- **Crypto**: Cryptocurrency operations
- **QR**: Quick payment tokens
- **Card Funding**: Card funding preferences

### Administrative

- **Quotes**: Rate and fee calculations
- **Audit**: Transaction logging and tracking
- **Feature Flags**: Runtime configuration

## Testing Strategy

### Integration Tests

- **Location**: `src/tests/money-movement.api.test.ts`
- **Coverage**: All 8 feature groups with auth validation
- **Execution**: `npm test -- --testPathPattern=money-movement.api.test.ts`

### Smoke Testing

- **Script**: `./scripts/smoke.sh`
- **Coverage**: Type check, tests, server startup, health checks
- **Usage**: Run from backend directory

### Manual Testing

- **Test Server**: `npm run dev` (starts on port 4001)
- **Health Check**: `GET /health`
- **API Explorer**: Swagger UI at `/api-docs` (if enabled)

## Error Handling

### Standard Response Format

```json
{
  "code": "ERROR_CODE",
  "message": "Human readable error message",
  "details": {
    "field": "Additional error context"
  }
}
```

### Common Error Codes

- `AUTHENTICATION_ERROR`: Invalid or missing JWT token
- `VALIDATION_ERROR`: Request body validation failed
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server-side error
- `FEATURE_DISABLED`: Feature flag is off

### Rate Limiting

- **Anonymous**: 100 requests per minute
- **Authenticated**: 200 requests per minute
- **Headers**: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Database Schema

### Money Movement Tables

- `transfers`: Internal and external transfers
- `beneficiaries`: Transfer recipients
- `payment_requests`: Payment request tracking
- `recurring_rules`: Scheduled transfer rules
- `dca_plans`: Dollar cost averaging plans
- `crypto_withdrawals`: Cryptocurrency operations
- `qr_tokens`: QR payment tokens

### Migration

- **File**: `db/migrations/005_money_movement.sql`
- **Status**: Ready for deployment
- **Rollback**: Includes down migration

## Performance Considerations

### Caching Strategy

- **Redis TTL**: 300 seconds for frequently accessed data
- **Database Pool**: 5-20 connections with 30s timeout
- **Rate Limiting**: In-memory with Redis fallback

### Monitoring Points

- Database connection pool utilization
- Redis memory usage and hit rates
- API response times (target: <100ms for read operations)
- Rate limit hit frequency

## Security Notes

### Authentication

- JWT tokens with configurable expiration
- Rate limiting per IP and per user
- Idempotency keys for write operations

### Data Validation

- Input sanitization on all endpoints
- Schema validation using Zod
- SQL injection prevention via parameterized queries

### Feature Flags

- All new features disabled by default
- Runtime configuration without restarts
- Audit logging for flag changes

## Troubleshooting

### Common Issues

1. **Database Connection**: Check `DATABASE_URL` and Postgres status
2. **Redis Connection**: Verify `REDIS_URL` and Redis service
3. **JWT Errors**: Ensure `JWT_SECRET` is set and consistent
4. **Feature Disabled**: Check feature flag configuration

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug npm run dev
```

### Health Checks

```bash
# Basic health
curl http://localhost:4001/health

# Detailed status
curl http://localhost:4001/health/detailed
```

## Next Steps

1. **Frontend Integration**: Frontend teams can now consume these APIs
2. **Performance Testing**: Load test high-traffic scenarios
3. **Monitoring**: Add metrics collection and alerting
4. **Documentation**: Expand OpenAPI specs with examples
5. **Code Quality**: Address remaining linting issues incrementally
