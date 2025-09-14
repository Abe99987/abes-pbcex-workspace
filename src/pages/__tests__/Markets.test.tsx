/**
 * Markets Page Tests - Basic RTL smoke tests
 * Tests feature flag behavior and core functionality
 */

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import Markets from '../Markets';
import { FEATURE_FLAGS } from '@/config/features';

// Mock the API adapter
jest.mock('../../lib/api', () => ({
  marketsAdapter: {
    getSymbols: jest.fn().mockResolvedValue([
      {
        pair: 'BTC/USDC',
        symbol: 'BTC',
        name: 'Bitcoin',
        price: '50000',
        changePercent: 2.5,
        sparklineData: [50000, 50100, 49900, 50000, 50200, 50300, 50100, 50000],
        type: 'crypto',
        isFavorite: true,
      },
      {
        pair: 'ETH/USDC',
        symbol: 'ETH',
        name: 'Ethereum',
        price: '3000',
        changePercent: 1.2,
        sparklineData: [3000, 3010, 2990, 3000, 3020, 3030, 3010, 3000],
        type: 'crypto',
      },
    ]),
    getKPIs: jest.fn().mockResolvedValue({
      fearGreedIndex: 50,
      fearGreedLabel: 'Neutral',
      ethGasPrice: '0.127955129',
      tradingVolumeUsd: '1525.04 B USD',
      longShortRatio: { long: 77, short: 23 },
    }),
    getSectors: jest.fn().mockResolvedValue({
      crypto: [{ name: 'DeFi', change: '+5.2%', isPositive: true }],
      commodity: [{ name: 'Metals', change: '+1.8%', isPositive: true }],
    }),
    startPriceStream: jest.fn().mockReturnValue({
      close: jest.fn(),
    }),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

describe('Markets Page', () => {
  beforeEach(() => {
    // Reset feature flag to default
    (FEATURE_FLAGS as any)['markets.v1'] = true;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders markets page when feature flag is enabled', async () => {
    render(
      <TestWrapper>
        <Markets />
      </TestWrapper>
    );

    // Should show page title
    expect(screen.getByText(/Markets/)).toBeInTheDocument();
  });

  it('shows fallback UI when feature flag is disabled', async () => {
    // Disable feature flag
    (FEATURE_FLAGS as any)['markets.v1'] = false;

    render(
      <TestWrapper>
        <Markets />
      </TestWrapper>
    );

    // Should show fallback message
    expect(screen.getByText(/Markets Coming Soon/)).toBeInTheDocument();
    expect(screen.getByText(/currently in development/)).toBeInTheDocument();
  });

  it('has overview and key-metrics tabs', async () => {
    render(
      <TestWrapper>
        <Markets />
      </TestWrapper>
    );

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Key Metrics')).toBeInTheDocument();
  });

  it('shows loading state initially', async () => {
    render(
      <TestWrapper>
        <Markets />
      </TestWrapper>
    );

    // Should show loading spinner initially
    expect(screen.getByText(/Loading market data/)).toBeInTheDocument();
  });

  it('starts SSE connection and cleans up on unmount', () => {
    const mockClose = jest.fn();
    const mockEventSource = { close: mockClose };

    const marketsAdapter = require('../../lib/api').marketsAdapter;
    marketsAdapter.startPriceStream.mockReturnValue(mockEventSource);

    const { unmount } = render(
      <TestWrapper>
        <Markets />
      </TestWrapper>
    );

    // Should start price stream
    expect(marketsAdapter.startPriceStream).toHaveBeenCalled();

    // Should clean up on unmount
    unmount();
    expect(mockClose).toHaveBeenCalled();
  });
});
