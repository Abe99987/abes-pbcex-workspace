export type AccountType = 'PERSONAL' | 'BUSINESS';
export type Currency = string; // e.g., 'USD'
export type CategoryId = string;

export interface Transaction {
  id: string;
  date: string; // ISO
  merchant: string;
  memo?: string;
  amount: number; // negative = spend
  currency: Currency;
  categoryId?: CategoryId;
  tags?: string[];
  accountName?: string;
  isRecurring?: boolean;
  confidence?: number; // 0..1
}

export interface SpendStat {
  categoryId: CategoryId;
  total: number;
  pct: number;
}

export interface Category {
  id: CategoryId;
  name: string;
  icon: string;
  color: string;
  isBusinessOnly?: boolean;
}

export interface MerchantTrend {
  merchant: string;
  currentMonth: number;
  previousMonth: number;
  change: number;
  transactionCount: number;
}

export interface BurnData {
  month: string;
  amount: number;
}

// Category taxonomy
export const CATEGORIES: Category[] = [
  // Universal Categories
  { id: 'fixed-costs', name: 'Fixed Costs', icon: '🏠', color: '#E74C3C' },
  { id: 'utilities', name: 'Utilities & Bills', icon: '⚡', color: '#F39C12' },
  {
    id: 'subscriptions',
    name: 'Memberships & Subscriptions',
    icon: '📱',
    color: '#9B59B6',
  },
  { id: 'food', name: 'Food', icon: '🍽️', color: '#27AE60' },
  { id: 'transport', name: 'Transport', icon: '🚗', color: '#3498DB' },
  { id: 'health', name: 'Health', icon: '⚕️', color: '#E67E22' },
  { id: 'education', name: 'Education', icon: '📚', color: '#8E44AD' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#F1C40F' },
  {
    id: 'entertainment',
    name: 'Entertainment & Leisure',
    icon: '🎪',
    color: '#16A085',
  },
  { id: 'fees', name: 'Fees & Charges', icon: '💸', color: '#E74C3C' },
  { id: 'income', name: 'Income', icon: '💰', color: '#2ECC71' },
  { id: 'savings', name: 'Savings Transfers', icon: '🏦', color: '#3498DB' },
  { id: 'misc', name: 'Misc (Uncategorized)', icon: '❓', color: '#95A5A6' },

  // Business-only Categories
  {
    id: 'revenue',
    name: 'Revenue',
    icon: '💼',
    color: '#2ECC71',
    isBusinessOnly: true,
  },
  {
    id: 'cogs',
    name: 'COGS',
    icon: '📦',
    color: '#E74C3C',
    isBusinessOnly: true,
  },
  {
    id: 'operating',
    name: 'Operating Expenses',
    icon: '🏢',
    color: '#F39C12',
    isBusinessOnly: true,
  },
  {
    id: 'professional',
    name: 'Professional Services',
    icon: '⚖️',
    color: '#9B59B6',
    isBusinessOnly: true,
  },
  {
    id: 'taxes',
    name: 'Taxes',
    icon: '📊',
    color: '#E74C3C',
    isBusinessOnly: true,
  },
  {
    id: 'travel',
    name: 'Travel & Meals',
    icon: '✈️',
    color: '#3498DB',
    isBusinessOnly: true,
  },
  {
    id: 'capex',
    name: 'Capital Expenditures',
    icon: '🏭',
    color: '#34495E',
    isBusinessOnly: true,
  },
];

// Mock data generators
export const generateMockTransactions = (
  accountType: AccountType,
  count: number = 100
): Transaction[] => {
  const categories = CATEGORIES.filter(
    cat => !cat.isBusinessOnly || accountType === 'BUSINESS'
  );
  const merchants = [
    'Amazon',
    'Walmart',
    'Target',
    'Starbucks',
    "McDonald's",
    'Shell Gas Station',
    'Netflix',
    'Spotify',
    'Uber',
    'Lyft',
    'Whole Foods',
    'CVS Pharmacy',
    'Home Depot',
    'Best Buy',
    'Apple Store',
    'Google Pay',
    'PayPal',
  ];

  const transactions: Transaction[] = [];

  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 365));

    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const amount = -(Math.random() * 500 + 10); // Negative for spending

    transactions.push({
      id: `tx_${i}`,
      date: date.toISOString(),
      merchant,
      memo: `Transaction at ${merchant}`,
      amount,
      currency: 'USD',
      categoryId: category.id,
      tags: [],
      accountName: 'Main Account',
      isRecurring: Math.random() > 0.8,
      confidence: Math.random(),
    });
  }

  return transactions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

