import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/utils/api';
import type { Transaction } from '@/types/wallet';
import Navigation from '@/components/Navigation';
import toast from 'react-hot-toast';
import {
  Filter,
  Download,
  Search,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
} from 'lucide-react';

interface TransactionFilters {
  search: string;
  type: string;
  status: string;
  asset: string;
  dateFrom: string;
  dateTo: string;
}

const TRANSACTION_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'DEPOSIT', label: 'Deposit' },
  { value: 'WITHDRAWAL', label: 'Withdrawal' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'TRADE', label: 'Trade' },
  { value: 'CONVERSION', label: 'Conversion' },
];

const TRANSACTION_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const ASSETS = [
  { value: '', label: 'All Assets' },
  { value: 'USD', label: 'USD' },
  { value: 'USDC', label: 'USDC' },
  { value: 'PAXG', label: 'PAXG (Gold)' },
  { value: 'XAU-s', label: 'XAU-s (Gold Synthetic)' },
  { value: 'XAG-s', label: 'XAG-s (Silver Synthetic)' },
  { value: 'XPT-s', label: 'XPT-s (Platinum Synthetic)' },
];

// Mock transaction data (replace with real API data)
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_001',
    type: 'DEPOSIT',
    asset: 'USD',
    amount: '5000.00',
    accountType: 'FUNDING',
    description: 'Bank wire deposit',
    reference: 'WIRE_20241201_001',
    createdAt: '2024-12-01T10:30:00Z',
  },
  {
    id: 'tx_002',
    type: 'TRADE',
    asset: 'PAXG',
    amount: '2.5000',
    accountType: 'TRADING',
    description: 'Buy PAXG with USD',
    reference: 'TRADE_20241201_002',
    createdAt: '2024-12-01T14:15:00Z',
  },
  {
    id: 'tx_003',
    type: 'TRANSFER',
    asset: 'XAU-s',
    amount: '1.2500',
    accountType: 'TRADING',
    description: 'Transfer to trading account',
    reference: 'TRANSFER_20241130_003',
    createdAt: '2024-11-30T16:45:00Z',
  },
  {
    id: 'tx_004',
    type: 'WITHDRAWAL',
    asset: 'USD',
    amount: '1000.00',
    accountType: 'FUNDING',
    description: 'Bank wire withdrawal',
    reference: 'WIRE_20241129_004',
    createdAt: '2024-11-29T09:20:00Z',
  },
  {
    id: 'tx_005',
    type: 'CONVERSION',
    asset: 'XAG-s',
    amount: '150.0000',
    accountType: 'TRADING',
    description: 'Convert XAU-s to XAG-s',
    reference: 'CONV_20241128_005',
    createdAt: '2024-11-28T11:10:00Z',
  },
];

export default function TransactionHistory() {
  const { user, isLoading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    type: '',
    status: '',
    asset: '',
    dateFrom: '',
    dateTo: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    if (!user) return;

    const fetchTransactions = async () => {
      try {
        const response = await api.wallet.getTransactions(100); // Fetch more transactions
        if (response.data.code === 'SUCCESS') {
          // Use API data if available, otherwise fall back to mock data
          const apiTransactions = response.data.data?.transactions || [];
          setTransactions(apiTransactions.length > 0 ? apiTransactions : MOCK_TRANSACTIONS);
        } else {
          // Use mock data if API fails
          setTransactions(MOCK_TRANSACTIONS);
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
        // Use mock data as fallback
        setTransactions(MOCK_TRANSACTIONS);
        toast.error('Using mock transaction data');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownCircle className="h-5 w-5 text-green-500" />;
      case 'WITHDRAWAL':
        return <ArrowUpCircle className="h-5 w-5 text-red-500" />;
      case 'TRANSFER':
        return <Send className="h-5 w-5 text-blue-500" />;
      case 'TRADE':
        return <RefreshCw className="h-5 w-5 text-purple-500" />;
      case 'CONVERSION':
        return <RefreshCw className="h-5 w-5 text-orange-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string = 'COMPLETED') => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="h-3 w-3 mr-1" />
            Unknown
          </span>
        );
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filters.search && !tx.description.toLowerCase().includes(filters.search.toLowerCase()) && 
        !tx.reference?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.type && tx.type !== filters.type) return false;
    if (filters.asset && tx.asset !== filters.asset) return false;
    // Add date filtering logic here
    return true;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const exportTransactions = () => {
    const csv = [
      ['Date', 'Type', 'Asset', 'Amount', 'Account', 'Status', 'Description', 'Reference'],
      ...filteredTransactions.map(tx => [
        new Date(tx.createdAt).toLocaleDateString(),
        tx.type,
        tx.asset,
        tx.amount,
        tx.accountType,
        'COMPLETED', // Default status since our current Transaction type doesn't include status
        tx.description,
        tx.reference || '',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Transactions exported successfully');
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
              Please log in to view your transaction history
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
              <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
              <p className="text-gray-600 mt-1">
                View all your deposits, withdrawals, and transfers
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportTransactions}
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
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {TRANSACTION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
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
                {TRANSACTION_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            {/* Asset Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asset
              </label>
              <select
                value={filters.asset}
                onChange={(e) => setFilters(prev => ({ ...prev, asset: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {ASSETS.map(asset => (
                  <option key={asset.value} value={asset.value}>{asset.label}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => setFilters({
                  search: '',
                  type: '',
                  status: '',
                  asset: '',
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

        {/* Transaction Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TxID
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(transaction.type)}
                        <span className="text-sm font-medium text-gray-900">
                          {transaction.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {transaction.asset}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        transaction.accountType === 'FUNDING' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {transaction.accountType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 font-mono">
                          {transaction.reference || transaction.id}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(transaction.reference || transaction.id);
                            toast.success('Transaction ID copied');
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                        {Math.min(startIndex + itemsPerPage, filteredTransactions.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredTransactions.length}</span> results
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
        {filteredTransactions.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or check back later for new transactions.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
