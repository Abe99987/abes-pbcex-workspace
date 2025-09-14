import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Download,
  Filter,
  Search,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  MoreVertical,
} from 'lucide-react';

const Transactions = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock transaction data
  const transactions = [
    {
      id: 'tx_001',
      type: 'Deposit',
      asset: 'USDC',
      amount: '+5,000.00',
      usdValue: '+$5,000.00',
      status: 'Completed',
      timestamp: '2024-01-15 14:23:45',
      txHash: '0x1234...5678',
      from: 'Bank Transfer',
      to: 'Funding Account',
      fee: '$0.00',
      isPositive: true,
    },
    {
      id: 'tx_002',
      type: 'Trade',
      asset: 'BTC/USDC',
      amount: '+0.025 BTC',
      usdValue: '+$1,696.25',
      status: 'Completed',
      timestamp: '2024-01-15 12:18:32',
      txHash: '0x2345...6789',
      from: 'USDC Balance',
      to: 'BTC Balance',
      fee: '$2.55',
      isPositive: true,
    },
    {
      id: 'tx_003',
      type: 'Transfer',
      asset: 'PAXG',
      amount: '-2.5 PAXG',
      usdValue: '-$5,121.25',
      status: 'Completed',
      timestamp: '2024-01-14 16:45:12',
      txHash: '0x3456...7890',
      from: 'Trading Account',
      to: 'Funding Account',
      fee: '$0.50',
      isPositive: false,
    },
    {
      id: 'tx_004',
      type: 'Withdrawal',
      asset: 'USD',
      amount: '-1,000.00',
      usdValue: '-$1,000.00',
      status: 'Processing',
      timestamp: '2024-01-14 09:30:15',
      txHash: 'pending',
      from: 'Funding Account',
      to: 'Bank Account (*4532)',
      fee: '$15.00',
      isPositive: false,
    },
    {
      id: 'tx_005',
      type: 'Purchase',
      asset: 'XAU',
      amount: '+1.5 oz',
      usdValue: '+$3,072.75',
      status: 'Completed',
      timestamp: '2024-01-13 11:15:08',
      txHash: '0x4567...8901',
      from: 'USDC Balance',
      to: 'Physical Gold Vault',
      fee: '$5.25',
      isPositive: true,
    },
    {
      id: 'tx_006',
      type: 'Staking Reward',
      asset: 'ETH',
      amount: '+0.0045 ETH',
      usdValue: '+$12.15',
      status: 'Completed',
      timestamp: '2024-01-13 00:00:00',
      txHash: '0x5678...9012',
      from: 'Staking Pool',
      to: 'ETH Balance',
      fee: '$0.00',
      isPositive: true,
    },
    {
      id: 'tx_007',
      type: 'Send',
      asset: 'USDC',
      amount: '-250.00',
      usdValue: '-$250.00',
      status: 'Failed',
      timestamp: '2024-01-12 15:42:33',
      txHash: '0x6789...0123',
      from: 'Funding Account',
      to: 'External Address',
      fee: '$2.00',
      isPositive: false,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'Processing':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'Failed':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'Pending':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Deposit':
      case 'Purchase':
      case 'Staking Reward':
        return 'text-green-400';
      case 'Withdrawal':
      case 'Send':
        return 'text-red-400';
      case 'Trade':
      case 'Transfer':
        return 'text-blue-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || tx.type.toLowerCase() === filterType.toLowerCase();
    const matchesStatus = filterStatus === 'all' || tx.status.toLowerCase() === filterStatus.toLowerCase();
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      
      <Helmet>
        <title>Transaction History - PBCEx | Account Transfers</title>
        <meta
          name='description'
          content='View your complete transaction history including deposits, withdrawals, trades, and transfers on PBCEx.'
        />
      </Helmet>

      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-6xl mx-auto space-y-6'>
          
          {/* Header */}
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div>
              <h1 className='text-3xl font-bold text-foreground mb-2'>Transaction History</h1>
              <p className='text-muted-foreground'>All your account activity and transfers</p>
            </div>
            
            <div className='flex gap-2'>
              <Button variant='outline' className='flex items-center gap-2'>
                <Calendar className='w-4 h-4' />
                Export
              </Button>
              <Button variant='outline' className='flex items-center gap-2'>
                <Download className='w-4 h-4' />
                Download CSV
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className='bg-card/50 border-border/50'>
            <CardHeader>
              <CardTitle className='text-foreground flex items-center gap-2 text-lg'>
                <Filter className='w-5 h-5' />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='search'>Search</Label>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
                    <Input
                      id='search'
                      placeholder='Search transactions...'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className='pl-9'
                    />
                  </div>
                </div>
                
                <div className='space-y-2'>
                  <Label>Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Types</SelectItem>
                      <SelectItem value='deposit'>Deposit</SelectItem>
                      <SelectItem value='withdrawal'>Withdrawal</SelectItem>
                      <SelectItem value='trade'>Trade</SelectItem>
                      <SelectItem value='transfer'>Transfer</SelectItem>
                      <SelectItem value='purchase'>Purchase</SelectItem>
                      <SelectItem value='send'>Send</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className='space-y-2'>
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Status</SelectItem>
                      <SelectItem value='completed'>Completed</SelectItem>
                      <SelectItem value='processing'>Processing</SelectItem>
                      <SelectItem value='pending'>Pending</SelectItem>
                      <SelectItem value='failed'>Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className='space-y-2'>
                  <Label>Date Range</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder='Last 30 days' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='7d'>Last 7 days</SelectItem>
                      <SelectItem value='30d'>Last 30 days</SelectItem>
                      <SelectItem value='90d'>Last 90 days</SelectItem>
                      <SelectItem value='1y'>Last year</SelectItem>
                      <SelectItem value='all'>All time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction List */}
          <Card className='bg-card/50 border-border/50'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-foreground'>
                  Transactions ({filteredTransactions.length})
                </CardTitle>
                <Button variant='ghost' size='sm'>
                  <ArrowUpDown className='w-4 h-4' />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Desktop Table */}
              <div className='hidden lg:block'>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b border-border/50'>
                        <th className='text-left py-3 text-sm font-medium text-muted-foreground'>Date & Time</th>
                        <th className='text-left py-3 text-sm font-medium text-muted-foreground'>Type</th>
                        <th className='text-left py-3 text-sm font-medium text-muted-foreground'>Asset</th>
                        <th className='text-right py-3 text-sm font-medium text-muted-foreground'>Amount</th>
                        <th className='text-right py-3 text-sm font-medium text-muted-foreground'>USD Value</th>
                        <th className='text-center py-3 text-sm font-medium text-muted-foreground'>Status</th>
                        <th className='text-center py-3 text-sm font-medium text-muted-foreground'>Actions</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-border/50'>
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className='hover:bg-muted/30'>
                          <td className='py-4'>
                            <div className='text-sm text-foreground'>{tx.timestamp.split(' ')[0]}</div>
                            <div className='text-xs text-muted-foreground'>{tx.timestamp.split(' ')[1]}</div>
                          </td>
                          <td className='py-4'>
                            <span className={`text-sm font-medium ${getTypeColor(tx.type)}`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className='py-4'>
                            <div className='text-sm font-medium text-foreground'>{tx.asset}</div>
                            <div className='text-xs text-muted-foreground'>ID: {tx.id}</div>
                          </td>
                          <td className='text-right py-4'>
                            <span className={`text-sm font-mono ${tx.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                              {tx.amount}
                            </span>
                          </td>
                          <td className='text-right py-4'>
                            <span className={`text-sm font-mono ${tx.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                              {tx.usdValue}
                            </span>
                          </td>
                          <td className='text-center py-4'>
                            <Badge className={getStatusColor(tx.status)} variant='outline'>
                              {tx.status}
                            </Badge>
                          </td>
                          <td className='text-center py-4'>
                            <Button variant='ghost' size='sm'>
                              <MoreVertical className='w-4 h-4' />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className='lg:hidden space-y-4'>
                {filteredTransactions.map((tx) => (
                  <div key={tx.id} className='p-4 bg-muted/30 rounded-lg border border-border/50'>
                    <div className='flex items-start justify-between mb-3'>
                      <div>
                        <div className='flex items-center gap-2 mb-1'>
                          <span className={`text-sm font-medium ${getTypeColor(tx.type)}`}>
                            {tx.type}
                          </span>
                          <Badge className={getStatusColor(tx.status)} variant='outline'>
                            {tx.status}
                          </Badge>
                        </div>
                        <div className='text-xs text-muted-foreground'>{tx.timestamp}</div>
                      </div>
                      <Button variant='ghost' size='sm'>
                        <MoreVertical className='w-4 h-4' />
                      </Button>
                    </div>
                    
                    <div className='space-y-2'>
                      <div className='flex justify-between'>
                        <span className='text-sm text-muted-foreground'>Asset:</span>
                        <span className='text-sm font-medium text-foreground'>{tx.asset}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-sm text-muted-foreground'>Amount:</span>
                        <span className={`text-sm font-mono ${tx.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.amount}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-sm text-muted-foreground'>USD Value:</span>
                        <span className={`text-sm font-mono ${tx.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.usdValue}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-sm text-muted-foreground'>Fee:</span>
                        <span className='text-sm font-mono text-foreground'>{tx.fee}</span>
                      </div>
                      
                      {tx.txHash !== 'pending' && (
                        <div className='flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t border-border/30'>
                          <span>TX:</span>
                          <span className='font-mono'>{tx.txHash}</span>
                          <ExternalLink className='w-3 h-3 ml-1' />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredTransactions.length === 0 && (
                <div className='text-center py-12'>
                  <div className='text-muted-foreground mb-2'>No transactions found</div>
                  <div className='text-sm text-muted-foreground'>
                    Try adjusting your search or filter criteria
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Transactions;