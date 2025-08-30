import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import toast from 'react-hot-toast';
import {
  Filter,
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
} from 'lucide-react';

interface OrderFilters {
  search: string;
  pair: string;
  side: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

interface Order {
  id: string;
  orderId: string;
  pair: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP';
  price: string;
  amount: string;
  filled: string;
  status: 'FILLED' | 'PARTIAL' | 'CANCELLED' | 'PENDING';
  fee: string;
  feeAsset: string;
  timestamp: string;
  executedAt?: string;
}

const TRADING_PAIRS = [
  { value: '', label: 'All Pairs' },
  { value: 'GOLD/USD', label: 'GOLD/USD' },
  { value: 'SILVER/USD', label: 'SILVER/USD' },
  { value: 'PLATINUM/USD', label: 'PLATINUM/USD' },
  { value: 'PALLADIUM/USD', label: 'PALLADIUM/USD' },
  { value: 'COPPER/USD', label: 'COPPER/USD' },
  { value: 'PAXG/USD', label: 'PAXG/USD' },
  { value: 'XAU/USD', label: 'XAU/USD' },
  { value: 'XAG/USD', label: 'XAG/USD' },
];

const ORDER_SIDES = [
  { value: '', label: 'All Sides' },
  { value: 'BUY', label: 'Buy' },
  { value: 'SELL', label: 'Sell' },
];

const ORDER_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'FILLED', label: 'Filled' },
  { value: 'PARTIAL', label: 'Partially Filled' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

// Mock order data (Bybit-style)
const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    orderId: 'ORD_20241201_001',
    pair: 'GOLD/USD',
    side: 'BUY',
    type: 'MARKET',
    price: '2048.50',
    amount: '1.0000',
    filled: '1.0000',
    status: 'FILLED',
    fee: '1.02',
    feeAsset: 'USD',
    timestamp: '2024-12-01T10:30:15Z',
    executedAt: '2024-12-01T10:30:16Z',
  },
  {
    id: '2',
    orderId: 'ORD_20241201_002',
    pair: 'SILVER/USD',
    side: 'SELL',
    type: 'LIMIT',
    price: '24.85',
    amount: '50.0000',
    filled: '50.0000',
    status: 'FILLED',
    fee: '0.62',
    feeAsset: 'USD',
    timestamp: '2024-12-01T14:15:30Z',
    executedAt: '2024-12-01T14:16:45Z',
  },
  {
    id: '3',
    orderId: 'ORD_20241130_003',
    pair: 'PLATINUM/USD',
    side: 'BUY',
    type: 'LIMIT',
    price: '924.80',
    amount: '0.5000',
    filled: '0.3000',
    status: 'PARTIAL',
    fee: '0.14',
    feeAsset: 'USD',
    timestamp: '2024-11-30T16:45:20Z',
    executedAt: '2024-11-30T17:22:10Z',
  },
  {
    id: '4',
    orderId: 'ORD_20241130_004',
    pair: 'GOLD/USD',
    side: 'SELL',
    type: 'MARKET',
    price: '2045.20',
    amount: '0.7500',
    filled: '0.7500',
    status: 'FILLED',
    fee: '0.77',
    feeAsset: 'USD',
    timestamp: '2024-11-30T09:20:45Z',
    executedAt: '2024-11-30T09:20:46Z',
  },
  {
    id: '5',
    orderId: 'ORD_20241129_005',
    pair: 'COPPER/USD',
    side: 'BUY',
    type: 'LIMIT',
    price: '8.25',
    amount: '100.0000',
    filled: '0.0000',
    status: 'CANCELLED',
    fee: '0.00',
    feeAsset: 'USD',
    timestamp: '2024-11-29T11:10:30Z',
  },
  {
    id: '6',
    orderId: 'ORD_20241129_006',
    pair: 'PALLADIUM/USD',
    side: 'BUY',
    type: 'MARKET',
    price: '1150.75',
    amount: '0.2000',
    filled: '0.2000',
    status: 'FILLED',
    fee: '0.23',
    feeAsset: 'USD',
    timestamp: '2024-11-29T13:45:22Z',
    executedAt: '2024-11-29T13:45:23Z',
  },
];

