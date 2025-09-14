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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
  const itemsPerPage = 20;

  // Mock spending data
  const totalSpent = 4267.83;
  const monthlyBudget = 5000;
  const budgetUsed = (totalSpent / monthlyBudget) * 100;

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
            <h1 className='text-3xl font-bold text-foreground mb-2'>My Spending</h1>
            <p className='text-muted-foreground'>Track your expenses and manage your budget</p>
          </div>

          {/* Overview Cards */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
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

          {/* Charts Row */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            
            {/* Spending by Category */}
            <Card className='bg-card/50 border-border/50'>
              <CardHeader>
                <CardTitle className='text-foreground'>Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='h-64 mb-4'>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="amount"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className='space-y-2'>
                  {categoryData.map((category, index) => {
                    const Icon = category.icon;
                    const percentOfBudget = (category.amount / category.budget) * 100;
                    
                    return (
                      <div key={index} className='flex items-center justify-between p-2 hover:bg-muted/50 rounded'>
                        <div className='flex items-center gap-3'>
                          <div className='p-1.5 rounded' style={{ backgroundColor: `${category.color}20` }}>
                            <Icon className='w-4 h-4' style={{ color: category.color }} />
                          </div>
                          <div>
                            <div className='text-sm font-medium text-foreground flex items-center gap-2'>
                              {category.name}
                              {category.recurring && (
                                <Badge variant='secondary' className='text-xs'>Recurring</Badge>
                              )}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              ${category.amount.toLocaleString()} / ${category.budget.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className='text-sm font-medium text-foreground'>
                            {percentOfBudget.toFixed(0)}%
                          </div>
                          <div className={`text-xs ${percentOfBudget > 90 ? 'text-red-500' : percentOfBudget > 75 ? 'text-yellow-500' : 'text-green-500'}`}>
                            {percentOfBudget > 100 ? 'Over budget' : 'On track'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card className='bg-card/50 border-border/50'>
              <CardHeader>
                <CardTitle className='text-foreground'>Monthly Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='h-64 mb-4'>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
                      <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className='text-sm text-muted-foreground text-center'>
                  Average monthly spending: ${monthlyTrend.reduce((acc, month) => acc + month.amount, 0) / monthlyTrend.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Ledger Section */}
          <div className='grid grid-cols-1 xl:grid-cols-4 gap-6'>
            
            {/* Main Ledger */}
            <div className='xl:col-span-3 space-y-4'>
              
              {/* Nudge Banner */}
              <Card className='bg-primary/10 border-primary/20'>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <Target className='w-5 h-5 text-primary' />
                      <div>
                        <p className='text-sm font-medium text-foreground'>
                          Potential monthly savings: ${savingsOpportunities.reduce((acc, opp) => acc + opp.potential, 0).toFixed(0)}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          Review uncategorized transactions to find more savings opportunities
                        </p>
                      </div>
                    </div>
                    <Button variant='ghost' size='sm'>
                      <X className='w-4 h-4' />
                    </Button>
                  </div>
                </CardContent>
              </Card>

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

            {/* Right Rail */}
            <div className='space-y-6'>
              
              {/* Budgets & Categories */}
              <Card className='bg-card/50 border-border/50'>
                <CardHeader>
                  <CardTitle className='text-foreground text-sm'>Budgets & Categories</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {categoryData.map((category, index) => {
                    const Icon = category.icon;
                    const percentOfBudget = (category.amount / category.budget) * 100;
                    
                    return (
                      <div key={index} className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <div className='p-1 rounded' style={{ backgroundColor: `${category.color}20` }}>
                              <Icon className='w-3 h-3' style={{ color: category.color }} />
                            </div>
                            <span className='text-xs font-medium text-foreground'>{category.name}</span>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant='ghost' size='sm' className='text-xs h-6'>
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Budget - {category.name}</DialogTitle>
                              </DialogHeader>
                              <div className='space-y-4'>
                                <div>
                                  <label className='text-sm font-medium'>Monthly Budget</label>
                                  <Input defaultValue={category.budget} type='number' />
                                </div>
                                <Button>Save Changes</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <Progress value={percentOfBudget} className='h-1' />
                        <div className='flex justify-between text-xs text-muted-foreground'>
                          <span>${category.amount.toLocaleString()}</span>
                          <span>${category.budget.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Recurring Expenses */}
              <Card className='bg-card/50 border-border/50'>
                <CardHeader>
                  <CardTitle className='text-foreground text-sm'>Recurring Expenses</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {recurringExpenses.map((expense, index) => {
                    const Icon = expense.icon;
                    return (
                      <div key={index} className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <div className='p-1 rounded' style={{ backgroundColor: `${expense.color}20` }}>
                            <Icon className='w-3 h-3' style={{ color: expense.color }} />
                          </div>
                          <div>
                            <div className='text-xs font-medium text-foreground'>{expense.name}</div>
                            <div className='text-xs text-muted-foreground'>${expense.amount}</div>
                          </div>
                        </div>
                        <Button variant='ghost' size='sm' className='text-xs h-6'>
                          Manage
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Savings Opportunities */}
              <Card className='bg-card/50 border-border/50'>
                <CardHeader>
                  <CardTitle className='text-foreground text-sm'>Savings Tips</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {savingsOpportunities.map((opportunity, index) => (
                    <div key={index} className='p-3 bg-muted/30 rounded-lg'>
                      <div className='flex items-start justify-between mb-2'>
                        <div>
                          <div className='text-xs font-medium text-foreground'>{opportunity.category}</div>
                          <div className='text-xs text-green-500 font-medium'>Save ~${opportunity.potential}</div>
                        </div>
                      </div>
                      <p className='text-xs text-muted-foreground leading-relaxed mb-2'>
                        {opportunity.tip}
                      </p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant='outline' size='sm' className='text-xs h-6'>
                            Create Rule
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create Categorization Rule</DialogTitle>
                          </DialogHeader>
                          <div className='space-y-4'>
                            <div>
                              <label className='text-sm font-medium'>When merchant name contains:</label>
                              <Input placeholder='e.g. Starbucks' />
                            </div>
                            <div>
                              <label className='text-sm font-medium'>Automatically categorize as:</label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder='Select category' />
                                </SelectTrigger>
                                <SelectContent>
                                  {categoryData.map((cat) => (
                                    <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <Checkbox id='auto-categorize' />
                              <label htmlFor='auto-categorize' className='text-sm'>
                                Auto-categorize future transactions
                              </label>
                            </div>
                            <Button>Create Rule</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MySpending;