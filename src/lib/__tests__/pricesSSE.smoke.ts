// Minimal smoke test for pricesSSE without adding new test frameworks
// Run with: npx ts-node --esm src/lib/__tests__/pricesSSE.smoke.ts

import assert from 'node:assert';

// Provide minimal window + EventSource shims for Node
 
(global as any).window = {};

type MessageListener = (evt: MessageEvent) => void;

class MockEventSource {
  url: string;
  listeners: Record<string, MessageListener[]> = {};
  closed = false;

  constructor(url: string) {
    this.url = url;
     
    (global as any).__lastES = this;
  }

  addEventListener(type: string, cb: MessageListener) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(cb);
  }

  removeEventListener(type: string, cb: MessageListener) {
    this.listeners[type] = (this.listeners[type] || []).filter(l => l !== cb);
  }

  close() {
    this.closed = true;
  }

  emit(type: string, data: unknown) {
    for (const cb of this.listeners[type] || []) {
       
      cb({ data: JSON.stringify(data) } as any);
    }
  }
}

 
(global as any).EventSource = MockEventSource as unknown as typeof EventSource;

import { subscribePrices, pairToBaseSymbol } from '../pricesSSE.ts';

async function main() {
  // pairToBaseSymbol basics
  assert.strictEqual(pairToBaseSymbol('BTC/USDC'), 'BTC');
  assert.strictEqual(pairToBaseSymbol('PAXG/USD'), 'XAU');
  assert.strictEqual(pairToBaseSymbol('xau-s/xag-s'), 'XAU');

  // subscribePrices happy path
  let ticks = 0;
  const unsubscribe = subscribePrices(
    ['BTC'],
    () => {
      ticks += 1;
    },
    { maxPerSecond: 100 }
  );

   
  const es = (global as any).__lastES as MockEventSource;
  assert.ok(es, 'EventSource should be constructed');
  assert.ok(
    es.url.includes('/api/prices/stream'),
    'SSE URL should target prices stream'
  );

  es.emit('message', {
    symbol: 'BTC',
    usd: 123.45,
    ts: Date.now(),
    source: 'MOCK',
  });
  await new Promise(r => setTimeout(r, 5));
  assert.strictEqual(ticks, 1, 'one tick should be delivered');

  // Unsubscribe should stop further delivery
  unsubscribe();
  const deliveredBefore = ticks;
  es.emit('message', {
    symbol: 'BTC',
    usd: 124.0,
    ts: Date.now(),
    source: 'MOCK',
  });
  await new Promise(r => setTimeout(r, 5));
  assert.strictEqual(ticks, deliveredBefore, 'no ticks after unsubscribe');

  // Done
   
  console.log('pricesSSE smoke: OK');
}

main().catch(err => {
   
  console.error(err);
  process.exit(1);
});
