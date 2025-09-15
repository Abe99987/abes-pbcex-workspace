# Architecture TLDR

Quick reference for the PBCEx system architecture.

## Overview

PBCEx is a crypto trading platform with a microservices backend, React frontend, and blockchain integration layer.

**Core Stack:**

- Backend: Node.js/TypeScript, Express, PostgreSQL
- Frontend: React/Next.js, TypeScript, Tailwind CSS
- Blockchain: Ethereum, Hardhat, Chainlink oracles
- Infrastructure: Docker, CI/CD pipeline

## Invariants

### Security

- All trading operations require authentication
- Idempotency keys for critical operations
- Rate limiting on all public endpoints
- Input validation at API boundaries

### Data Integrity

- ACID transactions for financial operations
- Event sourcing for audit trail
- Database constraints and foreign keys
- Backup and disaster recovery procedures

### Performance

- Response time targets: < 200ms for trading APIs
- Database indexing on query paths
- Connection pooling and caching strategies
- Load balancing for horizontal scaling

## Phase-1 Surfaces

### Trading Core

- Market data streaming (WebSocket/SSE)
- Order placement and management
- Portfolio tracking and balances
- Trade history and reporting

### User Management

- Authentication and authorization
- KYC/compliance workflows
- User preferences and settings
- Multi-factor authentication

### Integration Points

- Price feed aggregation (Chainlink)
- Blockchain transaction monitoring
- External API integrations
- Third-party service connections

## Future Hooks

### Scaling Preparation

- Message queue architecture readiness
- Database sharding considerations
- CDN integration points
- Multi-region deployment paths

### Feature Extensibility

- Plugin architecture for new trading pairs
- Extensible order types and strategies
- White-label customization points
- API versioning strategy

---

_This is a living document - update as architecture evolves_
