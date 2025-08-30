import { useState, useEffect, useCallback } from 'react';
import { api, PricesResponse } from '@/utils/api';

/**
 * Price data hook for real-time precious metals pricing
 */

interface PriceData {
  price: string;
  change24h: string;
  lastUpdated: string;
}

interface UsePricesReturn {
  prices: Record<string, PriceData>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshPrices: () => Promise<void>;
}

interface UsePricesOptions {
  assets?: string[]; // Specific assets to track
  pollingInterval?: number; // Polling interval in milliseconds
  autoRefresh?: boolean; // Whether to auto-refresh prices
}

const DEFAULT_ASSETS = ['AU', 'AG', 'PT', 'PD', 'CU'];
const DEFAULT_POLLING_INTERVAL = 5000; // 5 seconds

export function usePrices(options: UsePricesOptions = {}): UsePricesReturn {
  const {
    assets = DEFAULT_ASSETS,
    pollingInterval = DEFAULT_POLLING_INTERVAL,
    autoRefresh = true,
  } = options;

  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      const responses = await Promise.all(
        assets.map(asset => api.trade.getPrices(asset))
      );

      const newPrices: Record<string, PriceData> = {};

      responses.forEach((response, index) => {
        const asset = assets[index];
        if (
          asset &&
          response.data.code === 'SUCCESS' &&
          response.data.data &&
          response.data.data[asset]
        ) {
          newPrices[asset] = {
            price: response.data.data[asset].price,
            change24h: response.data.data[asset].change24h,
            lastUpdated:
              response.data.data[asset].lastUpdated || new Date().toISOString(),
          };
        }
      });

      setPrices(prevPrices => ({ ...prevPrices, ...newPrices }));
      setLastUpdated(new Date());
      setError(null);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch prices';
      const responseError = err as {
        response?: { data?: { message?: string } };
      };
      const message = responseError.response?.data?.message || errorMessage;
      setError(message);
      console.error('Price fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [assets]);

  const refreshPrices = useCallback(async () => {
    setIsLoading(true);
    await fetchPrices();
  }, [fetchPrices]);

  // Initial fetch
  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Auto-refresh with polling
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchPrices();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, pollingInterval, fetchPrices]);

  // Page visibility handling - pause when tab is hidden
  useEffect(() => {
    if (!autoRefresh) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh immediately when tab becomes visible
        fetchPrices();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [autoRefresh, fetchPrices]);

  return {
    prices,
    isLoading,
    error,
    lastUpdated,
    refreshPrices,
  };
}

// Hook for a single asset price
export function useAssetPrice(
  asset: string,
  options: Omit<UsePricesOptions, 'assets'> = {}
) {
  const { prices, isLoading, error, lastUpdated, refreshPrices } = usePrices({
    ...options,
    assets: [asset],
  });

  return {
    price: prices[asset] || null,
    isLoading,
    error,
    lastUpdated,
    refreshPrices,
  };
}

// Hook for price changes and alerts
export function usePriceAlerts(
  asset: string,
  thresholds: { high?: number; low?: number }
) {
  const { price } = useAssetPrice(asset);
  const [alerts, setAlerts] = useState<
    Array<{ type: 'high' | 'low'; price: string; timestamp: Date }>
  >([]);

  useEffect(() => {
    if (!price) return;

    const currentPrice = parseFloat(price.price);
    const newAlerts: typeof alerts = [];

    if (thresholds.high && currentPrice >= thresholds.high) {
      newAlerts.push({
        type: 'high',
        price: price.price,
        timestamp: new Date(),
      });
    }

    if (thresholds.low && currentPrice <= thresholds.low) {
      newAlerts.push({
        type: 'low',
        price: price.price,
        timestamp: new Date(),
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts]);
    }
  }, [price, thresholds.high, thresholds.low]);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    alerts,
    clearAlerts,
    hasAlerts: alerts.length > 0,
  };
}

