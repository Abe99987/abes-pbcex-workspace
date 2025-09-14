import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
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
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
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
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const itemsPerPage = 20;

  // Mock spending data
  const totalSpent = 4267.83;
  const monthlyBudget = 5000;
  const budgetUsed = (totalSpent / monthlyBudget) * 100;
  const totalIncome = 6500;
  const savingsRate = Math.round(((totalIncome - totalSpent) / totalIncome) * 100);
  const potentialDCAAmount = Math.round((totalIncome - totalSpent) * 0.8);

  const categoryData = [
    { name: 'Shopping', amount: 1234.56, color: '#8B5CF6', icon: ShoppingCart, budget: 1500, recurring: false },
    { name: 'Housing', amount: 987.43, color: '#06B6D4', icon: Home, budget: 1200, recurring: true },
    { name: 'Transportation', amount: 543.21, color: '#10B981', icon: Car, budget: 600, recurring: false },
    { name: 'Travel', amount: 456.78, color: '#F59E0B', icon: Plane, budget: 500, recurring: false },
    { name: 'Food & Dining', amount: 398.45, color: '#EF4444', icon: Coffee, budget: 400, recurring: false },
    { name: 'Entertainment', amount: 287.32, color: '#EC4899', icon: Film, budget: 300, recurring: false },
    { name: 'Other', amount: 360.08, color: '#6B7280', icon: DollarSign, budget: 500, recurring: false },
  ];

  const monthlyTrend = [
    { month: 'Jan', amount: 3890 },
    { month: 'Feb', amount: 4120 },
    { month: 'Mar', amount: 3950 },
    { month: 'Apr', amount: 4340 },
    { month: 'May', amount: 4267 },
  ];

  // Mock transaction data
  const mockTransactions = [
    { id: '1', date: '2024-01-15', merchant: 'Amazon', description: 'Online shopping - Electronics', category: 'Shopping', tags: ['electronics', 'online'], amount: -189.99, status: 'completed', recurring: false, type: 'card', account: 'Funding' },
    { id: '2', date: '2024-01-14', merchant: 'Starbucks', description: 'Coffee and pastry', category: 'Food & Dining', tags: ['coffee'], amount: -12.45, status: 'completed', recurring: false, type: 'card', account: 'Funding' },
    { id: '3', date: '2024-01-14', merchant: 'Netflix', description: 'Monthly subscription', category: 'Entertainment', tags: ['subscription'], amount: -15.99, status: 'completed', recurring: true, type: 'card', account: 'Funding' },
    { id: '4', date: '2024-01-13', merchant: 'Shell Gas Station', description: 'Fuel purchase', category: 'Transportation', tags: ['gas'], amount: -45.67, status: 'completed', recurring: false, type: 'card', account: 'Funding' },
    { id: '5', date: '2024-01-12', merchant: 'Walmart', description: 'Groceries', category: 'Food & Dining', tags: ['groceries'], amount: -87.23, status: 'completed', recurring: false, type: 'card', account: 'Funding' },
    { id: '6', date: '2024-01-11', merchant: 'Uber', description: 'Ride to airport', category: 'Transportation', tags: ['ride-share'], amount: -23.50, status: 'completed', recurring: false, type: 'card', account: 'Funding' },
    { id: '7', date: '2024-01-10', merchant: 'Apple', description: 'App Store purchase', category: 'Entertainment', tags: ['apps'], amount: -4.99, status: 'completed', recurring: false, type: 'card', account: 'Funding' },
    { id: '8', date: '2024-01-09', merchant: 'Target', description: 'Home supplies', category: 'Shopping', tags: ['home'], amount: -156.78, status: 'completed', recurring: false, type: 'card', account: 'Funding' },
  ];

  const recurringExpenses = categoryData.filter(cat => cat.recurring);

  const savingsOpportunities = [
    { category: 'Shopping', potential: 234.56, tip: 'Consider setting spending alerts for discretionary purchases' },
    { category: 'Food & Dining', potential: 98.45, tip: 'Try meal planning to reduce spontaneous food orders' },
    { category: 'Entertainment', potential: 87.32, tip: 'Look for bundle subscriptions to save on streaming services' },
  ];

  // Filter transactions
  const filteredTransactions = mockTransactions.filter(transaction => {
    const matchesSearch = transaction.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
  const handleCategoryUpdate = (transactionId: string, newCategory: string) => {
    // In a real app, this would update the transaction
    console.log(`Updating transaction ${transactionId} to category ${newCategory}`);
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
    const delta = (currentRate - goalRate) / 100 * totalIncome;
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
                <h1 className='text-3xl font-bold text-foreground mb-2'>My Spending</h1>
                <div className='flex items-center gap-4'>
                  <p className='text-muted-foreground'>Track your expenses and manage your budget</p>
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
                        <span className='text-sm font-medium text-foreground'>Smart Spend</span>
                        <Switch 
                          checked={smartSpendEnabled}
                          onCheckedChange={setSmartSpendEnabled}
                        />
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        Automatically spend from the optimal asset (fees/liquidity rules)
                      </p>
                    </div>
                  </div>
                  
                  <div className='flex items-center gap-3'>
                    <div>
                      <label className='text-xs text-muted-foreground block mb-1'>
                        Default spend asset when Smart Spend is off
                      </label>
                      <Select value={defaultSpendAsset} onValueChange={setDefaultSpendAsset}>
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
              <CardTitle className='text-foreground'>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex flex-col items-center space-y-6'>
                {/* Large Centered Donut */}
                <div className='h-96 w-full flex justify-center'>
                  <ResponsiveContainer width={420} height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={160}
                        paddingAngle={2}
                        dataKey="amount"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList
                          dataKey={(entry: any) => `${entry.name} (${((entry.amount / totalSpent) * 100).toFixed(0)}%)`}
                          position="outside"
                          fontSize={11}
                          fill="hsl(var(--foreground))"
                        />
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Category Legend Below - Two Columns */}
                <div className='w-full max-w-4xl'>
                  <div className='flex items-center justify-between mb-4'>
                    <h4 className='text-sm font-medium text-foreground'>Categories</h4>
                    <Dialog open={showAddCategoryModal} onOpenChange={setShowAddCategoryModal}>
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
                            <label className='text-sm font-medium'>Category Name</label>
                            <Input placeholder='e.g. Health & Fitness' />
                          </div>
                          <div>
                            <label className='text-sm font-medium'>Color</label>
                            <Input type='color' defaultValue='#8B5CF6' />
                          </div>
                          <div>
                            <label className='text-sm font-medium'>Monthly Budget</label>
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
                      const percentOfBudget = (category.amount / category.budget) * 100;
                      return (
                        <div key={index} className='flex items-center justify-between p-3 bg-muted/20 rounded-lg'>
                          <div className='flex items-center space-x-3'>
                            <div className='p-1 rounded' style={{ backgroundColor: `${category.color}20` }}>
                              <Icon className='w-4 h-4' style={{ color: category.color }} />
                            </div>
                            <span className='text-sm font-medium text-foreground'>{category.name}</span>
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
                  <CardTitle className='text-sm font-medium text-muted-foreground'>This Month</CardTitle>
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
                  <CardTitle className='text-sm font-medium text-muted-foreground'>Budget Used</CardTitle>
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
                  <CardTitle className='text-sm font-medium text-muted-foreground'>Avg. Daily</CardTitle>
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
                  <CardTitle className='text-foreground'>Monthly Trend</CardTitle>
                </div>
                <div className='flex gap-1 mt-2 overflow-x-auto'>
                  {['Day', 'Month', 'Year'].map((period) => (
                    <Button
                      key={period}
                      variant={trendTimeframe === period ? 'default' : 'ghost'}
                      size='sm'
                      className='text-xs h-6 px-3 flex-shrink-0'
                      onClick={() => setTrendTimeframe(period)}
                    >
                      {period}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className='h-96 mb-4'>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Spent']}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                        animationDuration={1000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className='text-sm text-muted-foreground text-center'>
                  Average: ${(monthlyTrend.reduce((acc, month) => acc + month.amount, 0) / monthlyTrend.length).toLocaleString()}
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
                      variant={trendTimeframe === 'Month' ? 'default' : 'outline'} 
                      size='sm'
                      onClick={() => setTrendTimeframe('Month')}
                      className='text-xs'
                    >
                      Month
                    </Button>
                    <Button 
                      variant={trendTimeframe === 'Year' ? 'default' : 'outline'} 
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
                        clipPath: 'polygon(50% 0, 100% 0, 100% 50%, 50% 50%)'
                      }}
                    ></div>
                    <div className='absolute inset-0 flex items-center justify-center'>
                      <div className='text-center'>
                        <div className='text-3xl font-bold text-foreground'>{savingsRate}%</div>
                        <div className='text-sm text-muted-foreground'>{getSavingsRateLabel(savingsRate)}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Goal Pills */}
                <div className='flex justify-center gap-2 mb-3'>
                  {[15, 25, 30].map((goal) => (
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
                    variant={savingsGoal !== 15 && savingsGoal !== 25 && savingsGoal !== 30 ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setSavingsGoal(35)}
                    className='text-xs px-3'
                  >
                    Custom
                  </Button>
                </div>
                
                {/* Custom Input */}
                {savingsGoal !== 15 && savingsGoal !== 25 && savingsGoal !== 30 && (
                  <div className='flex justify-center'>
                    <Input
                      type='number'
                      placeholder='%'
                      className='w-20 text-center'
                      value={savingsGoal}
                      onChange={(e) => setSavingsGoal(Number(e.target.value))}
                    />
                  </div>
                )}
                
                <div className='text-center'>
                  <div className='text-sm text-muted-foreground mb-2'>Target: {savingsGoal}%</div>
                  <div className='text-xs text-muted-foreground'>{getSavingsGoalDelta(savingsRate, savingsGoal)}</div>
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
                      <p className='text-sm font-medium text-foreground'>Auto-invest your savings</p>
                      <p className='text-xs text-muted-foreground'>
                        Based on your current savings pace, you could auto-invest ~${potentialDCAAmount}/month.
                      </p>
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <Button 
                      variant='outline'
                      size='sm'
                      onClick={() => window.location.href = '/trading/dca?tab=calculator'}
                    >
                      DCA Calculator
                    </Button>
                    <Button 
                      variant='default'
                      size='sm'
                      onClick={() => window.location.href = '/trading/dca'}
                    >
                      Set up DCA
                    </Button>
                  </div>
                </div>
                
                {/* DCA Configuration */}
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                  <div className='flex items-center space-x-2'>
                    <span className='text-sm text-foreground'>Amount per</span>
                    <div className='flex space-x-1'>
                      {['Day', 'Month', 'Year'].map((timeframe) => (
                        <Button
                          key={timeframe}
                          variant={dcaTimeframe === timeframe ? 'default' : 'outline'}
                          size='sm'
                          onClick={() => setDcaTimeframe(timeframe)}
                          className='text-xs px-2'
                        >
                          {timeframe}
                        </Button>
                      ))}
                    </div>
                    <Input
                      type='number'
                      placeholder='100'
                      className='w-20'
                      defaultValue='100'
                    />
                  </div>
                  
                  <div>
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
                  
                  <Button className='w-full'>
                    Save monthly rule
                  </Button>
                </div>
                
                {/* Rules List */}
                <div className='space-y-2'>
                  <h4 className='text-sm font-medium text-foreground'>Active Rules</h4>
                  <div className='space-y-2 max-h-32 overflow-y-auto'>
                    <div className='flex items-center justify-between p-3 bg-card/50 rounded-lg border'>
                      <div className='flex items-center gap-3'>
                        <span className='text-sm font-medium'>$100 / Month → Gold</span>
                        <Badge variant='secondary' className='text-xs'>From: Funding</Badge>
                      </div>
                      <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                        <X className='w-3 h-3' />
                      </Button>
                    </div>
                    <div className='flex items-center justify-between p-3 bg-card/50 rounded-lg border'>
                      <div className='flex items-center gap-3'>
                        <span className='text-sm font-medium'>$50 / Month → Silver</span>
                        <Badge variant='secondary' className='text-xs'>From: Trading</Badge>
                      </div>
                      <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                        <X className='w-3 h-3' />
                      </Button>
                    </div>
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
                          <SelectValue placeholder={formatMonthYear(currentMonth)} />
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
                    Showing transactions for {formatMonthYear(currentMonth).replace(' ', ' 1–30, ')}
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
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='pl-10'
                      />
                    </div>
                    <div className='flex gap-2'>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className='w-40'>
                          <SelectValue placeholder='Category' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='all'>All Categories</SelectItem>
                          {categoryData.map((cat) => (
                            <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
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
                      <Button variant='outline' size='sm'>
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
                        {selectedTransactions.length} transaction{selectedTransactions.length !== 1 ? 's' : ''} selected
                      </p>
                      <div className='flex gap-2'>
                        <Select>
                          <SelectTrigger className='w-40'>
                            <SelectValue placeholder='Categorize as...' />
                          </SelectTrigger>
                          <SelectContent>
                            {categoryData.map((cat) => (
                              <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
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
                        <Button variant='ghost' size='sm' onClick={() => setSelectedTransactions([])}>
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
                  <CardTitle className='text-foreground'>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent className='p-0'>
                  <div className='overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className='w-12'>
                            <Checkbox
                              checked={selectedTransactions.length === paginatedTransactions.length && paginatedTransactions.length > 0}
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
                        {paginatedTransactions.map((transaction) => (
                          <TableRow key={transaction.id} className='hover:bg-muted/50'>
                            <TableCell>
                              <Checkbox
                                checked={selectedTransactions.includes(transaction.id)}
                                onCheckedChange={() => handleSelectTransaction(transaction.id)}
                              />
                            </TableCell>
                            <TableCell className='text-sm text-muted-foreground'>
                              {new Date(transaction.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className='font-medium text-foreground'>{transaction.merchant}</div>
                                <div className='text-xs text-muted-foreground'>{transaction.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={transaction.category}
                                onValueChange={(value) => handleCategoryUpdate(transaction.id, value)}
                              >
                                <SelectTrigger className='w-32'>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categoryData.map((cat) => (
                                    <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className='flex gap-1 flex-wrap'>
                                {transaction.tags.map((tag) => (
                                  <Badge key={tag} variant='secondary' className='text-xs'>
                                    {tag}
                                  </Badge>
                                ))}
                                {transaction.recurring && (
                                  <Badge variant='outline' className='text-xs'>
                                    <Repeat className='w-3 h-3 mr-1' />
                                    Recurring
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className='text-right'>
                              <span className={transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}>
                                ${Math.abs(transaction.amount).toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
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
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
                    </p>
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
              DCA and round-ups are optional; not investment advice. Settlement in selected metal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MySpending;