import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import {
  spendingAdapter,
  type Transaction,
  type Budget,
  type DCARule,
  type SpendingFilters,
} from '@/lib/api';
import { FEATURE_FLAGS } from '@/config/features';
import { useDCAStore } from '@/hooks/useDCAStore';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Home,
  Car,
  Plane,
  Coffee,
  Film,
  Target,
  AlertCircle,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Tag,
  Repeat,
  X,
  Gauge,
  Coins,
  Settings,
  CreditCard,
  RotateCcw,
  PiggyBank,
} from 'lucide-react';

const MySpending = () => {
  // State management
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedMetal, setSelectedMetal] = useState('Gold');
  const [smartSpendEnabled, setSmartSpendEnabled] = useState(true);
  const [defaultSpendAsset, setDefaultSpendAsset] = useState('USDC');
  const [trendTimeframe, setTrendTimeframe] = useState('Month');
  const [savingsGoal, setSavingsGoal] = useState(25);
  const [dcaTimeframe, setDcaTimeframe] = useState('Month');
  const [dcaAsset, setDcaAsset] = useState('Gold');
  const [dcaSourceAccount, setDcaSourceAccount] = useState('Funding');
  const [dcaAmount, setDcaAmount] = useState(100);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  // API data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [dcaRules, setDcaRules] = useState<DCARule[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTagInput, setShowTagInput] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [newTag, setNewTag] = useState('');
  const itemsPerPage = 20;

  // Load API data on component mount
  useEffect(() => {
    const loadSpendingData = async () => {
      try {
        setLoading(true);
        const month = currentMonth.toISOString().slice(0, 7); // YYYY-MM format

        const [transactionsData, budgetsData, rulesData, tagsData] =
          await Promise.all([
            spendingAdapter.getTransactions({ month }),
            spendingAdapter.getBudgets(),
            spendingAdapter.getDCARules(),
            spendingAdapter.getTags(),
          ]);

        setTransactions(transactionsData);
        setBudgets(budgetsData);
        setDcaRules(rulesData);
        setAvailableTags(tagsData);
      } catch (error) {
        console.error('Failed to load spending data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSpendingData();
  }, [currentMonth]);

  // Feature flag check after hooks
  if (!FEATURE_FLAGS['spending.v1']) {
    return (
      <div className='min-h-screen bg-background'>
        <Navigation />
        <div className='flex items-center justify-center py-24'>
          <div className='text-center space-y-4'>
            <h1 className='text-2xl font-bold text-foreground'>
              My Spending Coming Soon
            </h1>
            <p className='text-muted-foreground'>
              The spending analytics feature is currently in development.
            </p>
            <Button
              onClick={() => (window.location.href = '/')}
              variant='default'
            >
              Return Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate spending metrics from live data
  const totalSpent = transactions
    .filter(tx => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const monthlyBudget =
    budgets.reduce((sum, budget) => sum + budget.monthlyLimit, 0) || 5000;
  const budgetUsed = (totalSpent / monthlyBudget) * 100;
  const totalIncome = 6500; // Mock - would come from income tracking
  const savingsRate = Math.round(
    ((totalIncome - totalSpent) / totalIncome) * 100
  );
  const potentialDCAAmount = Math.round((totalIncome - totalSpent) * 0.8);

  const categoryData = [
    {
      name: 'Shopping',
      amount: 1234.56,
      color: '#8B5CF6',
      icon: ShoppingCart,
      budget: 1500,
      recurring: false,
    },
    {
      name: 'Housing',
      amount: 987.43,
      color: '#06B6D4',
      icon: Home,
      budget: 1200,
      recurring: true,
    },
    {
      name: 'Transportation',
      amount: 543.21,
      color: '#10B981',
      icon: Car,
      budget: 600,
      recurring: false,
    },
    {
      name: 'Travel',
      amount: 456.78,
      color: '#F59E0B',
      icon: Plane,
      budget: 500,
      recurring: false,
    },
    {
      name: 'Food & Dining',
      amount: 398.45,
      color: '#EF4444',
      icon: Coffee,
      budget: 400,
      recurring: false,
    },
    {
      name: 'Entertainment',
      amount: 287.32,
      color: '#EC4899',
      icon: Film,
      budget: 300,
      recurring: false,
    },
    {
      name: 'Other',
      amount: 360.08,
      color: '#6B7280',
      icon: DollarSign,
      budget: 500,
      recurring: false,
    },
  ];

  // Data for different trend views
  const dailyTrend = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    amount: Math.floor(Math.random() * 200) + 100, // Random daily amounts
  }));

  const monthlyTrend = [
    { month: 'Jul', amount: 3654 },
    { month: 'Aug', amount: 3890 },
    { month: 'Sep', amount: 4120 },
    { month: 'Oct', amount: 3950 },
    { month: 'Nov', amount: 4340 },
    { month: 'Dec', amount: 4267 },
    { month: 'Jan', amount: 4156 },
    { month: 'Feb', amount: 3987 },
    { month: 'Mar', amount: 4298 },
    { month: 'Apr', amount: 4089 },
    { month: 'May', amount: 4178 },
    { month: 'Jun', amount: 4267 },
  ];

  const yearlyTrend = [
    { year: '2020', amount: 42680 },
    { year: '2021', amount: 45230 },
    { year: '2022', amount: 48950 },
    { year: '2023', amount: 51240 },
    { year: '2024', amount: 49870 },
  ];

  // Get current trend data based on timeframe
  const getCurrentTrendData = () => {
    switch (trendTimeframe) {
      case 'Day':
        return dailyTrend;
      case 'Year':
        return yearlyTrend;
      default:
        return monthlyTrend;
    }
  };

  const getCurrentDataKey = () => {
    switch (trendTimeframe) {
      case 'Day':
        return 'day';
      case 'Year':
        return 'year';
      default:
        return 'month';
    }
  };

  // Filter transactions for current view
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch =
      transaction.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || transaction.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const recurringExpenses = categoryData.filter(cat => cat.recurring);

  const savingsOpportunities = [
    {
      category: 'Shopping',
      potential: 234.56,
      tip: 'Consider setting spending alerts for discretionary purchases',
    },
    {
      category: 'Food & Dining',
      potential: 98.45,
      tip: 'Try meal planning to reduce spontaneous food orders',
    },
    {
      category: 'Entertainment',
      potential: 87.32,
      tip: 'Look for bundle subscriptions to save on streaming services',
    },
  ];

  // Category totals for spending breakdown
  const categoryData = budgets.map(budget => ({
    name: budget.category,
    amount: budget.spent,
    color: getColorForCategory(budget.category),
    icon: getIconForCategory(budget.category),
    budget: budget.monthlyLimit,
    recurring: false, // Could be enhanced from transaction data
  }));

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle transaction selection
  const handleSelectTransaction = (transactionId: string) => {
    setSelectedTransactions(prev =>
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === paginatedTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(paginatedTransactions.map(t => t.id));
    }
  };

  // Handle category update
  const handleCategoryUpdate = async (
    transactionId: string,
    newCategory: string
  ) => {
    try {
      // Update locally first for optimistic UI
      setTransactions(prev =>
        prev.map(tx =>
          tx.id === transactionId ? { ...tx, category: newCategory } : tx
        )
      );

      // Make API call (would be implemented in adapter)
      console.log(
        `Updated transaction ${transactionId} to category ${newCategory}`
      );
    } catch (error) {
      console.error('Failed to update category:', error);
      // Revert on error
      // In a real implementation, you'd reload or revert the state
    }
  };

  // CSV Export handler
  const handleCSVExport = async () => {
    try {
      const blob = await spendingAdapter.exportCSV({
        month: currentMonth.toISOString().slice(0, 7),
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `transactions_${currentMonth.toISOString().slice(0, 7)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('CSV export failed:', error);
    }
  };

  // Tag management
  const handleAddTag = async (transactionId: string, tag: string) => {
    try {
      await spendingAdapter.addTag(transactionId, tag);

      // Update local state
      setTransactions(prev =>
        prev.map(tx =>
          tx.id === transactionId ? { ...tx, tags: [...tx.tags, tag] } : tx
        )
      );
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };

  // DCA rule creation
  const handleCreateDCARule = async () => {
    try {
      if (dcaAmount > 0) {
        const rule = await spendingAdapter.createDCARule({
          alias: `${dcaAsset.toLowerCase()}_${dcaTimeframe.toLowerCase()}`,
          asset: dcaAsset,
          amount: dcaAmount,
          frequency: dcaTimeframe.toLowerCase() as
            | 'daily'
            | 'weekly'
            | 'monthly',
          nextExecution: new Date().toISOString(),
          isActive: true,
        });

        // Update local state
        setDcaRules(prev => [...prev, rule]);
      }
    } catch (error) {
      console.error('Failed to create DCA rule:', error);
    }
  };

  // Helper functions for category mapping
  const getColorForCategory = (category: string) => {
    const colorMap: Record<string, string> = {
      Shopping: '#8B5CF6',
      'Food & Dining': '#EF4444',
      Transportation: '#10B981',
      Entertainment: '#EC4899',
      Housing: '#06B6D4',
      Travel: '#F59E0B',
    };
    return colorMap[category] || '#6B7280';
  };

  const getIconForCategory = (category: string) => {
    const iconMap: Record<string, typeof ShoppingCart> = {
      Shopping: ShoppingCart,
      'Food & Dining': Coffee,
      Transportation: Car,
      Entertainment: Film,
      Housing: Home,
      Travel: Plane,
    };
    return iconMap[category] || DollarSign;
  };

  // Helper functions
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getSavingsRateColor = (rate: number) => {
    if (rate < 15) return 'text-red-500';
    if (rate < 25) return 'text-yellow-500';
    if (rate < 30) return 'text-blue-500';
    return 'text-green-500';
  };

  const getSavingsRateLabel = (rate: number) => {
    if (rate < 15) return 'Needs work';
    if (rate < 25) return 'Good';
    if (rate < 30) return 'Strong';
    return 'Wealthy';
  };

  const getSavingsGoalDelta = (currentRate: number, goalRate: number) => {
    const delta = ((currentRate - goalRate) / 100) * totalIncome;
    if (currentRate >= goalRate) {
      return `You're above goal by $${Math.abs(delta).toFixed(0)}/mo.`;
    } else {
      return `You're under goal by $${Math.abs(delta).toFixed(0)}/mo.`;
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />

      <Helmet>
        <title>My Spending - PBCEx | Spending Analysis & Budgets</title>
        <meta
          name='description'
          content='Track your spending patterns, manage budgets, and discover savings opportunities with PBCEx spending analytics.'
        />
      </Helmet>

      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-6xl mx-auto space-y-8'>
          {/* Header */}
          <div>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h1 className='text-3xl font-bold text-foreground mb-2'>
                  My Spending
                </h1>
                <div className='flex items-center gap-4'>
                  <p className='text-muted-foreground'>
                    Track your expenses and manage your budget
                  </p>
                  <a
                    href='/my-cards'
                    className='text-sm text-primary hover:text-primary/80 underline'
                  >
                    My Cards
                  </a>
                </div>
              </div>
            </div>

            {/* Smart Spend Settings */}
            <Card className='bg-card/50 border-border/50 mb-6'>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Settings className='w-5 h-5 text-muted-foreground' />
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-medium text-foreground'>
                          Smart Spend
                        </span>
                        <Switch
                          checked={smartSpendEnabled}
                          onCheckedChange={setSmartSpendEnabled}
                        />
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        Automatically spend from the optimal asset
                        (fees/liquidity rules)
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-3'>
                    <div>
                      <label className='text-xs text-muted-foreground block mb-1'>
                        Default spend asset when Smart Spend is off
                      </label>
                      <Select
                        value={defaultSpendAsset}
                        onValueChange={setDefaultSpendAsset}
                      >
                        <SelectTrigger className='w-32 h-8'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='USDC'>USDC</SelectItem>
                          <SelectItem value='BTC'>BTC</SelectItem>
                          <SelectItem value='ETH'>ETH</SelectItem>
                          <SelectItem value='GOLD'>GOLD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 1: Donut Chart - Full Width */}
          <Card className='bg-card/50 border-border/50'>
            <CardHeader>
              <CardTitle className='text-foreground'>
                Spending by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex flex-col items-center space-y-6'>
                {/* Large Centered Donut */}
                <div className='h-96 w-full flex justify-center'>
                  <ResponsiveContainer width={420} height='100%'>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx='50%'
                        cy='50%'
                        innerRadius={80}
                        outerRadius={160}
                        paddingAngle={2}
                        dataKey='amount'
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList
                          dataKey={(entry: any) =>
                            `${entry.name} (${((entry.amount / totalSpent) * 100).toFixed(0)}%)`
                          }
                          position='outside'
                          fontSize={11}
                          fill='hsl(var(--foreground))'
                        />
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [
                          `$${value.toLocaleString()}`,
                          'Amount',
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Legend Below - Two Columns */}
                <div className='w-full max-w-4xl'>
                  <div className='flex items-center justify-between mb-4'>
                    <h4 className='text-sm font-medium text-foreground'>
                      Categories
                    </h4>
                    <Dialog
                      open={showAddCategoryModal}
                      onOpenChange={setShowAddCategoryModal}
                    >
                      <DialogTrigger asChild>
                        <Button variant='outline' size='sm' className='text-xs'>
                          Add Category
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Category</DialogTitle>
                        </DialogHeader>
                        <div className='space-y-4'>
                          <div>
                            <label className='text-sm font-medium'>
                              Category Name
                            </label>
                            <Input placeholder='e.g. Health & Fitness' />
                          </div>
                          <div>
                            <label className='text-sm font-medium'>Color</label>
                            <Input type='color' defaultValue='#8B5CF6' />
                          </div>
                          <div>
                            <label className='text-sm font-medium'>
                              Monthly Budget
                            </label>
                            <Input type='number' placeholder='500' />
                          </div>
                          <Button>Add Category</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    {categoryData.map((category, index) => {
                      const Icon = category.icon;
                      const percentOfBudget =
                        (category.amount / category.budget) * 100;
                      return (
                        <div
                          key={index}
                          className='flex items-center justify-between p-3 bg-muted/20 rounded-lg'
                        >
                          <div className='flex items-center space-x-3'>
                            <div
                              className='p-1 rounded'
                              style={{ backgroundColor: `${category.color}20` }}
                            >
                              <Icon
                                className='w-4 h-4'
                                style={{ color: category.color }}
                              />
                            </div>
                            <span className='text-sm font-medium text-foreground'>
                              {category.name}
                            </span>
                          </div>
                          <div className='text-right'>
                            <div className='text-sm font-semibold text-foreground'>
                              ${category.amount.toLocaleString()}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              {percentOfBudget.toFixed(0)}% of budget
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Row 2: KPI Tiles (Left) + Monthly Trend (Right) */}
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
            {/* Left Column: KPI Tiles Stacked */}
            <div className='lg:col-span-4 space-y-4'>
              <Card className='bg-card/50 border-border/50'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium text-muted-foreground'>
                    This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-foreground mb-1'>
                    ${totalSpent.toLocaleString()}
                  </div>
                  <div className='flex items-center gap-1 text-sm'>
                    <TrendingUp className='w-4 h-4 text-red-500' />
                    <span className='text-red-500'>+12.3%</span>
                    <span className='text-muted-foreground'>vs last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-card/50 border-border/50'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium text-muted-foreground'>
                    Budget Used
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-foreground mb-2'>
                    {budgetUsed.toFixed(1)}%
                  </div>
                  <Progress value={budgetUsed} className='h-2 mb-1' />
                  <div className='text-sm text-muted-foreground'>
                    ${(monthlyBudget - totalSpent).toLocaleString()} remaining
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-card/50 border-border/50'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium text-muted-foreground'>
                    Avg. Daily
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-foreground mb-1'>
                    ${(totalSpent / 30).toFixed(0)}
                  </div>
                  <div className='flex items-center gap-1 text-sm'>
                    <TrendingDown className='w-4 h-4 text-green-500' />
                    <span className='text-green-500'>-5.2%</span>
                    <span className='text-muted-foreground'>vs last month</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Monthly Trend - Expanded */}
            <Card className='bg-card/50 border-border/50 lg:col-span-8'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-foreground'>
                    Monthly Trend
                  </CardTitle>
                </div>
                <div className='flex gap-1 mt-2 overflow-x-auto'>
                  {['Day', 'Month', 'Year'].map(period => (
                    <Button
                      key={period}
                      variant={trendTimeframe === period ? 'default' : 'ghost'}
                      size='sm'
                      className='text-xs h-6 px-3 flex-shrink-0'
                      onClick={() => {
                        setTrendTimeframe(period);
                        // Sync the savings gauge timeframe (only Month/Year for gauge)
                        if (period === 'Month' || period === 'Year') {
                          // No additional action needed as the gauge already syncs
                        }
                      }}
                    >
                      {period}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className='h-96 mb-4'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={getCurrentTrendData()}>
                      <CartesianGrid
                        strokeDasharray='3 3'
                        stroke='hsl(var(--border))'
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey={getCurrentDataKey()}
                        stroke='hsl(var(--muted-foreground))'
                        fontSize={12}
                        tickLine={false}
                        interval={trendTimeframe === 'Day' ? 4 : 0}
                      />
                      <YAxis
                        stroke='hsl(var(--muted-foreground))'
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          `$${value.toLocaleString()}`,
                          'Spent',
                        ]}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                        }}
                      />
                      <Bar
                        dataKey='amount'
                        fill='hsl(var(--primary))'
                        radius={[4, 4, 0, 0]}
                        animationDuration={800}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className='text-sm text-muted-foreground text-center'>
                  Average: $
                  {(
                    getCurrentTrendData().reduce(
                      (acc: number, item: any) => acc + item.amount,
                      0
                    ) / getCurrentTrendData().length
                  ).toLocaleString()}
                  {trendTimeframe === 'Day' && (
                    <span className='block text-xs mt-1'>January 2024</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Savings Gauge and DCA Nudge Section */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
            {/* Savings Rate Gauge */}
            <Card className='bg-card/50 border-border/50'>
              <CardHeader className='pb-4'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-lg flex items-center space-x-2'>
                    <Gauge className='w-5 h-5' />
                    <span>Savings Rate</span>
                  </CardTitle>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant={
                        trendTimeframe === 'Month' || trendTimeframe === 'Day'
                          ? 'default'
                          : 'outline'
                      }
                      size='sm'
                      onClick={() => setTrendTimeframe('Month')}
                      className='text-xs'
                    >
                      Month
                    </Button>
                    <Button
                      variant={
                        trendTimeframe === 'Year' ? 'default' : 'outline'
                      }
                      size='sm'
                      onClick={() => setTrendTimeframe('Year')}
                      className='text-xs'
                    >
                      Year
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex justify-center'>
                  <div className='relative w-40 h-40'>
                    <div className='absolute inset-0 rounded-full border-8 border-muted'></div>
                    <div
                      className={`absolute inset-0 rounded-full border-8 border-t-transparent border-r-transparent ${getSavingsRateColor(savingsRate)} transition-all duration-500`}
                      style={{
                        transform: `rotate(${(savingsRate / 100) * 360}deg)`,
                        clipPath: 'polygon(50% 0, 100% 0, 100% 50%, 50% 50%)',
                      }}
                    ></div>
                    <div className='absolute inset-0 flex items-center justify-center'>
                      <div className='text-center'>
                        <div className='text-3xl font-bold text-foreground'>
                          {savingsRate}%
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {getSavingsRateLabel(savingsRate)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Goal Pills */}
                <div className='flex justify-center gap-2 mb-3'>
                  {[15, 25, 30].map(goal => (
                    <Button
                      key={goal}
                      variant={savingsGoal === goal ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setSavingsGoal(goal)}
                      className='text-xs px-3'
                    >
                      {goal}%
                    </Button>
                  ))}
                  <Button
                    variant={
                      savingsGoal !== 15 &&
                      savingsGoal !== 25 &&
                      savingsGoal !== 30
                        ? 'default'
                        : 'outline'
                    }
                    size='sm'
                    onClick={() => setSavingsGoal(35)}
                    className='text-xs px-3'
                  >
                    Custom
                  </Button>
                </div>

                {/* Custom Input */}
                {savingsGoal !== 15 &&
                  savingsGoal !== 25 &&
                  savingsGoal !== 30 && (
                    <div className='flex justify-center'>
                      <Input
                        type='number'
                        placeholder='%'
                        className='w-20 text-center'
                        value={savingsGoal}
                        onChange={e => setSavingsGoal(Number(e.target.value))}
                      />
                    </div>
                  )}

                <div className='text-center'>
                  <div className='text-sm text-muted-foreground mb-2'>
                    Target: {savingsGoal}%
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {getSavingsGoalDelta(savingsRate, savingsGoal)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gold DCA Nudge */}
            <Card className='lg:col-span-2 bg-primary/10 border-primary/20'>
              <CardContent className='p-4 space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Coins className='w-5 h-5 text-primary' />
                    <div>
                      <p className='text-sm font-medium text-foreground'>
                        Auto-invest your savings
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Based on your current savings pace, you could
                        auto-invest ~${potentialDCAAmount}/month.
                      </p>
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        (window.location.href = '/trading/dca#calculator')
                      }
                    >
                      DCA Calculator
                    </Button>
                    <Button
                      variant='default'
                      size='sm'
                      onClick={() =>
                        (window.location.href = '/trading/dca#setup')
                      }
                    >
                      Set up DCA
                    </Button>
                  </div>
                </div>

                {/* DCA Configuration Form */}
                <div className='space-y-4'>
                  {/* Amount per section with label above */}
                  <div>
                    <label className='text-sm font-medium text-foreground block mb-2'>
                      Amount per
                    </label>
                    <div className='flex items-center gap-3 flex-wrap'>
                      <div className='flex gap-1'>
                        {['Day', 'Month'].map(timeframe => (
                          <Button
                            key={timeframe}
                            variant={
                              dcaTimeframe === timeframe ? 'default' : 'outline'
                            }
                            size='sm'
                            onClick={() => setDcaTimeframe(timeframe)}
                            className='text-xs px-3'
                          >
                            {timeframe}
                          </Button>
                        ))}
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        Executes at beginning of selected period.
                      </p>
                    </div>
                  </div>

                  {/* Form fields row */}
                  <div className='grid grid-cols-1 sm:grid-cols-4 gap-3 items-end'>
                    <div>
                      <label className='text-sm font-medium text-foreground block mb-2'>
                        Amount
                      </label>
                      <Input
                        type='number'
                        placeholder='100'
                        value={dcaAmount}
                        onChange={e => setDcaAmount(Number(e.target.value))}
                        className='min-w-20'
                      />
                    </div>

                    <div>
                      <label className='text-sm font-medium text-foreground block mb-2'>
                        Choose asset
                      </label>
                      <Select value={dcaAsset} onValueChange={setDcaAsset}>
                        <SelectTrigger>
                          <SelectValue placeholder='Select asset' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='Gold'>Gold</SelectItem>
                          <SelectItem value='Silver'>Silver</SelectItem>
                          <SelectItem value='BTC'>BTC</SelectItem>
                          <SelectItem value='ETH'>ETH</SelectItem>
                          <SelectItem value='Platinum'>Platinum</SelectItem>
                          <SelectItem value='Palladium'>Palladium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className='text-sm font-medium text-foreground block mb-2'>
                        From account
                      </label>
                      <Select
                        value={dcaSourceAccount}
                        onValueChange={setDcaSourceAccount}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='Funding'>Funding</SelectItem>
                          <SelectItem value='Trading'>Trading</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      className='w-full sm:w-auto'
                      onClick={handleCreateDCARule}
                      disabled={loading || dcaAmount <= 0}
                    >
                      Save monthly rule
                    </Button>
                  </div>
                </div>

                {/* Rules List */}
                <div className='space-y-2'>
                  <h4 className='text-sm font-medium text-foreground'>
                    Active Rules
                  </h4>
                  <div className='space-y-2 max-h-32 overflow-y-auto'>
                    {dcaRules.length === 0 ? (
                      <div className='text-center py-4 text-sm text-muted-foreground'>
                        No active DCA rules yet
                      </div>
                    ) : (
                      dcaRules.map(rule => (
                        <div
                          key={rule.id}
                          className='flex items-center justify-between p-3 bg-card/50 rounded-lg border'
                        >
                          <div className='flex items-center gap-3'>
                            <span className='text-sm font-medium'>
                              ${rule.amount} / {rule.frequency} → {rule.asset}
                            </span>
                            <Badge variant='secondary' className='text-xs'>
                              {rule.alias}
                            </Badge>
                            <Badge
                              variant={rule.isActive ? 'default' : 'outline'}
                              className='text-xs'
                            >
                              {rule.isActive ? 'Active' : 'Paused'}
                            </Badge>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-6 w-6 p-0'
                            onClick={() => {
                              // Remove from API state
                              setDcaRules(prev =>
                                prev.filter(r => r.id !== rule.id)
                              );
                            }}
                          >
                            <X className='w-3 h-3' />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Ledger Section - Full Width */}
          <div className='space-y-4'>
            {/* Month Header for Transactions */}
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='text-xl font-semibold text-foreground flex items-center gap-3'>
                  Recent Transactions — {formatMonthYear(currentMonth)}
                  <div className='flex items-center gap-1'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => navigateMonth('prev')}
                      className='h-8 w-8 p-0'
                    >
                      <ChevronLeft className='w-4 h-4' />
                    </Button>
                    <Select>
                      <SelectTrigger className='w-32 h-8 text-xs'>
                        <SelectValue
                          placeholder={formatMonthYear(currentMonth)}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='2024-09'>September 2024</SelectItem>
                        <SelectItem value='2024-08'>August 2024</SelectItem>
                        <SelectItem value='2024-07'>July 2024</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => navigateMonth('next')}
                      className='h-8 w-8 p-0'
                    >
                      <ChevronRight className='w-4 h-4' />
                    </Button>
                  </div>
                </h2>
                <p className='text-xs text-muted-foreground'>
                  Showing transactions for{' '}
                  {formatMonthYear(currentMonth).replace(' ', ' 1–30, ')}
                </p>
              </div>
            </div>

            {/* Filters & Search */}
            <Card className='bg-card/50 border-border/50'>
              <CardContent className='p-4'>
                <div className='flex flex-col md:flex-row gap-4'>
                  <div className='relative flex-1'>
                    <Search className='w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground' />
                    <Input
                      placeholder='Search transactions...'
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className='pl-10'
                    />
                  </div>
                  <div className='flex gap-2'>
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger className='w-40'>
                        <SelectValue placeholder='Category' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All Categories</SelectItem>
                        {categoryData.map(cat => (
                          <SelectItem key={cat.name} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant='outline' size='sm'>
                      <Calendar className='w-4 h-4 mr-2' />
                      Date Range
                    </Button>
                    <Button variant='outline' size='sm'>
                      <Filter className='w-4 h-4 mr-2' />
                      More Filters
                    </Button>
                    <Button variant='outline' size='sm'>
                      <Download className='w-4 h-4 mr-2' />
                      Export
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleCSVExport}
                      disabled={loading}
                    >
                      <Download className='w-4 h-4 mr-2' />
                      Export month CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Actions Bar */}
            {selectedTransactions.length > 0 && (
              <Card className='bg-primary/10 border-primary/20'>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <p className='text-sm font-medium text-foreground'>
                      {selectedTransactions.length} transaction
                      {selectedTransactions.length !== 1 ? 's' : ''} selected
                    </p>
                    <div className='flex gap-2'>
                      <Select>
                        <SelectTrigger className='w-40'>
                          <SelectValue placeholder='Categorize as...' />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryData.map(cat => (
                            <SelectItem key={cat.name} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant='outline' size='sm'>
                        <Repeat className='w-4 h-4 mr-2' />
                        Mark Recurring
                      </Button>
                      <Button variant='outline' size='sm'>
                        <Tag className='w-4 h-4 mr-2' />
                        Add Tag
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setSelectedTransactions([])}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transactions Table */}
            <Card className='bg-card/50 border-border/50'>
              <CardHeader>
                <CardTitle className='text-foreground'>
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent className='p-0'>
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-12'>
                          <Checkbox
                            checked={
                              selectedTransactions.length ===
                                paginatedTransactions.length &&
                              paginatedTransactions.length > 0
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Merchant</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead className='text-right'>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTransactions.map(transaction => (
                        <TableRow
                          key={transaction.id}
                          className='hover:bg-muted/50'
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedTransactions.includes(
                                transaction.id
                              )}
                              onCheckedChange={() =>
                                handleSelectTransaction(transaction.id)
                              }
                            />
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground'>
                            {new Date(transaction.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className='font-medium text-foreground'>
                                {transaction.merchant}
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                {transaction.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={transaction.category}
                              onValueChange={value =>
                                handleCategoryUpdate(transaction.id, value)
                              }
                            >
                              <SelectTrigger className='w-32'>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {categoryData.map(cat => (
                                  <SelectItem key={cat.name} value={cat.name}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className='flex gap-1 flex-wrap items-center'>
                              {transaction.tags.map(tag => (
                                <Badge
                                  key={tag}
                                  variant='secondary'
                                  className='text-xs'
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {transaction.recurring && (
                                <Badge variant='outline' className='text-xs'>
                                  <Repeat className='w-3 h-3 mr-1' />
                                  Recurring
                                </Badge>
                              )}

                              {/* Add Tag functionality */}
                              {transaction.tags.length === 0 ? (
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  className='text-xs h-6 px-2 text-muted-foreground'
                                  onClick={() =>
                                    setShowTagInput({
                                      ...showTagInput,
                                      [transaction.id]: true,
                                    })
                                  }
                                >
                                  + Add tag
                                </Button>
                              ) : (
                                <Button
                                  variant='outline'
                                  size='sm'
                                  className='text-xs h-6 w-6 p-0'
                                  onClick={() =>
                                    setShowTagInput({
                                      ...showTagInput,
                                      [transaction.id]: true,
                                    })
                                  }
                                >
                                  +
                                </Button>
                              )}

                              {/* Inline tag input */}
                              {showTagInput[transaction.id] && (
                                <div className='flex items-center gap-1 ml-2'>
                                  <Input
                                    placeholder='Tag name'
                                    className='h-6 w-20 text-xs'
                                    value={newTag}
                                    onChange={e => setNewTag(e.target.value)}
                                    onKeyDown={async e => {
                                      if (e.key === 'Enter' && newTag.trim()) {
                                        await handleAddTag(
                                          transaction.id,
                                          newTag
                                        );
                                        setNewTag('');
                                        setShowTagInput({
                                          ...showTagInput,
                                          [transaction.id]: false,
                                        });
                                      } else if (e.key === 'Escape') {
                                        setShowTagInput({
                                          ...showTagInput,
                                          [transaction.id]: false,
                                        });
                                        setNewTag('');
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    className='h-6 w-6 p-0'
                                    onClick={() => {
                                      setShowTagInput({
                                        ...showTagInput,
                                        [transaction.id]: false,
                                      });
                                      setNewTag('');
                                    }}
                                  >
                                    <X className='w-3 h-3' />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className='text-right'>
                            <span
                              className={
                                transaction.amount < 0
                                  ? 'text-red-500'
                                  : 'text-green-500'
                              }
                            >
                              ${Math.abs(transaction.amount).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                transaction.status === 'completed'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {transaction.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className='flex items-center justify-between px-6 py-4 border-t border-border'>
                  <p className='text-sm text-muted-foreground'>
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredTransactions.length
                    )}{' '}
                    of {filteredTransactions.length} transactions
                  </p>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setCurrentPage(prev => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className='w-4 h-4' />
                    </Button>
                    <span className='text-sm text-muted-foreground'>
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setCurrentPage(prev => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Footer Disclosure */}
          <div className='text-xs text-muted-foreground text-center pt-8 border-t border-border'>
            <p>
              DCA and round-ups are optional; not investment advice. Settlement
              in selected metal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MySpending;