export const generateMockBurnData = (): BurnData[] => {
  const data: BurnData[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const amount = Math.random() * 3000 + 2000; // $2k-5k per month

    data.push({
      month: date.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      }),
      amount,
    });
  }

  return data;
};

export const generateMockMerchantTrends = (): MerchantTrend[] => {
  const merchants = [
    'Amazon',
    'Starbucks',
    'Uber',
    'Netflix',
    'Walmart',
    'Target',
    'Shell',
    'CVS',
    'Whole Foods',
    'Apple',
  ];

  return merchants
    .map(merchant => {
      const currentMonth = Math.random() * 500 + 100;
      const previousMonth = Math.random() * 500 + 100;
      const change = ((currentMonth - previousMonth) / previousMonth) * 100;

      return {
        merchant,
        currentMonth,
        previousMonth,
        change,
        transactionCount: Math.floor(Math.random() * 20) + 1,
      };
    })
    .sort((a, b) => b.currentMonth - a.currentMonth);
};

interface CategorizationRule {
  merchant: string;
  categoryId: CategoryId;
  description?: string;
  confidence?: number;
}

// API stubs
export const useSpendingData = (accountType: AccountType) => {
  const transactions = generateMockTransactions(accountType);
  const burnData = generateMockBurnData();
  const merchantTrends = generateMockMerchantTrends();

  const getTransactions = async (
    account: AccountType,
    from: string,
    to: string
  ): Promise<Transaction[]> => {
    // Simulate API call
    return new Promise(resolve => {
      setTimeout(() => resolve(transactions), 300);
    });
  };

  const updateTransactionCategory = async (
    id: string,
    categoryId: CategoryId
  ): Promise<void> => {
    // Simulate API call
    return new Promise(resolve => {
      setTimeout(() => {
        const tx = transactions.find(t => t.id === id);
        if (tx) tx.categoryId = categoryId;
        resolve();
      }, 300);
    });
  };

  const createCategorizationRule = async (
    rule: CategorizationRule
  ): Promise<void> => {
    // Simulate API call
    return new Promise(resolve => {
      setTimeout(() => resolve(), 300);
    });
  };

  const detectRecurring = async (
    transactions: Transaction[]
  ): Promise<string[]> => {
    // Simple heuristic - same merchant appearing multiple times
    const merchantCounts: { [key: string]: string[] } = {};
    transactions.forEach(tx => {
      if (!merchantCounts[tx.merchant]) merchantCounts[tx.merchant] = [];
      merchantCounts[tx.merchant].push(tx.id);
    });

    return Object.values(merchantCounts)
      .filter(ids => ids.length >= 3)
      .flat();
  };

  const getSpendingStats = async (
    account: AccountType,
    range: { from: string; to: string }
  ): Promise<SpendStat[]> => {
    const total = transactions.reduce(
      (sum, tx) => sum + Math.abs(tx.amount),
      0
    );
    const categoryTotals: { [key: string]: number } = {};

    transactions.forEach(tx => {
      if (tx.categoryId && tx.amount < 0) {
        // Only spending
        categoryTotals[tx.categoryId] =
          (categoryTotals[tx.categoryId] || 0) + Math.abs(tx.amount);
      }
    });

    return Object.entries(categoryTotals).map(([categoryId, amount]) => ({
      categoryId,
      total: amount,
      pct: (amount / total) * 100,
    }));
  };

  const getMerchantTrends = async (
    account: AccountType,
    months: number
  ): Promise<MerchantTrend[]> => {
    return merchantTrends;
  };

  return {
    transactions,
    burnData,
    merchantTrends,
    getTransactions,
    updateTransactionCategory,
    createCategorizationRule,
    detectRecurring,
    getSpendingStats,
    getMerchantTrends,
  };
};