// Hook for price history (mock data for now)
export function usePriceHistory(
  asset: string,
  period: '1h' | '1d' | '1w' | '1m' = '1d'
) {
  const [history, setHistory] = useState<
    Array<{ timestamp: Date; price: number; volume: number }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);

        // Mock historical data generation (replace with API call)
        const points = 100;
        const currentPrice = 2050; // Mock current gold price
        const mockHistory: typeof history = [];

        const periodMs = {
          '1h': 60 * 60 * 1000,
          '1d': 24 * 60 * 60 * 1000,
          '1w': 7 * 24 * 60 * 60 * 1000,
          '1m': 30 * 24 * 60 * 60 * 1000,
        }[period];

        const intervalMs = periodMs / points;
        const now = new Date();

        for (let i = points - 1; i >= 0; i--) {
          const timestamp = new Date(now.getTime() - i * intervalMs);

          // Generate mock price with some volatility
          const volatility = 0.02; // 2% volatility
          const randomChange = (Math.random() - 0.5) * volatility;
          const price = currentPrice * (1 + randomChange * (i / points));
          const volume = Math.floor(Math.random() * 1000000);

          mockHistory.push({ timestamp, price, volume });
        }

        setHistory(mockHistory);
        setError(null);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch price history';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [asset, period]);

  return {
    history,
    isLoading,
    error,
  };
}

// Utility functions for price formatting and calculations
export function formatPrice(price: string | number, asset: string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numPrice)) return '$0.00';

  // Different precision for different assets
  let decimals = 2;
  if (['AU', 'AG', 'PT', 'PD'].includes(asset)) {
    decimals = 2; // USD per ounce
  } else if (asset === 'CU') {
    decimals = 4; // Copper is much cheaper
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numPrice);
}

export function formatPriceChange(change: string): {
  text: string;
  isPositive: boolean;
} {
  const isPositive = change.startsWith('+');
  const text =
    change.startsWith('+') || change.startsWith('-') ? change : `+${change}`;

  return { text, isPositive };
}

export function getAssetDisplayName(asset: string): string {
  const names: Record<string, string> = {
    AU: 'Gold',
    AG: 'Silver',
    PT: 'Platinum',
    PD: 'Palladium',
    CU: 'Copper',
  };

  return names[asset] || asset;
}

export function getAssetSymbol(asset: string): string {
  const symbols: Record<string, string> = {
    AU: '🥇',
    AG: '🥈',
    PT: '⚪',
    PD: '⚫',
    CU: '🟤',
  };

  return symbols[asset] || '';
}

// Market status hook
export function useMarketStatus() {
  const [isOpen, setIsOpen] = useState(true); // Precious metals trade 24/7
  const [nextOpen, setNextOpen] = useState<Date | null>(null);
  const [nextClose, setNextClose] = useState<Date | null>(null);

  useEffect(() => {
    // For precious metals, markets are generally open 24/7
    // But major trading hours are typically 9 AM - 5 PM ET
    const now = new Date();
    const etHour = now.getUTCHours() - 5; // Rough ET conversion

    const marketHours = {
      start: 9, // 9 AM ET
      end: 17, // 5 PM ET
    };

    const isMainHours = etHour >= marketHours.start && etHour < marketHours.end;
    setIsOpen(isMainHours);

    // Calculate next open/close times (simplified)
    if (isMainHours) {
      const closeTime = new Date(now);
      closeTime.setUTCHours(22, 0, 0, 0); // 5 PM ET
      setNextClose(closeTime);
      setNextOpen(null);
    } else {
      const openTime = new Date(now);
      if (etHour >= marketHours.end) {
        // Next day
        openTime.setUTCDate(openTime.getUTCDate() + 1);
      }
      openTime.setUTCHours(14, 0, 0, 0); // 9 AM ET
      setNextOpen(openTime);
      setNextClose(null);
    }
  }, []);

  return {
    isOpen,
    nextOpen,
    nextClose,
    isMainHours: isOpen,
  };
}
