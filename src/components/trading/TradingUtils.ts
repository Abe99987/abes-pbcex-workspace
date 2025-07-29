// Utility functions for trading components

export interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export const generateCandlestickData = (count: number, timeframe: string): CandlestickData[] => {
  const data: CandlestickData[] = [];
  let basePrice = 2380;
  const now = new Date();
  
  const getTimeInterval = (tf: string): number => {
    switch (tf) {
      case "1m": return 60 * 1000;
      case "5m": return 5 * 60 * 1000;
      case "15m": return 15 * 60 * 1000;
      case "1h": return 60 * 60 * 1000;
      case "4h": return 4 * 60 * 60 * 1000;
      case "1d": return 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  };

  const interval = getTimeInterval(timeframe);

  for (let i = count; i >= 0; i--) {
    const time = new Date(now.getTime() - i * interval);
    const open = basePrice + (Math.random() - 0.5) * 20;
    const close = open + (Math.random() - 0.5) * 30;
    const high = Math.max(open, close) + Math.random() * 15;
    const low = Math.min(open, close) - Math.random() * 15;
    const volume = Math.random() * 1000 + 100;

    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: parseFloat(volume.toFixed(0)),
    });

    basePrice = close;
  }

  return data;
};

export const generateOrderBookData = () => {
  const basePrice = 2380;
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];

  // Generate bid orders (buy orders - below current price)
  for (let i = 0; i < 15; i++) {
    const price = basePrice - (i + 1) * 0.5 - Math.random() * 2;
    const amount = Math.random() * 5 + 0.1;
    const total = price * amount;
    
    bids.push({
      price: parseFloat(price.toFixed(2)),
      amount: parseFloat(amount.toFixed(3)),
      total: parseFloat(total.toFixed(2)),
    });
  }

  // Generate ask orders (sell orders - above current price)
  for (let i = 0; i < 15; i++) {
    const price = basePrice + (i + 1) * 0.5 + Math.random() * 2;
    const amount = Math.random() * 5 + 0.1;
    const total = price * amount;
    
    asks.push({
      price: parseFloat(price.toFixed(2)),
      amount: parseFloat(amount.toFixed(3)),
      total: parseFloat(total.toFixed(2)),
    });
  }

  return { bids, asks };
};

export const formatPrice = (price: number, decimals: number = 2): string => {
  return price.toFixed(decimals);
};

export const formatVolume = (volume: number): string => {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toString();
};

export const calculatePercentageChange = (current: number, previous: number): number => {
  return ((current - previous) / previous) * 100;
};