export default function OrderHistory() {
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OrderFilters>({
    search: '',
    pair: '',
    side: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    if (!user) return;

    // Simulate API call - replace with actual API call
    const fetchOrders = async () => {
      try {
        // For now, use mock data. Replace with actual API call:
        // const response = await api.trade.getOrderHistory();
        setOrders(MOCK_ORDERS);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        toast.error('Failed to load order history');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const getSideColor = (side: string) => {
    return side === 'BUY' ? 'text-green-600' : 'text-red-600';
  };

  const getSideIcon = (side: string) => {
    return side === 'BUY' ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FILLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Filled
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Partial
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filters.search && !order.orderId.toLowerCase().includes(filters.search.toLowerCase()) && 
        !order.pair.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.pair && order.pair !== filters.pair) return false;
    if (filters.side && order.side !== filters.side) return false;
    if (filters.status && order.status !== filters.status) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const exportOrders = () => {
    const csv = [
      ['Date', 'Order ID', 'Pair', 'Side', 'Type', 'Price', 'Amount', 'Filled', 'Status', 'Fee', 'Fee Asset'],
      ...filteredOrders.map(order => [
        new Date(order.timestamp).toLocaleDateString(),
        order.orderId,
        order.pair,
        order.side,
        order.type,
        order.price,
        order.amount,
        order.filled,
        order.status,
        order.fee,
        order.feeAsset,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Order history exported successfully');
  };

  const calculateFillPercentage = (filled: string, amount: string) => {
    const filledNum = parseFloat(filled);
    const amountNum = parseFloat(amount);
    if (amountNum === 0) return 0;
    return (filledNum / amountNum) * 100;
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
              Please log in to view your order history
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
              <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
              <p className="text-gray-600 mt-1">
                Track all your trading activity and order executions
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={exportOrders}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm font-medium text-gray-500">Total Orders</div>
            <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm font-medium text-gray-500">Filled Orders</div>
            <div className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === 'FILLED').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm font-medium text-gray-500">Pending Orders</div>
            <div className="text-2xl font-bold text-blue-600">
              {orders.filter(o => o.status === 'PENDING' || o.status === 'PARTIAL').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-sm font-medium text-gray-500">Total Fees</div>
            <div className="text-2xl font-bold text-gray-900">
              ${orders.reduce((sum, o) => sum + parseFloat(o.fee), 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Order ID or pair..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Pair Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pair
              </label>
              <select
                value={filters.pair}
                onChange={(e) => setFilters(prev => ({ ...prev, pair: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {TRADING_PAIRS.map(pair => (
                  <option key={pair.value} value={pair.value}>{pair.label}</option>
                ))}
              </select>
            </div>

            {/* Side Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Side
              </label>
              <select
                value={filters.side}
                onChange={(e) => setFilters(prev => ({ ...prev, side: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {ORDER_SIDES.map(side => (
                  <option key={side.value} value={side.value}>{side.label}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {ORDER_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => setFilters({
                  search: '',
                  pair: '',
                  side: '',
                  status: '',
                  dateFrom: '',
                  dateTo: '',
                })}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pair
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Side
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedOrders.map((order) => {
                  const fillPercentage = calculateFillPercentage(order.filled, order.amount);
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>{new Date(order.timestamp).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 font-mono">
                            {order.orderId}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(order.orderId);
                              toast.success('Order ID copied');
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {order.pair}
                        </span>
                        <div className="text-xs text-gray-500">{order.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          {getSideIcon(order.side)}
                          <span className={`text-sm font-medium ${getSideColor(order.side)}`}>
                            {order.side}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${parseFloat(order.price).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.filled} ({fillPercentage.toFixed(1)}%)
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${fillPercentage}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.fee} {order.feeAsset}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(startIndex + itemsPerPage, filteredOrders.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredOrders.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
                      })}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
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
        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or place your first trade to see order history.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
