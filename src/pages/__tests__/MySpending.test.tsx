/**
 * MySpending Page Tests - Basic RTL smoke tests
 * Tests feature flag behavior and core functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MySpending from '../account/MySpending';
import { FEATURE_FLAGS } from '@/config/features';

// Mock the API adapter
jest.mock('../../lib/api', () => ({
  spendingAdapter: {
    getTransactions: jest.fn().mockResolvedValue([
      {
        id: '1',
        merchant: 'Test Store',
        amount: -100,
        category: 'Shopping',
        date: '2024-01-01',
        description: 'Test purchase',
        tags: ['test'],
        status: 'completed',
        recurring: false,
        type: 'card',
        account: 'Funding',
      },
    ]),
    getBudgets: jest.fn().mockResolvedValue([
      {
        id: '1',
        category: 'Shopping',
        monthlyLimit: 500,
        spent: 100,
        remaining: 400,
      },
    ]),
    getDCARules: jest.fn().mockResolvedValue([
      {
        id: '1',
        alias: 'monthly_gold',
        asset: 'Gold',
        amount: 100,
        frequency: 'monthly',
        nextExecution: '2024-02-01T10:00:00Z',
        isActive: true,
      },
    ]),
    getTags: jest.fn().mockResolvedValue(['electronics', 'groceries']),
    exportCSV: jest
      .fn()
      .mockResolvedValue(
        new Blob(['\uFEFFtest'], { type: 'text/csv;charset=utf-8' })
      ),
    addTag: jest.fn().mockResolvedValue(undefined),
    createDCARule: jest.fn().mockResolvedValue({
      id: 'new_rule',
      alias: 'test_rule',
      asset: 'Gold',
      amount: 100,
      frequency: 'monthly',
      nextExecution: '2024-02-01T10:00:00Z',
      isActive: true,
    }),
  },
}));

// Mock DCA store
jest.mock('../../hooks/useDCAStore', () => ({
  useDCAStore: () => ({
    rules: [],
    deleteRule: jest.fn(),
  }),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('MySpending Page', () => {
  beforeEach(() => {
    // Reset feature flag to default
    (FEATURE_FLAGS as any)['spending.v1'] = true;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders spending page when feature flag is enabled', async () => {
    render(
      <TestWrapper>
        <MySpending />
      </TestWrapper>
    );

    // Should show page title
    expect(screen.getByText(/My Spending/)).toBeInTheDocument();
  });

  it('shows fallback UI when feature flag is disabled', async () => {
    // Disable feature flag
    (FEATURE_FLAGS as any)['spending.v1'] = false;

    render(
      <TestWrapper>
        <MySpending />
      </TestWrapper>
    );

    // Should show fallback message
    expect(screen.getByText(/My Spending Coming Soon/)).toBeInTheDocument();
    expect(screen.getByText(/currently in development/)).toBeInTheDocument();
  });

  it('has spending breakdown and KPI sections', async () => {
    render(
      <TestWrapper>
        <MySpending />
      </TestWrapper>
    );

    expect(screen.getByText(/Spending by Category/)).toBeInTheDocument();
    expect(screen.getByText(/This Month/)).toBeInTheDocument();
  });

  it('shows DCA nudge section and rule management', async () => {
    render(
      <TestWrapper>
        <MySpending />
      </TestWrapper>
    );

    expect(screen.getByText(/Auto-invest your savings/)).toBeInTheDocument();
    expect(screen.getByText(/Set up DCA/)).toBeInTheDocument();
    expect(screen.getByText(/Active Rules/)).toBeInTheDocument();
  });

  it('handles CSV export functionality', async () => {
    render(
      <TestWrapper>
        <MySpending />
      </TestWrapper>
    );

    // Find and click export button
    const exportButton = screen.getByRole('button', {
      name: /Export month CSV/i,
    });
    expect(exportButton).toBeInTheDocument();

    fireEvent.click(exportButton);

    // Should call the export function
    await waitFor(() => {
      const { spendingAdapter } = require('../../lib/api');
      expect(spendingAdapter.exportCSV).toHaveBeenCalledWith({
        month: expect.stringMatching(/\d{4}-\d{2}/),
      });
    });
  });

  it('shows transaction ledger with month filtering', async () => {
    render(
      <TestWrapper>
        <MySpending />
      </TestWrapper>
    );

    expect(screen.getByText(/Recent Transactions/)).toBeInTheDocument();
    expect(screen.getByText(/January 2025/i)).toBeInTheDocument();
  });
});
