import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth, useKycStatus, getUserDisplayName } from '@/hooks/useAuth';
import {
  usePrices,
  formatPrice,
  formatPriceChange,
  getAssetDisplayName,
} from '@/hooks/usePrices';
import {
  api,
  type BalancesResponse,
  type BackendTransaction,
} from '@/utils/api';
import toast from 'react-hot-toast';
import Navigation from '@/components/Navigation';

/**
 * Dashboard page showing balances, portfolio value, and market overview
 */

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { kycStatus, canTrade, needsKyc } = useKycStatus();
  const { prices, isLoading: pricesLoading } = usePrices();

  const [balances, setBalances] = useState<BalancesResponse | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<BackendTransaction[]>(
    []
  );
  const [activityLoading, setActivityLoading] = useState(true);

  // Fetch user balances
  useEffect(() => {
    if (!user) return;

    const fetchBalances = async () => {
      try {
        const response = await api.wallet.getBalances();
        if (response.data.code === 'SUCCESS' && response.data.data) {
          setBalances(response.data.data);
        }
      } catch (error: unknown) {
        toast.error('Failed to load balances');
        console.error('Balances fetch error:', error);
      } finally {
        setBalancesLoading(false);
      }
    };

    fetchBalances();
  }, [user]);

  // Fetch recent activity
  useEffect(() => {
    if (!user) return;

    const fetchActivity = async () => {
      try {
        const response = await api.wallet.getTransactions(10);
        if (response.data.code === 'SUCCESS') {
          setRecentActivity(response.data.data?.transactions || []);
        }
      } catch (error: unknown) {
        console.error('Activity fetch error:', error);
        // Don't show error toast for activity - it's not critical
      } finally {
        setActivityLoading(false);
      }
    };

    fetchActivity();
  }, [user]);

  if (authLoading) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500'></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-slate-800 mb-4'>
            Please log in to view your dashboard
          </h1>
          <Link href='/login?next=/dashboard' className='btn btn-primary'>
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <Navigation />

      {/* Dashboard Header */}
      <div className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex justify-between items-center'>
            <div>
              <h1 className='text-3xl font-bold text-slate-800'>
                Welcome back, {getUserDisplayName(user)}
              </h1>
              <p className='text-slate-600 mt-1'>
                Your precious metals trading dashboard
              </p>
            </div>
            <div className='flex items-center space-x-4'>
              {needsKyc && (
                <div className='bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm'>
                  KYC Required
                </div>
              )}
              <div
                className={`px-3 py-1 rounded-full text-sm ${
                  user.kycStatus === 'APPROVED'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {user.kycStatus.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* KYC Alert */}
        {needsKyc && (
          <div className='bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8'>
            <div className='flex items-start'>
              <div className='flex-shrink-0'>
                <span className='text-2xl'>⚠️</span>
              </div>
              <div className='ml-3'>
                <h3 className='text-lg font-medium text-amber-800'>
                  Complete your verification to start trading
                </h3>
                <p className='mt-2 text-amber-700'>
                  You need to complete identity verification before you can
                  trade or withdraw funds.
                </p>
                <div className='mt-4'>
                  <a href='/account/profile' className='btn-primary'>
                    Complete KYC
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Left Column - Balances */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Portfolio Overview */}
            <div className='card'>
              <div className='card-header'>
                <h2 className='card-title'>Portfolio Overview</h2>
                <p className='card-description'>Your current asset holdings</p>
              </div>
              <div className='card-content'>
                {balancesLoading ? (
                  <div className='space-y-4'>
                    {[1, 2, 3].map(i => (
                      <div key={i} className='skeleton h-16 w-full'></div>
                    ))}
                  </div>
                ) : balances ? (
                  <div className='space-y-6'>
                    {/* Total Portfolio Value */}
                    <div className='bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white'>
                      <div className='text-sm opacity-90'>
                        Total Portfolio Value
                      </div>
                      <div className='text-3xl font-bold mt-1'>
                        $
                        {(
                          parseFloat(balances.funding.totalUsdValue) +
                          parseFloat(balances.trading.totalUsdValue)
                        ).toLocaleString()}
                      </div>
                      <div className='text-sm opacity-90 mt-2'>
                        Funding: $
                        {parseFloat(
                          balances.funding.totalUsdValue
                        ).toLocaleString()}{' '}
                        • Trading: $
                        {parseFloat(
                          balances.trading.totalUsdValue
                        ).toLocaleString()}
                      </div>
                    </div>

                    {/* Funding Account */}
                    <div>
                      <h3 className='text-lg font-semibold text-slate-800 mb-4'>
                        Funding Account (Real Assets)
                      </h3>
                      <div className='space-y-3'>
                        {balances.funding.balances.map(balance => (
                          <div
                            key={balance.asset}
                            className='flex items-center justify-between p-4 bg-slate-50 rounded-lg'
                          >
                            <div className='flex items-center space-x-3'>
                              <div className='w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center'>
                                <span className='text-primary-600 font-bold'>
                                  {balance.asset === 'PAXG'
                                    ? '🥇'
                                    : balance.asset === 'USD'
                                      ? '$'
                                      : '💰'}
                                </span>
                              </div>
                              <div>
                                <div className='font-medium text-slate-800'>
                                  {balance.asset === 'PAXG'
                                    ? 'Gold (PAXG)'
                                    : balance.asset}
                                </div>
                                <div className='text-sm text-slate-600'>
                                  {balance.amount} {balance.asset}
                                </div>
                              </div>
                            </div>
                            <div className='text-right'>
                              <div className='font-medium text-slate-800'>
                                ${parseFloat(balance.usdValue).toLocaleString()}
                              </div>
                              <div className='text-sm text-slate-600'>USD</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Trading Account */}
                    <div>
                      <h3 className='text-lg font-semibold text-slate-800 mb-4'>
                        Trading Account (Synthetic Assets)
                      </h3>
                      <div className='space-y-3'>
                        {balances.trading.balances.map(balance => (
                          <div
                            key={balance.asset}
                            className='flex items-center justify-between p-4 bg-slate-50 rounded-lg'
                          >
                            <div className='flex items-center space-x-3'>
                              <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                                <span className='text-blue-600 font-bold'>
                                  {balance.asset.includes('AU')
                                    ? '🥇'
                                    : balance.asset.includes('AG')
                                      ? '🥈'
                                      : balance.asset.includes('PT')
                                        ? '⚪'
                                        : balance.asset.includes('PD')
                                          ? '⚫'
                                          : balance.asset.includes('CU')
                                            ? '🟤'
                                            : '💎'}
                                </span>
                              </div>
                              <div>
                                <div className='font-medium text-slate-800'>
                                  {balance.asset.replace('-s', '')} Synthetic
                                </div>
                                <div className='text-sm text-slate-600'>
                                  {balance.amount} {balance.asset}
                                </div>
                              </div>
                            </div>
                            <div className='text-right'>
                              <div className='font-medium text-slate-800'>
                                ${parseFloat(balance.usdValue).toLocaleString()}
                              </div>
                              <div className='text-sm text-slate-600'>USD</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='text-center py-8 text-slate-500'>
                    Failed to load balances
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className='card'>
              <div className='card-header'>
                <h2 className='card-title'>Quick Actions</h2>
              </div>
              <div className='card-content'>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  <a
                    href='/wallet/deposit'
                    className='p-4 text-center bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors'
                  >
                    <div className='text-2xl mb-2'>💰</div>
                    <div className='text-sm font-medium'>Deposit</div>
                  </a>
                  <a
                    href='/trade'
                    className={`p-4 text-center rounded-lg transition-colors ${
                      canTrade
                        ? 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <div className='text-2xl mb-2'>📈</div>
                    <div className='text-sm font-medium'>Trade</div>
                  </a>
                  <a
                    href='/shop'
                    className={`p-4 text-center rounded-lg transition-colors ${
                      canTrade
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <div className='text-2xl mb-2'>🛍️</div>
                    <div className='text-sm font-medium'>Shop</div>
                  </a>
                  <a
                    href='/wallet/withdraw'
                    className={`p-4 text-center rounded-lg transition-colors ${
                      canTrade
                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <div className='text-2xl mb-2'>💸</div>
                    <div className='text-sm font-medium'>Withdraw</div>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Market Data */}
          <div className='space-y-6'>
            {/* Live Prices */}
            <div className='card'>
              <div className='card-header'>
                <h2 className='card-title'>Live Prices</h2>
                <p className='card-description'>
                  Current precious metals prices
                </p>
              </div>
              <div className='card-content'>
                {pricesLoading ? (
                  <div className='space-y-4'>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className='skeleton h-12 w-full'></div>
                    ))}
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {Object.entries(prices).map(([asset, priceData]) => {
                      const change = formatPriceChange(priceData.change24h);
                      return (
                        <div
                          key={asset}
                          className='flex items-center justify-between p-3 rounded-lg hover:bg-slate-50'
                        >
                          <div className='flex items-center space-x-3'>
                            <span className='text-xl'>
                              {asset === 'AU'
                                ? '🥇'
                                : asset === 'AG'
                                  ? '🥈'
                                  : asset === 'PT'
                                    ? '⚪'
                                    : asset === 'PD'
                                      ? '⚫'
                                      : '🟤'}
                            </span>
                            <div>
                              <div className='font-medium'>
                                {getAssetDisplayName(asset)}
                              </div>
                              <div className='text-xs text-slate-500'>
                                Per oz
                              </div>
                            </div>
                          </div>
                          <div className='text-right'>
                            <div className='font-medium'>
                              {formatPrice(priceData.price, asset)}
                            </div>
                            <div
                              className={`text-xs ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {change.text}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Account Status */}
            <div className='card'>
              <div className='card-header'>
                <h2 className='card-title'>Account Status</h2>
              </div>
              <div className='card-content space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-slate-600'>Email Verified</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      user.emailVerified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.emailVerified ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-slate-600'>Phone Verified</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      user.phoneVerified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.phoneVerified ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-slate-600'>2FA Enabled</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      user.twoFactorEnabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {user.twoFactorEnabled ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-slate-600'>
                    Trading Enabled
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      canTrade
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {canTrade ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className='card'>
              <div className='card-header'>
                <h2 className='card-title'>Recent Activity</h2>
              </div>
              <div className='card-content'>
                {activityLoading ? (
                  <div className='space-y-3'>
                    {[1, 2, 3].map(i => (
                      <div key={i} className='skeleton h-12 w-full'></div>
                    ))}
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div className='space-y-3'>
                    {recentActivity.slice(0, 5).map((activity, index) => (
                      <div
                        key={activity.id || index}
                        className='flex items-center justify-between p-3 bg-slate-50 rounded-lg'
                      >
                        <div className='flex items-center space-x-3'>
                          <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                            <span className='text-blue-600 text-sm font-bold'>
                              {activity.type === 'CREDIT'
                                ? '+'
                                : activity.type === 'DEBIT'
                                  ? '-'
                                  : activity.type === 'TRADE'
                                    ? '↔'
                                    : activity.type === 'MINT'
                                      ? '⚡'
                                      : activity.type === 'BURN'
                                        ? '🔥'
                                        : '•'}
                            </span>
                          </div>
                          <div>
                            <div className='text-sm font-medium text-slate-800'>
                              {activity.description ||
                                `${activity.type} - ${activity.asset}`}
                            </div>
                            <div className='text-xs text-slate-600'>
                              {new Date(
                                activity.createdAt
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className='text-sm font-medium text-slate-800'>
                            {activity.type === 'DEBIT' ? '-' : '+'}
                            {activity.amount} {activity.asset}
                          </div>
                          <div className='text-xs text-slate-600'>
                            {activity.accountType}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-sm text-slate-500 text-center py-8'>
                    No recent activity
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
