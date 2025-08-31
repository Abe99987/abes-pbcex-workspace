# Chainlink Oracle Integration

This document describes the Chainlink Data Feeds integration for PBCEx, providing on-chain price oracles for cross-validation with TradingView and other price sources.

## Overview

The Chainlink integration consists of:

1. **Smart Contracts**: Solidity contracts for reading Chainlink price feeds
2. **Backend Service**: Node.js service for reading prices off-chain via RPC
3. **REST API**: Endpoint for fetching current oracle prices
4. **Testing**: Mock contracts and unit tests for local development

## Architecture

### Smart Contracts

- `PriceFeedConsumer.sol`: Main contract for reading Chainlink aggregator data
- `LocalMockFeed.sol`: Mock aggregator for testing (inherits from MockV3Aggregator)

### Backend Components

- `chainlinkPrice.ts`: Service for reading prices via ethers.js
- `priceOracleRoutes.ts`: REST API routes
- Redis caching with configurable TTL

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Chainlink Oracle Configuration
RPC_URL_MAINNET=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
RPC_URL_SEPOLIA=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
CHAINLINK_FEED_ADDRESS=0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
```

### Supported Feed Addresses

#### Mainnet

- **ETH/USD**: `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419`
- **BTC/USD**: `0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c`

#### Sepolia Testnet

- **BTC/USD**: `0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43`
- **ETH/USD**: `0x694AA1769357215DE4FAC081bf1f309aDC325306`

For the complete list of available feeds, visit:
https://docs.chain.link/data-feeds/price-feeds/addresses

## Usage

### REST API

GET `/api/oracle/chainlink`

Query parameters:

- `feed` (optional): Feed contract address
- `rpc` (optional): RPC URL to use

Response:

```json
{
  "price": "350000000000",
  "decimals": 8,
  "roundId": "18446744073709562763",
  "updatedAt": 1672531200,
  "source": "chainlink"
}
```

### Example Usage

```javascript
// Fetch ETH/USD price
const response = await fetch('http://localhost:4001/api/oracle/chainlink');
const data = await response.json();

// Convert to human-readable price
const price = parseFloat(data.price) / Math.pow(10, data.decimals);
console.log(`ETH/USD: $${price.toFixed(2)}`);
```

## Deployment

### Smart Contract Deployment

1. Deploy to localhost:

```bash
cd onchain
npx hardhat run scripts/deployPriceFeed.ts --network localhost
```

2. Deploy to Sepolia:

```bash
npx hardhat run scripts/deployPriceFeed.ts --network sepolia
```

3. Deploy to Mainnet:

```bash
npx hardhat run scripts/deployPriceFeed.ts --network mainnet
```

### Testing

Run smart contract tests:

```bash
cd onchain
npx hardhat test
```

Test the backend service:

```bash
node scripts/check-chainlink.mjs
```

## Data Validation

The integration includes several validation checks:

1. **Price Validation**: Rejects zero or negative prices
2. **Round Validation**: Ensures `answeredInRound >= roundId`
3. **Timestamp Validation**: Requires non-zero `updatedAt`
4. **Freshness Check**: Application-level checks for stale data (configurable threshold)

## Best Practices

### Handling Stale Data

- Set appropriate cache TTL (default: 10 seconds)
- Implement freshness checks based on `updatedAt` timestamp
- Cross-validate with other price sources (TradingView, CoinGecko)
- Use circuit breaker pattern for failed oracle calls

### Error Handling

```javascript
try {
  const price = await readChainlinkPrice();
  // Use price data
} catch (error) {
  if (error.message === 'stale round') {
    // Handle stale data - maybe use cached fallback
  } else if (error.message === 'empty price') {
    // Handle missing price data
  } else {
    // Handle RPC/network errors
  }
}
```

### Security Considerations

- Always validate oracle responses
- Implement rate limiting for API endpoints
- Use environment variables for sensitive RPC URLs
- Monitor for unusual price movements
- Implement maximum price deviation checks

## Troubleshooting

### Common Issues

1. **"RPC URL not set"**: Add RPC_URL_MAINNET or RPC_URL to environment
2. **"Invalid feed"**: Verify the feed address for your network
3. **"Stale round"**: The price feed hasn't been updated recently
4. **Network timeouts**: Check RPC provider status and rate limits

### Monitoring

Monitor the following metrics:

- Oracle response times
- Price feed update frequency
- Price deviation from other sources
- RPC call success rates

## Cost Analysis

Reading Chainlink Data Feeds:

- **Gas Cost**: ~21,000-30,000 gas per read
- **No LINK Required**: Consumers don't pay LINK tokens
- **Sponsored by Feed**: Updates funded by data feed sponsors

## References

- [Chainlink Data Feeds Documentation](https://docs.chain.link/data-feeds)
- [Price Feed Contract Addresses](https://docs.chain.link/data-feeds/price-feeds/addresses)
- [AggregatorV3Interface Reference](https://docs.chain.link/data-feeds/api-reference)
