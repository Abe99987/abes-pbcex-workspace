import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  Repeat,
  TrendingUp,
  PiggyBank,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import SpendingDonut from '@/components/spending/SpendingDonut';
import CategorySummaryList from '@/components/spending/CategorySummaryList';
import BurnTrendChart from '@/components/spending/BurnTrendChart';
import TopMerchantsChart from '@/components/spending/TopMerchantsChart';
import TransactionsTable from '@/components/spending/TransactionsTable';
import SavingsRateCard from '@/components/spending/SavingsRateCard';
import {
  useSpendingData,
  AccountType,
  Transaction,
} from '@/hooks/useSpendingData';

const MySpending = () => {
  const [accountType, setAccountType] = useState<AccountType>('PERSONAL');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    transactions,
    burnData,
    merchantTrends,
    updateTransactionCategory,
    createCategorizationRule,
    getSpendingStats,
  } = useSpendingData(accountType);

  // Calculate KPIs
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return (
      txDate.getMonth() === currentMonth &&
      txDate.getFullYear() === currentYear &&
      tx.amount < 0
    ); // Only spending
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

  // Mock income for savings rate calculation
  const totalIncome = 8000; // Mock monthly income
  const savingsRate = Math.max(0, 1 - totalSpent / totalIncome);

  // Calculate spending stats for donut chart
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

  const handleUpdateCategory = async (id: string, categoryId: string) => {
    await updateTransactionCategory(id, categoryId);
  };

  const handleCreateRule = async (transaction: Transaction) => {
    await createCategorizationRule({
      merchant: transaction.merchant,
      categoryId: transaction.categoryId,
      confidence: 0.9,
    });
  };

  const getSavingsRateBadge = () => {
    if (savingsRate >= 0.25)
      return { label: 'Wealth Path', variant: 'default' as const };
    if (savingsRate >= 0.2)
      return { label: 'Strong', variant: 'secondary' as const };
    if (savingsRate >= 0.15)
      return { label: 'Secure', variant: 'outline' as const };
    return { label: 'Below Target', variant: 'destructive' as const };
  };

  const savingsBadge = getSavingsRateBadge();

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='mb-8 flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0'>
          <div>
            <h1 className='text-3xl md:text-4xl font-bold text-foreground mb-4'>
              My Spending
            </h1>
            <p className='text-xl text-muted-foreground'>
              Track expenses, analyze trends, and optimize your financial health
            </p>
          </div>

          {/* Account Type Toggle */}
          <Tabs
            value={accountType}
            onValueChange={value => setAccountType(value as AccountType)}
          >
            <TabsList className='grid w-fit grid-cols-2'>
              <TabsTrigger value='PERSONAL'>Personal</TabsTrigger>
              <TabsTrigger value='BUSINESS'>Business</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* KPI Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Spent (This Month)
              </CardTitle>
              <DollarSign className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-destructive'>
                $
                {totalSpent.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className='text-xs text-muted-foreground'>
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Recurring (This Month)
              </CardTitle>
              <Repeat className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-primary'>
                $
                {recurringSpent.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className='text-xs text-muted-foreground'>
                {((recurringSpent / totalSpent) * 100).toFixed(0)}% of total
                spend
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Discretionary (This Month)
              </CardTitle>
              <TrendingUp className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-orange-600'>
                $
                {discretionarySpent.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className='text-xs text-muted-foreground'>
                {((discretionarySpent / totalSpent) * 100).toFixed(0)}% of total
                spend
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Savings Rate
              </CardTitle>
              <PiggyBank className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='flex items-center justify-between'>
                <div className='text-2xl font-bold text-primary'>
                  {(savingsRate * 100).toFixed(1)}%
                </div>
                <Badge variant={savingsBadge.variant}>
                  {savingsBadge.label}
                </Badge>
              </div>
              <p className='text-xs text-muted-foreground'>
                Target: 20% Strong
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Two-column hero */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
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
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8'>
          {/* Monthly Burn Chart */}
          <div className='lg:col-span-2'>
            <BurnTrendChart data={burnData} />
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
        <div className='mb-8'>
          <TopMerchantsChart data={merchantTrends} />
        </div>

        {/* 50/30/20 Reference Guide */}
        <Card className='mb-8'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold flex items-center space-x-2'>
                <Calendar className='w-5 h-5' />
                <span>50/30/20 Budget Guide</span>
              </h3>
              <Badge variant='outline'>Reference</Badge>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='text-center p-4 bg-red-50 dark:bg-red-900/10 rounded-lg'>
                <div className='text-2xl font-bold text-red-600'>50%</div>
                <div className='text-sm font-medium'>Needs</div>
                <div className='text-xs text-muted-foreground'>
                  Fixed costs, utilities, groceries
                </div>
              </div>
              <div className='text-center p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg'>
                <div className='text-2xl font-bold text-yellow-600'>30%</div>
                <div className='text-sm font-medium'>Wants</div>
                <div className='text-xs text-muted-foreground'>
                  Entertainment, dining out, shopping
                </div>
              </div>
              <div className='text-center p-4 bg-green-50 dark:bg-green-900/10 rounded-lg'>
                <div className='text-2xl font-bold text-green-600'>20%</div>
                <div className='text-sm font-medium'>Savings</div>
                <div className='text-xs text-muted-foreground'>
                  Emergency fund, investments, debt
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Section */}
        <TransactionsTable
          transactions={transactions}
          selectedCategory={selectedCategory}
          accountType={accountType}
          onUpdateCategory={handleUpdateCategory}
          onCreateRule={handleCreateRule}
        />
      </div>
    </div>
  );
};

export default MySpending;
