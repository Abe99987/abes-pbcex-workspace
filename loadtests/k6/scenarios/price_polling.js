import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend, Gauge } from 'k6/metrics';
import ws from 'k6/ws';

/**
 * K6 Load Test: Price Polling and Real-time Updates
 * 
 * Simulates realistic price monitoring load including:
 * - HTTP price polling
 * - WebSocket real-time price feeds
 * - Chart data requests
 * - Market data subscriptions
 */

// Test configuration
export const options = {
  scenarios: {
    // HTTP price polling scenario
    http_polling: {
      executor: 'constant-vus',
      vus: 30,
      duration: '5m',
      tags: { test_type: 'http_polling' },
      exec: 'httpPricePolling',
    },
    
    // WebSocket price feed scenario
    websocket_feeds: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      tags: { test_type: 'websocket' },
      exec: 'websocketPriceFeeds',
    },
    
    // Chart data loading scenario  
    chart_data: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '3m', target: 20 },
        { duration: '1m', target: 5 },
      ],
      tags: { test_type: 'chart_data' },
      exec: 'chartDataLoad',
    },
    
    // Market data burst scenario
    market_data_burst: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 20,
      maxVUs: 100,
      stages: [
        { duration: '30s', target: 50 },  // Burst to 50 req/s
        { duration: '1m', target: 100 },  // Peak at 100 req/s
        { duration: '30s', target: 50 },  // Reduce to 50 req/s
        { duration: '1m', target: 20 },   // Normal load
      ],
      tags: { test_type: 'market_burst' },
      exec: 'marketDataBurst',
    },
  },
  
  // Performance thresholds
  thresholds: {
    // Price endpoint should be very fast
    'http_req_duration{endpoint:prices}': ['p(95)<100', 'p(99)<200'],
    
    // Chart data can be slower but should be reasonable
    'http_req_duration{endpoint:chart}': ['p(95)<500', 'p(99)<1000'],
    
    // WebSocket connection success rate
    'ws_connection_success': ['rate>0.98'],
    
    // Price update frequency (should receive updates)
    'price_updates_received': ['rate>0.8'],
    
    // Overall HTTP failure rate
    'http_req_failed': ['rate<0.02'],
    
    // Market data availability
    'market_data_availability': ['rate>0.99'],
  },
};

// Custom metrics
const priceUpdateLatency = new Trend('price_update_latency');
const wsConnectionSuccess = new Rate('ws_connection_success');
const priceUpdatesReceived = new Rate('price_updates_received');
const marketDataAvailability = new Rate('market_data_availability');
const concurrentConnections = new Gauge('concurrent_ws_connections');
const priceDataFreshness = new Trend('price_data_freshness');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4001';
const WS_URL = __ENV.WS_URL || 'ws://localhost:4001';
const POLL_INTERVAL = parseInt(__ENV.POLL_INTERVAL || '2'); // seconds
const ASSETS = ['XAU-s', 'XAG-s', 'XPT-s', 'XPD-s', 'XCU-s'];

/**
 * HTTP Price Polling Test
 */
export function httpPricePolling() {
  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'prices' },
  };
  
  group('Price Polling Loop', () => {
    for (let i = 0; i < 60 / POLL_INTERVAL; i++) { // Run for 1 minute
      const startTime = Date.now();
      
      // Get all prices
      const pricesResponse = http.get(`${BASE_URL}/api/trade/prices`, params);
      
      const priceCheck = check(pricesResponse, {
        'prices status is 200': (r) => r.status === 200,
        'prices response time < 100ms': (r) => r.timings.duration < 100,
        'all assets present': (r) => {
          const prices = r.json('data.prices');
          return prices && ASSETS.every(asset => prices[asset]);
        },
        'prices have bid/ask': (r) => {
          const prices = r.json('data.prices');
          if (!prices) return false;
          
          return ASSETS.every(asset => {
            const assetPrice = prices[asset];
            return assetPrice && 
                   assetPrice.bid && 
                   assetPrice.ask && 
                   parseFloat(assetPrice.ask) > parseFloat(assetPrice.bid);
          });
        },
        'prices are fresh': (r) => {
          const prices = r.json('data.prices');
          if (!prices) return false;
          
          const now = Date.now();
          return ASSETS.every(asset => {
            const assetPrice = prices[asset];
            if (!assetPrice.lastUpdate) return false;
            
            const updateTime = new Date(assetPrice.lastUpdate).getTime();
            const ageMs = now - updateTime;
            priceDataFreshness.add(ageMs);
            
            return ageMs < 30000; // Less than 30 seconds old
          });
        },
      });
      
      marketDataAvailability.add(priceCheck);
      priceUpdateLatency.add(Date.now() - startTime);
      
      // Random asset-specific request (30% chance)
      if (Math.random() < 0.3) {
        const randomAsset = ASSETS[Math.floor(Math.random() * ASSETS.length)];
        
        const assetResponse = http.get(
          `${BASE_URL}/api/trade/prices?assets=${randomAsset}`,
          { ...params, tags: { endpoint: 'price_single' } }
        );
        
        check(assetResponse, {
          'single asset price OK': (r) => r.status === 200,
          'single asset data correct': (r) => {
            const prices = r.json('data.prices');
            return prices && prices[randomAsset];
          },
        });
      }
      
      sleep(POLL_INTERVAL);
    }
  });
}

