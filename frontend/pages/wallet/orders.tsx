import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import type {
  Trade,
  TradeFilters,
  TradeHistoryResponse,
  TradeKPIs,
} from '@/types/wallet';
import {
  Download,
  Search,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface OrderFiltersState {
  search: string;
  pair: string;
  side: string;
  orderType: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

const TRADING_PAIRS = [
  { value: '', label: 'All Pairs' },
  { value: 'XAUUSD', label: 'XAUUSD (Gold)' },
  { value: 'XAGUSD', label: 'XAGUSD (Silver)' },
  { value: 'XPTUSD', label: 'XPTUSD (Platinum)' },
  { value: 'XPDUSD', label: 'XPDUSD (Palladium)' },
  { value: 'HGUSD', label: 'HGUSD (Copper)' },
];

const ORDER_SIDES = [
  { value: '', label: 'All Sides' },
  { value: 'BUY', label: 'Buy' },
  { value: 'SELL', label: 'Sell' },
];

const ORDER_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'MARKET', label: 'Market' },
  { value: 'LIMIT', label: 'Limit' },
  { value: 'STOP_LOSS', label: 'Stop Loss' },
];

const ORDER_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'FILLED', label: 'Filled' },
  { value: 'PARTIALLY_FILLED', label: 'Partially Filled' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function OrderHistory() {
  const { user, isLoading: authLoading } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [kpis, setKpis] = useState<TradeKPIs>({
    totalOrders: 0,
    filledOrders: 0,
    totalVolume: '0',
    totalFees: '0',
  });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState<OrderFiltersState>({
    search: '',
    pair: '',
    side: '',
    orderType: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);

        // Build API filters
        const apiFilters: TradeFilters = {
          pair: filters.pair || undefined,
          side: filters.side || undefined,
          order_type: filters.orderType || undefined,
          status: filters.status || undefined,
          date_from: filters.dateFrom || undefined,
          date_to: filters.dateTo || undefined,
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
        };

        // Remove undefined values
        const cleanFilters = Object.fromEntries(
          Object.entries(apiFilters).filter(([_, v]) => v !== undefined)
        );

        const response = await fetch(
          '/api/trade/history?' + new URLSearchParams(cleanFilters),
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.code === 'SUCCESS') {
            const tradeData: TradeHistoryResponse = data.data;
            setTrades(tradeData.trades);
            setKpis(tradeData.kpis);
            setTotal(tradeData.total);
            setHasMore(tradeData.hasMore);
          } else {
            throw new Error(data.message || 'Failed to fetch orders');
          }
        } else {
          throw new Error('API request failed');
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        toast.error('Failed to load order history - using sample data');

        // Fallback to mock data
        const mockTrades: Trade[] = [
          {
            id: '1',
            timestamp: '2024-12-01T10:30:15Z',
            pair: 'XAUUSD',
            side: 'BUY',
            orderType: 'MARKET',
            price: '2048.50',
            amount: '1.0000',
            filled: '1.0000',
            total: '2048.50',
            fee: '1.02',
            feeAsset: 'USD',
            status: 'FILLED',
            fillPercentage: '100.0',
          },
          {
            id: '2',
            timestamp: '2024-12-01T14:15:30Z',
            pair: 'XAGUSD',
            side: 'SELL',
            orderType: 'LIMIT',
            price: '24.85',
            amount: '50.0000',
            filled: '50.0000',
            total: '1242.50',
            fee: '0.62',
            feeAsset: 'USD',
            status: 'FILLED',
            fillPercentage: '100.0',
          },
          {
            id: '3',
            timestamp: '2024-11-30T16:45:20Z',
            pair: 'XPTUSD',
            side: 'BUY',
            orderType: 'LIMIT',
            price: '924.80',
            amount: '0.5000',
            filled: '0.3000',
            total: '277.44',
            fee: '0.14',
            feeAsset: 'USD',
            status: 'PARTIALLY_FILLED',
            fillPercentage: '60.0',
          },
        ];

        setTrades(mockTrades);
        setKpis({
          totalOrders: 3,
          filledOrders: 2,
          totalVolume: '3568.44',
          totalFees: '1.78',
        });
        setTotal(3);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, filters, currentPage, itemsPerPage]);

  const getSideColor = (side: string) => {
    return side === 'BUY' ? 'text-green-600' : 'text-red-600';
  };

  const getSideIcon = (side: string) => {
    return side === 'BUY' ? (
      <TrendingUp className='h-4 w-4 text-green-500' />
    ) : (
      <TrendingDown className='h-4 w-4 text-red-500' />
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FILLED':
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
            <CheckCircle className='h-3 w-3 mr-1' />
            Filled
          </span>
        );
      case 'PARTIALLY_FILLED':
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
            <Clock className='h-3 w-3 mr-1' />
            Partial
          </span>
        );
      case 'PENDING':
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
            <Clock className='h-3 w-3 mr-1' />
            Pending
          </span>
        );
      case 'CANCELLED':
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
            <XCircle className='h-3 w-3 mr-1' />
            Cancelled
          </span>
        );
      case 'REJECTED':
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'>
            <AlertCircle className='h-3 w-3 mr-1' />
            Rejected
          </span>
        );
      default:
        return (
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
            Unknown
          </span>
        );
    }
  };

  const exportOrders = async () => {
    try {
      // Build API filters (same as fetch)
      const apiFilters: TradeFilters = {
        pair: filters.pair || undefined,
        side: filters.side || undefined,
        order_type: filters.orderType || undefined,
        status: filters.status || undefined,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
      };

      // Remove undefined values
      const cleanFilters = Object.fromEntries(
        Object.entries(apiFilters).filter(([_, v]) => v !== undefined)
      );

      const response = await fetch(
        '/api/trade/history/export.csv?' + new URLSearchParams(cleanFilters),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `order-history-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Order history exported successfully');
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export failed:', error);

      // Fallback to client-side CSV generation
      const csv = [
        [
          'Date',
          'Order ID',
          'Pair',
          'Side',
          'Type',
          'Price',
          'Amount',
          'Filled',
          'Total Value',
          'Fee',
          'Fee Asset',
          'Status',
        ],
        ...trades.map(trade => [
          new Date(trade.timestamp).toLocaleDateString(),
          trade.id,
          trade.pair,
          trade.side,
          trade.orderType,
          trade.price,
          trade.amount,
          trade.filled,
          trade.total,
          trade.fee,
          trade.feeAsset,
          trade.status,
        ]),
      ]
        .map(row => row.join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `order-history-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Order history exported successfully (fallback)');
    }
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  if (authLoading || loading) {
    return (
      <div className='min-h-screen bg-slate-50'>
        <div className='flex items-center justify-center h-96'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500'></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='min-h-screen bg-slate-50'>
        <div className='flex items-center justify-center h-96'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-gray-800 mb-4'>
              Please log in to view your order history
            </h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      {/* Page Header */}
      <div className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex justify-between items-center'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Order History
              </h1>
              <p className='text-gray-600 mt-1'>
                Track all your trading activity and order executions
              </p>
            </div>
            <div className='flex items-center space-x-3'>
              <button
                onClick={() => window.location.reload()}
                className='flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200'
              >
                <RefreshCw className='h-4 w-4' />
                <span>Refresh</span>
              </button>
              <button
                onClick={exportOrders}
                className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
              >
                <Download className='h-4 w-4' />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* KPI Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white rounded-lg shadow-sm border p-6'>
            <div className='text-sm font-medium text-gray-500'>
              Total Orders
            </div>
            <div className='text-2xl font-bold text-gray-900'>
              {kpis.totalOrders}
            </div>
          </div>
          <div className='bg-white rounded-lg shadow-sm border p-6'>
            <div className='text-sm font-medium text-gray-500'>
              Filled Orders
            </div>
            <div className='text-2xl font-bold text-green-600'>
              {kpis.filledOrders}
            </div>
          </div>
          <div className='bg-white rounded-lg shadow-sm border p-6'>
            <div className='text-sm font-medium text-gray-500'>
              Total Volume
            </div>
            <div className='text-2xl font-bold text-gray-900'>
              ${parseFloat(kpis.totalVolume).toLocaleString()}
            </div>
          </div>
          <div className='bg-white rounded-lg shadow-sm border p-6'>
            <div className='text-sm font-medium text-gray-500'>Total Fees</div>
            <div className='text-2xl font-bold text-gray-900'>
              ${parseFloat(kpis.totalFees).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-lg shadow-sm border p-6 mb-8'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4'>
            {/* Search */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Search
              </label>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <input
                  type='text'
                  placeholder='Order ID or pair...'
                  value={filters.search}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, search: e.target.value }))
                  }
                  className='pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>
            </div>

            {/* Pair Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Pair
              </label>
              <select
                value={filters.pair}
                onChange={e =>
                  setFilters(prev => ({ ...prev, pair: e.target.value }))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                {TRADING_PAIRS.map(pair => (
                  <option key={pair.value} value={pair.value}>
                    {pair.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Side Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Side
              </label>
              <select
                value={filters.side}
                onChange={e =>
                  setFilters(prev => ({ ...prev, side: e.target.value }))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                {ORDER_SIDES.map(side => (
                  <option key={side.value} value={side.value}>
                    {side.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Order Type Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Type
              </label>
              <select
                value={filters.orderType}
                onChange={e =>
                  setFilters(prev => ({ ...prev, orderType: e.target.value }))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                {ORDER_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Status
              </label>
              <select
                value={filters.status}
                onChange={e =>
                  setFilters(prev => ({ ...prev, status: e.target.value }))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                {ORDER_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                From Date
              </label>
              <input
                type='date'
                value={filters.dateFrom}
                onChange={e =>
                  setFilters(prev => ({ ...prev, dateFrom: e.target.value }))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>

            {/* Clear Filters */}
            <div className='flex items-end'>
              <button
                onClick={() => {
                  setFilters({
                    search: '',
                    pair: '',
                    side: '',
                    orderType: '',
                    status: '',
                    dateFrom: '',
                    dateTo: '',
                  });
                  setCurrentPage(1);
                }}
                className='w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200'
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className='bg-white rounded-lg shadow-sm border overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Date/Time
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Pair
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Side
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Type
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Price
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Amount
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Filled
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Total
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Fee
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Order ID
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {trades.map(trade => (
                  <tr key={trade.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      <div>
                        <div>
                          {new Date(trade.timestamp).toLocaleDateString()}
                        </div>
                        <div className='text-xs text-gray-500'>
                          {new Date(trade.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className='text-sm font-medium text-gray-900'>
                        {trade.pair}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center space-x-1'>
                        {getSideIcon(trade.side)}
                        <span
                          className={`text-sm font-medium ${getSideColor(trade.side)}`}
                        >
                          {trade.side}
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className='text-sm text-gray-900'>
                        {trade.orderType}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      ${parseFloat(trade.price).toLocaleString()}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {trade.amount}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {trade.filled} ({trade.fillPercentage}%)
                      </div>
                      <div className='w-full bg-gray-200 rounded-full h-1.5 mt-1'>
                        <div
                          className={`h-1.5 rounded-full ${
                            parseFloat(trade.fillPercentage) === 100
                              ? 'bg-green-600'
                              : parseFloat(trade.fillPercentage) > 0
                                ? 'bg-yellow-500'
                                : 'bg-gray-400'
                          }`}
                          style={{ width: `${trade.fillPercentage}%` }}
                        />
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      ${parseFloat(trade.total).toLocaleString()}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {trade.fee} {trade.feeAsset}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {getStatusBadge(trade.status)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center space-x-2'>
                        <span className='text-sm text-gray-500 font-mono'>
                          {trade.id}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(trade.id);
                            toast.success('Order ID copied');
                          }}
                          className='text-gray-400 hover:text-gray-600'
                          title='Copy Order ID'
                        >
                          <ExternalLink className='h-3 w-3' />
                        </button>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      <button className='text-gray-400 hover:text-gray-600'>
                        <MoreHorizontal className='h-4 w-4' />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='bg-white px-4 py-3 border-t border-gray-200 sm:px-6'>
              <div className='flex items-center justify-between'>
                <div className='flex-1 flex justify-between sm:hidden'>
                  <button
                    onClick={() =>
                      setCurrentPage(prev => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className='relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50'
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(prev => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className='ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50'
                  >
                    Next
                  </button>
                </div>
                <div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
                  <div>
                    <p className='text-sm text-gray-700'>
                      Showing{' '}
                      <span className='font-medium'>
                        {(currentPage - 1) * itemsPerPage + 1}
                      </span>{' '}
                      to{' '}
                      <span className='font-medium'>
                        {Math.min(currentPage * itemsPerPage, total)}
                      </span>{' '}
                      of <span className='font-medium'>{total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px'>
                      <button
                        onClick={() =>
                          setCurrentPage(prev => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className='relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50'
                      >
                        Previous
                      </button>
                      {Array.from(
                        { length: Math.min(totalPages, 5) },
                        (_, i) => {
                          const page = i + 1;
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === page
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        }
                      )}
                      <button
                        onClick={() =>
                          setCurrentPage(prev => Math.min(prev + 1, totalPages))
                        }
                        disabled={currentPage === totalPages}
                        className='relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50'
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {trades.length === 0 && !loading && (
          <div className='bg-white rounded-lg shadow-sm border p-12 text-center'>
            <TrendingUp className='h-12 w-12 text-gray-300 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No orders found
            </h3>
            <p className='text-gray-600 mb-6'>
              Try adjusting your filters or place your first trade to see order
              history.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
