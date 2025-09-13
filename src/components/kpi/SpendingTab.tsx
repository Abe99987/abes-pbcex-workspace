import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Download,
  Eye,
  Receipt,
  ShoppingCart,
} from 'lucide-react';

// Import spending components from existing MySpending page
import CategorySummaryList from '@/components/spending/CategorySummaryList';
import SpendingDonut from '@/components/spending/SpendingDonut';
import BurnTrendChart from '@/components/spending/BurnTrendChart';
import SavingsRateCard from '@/components/spending/SavingsRateCard';
import TopMerchantsChart from '@/components/spending/TopMerchantsChart';
import TransactionsTable from '@/components/spending/TransactionsTable';

const SpendingTab = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<'PERSONAL' | 'BUSINESS'>(
    'PERSONAL'
  );

  // Mock spending data (mirroring MySpending page structure)
  const mockTransactions = [
    {
      id: 'tx_1',
      date: '2024-01-15T10:30:00Z',
      merchant: 'Amazon',
      memo: 'Office supplies',
      amount: -125.5,
      currency: 'USD',
      categoryId: 'shopping',
      tags: ['business'],
      accountName: 'Business Account',
      isRecurring: false,
      confidence: 0.95,
    },
    {
      id: 'tx_2',
      date: '2024-01-14T14:20:00Z',
      merchant: 'Starbucks',
      memo: 'Coffee meeting',
      amount: -8.75,
      currency: 'USD',
      categoryId: 'food',
      tags: ['business'],
      accountName: 'Business Account',
      isRecurring: false,
      confidence: 0.9,
    },
    {
      id: 'tx_3',
      date: '2024-01-13T09:15:00Z',
      merchant: 'Office Depot',
      memo: 'Printer paper',
      amount: -45.0,
      currency: 'USD',
      categoryId: 'shopping',
      tags: ['office'],
      accountName: 'Business Account',
      isRecurring: true,
      confidence: 0.85,
    },
  ];

  const mockBurnData = [
    { month: 'Jan', amount: 4500 },
    { month: 'Feb', amount: 5200 },
    { month: 'Mar', amount: 4800 },
    { month: 'Apr', amount: 5100 },
    { month: 'May', amount: 4900 },
    { month: 'Jun', amount: 5300 },
  ];

  const mockMerchantTrends = [
    {
      merchant: 'Amazon',
      currentMonth: 450,
      previousMonth: 380,
      change: 18.4,
      transactionCount: 12,
    },
    {
      merchant: 'Starbucks',
      currentMonth: 120,
      previousMonth: 95,
      change: 26.3,
      transactionCount: 8,
    },
    {
      merchant: 'Office Depot',
      currentMonth: 85,
      previousMonth: 90,
      change: -5.6,
      transactionCount: 3,
    },
  ];

  // Calculate spending stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthTransactions = mockTransactions.filter(tx => {
    const txDate = new Date(tx.date);
    return (
      txDate.getMonth() === currentMonth &&
      txDate.getFullYear() === currentYear &&
      tx.amount < 0
    );
  });

  const totalSpent = thisMonthTransactions.reduce(
    (sum, tx) => sum + Math.abs(tx.amount),
    0
  );
  const recurringSpent = thisMonthTransactions
    .filter(tx => tx.isRecurring)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const discretionaryCategories = ['food', 'shopping', 'entertainment'];
  const discretionarySpent = thisMonthTransactions
    .filter(tx => discretionaryCategories.includes(tx.categoryId || ''))
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const totalIncome = 15000; // Mock monthly income
  const savingsRate = Math.max(0, 1 - totalSpent / totalIncome);

  const spendingStats = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};

    thisMonthTransactions.forEach(tx => {
      if (tx.categoryId && tx.amount < 0) {
        categoryTotals[tx.categoryId] =
          (categoryTotals[tx.categoryId] || 0) + Math.abs(tx.amount);
      }
    });

    return Object.entries(categoryTotals).map(([categoryId, total]) => ({
      categoryId,
      total,
      pct: (total / totalSpent) * 100,
    }));
  }, [thisMonthTransactions, totalSpent]);

  const handleCSVExport = () => {
    const csvData = [
      ['Date', 'Merchant', 'Amount', 'Category', 'Account', 'Recurring'],
      ...mockTransactions.map(tx => [
        new Date(tx.date).toLocaleDateString(),
        tx.merchant,
        tx.amount.toString(),
        tx.categoryId || 'uncategorized',
        tx.accountName,
        tx.isRecurring ? 'Yes' : 'No',
      ]),
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spending-data-${accountType.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Spending Analytics</h2>
          <p className='text-muted-foreground'>
            Business spending patterns and expense management
          </p>
        </div>
        <div className='flex space-x-2'>
          <Button variant='outline' size='sm' onClick={handleCSVExport}>
            <Download className='h-4 w-4 mr-2' />
            Export CSV
          </Button>
          <Button variant='outline' size='sm'>
            <Eye className='h-4 w-4 mr-2' />
            Inspect
          </Button>
        </div>
      </div>

      {/* Account Type Toggle */}
      <Tabs
        value={accountType}
        onValueChange={value =>
          setAccountType(value as 'PERSONAL' | 'BUSINESS')
        }
      >
        <TabsList className='grid w-fit grid-cols-2'>
          <TabsTrigger value='PERSONAL'>Personal</TabsTrigger>
          <TabsTrigger value='BUSINESS'>Business</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* KPI Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center space-x-2'>
              <span className='text-2xl font-bold text-red-600'>
                ${totalSpent.toLocaleString()}
              </span>
              <TrendingUp className='h-5 w-5 text-red-600' />
            </div>
            <p className='text-xs text-muted-foreground mt-1'>This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Recurring Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center space-x-2'>
              <span className='text-2xl font-bold text-orange-600'>
                ${recurringSpent.toLocaleString()}
              </span>
              <Receipt className='h-5 w-5 text-orange-600' />
            </div>
            <p className='text-xs text-muted-foreground mt-1'>Fixed costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Discretionary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center space-x-2'>
              <span className='text-2xl font-bold text-purple-600'>
                ${discretionarySpent.toLocaleString()}
              </span>
              <ShoppingCart className='h-5 w-5 text-purple-600' />
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Variable spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Savings Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center space-x-2'>
              <span className='text-2xl font-bold text-green-600'>
                {(savingsRate * 100).toFixed(1)}%
              </span>
              <TrendingUp className='h-5 w-5 text-green-600' />
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Of total income
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two-column layout */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Left Column - Category Summary */}
        <CategorySummaryList
          data={spendingStats}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />

        {/* Right Column - Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle className='text-xl'>Spending Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingDonut
              data={spendingStats}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              totalSpend={totalSpent}
            />
          </CardContent>
        </Card>
      </div>

      {/* Trends Row */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Monthly Burn Chart */}
        <div className='lg:col-span-2'>
          <BurnTrendChart data={mockBurnData} />
        </div>

        {/* Savings Rate Card */}
        <SavingsRateCard
          currentRate={savingsRate}
          totalSpend={totalSpent}
          totalIncome={totalIncome}
          targetRate={0.2}
        />
      </div>

      {/* Top Merchants Chart */}
      <TopMerchantsChart data={mockMerchantTrends} />

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionsTable
            transactions={mockTransactions}
            onUpdateCategory={() => {}}
            onCreateRule={() => {}}
            selectedCategory={selectedCategory}
            accountType={accountType}
          />
        </CardContent>
      </Card>

      {/* 50/30/20 Reference Guide */}
      <Card>
        <CardContent className='p-6'>
          <h3 className='text-lg font-semibold mb-4'>50/30/20 Budget Rule</h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg'>
              <div className='text-2xl font-bold text-red-600'>50%</div>
              <div className='text-sm text-red-600 font-medium'>Needs</div>
              <div className='text-xs text-muted-foreground mt-1'>
                Essential expenses
              </div>
            </div>
            <div className='text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg'>
              <div className='text-2xl font-bold text-yellow-600'>30%</div>
              <div className='text-sm text-yellow-600 font-medium'>Wants</div>
              <div className='text-xs text-muted-foreground mt-1'>
                Discretionary spending
              </div>
            </div>
            <div className='text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg'>
              <div className='text-2xl font-bold text-green-600'>20%</div>
              <div className='text-sm text-green-600 font-medium'>Savings</div>
              <div className='text-xs text-muted-foreground mt-1'>
                Financial goals
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpendingTab;
