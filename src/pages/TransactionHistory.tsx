import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Download, 
  Calendar,
  ArrowUpDown,
  Filter,
  MoreHorizontal,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  date: Date;
  asset: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'TRADE' | 'FEE' | 'SPENDING' | 'CONVERSION' | 'REWARD';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  fee: number;
  reference: string;
  description?: string;
  counterparty?: string;
}

const TransactionHistory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [assetFilter, setAssetFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30d');

  // Mock transaction data
  const mockTransactions: Transaction[] = [
    {
      id: 'tx_001',
      date: new Date('2024-01-15T10:30:00'),
      asset: 'USD',
      amount: 5000.00,
      type: 'DEPOSIT',
      status: 'COMPLETED',
      fee: 0,
      reference: 'DEP_5YK9X2M',
      description: 'Bank wire deposit',
      counterparty: 'Chase Bank ****1234'
    },
    {
      id: 'tx_002',
      date: new Date('2024-01-14T15:45:00'),
      asset: 'XAU-s',
      amount: -2.5,
      type: 'TRADE',
      status: 'COMPLETED',
      fee: 2.50,
      reference: 'TRD_8NMK4L1',
      description: 'Sold 2.5oz Gold Synthetic',
      counterparty: 'Market Order'
    },
    {
      id: 'tx_003',
      date: new Date('2024-01-14T09:20:00'),
      asset: 'PAXG',
      amount: 1.0,
      type: 'CONVERSION',
      status: 'COMPLETED',
      fee: 1.25,
      reference: 'CNV_7QWE832',
      description: 'USD → PAXG conversion',
    },
    {
      id: 'tx_004',
      date: new Date('2024-01-13T14:10:00'),
      asset: 'USD',
      amount: -125.50,
      type: 'SPENDING',
      status: 'COMPLETED',
      fee: 0,
      reference: 'SPD_9XCV123',
      description: 'Starbucks - Coffee purchase',
      counterparty: 'Starbucks #4829'
    },
    {
      id: 'tx_005',
      date: new Date('2024-01-12T11:35:00'),
      asset: 'USDC',
      amount: 1000.00,
      type: 'TRANSFER_IN',
      status: 'PENDING',
      fee: 0.50,
      reference: 'TIN_3HGF567',
      description: 'Transfer from trading account',
    },
    {
      id: 'tx_006',
      date: new Date('2024-01-11T16:22:00'),
      asset: 'XAG-s',
      amount: -50.0,
      type: 'WITHDRAWAL',
      status: 'FAILED',
      fee: 5.00,
      reference: 'WTD_2QAZ789',
      description: 'Physical silver withdrawal',
      counterparty: 'JM Bullion'
    }
  ];

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    return mockTransactions.filter(tx => {
      const matchesSearch = !searchQuery || 
        tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.counterparty?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesAsset = assetFilter === 'all' || tx.asset === assetFilter;
      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
      
      return matchesSearch && matchesAsset && matchesType && matchesStatus;
    });
  }, [mockTransactions, searchQuery, assetFilter, typeFilter, statusFilter]);

  const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'DEPOSIT': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'WITHDRAWAL': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'TRADE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'TRANSFER_IN': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'TRANSFER_OUT': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'SPENDING': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'CONVERSION': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'FEE': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'REWARD': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'FAILED': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const handleExport = (format: 'csv' | 'excel') => {
    console.log(`Exporting ${filteredTransactions.length} transactions as ${format}`);
    // Implementation would go here
  };

  const assets = ['USD', 'USDC', 'USDT', 'PAXG', 'XAU-s', 'XAG-s', 'XPT-s', 'BTC', 'ETH'];
  const types = ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'TRADE', 'FEE', 'SPENDING', 'CONVERSION', 'REWARD'];
  const statuses = ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Transaction History
          </h1>
          <p className="text-xl text-muted-foreground">
            View and manage all your account transactions
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by reference, description, or counterparty..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={assetFilter} onValueChange={setAssetFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>
                  {assets.map(asset => (
                    <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Showing {filteredTransactions.length} transactions</span>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">
                      <Button variant="ghost" size="sm" className="h-auto p-0 font-semibold">
                        Date <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Fee</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="w-[300px]">Description</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">
                        {format(transaction.date, 'MMM dd, HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.asset}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(transaction.type)} variant="secondary">
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transaction.status)} variant="secondary">
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {transaction.fee > 0 ? `-$${transaction.fee.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-blue-600 hover:text-blue-800">
                          {transaction.reference}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div>
                          {transaction.description}
                          {transaction.counterparty && (
                            <div className="text-xs text-muted-foreground/70">
                              {transaction.counterparty}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-2">No transactions found</div>
                <div className="text-sm text-muted-foreground">
                  Try adjusting your search criteria or filters
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TransactionHistory;