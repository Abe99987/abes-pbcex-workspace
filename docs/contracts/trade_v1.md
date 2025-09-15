# Trade v1 API Contracts

Core trading API contracts for PBCEx v1.

## Market Data Streaming

### SSE GET /api/markets/stream

**Description**: Server-Sent Events endpoint for real-time market data  
**Authentication**: Bearer token required  
**Content-Type**: `text/event-stream`

```typescript
// Event Types
interface MarketDataEvent {
  event: 'price_update' | 'volume_update' | 'order_book';
  data: PriceUpdate | VolumeUpdate | OrderBookSnapshot;
  timestamp: string;
}

interface PriceUpdate {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
}

interface OrderBookSnapshot {
  symbol: string;
  bids: [number, number][]; // [price, quantity]
  asks: [number, number][];
  sequence: number;
}
```

**Example Response Stream**:

```
event: price_update
data: {"symbol":"BTC-USD","price":45000.00,"change24h":2.5,"volume24h":1250000}

event: order_book
data: {"symbol":"ETH-USD","bids":[[3000,0.5],[2995,1.2]],"asks":[[3005,0.8],[3010,2.0]],"sequence":12345}
```

**Error Handling**:

- Connection drops: Client should reconnect with exponential backoff
- Invalid auth: 401 response, close stream
- Rate limiting: 429 response with retry-after header

## Order Management

### POST /api/trading/orders

**Description**: Place a new trading order  
**Authentication**: Bearer token required  
**Content-Type**: `application/json`  
**Idempotency**: `X-Idempotency-Key` header required

```typescript
interface CreateOrderRequest {
  symbol: string; // e.g., "BTC-USD"
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop_loss' | 'take_profit';
  quantity: number; // Base asset quantity
  price?: number; // Required for limit orders
  stopPrice?: number; // Required for stop orders
  timeInForce?: 'GTC' | 'IOC' | 'FOK'; // Good Till Cancel, Immediate Or Cancel, Fill Or Kill
}

interface CreateOrderResponse {
  orderId: string;
  status: 'pending' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected';
  symbol: string;
  side: 'buy' | 'sell';
  type: string;
  quantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  price?: number;
  averageFillPrice?: number;
  fees: {
    asset: string;
    amount: number;
  }[];
  createdAt: string;
  updatedAt: string;
}
```

**Example Request**:

```json
{
  "symbol": "BTC-USD",
  "side": "buy",
  "type": "limit",
  "quantity": 0.001,
  "price": 44000.0,
  "timeInForce": "GTC"
}
```

**Response Codes**:

- `201 Created`: Order placed successfully
- `400 Bad Request`: Invalid order parameters
- `401 Unauthorized`: Invalid or missing authentication
- `409 Conflict`: Duplicate idempotency key
- `422 Unprocessable Entity`: Insufficient balance or market closed
- `429 Too Many Requests`: Rate limit exceeded

### GET /api/trading/orders/{orderId}

**Description**: Get order details by ID  
**Authentication**: Bearer token required

```typescript
interface OrderDetailsResponse extends CreateOrderResponse {
  fills: {
    fillId: string;
    quantity: number;
    price: number;
    fee: number;
    timestamp: string;
  }[];
}
```

### DELETE /api/trading/orders/{orderId}

**Description**: Cancel an open order  
**Authentication**: Bearer token required  
**Idempotency**: `X-Idempotency-Key` header required

**Response**: Same as CreateOrderResponse with status updated to 'cancelled'

## Portfolio Management

### GET /api/portfolio/balances

**Description**: Get account balances  
**Authentication**: Bearer token required

```typescript
interface BalanceResponse {
  balances: {
    asset: string;
    available: number; // Available for trading
    locked: number; // Locked in open orders
    total: number; // available + locked
  }[];
  totalValueUSD: number;
  lastUpdated: string;
}
```

## Error Response Format

All endpoints use consistent error response format:

```typescript
interface ErrorResponse {
  error: {
    code: string; // Machine-readable error code
    message: string; // Human-readable error message
    details?: any; // Additional error context
    timestamp: string;
  };
}
```

**Common Error Codes**:

- `INVALID_SYMBOL`: Trading pair not supported
- `INSUFFICIENT_BALANCE`: Not enough funds for order
- `MARKET_CLOSED`: Trading not available for symbol
- `ORDER_SIZE_TOO_SMALL`: Below minimum order size
- `PRICE_OUT_OF_RANGE`: Price outside acceptable bounds
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Rate Limits

- **Market Data**: 100 requests/minute per user
- **Order Operations**: 60 requests/minute per user
- **Portfolio Queries**: 120 requests/minute per user

Rate limit headers included in all responses:

- `X-RateLimit-Limit`: Requests allowed per window
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Window reset timestamp

---

_API versioned at /api/v1/ - breaking changes will increment version_
