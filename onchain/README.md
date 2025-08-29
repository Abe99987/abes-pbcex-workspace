# PBCEx Onchain Smart Contracts

**⚠️ PHASE-3 STUB IMPLEMENTATION ⚠️**

This directory contains stub smart contracts for PBCEx's future onchain vault-backed token system. 

## 🚨 Important Notice

**DO NOT DEPLOY TO PRODUCTION**

These contracts are:
- ✅ Functional stubs for development
- ✅ Architecture demonstration 
- ❌ **NOT** production ready
- ❌ **NOT** security audited
- ❌ **NOT** fully tested

## 📋 Contracts Overview

### ERC20VaultToken.sol
Vault-backed ERC20 token representing synthetic precious metals:
- **Features**: Mint/burn only by backend services, compliance controls, daily limits
- **Backing**: 1:1 with physical vault inventory
- **Roles**: MINTER_ROLE, BURNER_ROLE, COMPLIANCE_ROLE
- **Security**: Pausable, blacklisting, transfer limits

### ProofOfReserves.sol  
Cryptographic proof system for vault backing verification:
- **Features**: Merkle proof verification, audit trail, time-locked updates
- **Integration**: Chainlink oracle price feeds
- **Security**: Multi-sig governance, emergency pause

## 🛠️ Development Setup

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests  
npm run test

# Generate coverage report
npm run coverage
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run specific test file
npx hardhat test test/ERC20VaultToken.test.ts

# Run with gas reporting
REPORT_GAS=true npm run test
```

## 🚀 Local Deployment

```bash
# Start local Hardhat network
npx hardhat node

# Deploy to local network
npm run deploy:localhost

# Verify deployment
npx hardhat verify --network localhost <contract-address>
```

## 📦 Contract Architecture

```
┌─────────────────────┐
│   Backend Service   │
│  (Mint/Burn Auth)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌─────────────────────┐
│  ERC20VaultToken    │────▶│  ProofOfReserves   │
│  - XAUV (Gold)      │     │  - Merkle Proofs   │
│  - XAGV (Silver)    │     │  - Audit Trail     │
│  - XPTV (Platinum)  │     │  - Oracle Price    │
└─────────────────────┘     └─────────────────────┘
           │                           ▲
           ▼                           │
┌─────────────────────┐               │
│   User Wallets      │               │
│  - Transfer tokens  │               │
│  - Check backing    │───────────────┘
└─────────────────────┘
```

## 🔐 Security Considerations

### For Production Deployment:

1. **Multi-Signature Governance**
   - Admin roles controlled by multi-sig wallets
   - Emergency pause controlled by DAO/governance

2. **External Audits Required**
   - Smart contract security audit
   - Economic model review
   - Integration testing

3. **Oracle Integration**
   - Chainlink price feeds for backing verification
   - Redundant price sources
   - Circuit breakers for price anomalies

4. **Regulatory Compliance**
   - KYC/AML integration hooks
   - Jurisdiction-based restrictions
   - Reporting and monitoring

## 📊 Token Economics

| Metal     | Token | Max Supply | Initial Backing |
|-----------|-------|------------|-----------------|
| Gold      | XAUV  | 10M        | 1,000 oz        |
| Silver    | XAGV  | 100M       | 50,000 oz       |  
| Platinum  | XPTV  | 1M         | 500 oz          |

## 🔄 Backend Integration

### Mint Process
```javascript
// Backend calls when user deposits physical metal
await vaultToken.mintBacked(
    userAddress,
    tokenAmount,
    physicalOunces
);
```

### Burn Process  
```javascript
// Backend calls when user redeems physical metal
await vaultToken.burnBacked(
    userAddress, 
    tokenAmount,
    physicalOunces
);
```

## 📈 Monitoring & Maintenance

### Key Metrics to Monitor:
- Backing ratio (should always be ≥100%)
- Daily transfer volumes
- Compliance violations
- Oracle price accuracy
- Contract gas usage

### Emergency Procedures:
- Pause all transfers
- Emergency admin actions
- Audit trail verification
- Incident response plan

## 🚧 Development Roadmap

### Phase 3A (Current - Stubs Only)
- [x] Contract architecture design
- [x] Basic contract stubs
- [x] Development environment setup
- [ ] **DO NOT DEPLOY**

### Phase 3B (Future - Full Implementation)
- [ ] Complete contract implementation
- [ ] Comprehensive test suite
- [ ] Security audit engagement  
- [ ] Mainnet deployment preparation
- [ ] Backend service integration
- [ ] Monitoring and alerting setup

### Phase 3C (Future - Advanced Features)
- [ ] Cross-chain bridge support
- [ ] DeFi protocol integrations
- [ ] Advanced governance features
- [ ] Layer 2 deployment options

## 📞 Support

For development questions:
- **Internal**: Contact blockchain team
- **Security Issues**: Report to security@pbcex.com
- **Production Deployment**: Requires executive approval

## ⚖️ Legal Notice

These smart contracts handle financial assets and are subject to:
- Securities regulations
- Commodity trading laws
- Anti-money laundering requirements
- Know Your Customer compliance

Consult legal counsel before deployment.
