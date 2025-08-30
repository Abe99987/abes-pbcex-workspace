import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePrices, formatPrice } from '@/hooks/usePrices';
import { api } from '@/utils/api';
import type { BalancesResponse } from '@/types/wallet';
import Navigation from '@/components/Navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import toast from 'react-hot-toast';
import {
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle,
  Send,
  ShoppingCart,
  RefreshCw,
  Coins,
  DollarSign,
} from 'lucide-react';

interface AssetPortfolioData {
  name: string;
  value: number;
  color: string;
}

const COLORS = {
  funding: '#10B981', // green
  trading: '#3B82F6', // blue
  fx: '#8B5CF6', // purple
  commodities: '#F59E0B', // amber
  crypto: '#EF4444', // red
  titled: '#6B7280', // gray
};

export default function MyAssets() {
  const { user, isLoading: authLoading } = useAuth();
  const { prices } = usePrices();
  const [balances, setBalances] = useState<BalancesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchBalances = async () => {
      try {
        const response = await api.wallet.getBalances();
        if (response.data.code === 'SUCCESS' && response.data.data) {
          setBalances(response.data.data);
        }
      } catch (error) {
        toast.error('Failed to load balances');
        console.error('Balances fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [user]);

  const portfolioData: AssetPortfolioData[] = balances
    ? [
        {
          name: 'Funding Account',
          value: parseFloat(balances.funding.totalUsdValue),
          color: COLORS.funding,
        },
        {
          name: 'Trading Account',
          value: parseFloat(balances.trading.totalUsdValue),
          color: COLORS.trading,
        },
        // Add mock data for other categories
        { name: 'FX Assets', value: 2500, color: COLORS.fx },
        { name: 'Commodities', value: 1800, color: COLORS.commodities },
        { name: 'Crypto', value: 950, color: COLORS.crypto },
        { name: 'Titled Assets', value: 15000, color: COLORS.titled },
      ]
    : [];

  const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0);

  const ActionButton = ({ 
    icon: Icon, 
    label, 
    onClick, 
    variant = 'default' 
  }: { 
    icon: any; 
    label: string; 
    onClick: () => void; 
    variant?: 'default' | 'primary' | 'success' | 'danger';
  }) => {
    const variantClasses = {
      default: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      primary: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      success: 'bg-green-100 text-green-700 hover:bg-green-200',
      danger: 'bg-red-100 text-red-700 hover:bg-red-200',
    };

    return (
      <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${variantClasses[variant]}`}
      >
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </button>
    );
  };

  if (authLoading || loading) {
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
              Please log in to view your assets
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
              <h1 className="text-3xl font-bold text-gray-900">My Assets</h1>
              <p className="text-gray-600 mt-1">
                Manage your portfolio across all account types
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Portfolio Breakdown Chart */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Portfolio Breakdown
              </h2>
              <div className="relative h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portfolioData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {portfolioData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        `$${value.toLocaleString()}`,
                        'Value',
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      ${totalValue.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Total Value</div>
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="mt-6 space-y-2">
                {portfolioData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      ${item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Asset Summary Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Portfolio Value */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Total Portfolio Value
                </h3>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                ${totalValue.toLocaleString()}
              </div>
              <div className="flex items-center text-green-600">
                <ArrowUpCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">+5.2% from last month</span>
              </div>
            </div>

            {/* Available for Trading */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Available for Trading
                </h3>
                <Coins className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                ${balances ? parseFloat(balances.trading.totalUsdValue).toLocaleString() : '0'}
              </div>
              <div className="flex items-center text-blue-600">
                <RefreshCw className="h-4 w-4 mr-1" />
                <span className="text-sm">Ready to trade</span>
              </div>
            </div>

            {/* Secured in Custody */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Secured in Custody
                </h3>
                <CreditCard className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                ${balances ? parseFloat(balances.funding.totalUsdValue).toLocaleString() : '0'}
              </div>
              <div className="flex items-center text-green-600">
                <span className="text-sm">Fully insured & audited</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <ActionButton
                  icon={ArrowDownCircle}
                  label="Deposit"
                  variant="success"
                  onClick={() => toast.info('Deposit feature coming soon')}
                />
                <ActionButton
                  icon={ArrowUpCircle}
                  label="Withdraw"
                  variant="danger"
                  onClick={() => toast.info('Withdraw feature coming soon')}
                />
                <ActionButton
                  icon={Send}
                  label="Send"
                  variant="primary"
                  onClick={() => toast.info('Send feature coming soon')}
                />
                <ActionButton
                  icon={ShoppingCart}
                  label="Buy"
                  variant="default"
                  onClick={() => toast.info('Buy feature coming soon')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Asset Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Funding Account Assets */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Funding Account (Real Assets)
              </h3>
              <p className="text-sm text-gray-600">
                Physical assets held in custody
              </p>
            </div>
            <div className="p-6">
              {balances?.funding.balances.length ? (
                <div className="space-y-4">
                  {balances.funding.balances.map((balance) => (
                    <div
                      key={balance.asset}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-yellow-600 font-bold">
                            {balance.asset === 'PAXG' ? '🥇' : 
                             balance.asset === 'USD' ? '💵' : 
                             balance.asset === 'USDC' ? '💰' : '💎'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {balance.asset === 'PAXG' ? 'Gold (PAXG)' : balance.asset}
                          </div>
                          <div className="text-sm text-gray-600">
                            {balance.amount} {balance.asset}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          ${parseFloat(balance.usdValue).toLocaleString()}
                        </div>
                        <div className="flex space-x-2 mt-2">
                          <ActionButton
                            icon={ArrowDownCircle}
                            label="Deposit"
                            variant="success"
                            onClick={() => toast.info('Deposit feature coming soon')}
                          />
                          <ActionButton
                            icon={ArrowUpCircle}
                            label="Withdraw"
                            variant="danger"
                            onClick={() => toast.info('Withdraw feature coming soon')}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Coins className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No assets in funding account</p>
                </div>
              )}
            </div>
          </div>

          {/* Trading Account Assets */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Trading Account (Synthetic Assets)
              </h3>
              <p className="text-sm text-gray-600">
                Tokenized assets for active trading
              </p>
            </div>
            <div className="p-6">
              {balances?.trading.balances.length ? (
                <div className="space-y-4">
                  {balances.trading.balances.map((balance) => (
                    <div
                      key={balance.asset}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold">
                            {balance.asset.includes('AU') ? '🥇' :
                             balance.asset.includes('AG') ? '🥈' :
                             balance.asset.includes('PT') ? '⚪' :
                             balance.asset.includes('PD') ? '⚫' :
                             balance.asset.includes('CU') ? '🟤' : '💎'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {balance.asset}
                          </div>
                          <div className="text-sm text-gray-600">
                            {balance.amount} {balance.asset}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          ${parseFloat(balance.usdValue).toLocaleString()}
                        </div>
                        <div className="flex space-x-2 mt-2">
                          <ActionButton
                            icon={ShoppingCart}
                            label="Buy"
                            variant="success"
                            onClick={() => toast.info('Buy feature coming soon')}
                          />
                          <ActionButton
                            icon={RefreshCw}
                            label="Sell"
                            variant="danger"
                            onClick={() => toast.info('Sell feature coming soon')}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Coins className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No assets in trading account</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