/**
 * WebSocket Price Feed Test
 */
export function websocketPriceFeeds() {
  const wsUrl = `${WS_URL}/ws/prices`;
  let messageCount = 0;
  let connectionEstablished = false;
  
  group('WebSocket Price Feed', () => {
    const res = ws.connect(wsUrl, {}, function(socket) {
      connectionEstablished = true;
      concurrentConnections.add(1);
      
      socket.on('open', () => {
        console.log('WebSocket connection opened');
        
        // Subscribe to price updates for all assets
        socket.send(JSON.stringify({
          type: 'subscribe',
          channel: 'prices',
          assets: ASSETS,
        }));
      });
      
      socket.on('message', (data) => {
        messageCount++;
        
        try {
          const message = JSON.parse(data);
          
          check(message, {
            'message has type': (msg) => msg.type !== undefined,
            'price message has data': (msg) => {
              if (msg.type === 'price_update') {
                return msg.asset && msg.bid && msg.ask;
              }
              return true;
            },
            'price data is valid': (msg) => {
              if (msg.type === 'price_update') {
                return parseFloat(msg.ask) > parseFloat(msg.bid);
              }
              return true;
            },
          });
          
          if (message.type === 'price_update') {
            priceUpdatesReceived.add(1);
            
            // Track update latency if timestamp provided
            if (message.timestamp) {
              const updateLatency = Date.now() - new Date(message.timestamp).getTime();
              priceUpdateLatency.add(updateLatency);
            }
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      });
      
      socket.on('close', () => {
        console.log('WebSocket connection closed');
        concurrentConnections.add(-1);
      });
      
      socket.on('error', (e) => {
        console.error('WebSocket error:', e);
      });
      
      // Keep connection alive for test duration
      sleep(60); // 1 minute
      
      // Unsubscribe before closing
      socket.send(JSON.stringify({
        type: 'unsubscribe',
        channel: 'prices',
      }));
      
      socket.close();
    });
    
    wsConnectionSuccess.add(connectionEstablished ? 1 : 0);
    
    check(null, {
      'received price updates': () => messageCount > 0,
      'adequate update frequency': () => messageCount > 10, // At least 10 updates per minute
    });
  });
}

/**
 * Chart Data Loading Test
 */
export function chartDataLoad() {
  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'chart' },
  };
  
  group('Chart Data Requests', () => {
    const asset = ASSETS[Math.floor(Math.random() * ASSETS.length)];
    const timeframes = ['1H', '4H', '1D', '1W', '1M'];
    const timeframe = timeframes[Math.floor(Math.random() * timeframes.length)];
    
    const chartStart = Date.now();
    
    const chartResponse = http.get(
      `${BASE_URL}/api/trade/market-data?asset=${asset}&timeframe=${timeframe}&limit=100`,
      params
    );
    
    const chartCheck = check(chartResponse, {
      'chart data status is 200': (r) => r.status === 200,
      'chart data has historical data': (r) => {
        const data = r.json('data.historicalData');
        return data && data[asset] && Array.isArray(data[asset].data);
      },
      'chart data points have OHLCV': (r) => {
        const data = r.json('data.historicalData');
        if (!data || !data[asset] || !data[asset].data) return false;
        
        const points = data[asset].data;
        return points.length > 0 && points.every(point => 
          point.open && point.high && point.low && point.close && point.timestamp
        );
      },
      'chart response time reasonable': (r) => r.timings.duration < 500,
    });
    
    if (chartCheck) {
      const chartLatency = Date.now() - chartStart;
      priceUpdateLatency.add(chartLatency, { operation: 'chart_load' });
    }
    
    // Simulate user browsing different timeframes
    if (Math.random() < 0.4) {
      const anotherTimeframe = timeframes[Math.floor(Math.random() * timeframes.length)];
      
      if (anotherTimeframe !== timeframe) {
        sleep(1); // User thinks before changing timeframe
        
        const secondChartResponse = http.get(
          `${BASE_URL}/api/trade/market-data?asset=${asset}&timeframe=${anotherTimeframe}&limit=100`,
          params
        );
        
        check(secondChartResponse, {
          'second chart load OK': (r) => r.status === 200,
          'different timeframe data': (r) => {
            const data = r.json('data.historicalData');
            return data && data[asset] && data[asset].timeframe === anotherTimeframe;
          },
        });
      }
    }
    
    sleep(2); // User views chart for 2 seconds
  });
}

