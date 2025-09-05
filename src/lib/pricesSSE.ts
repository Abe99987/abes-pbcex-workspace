export type PriceTick = {
  symbol: string;
  usd?: number;
  ts: number;
  source: string;
};

export function pairToBaseSymbol(pair: string): string {
  const up = (pair || '').toUpperCase();
  if (up.includes('XAU') || up.includes('PAXG')) return 'XAU';
  if (up.includes('BTC')) return 'BTC';
  if (up.includes('ETH')) return 'ETH';
  if (up.includes('USDC') || up.includes('USD')) return 'USDC';
  return 'XAU';
}

type SubscribeOptions = {
  maxPerSecond?: number;
};

export function subscribePrices(
  symbols: string[],
  onTick: (tick: PriceTick) => void,
  options: SubscribeOptions = {}
): () => void {
  const maxPerSecond = Math.max(1, options.maxPerSecond ?? 2);
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => {};
  }

  const uniq = Array.from(
    new Set((symbols || []).map(s => (s || '').toUpperCase()).filter(Boolean))
  );
  if (uniq.length === 0) return () => {};

  const url = `/api/prices/stream?symbols=${encodeURIComponent(uniq.join(','))}`;
  const es = new EventSource(url, { withCredentials: false });

  let lastEmittedAt = 0;
  const minIntervalMs = 1000 / maxPerSecond;

  const handleMessage = (evt: MessageEvent) => {
    try {
      const now = Date.now();
      if (now - lastEmittedAt < minIntervalMs) return;
      const data = JSON.parse(evt.data) as PriceTick;
      if (
        data &&
        typeof data.ts === 'number' &&
        typeof data.symbol === 'string'
      ) {
        lastEmittedAt = now;
        onTick(data);
      }
    } catch {
      // ignore malformed event
    }
  };

  es.addEventListener('message', handleMessage);
  // optional: ready event is informational only
  // es.addEventListener('ready', () => {});

  const unsubscribe = () => {
    es.removeEventListener('message', handleMessage as EventListener);
    es.close();
  };

  return unsubscribe;
}
