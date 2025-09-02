import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, LineChart, Line } from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  Download,
  CreditCard,
  ShoppingBag,
  Utensils,
  Car,
  Home,
  Plane,
  Gamepad2,
} from 'lucide-react';

interface SpendingCategory {
  id: string;
  name: string;
  icon: any;
  color: string;
  amount: number;
  percentage: number;
  change: number;
}

interface MonthlySpend {
  month: string;
  amount: number;
  discretionary: number;
  recurring: number;
}

interface TopMerchant {
  name: string;
  amount: number;
  transactions: number;
  category: string;
}

const SPENDING_CATEGORIES: SpendingCategory[] = [
  {
    id: 'dining',
    name: 'Dining & Food',
    icon: Utensils,
    color: '#EF4444',
    amount: 1250,
    percentage: 28.5,
    change: 5.2,
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: ShoppingBag,
    color: '#8B5CF6',
    amount: 890,
    percentage: 20.3,
    change: -2.1,
  },
  {
    id: 'transportation',
    name: 'Transportation',
    icon: Car,
    color: '#3B82F6',
    amount: 670,
    percentage: 15.3,
    change: 12.8,
  },
  {
    id: 'housing',
    name: 'Housing & Utilities',
    icon: Home,
    color: '#10B981',
    amount: 580,
    percentage: 13.2,
    change: 0.8,
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: Gamepad2,
    color: '#F59E0B',
    amount: 420,
    percentage: 9.6,
    change: -8.3,
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: Plane,
    color: '#06B6D4',
    amount: 570,
    percentage: 13.1,
    change: 25.4,
  },
];

const MONTHLY_SPEND_DATA: MonthlySpend[] = [
  { month: 'Jan', amount: 4200, discretionary: 2100, recurring: 2100 },
  { month: 'Feb', amount: 3800, discretionary: 1900, recurring: 1900 },
  { month: 'Mar', amount: 4500, discretionary: 2200, recurring: 2300 },
  { month: 'Apr', amount: 4100, discretionary: 2000, recurring: 2100 },
  { month: 'May', amount: 4380, discretionary: 2180, recurring: 2200 },
  { month: 'Jun', amount: 4600, discretionary: 2400, recurring: 2200 },
];

const TOP_MERCHANTS: TopMerchant[] = [
  { name: 'Amazon', amount: 520, transactions: 8, category: 'Shopping' },
  { name: 'Starbucks', amount: 240, transactions: 24, category: 'Dining' },
  { name: 'Uber', amount: 180, transactions: 12, category: 'Transportation' },
  { name: 'Netflix', amount: 15.99, transactions: 1, category: 'Entertainment' },
  { name: 'Target', amount: 340, transactions: 5, category: 'Shopping' },
];

export default function MySpending() {
  const { user, isLoading: authLoading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const totalSpending = SPENDING_CATEGORIES.reduce((sum, cat) => sum + cat.amount, 0);
  const currentMonthSpend = MONTHLY_SPEND_DATA[MONTHLY_SPEND_DATA.length - 1];
  const previousMonthSpend = MONTHLY_SPEND_DATA[MONTHLY_SPEND_DATA.length - 2];
  
  // Safe calculations with fallbacks
  const monthlyChange = currentMonthSpend && previousMonthSpend 
    ? ((currentMonthSpend.amount - previousMonthSpend.amount) / previousMonthSpend.amount) * 100 
    : 0;

  // Calculate burn rate and savings rate (mock data)
  const monthlyIncome = 7500; // Mock monthly income
  const savingsRate = currentMonthSpend 
    ? ((monthlyIncome - currentMonthSpend.amount) / monthlyIncome) * 100 
    : 0;
  const burnRate = currentMonthSpend 
    ? (currentMonthSpend.amount / monthlyIncome) * 100 
    : 0;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Please log in to view your spending
            </h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Spending</h1>
              <p className="text-gray-600 mt-1">
                Track and analyze your spending patterns
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Spending */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Total Spending</h3>
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              ${currentMonthSpend?.amount.toLocaleString() || '0'}
            </div>
            <div className={`flex items-center text-sm ${monthlyChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {monthlyChange >= 0 ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              <span>{Math.abs(monthlyChange).toFixed(1)}% from last month</span>
            </div>
          </div>

          {/* Discretionary Spending */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Discretionary</h3>
              <ShoppingBag className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              ${currentMonthSpend?.discretionary.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-600">
              {currentMonthSpend ? ((currentMonthSpend.discretionary / currentMonthSpend.amount) * 100).toFixed(1) : '0'}% of total
            </div>
          </div>

          {/* Burn Rate */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Burn Rate</h3>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {burnRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">
              Of monthly income
            </div>
          </div>

          {/* Savings Rate */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Savings Rate</h3>
              <TrendingDown className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-green-600 mb-2">
              {savingsRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">
              Of monthly income
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Spending Breakdown Chart */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Spending by Category
            </h2>
            <div className="relative h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={SPENDING_CATEGORIES}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="amount"
                  >
                    {SPENDING_CATEGORIES.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
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
            
            {/* Category List */}
            <div className="space-y-3">
              {SPENDING_CATEGORIES.map((category) => (
                <div key={category.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <category.icon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {category.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      ${category.amount.toLocaleString()}
                    </div>
                    <div className={`text-xs ${category.change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {category.change >= 0 ? '+' : ''}{category.change.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Monthly Spending Trend
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_SPEND_DATA}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `$${value.toLocaleString()}`,
                      name === 'discretionary' ? 'Discretionary' : 
                      name === 'recurring' ? 'Recurring' : 'Total'
                    ]}
                  />
                  <Bar dataKey="recurring" stackId="a" fill="#10B981" />
                  <Bar dataKey="discretionary" stackId="a" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-600">Recurring</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-sm text-gray-600">Discretionary</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Merchants */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Top Merchants
            </h2>
            <p className="text-sm text-gray-600">
              Your most frequent spending destinations this month
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {TOP_MERCHANTS.map((merchant, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {merchant.name[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {merchant.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {merchant.transactions} transactions • {merchant.category}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      ${merchant.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      This month
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