/**
 * Market Data Burst Test
 */
export function marketDataBurst() {
  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'market_burst' },
  };
  
  // Rapid-fire requests simulating market open or major news
  const requests = [
    () => http.get(`${BASE_URL}/api/trade/prices`, params),
    () => {
      const asset = ASSETS[Math.floor(Math.random() * ASSETS.length)];
      return http.get(`${BASE_URL}/api/trade/market-data?asset=${asset}&timeframe=1H&limit=50`, params);
    },
    () => http.get(`${BASE_URL}/api/trade/market-stats`, params),
    () => {
      const asset = ASSETS[Math.floor(Math.random() * ASSETS.length)];
      return http.get(`${BASE_URL}/api/trade/prices?assets=${asset}`, params);
    },
  ];
  
  const randomRequest = requests[Math.floor(Math.random() * requests.length)];
  const startTime = Date.now();
  
  const response = randomRequest();
  
  check(response, {
    'burst request successful': (r) => r.status === 200,
    'burst request fast enough': (r) => r.timings.duration < 300,
    'burst response has data': (r) => r.json('data') !== undefined,
  });
  
  const requestLatency = Date.now() - startTime;
  priceUpdateLatency.add(requestLatency, { operation: 'burst_request' });
  
  marketDataAvailability.add(response.status === 200 ? 1 : 0);
}

/**
 * Setup function
 */
export function setup() {
  console.log(`Starting price polling load test against ${BASE_URL}`);
  
  // Verify price endpoint is working
  const healthCheck = http.get(`${BASE_URL}/api/trade/prices`);
  
  if (healthCheck.status !== 200) {
    console.error('Price endpoint health check failed - aborting test');
    return null;
  }
  
  console.log('Price endpoint health check passed');
  
  return {
    baseUrl: BASE_URL,
    wsUrl: WS_URL,
    assets: ASSETS,
  };
}

/**
 * Teardown function
 */
export function teardown(data) {
  if (!data) return;
  
  console.log('\nPrice polling load test completed');
  
  // Final endpoint check
  const finalCheck = http.get(`${data.baseUrl}/api/trade/prices`);
  console.log(`Final price endpoint check: ${finalCheck.status}`);
  
  if (finalCheck.status !== 200) {
    console.error('WARNING: Price endpoint appears degraded after load test');
  }
}

/**
 * Utility function to simulate realistic user behavior patterns
 */
function simulateTraderBehavior() {
  const behaviors = {
    // Scalper - very frequent price checks
    scalper: {
      pollInterval: 1,
      chartViews: 'minimal',
      priceAlerts: 'high',
    },
    
    // Day trader - regular monitoring
    dayTrader: {
      pollInterval: 2,
      chartViews: 'moderate',
      priceAlerts: 'medium',
    },
    
    // Swing trader - less frequent checks
    swingTrader: {
      pollInterval: 5,
      chartViews: 'detailed',
      priceAlerts: 'low',
    },
    
    // Casual investor - sporadic monitoring
    casual: {
      pollInterval: 10,
      chartViews: 'overview',
      priceAlerts: 'minimal',
    },
  };
  
  const behaviorTypes = Object.keys(behaviors);
  const randomBehavior = behaviorTypes[Math.floor(Math.random() * behaviorTypes.length)];
  
  return behaviors[randomBehavior];
}

/**
 * Simulate market volatility impact on request patterns
 */
function adjustForVolatility() {
  // During high volatility, users check prices more frequently
  const volatilityFactor = Math.random();
  
  if (volatilityFactor > 0.8) {
    // High volatility - 20% of the time
    return {
      requestMultiplier: 2.0,
      chartLoadMultiplier: 1.5,
      alertFrequency: 'high',
    };
  } else if (volatilityFactor > 0.6) {
    // Medium volatility - 20% of the time
    return {
      requestMultiplier: 1.3,
      chartLoadMultiplier: 1.2,
      alertFrequency: 'medium',
    };
  } else {
    // Normal market conditions - 60% of the time
    return {
      requestMultiplier: 1.0,
      chartLoadMultiplier: 1.0,
      alertFrequency: 'normal',
    };
  }
}
