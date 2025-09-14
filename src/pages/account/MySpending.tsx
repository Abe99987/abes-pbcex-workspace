import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
} from 'lucide-react';

const MySpending = () => {
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

  const recurringExpenses = categoryData.filter(cat => cat.recurring);

  const savingsOpportunities = [
    { category: 'Shopping', potential: 234.56, tip: 'Consider setting spending alerts for discretionary purchases' },
    { category: 'Food & Dining', potential: 98.45, tip: 'Try meal planning to reduce spontaneous food orders' },
    { category: 'Entertainment', potential: 87.32, tip: 'Look for bundle subscriptions to save on streaming services' },
  ];

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

          {/* Savings Opportunities */}
          <Card className='bg-card/50 border-border/50'>
            <CardHeader>
              <CardTitle className='text-foreground flex items-center gap-2'>
                <Target className='w-5 h-5' />
                Savings Opportunities
              </CardTitle>
              <p className='text-sm text-muted-foreground mt-1'>
                Small changes that could save you money this month
              </p>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {savingsOpportunities.map((opportunity, index) => (
                  <div key={index} className='p-4 bg-muted/30 rounded-lg border border-border/50'>
                    <div className='flex items-start justify-between mb-2'>
                      <div>
                        <h4 className='font-medium text-foreground'>{opportunity.category}</h4>
                        <p className='text-sm text-green-500 font-medium'>Save ~${opportunity.potential}</p>
                      </div>
                      <AlertCircle className='w-4 h-4 text-primary' />
                    </div>
                    <p className='text-xs text-muted-foreground leading-relaxed'>
                      {opportunity.tip}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className='mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20'>
                <div className='flex items-start gap-3'>
                  <DollarSign className='w-5 h-5 text-primary mt-0.5' />
                  <div>
                    <p className='text-sm font-medium text-foreground mb-1'>
                      Potential monthly savings: ${savingsOpportunities.reduce((acc, opp) => acc + opp.potential, 0).toFixed(0)}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      By implementing these suggestions, you could save enough for an additional investment or emergency fund contribution.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recurring Expenses */}
          <Card className='bg-card/50 border-border/50'>
            <CardHeader>
              <CardTitle className='text-foreground'>Recurring Expenses</CardTitle>
              <p className='text-sm text-muted-foreground'>
                Subscriptions and regular payments
              </p>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {recurringExpenses.map((expense, index) => {
                  const Icon = expense.icon;
                  return (
                    <div key={index} className='flex items-center justify-between p-3 bg-muted/30 rounded-lg'>
                      <div className='flex items-center gap-3'>
                        <div className='p-2 rounded' style={{ backgroundColor: `${expense.color}20` }}>
                          <Icon className='w-4 h-4' style={{ color: expense.color }} />
                        </div>
                        <div>
                          <div className='font-medium text-foreground'>{expense.name}</div>
                          <div className='text-sm text-muted-foreground'>Monthly recurring</div>
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='font-medium text-foreground'>${expense.amount.toLocaleString()}</div>
                        <Button variant='ghost' size='sm' className='text-xs h-6'>
                          Manage
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MySpending;