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
  Search,
  Filter,
  X,
  MoreVertical,
  ExternalLink,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

const Orders = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Mock order data
  const orders = [
    {
      id: 'ORD-001',
      type: 'Buy',
      pair: 'BTC/USDC',
      orderType: 'Limit',
      amount: '0.025',
      price: '67,850.00',
      filled: '0.025',
      status: 'Filled',
      timestamp: '2024-01-15 14:23:45',
      total: '1,696.25',
      fee: '2.55',
      avgPrice: '67,850.00',
    },
    {
      id: 'ORD-002',
      type: 'Sell',
      pair: 'ETH/USDC',
      orderType: 'Market',
      amount: '2.0',
      price: '3,425.67',
      filled: '2.0',
      status: 'Filled',
      timestamp: '2024-01-15 12:18:32',
      total: '6,851.34',
      fee: '10.28',
      avgPrice: '3,425.67',
    },
    {
      id: 'ORD-003',
      type: 'Buy',
      pair: 'XAU/USD',
      orderType: 'Limit',
      amount: '1.5',
      price: '2,048.50',
      filled: '0.75',
      status: 'Partially Filled',
      timestamp: '2024-01-14 16:45:12',
      total: '3,072.75',
      fee: '4.61',
      avgPrice: '2,048.50',
    },
    {
      id: 'ORD-004',
      type: 'Buy',
      pair: 'SOL/USDC',
      orderType: 'Limit',
      amount: '10.0',
      price: '142.33',
      filled: '0.0',
      status: 'Open',
      timestamp: '2024-01-14 09:30:15',
      total: '1,423.30',
      fee: '0.00',
      avgPrice: '0.00',
    },
    {
      id: 'ORD-005',
      type: 'Sell',
      pair: 'PAXG/USDC',
      orderType: 'Stop Loss',
      amount: '2.0',
      price: '2,040.00',
      filled: '0.0',
      status: 'Cancelled',
      timestamp: '2024-01-13 11:15:08',
      total: '4,080.00',
      fee: '0.00',
      avgPrice: '0.00',
    },
    {
      id: 'ORD-006',
      type: 'Buy',
      pair: 'XAG/USD',
      orderType: 'Scale',
      amount: '20.0',
      price: '24.85',
      filled: '5.0',
      status: 'Partially Filled',
      timestamp: '2024-01-13 00:00:00',
      total: '497.00',
      fee: '1.24',
      avgPrice: '24.80',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Filled':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'Partially Filled':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Open':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'Cancelled':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'Expired':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'Buy' ? 'text-green-400' : 'text-red-400';
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.pair.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesType = filterType === 'all' || order.type.toLowerCase() === filterType.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const openOrders = orders.filter(order => order.status === 'Open' || order.status === 'Partially Filled');
  const orderHistory = orders.filter(order => order.status === 'Filled' || order.status === 'Cancelled');

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      
      <Helmet>
        <title>Order History - PBCEx | Trades & Executions</title>
        <meta
          name='description'
          content='View your trading order history, manage open orders, and track execution details on PBCEx.'
        />
      </Helmet>

      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-6xl mx-auto space-y-6'>
          
          {/* Header */}
          <div>
            <h1 className='text-3xl font-bold text-foreground mb-2'>Order History</h1>
            <p className='text-muted-foreground'>Manage your orders and view execution history</p>
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
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='search'>Search</Label>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
                    <Input
                      id='search'
                      placeholder='Search orders...'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className='pl-9'
                    />
                  </div>
                </div>
                
                <div className='space-y-2'>
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Status</SelectItem>
                      <SelectItem value='open'>Open</SelectItem>
                      <SelectItem value='filled'>Filled</SelectItem>
                      <SelectItem value='partially filled'>Partially Filled</SelectItem>
                      <SelectItem value='cancelled'>Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className='space-y-2'>
                  <Label>Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Types</SelectItem>
                      <SelectItem value='buy'>Buy Orders</SelectItem>
                      <SelectItem value='sell'>Sell Orders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-card/50">
              <TabsTrigger value="all">All Orders ({filteredOrders.length})</TabsTrigger>
              <TabsTrigger value="open">Open Orders ({openOrders.length})</TabsTrigger>
              <TabsTrigger value="history">Order History ({orderHistory.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              <OrderTable orders={filteredOrders} showActions={true} />
            </TabsContent>
            
            <TabsContent value="open" className="space-y-4">
              <OrderTable orders={openOrders} showActions={true} />
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              <OrderTable orders={orderHistory} showActions={false} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// Order Table Component
const OrderTable = ({ orders, showActions }: { orders: any[], showActions: boolean }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Filled':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'Partially Filled':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Open':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'Cancelled':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'Buy' ? 'text-green-400' : 'text-red-400';
  };

  return (
    <Card className='bg-card/50 border-border/50'>
      <CardContent className='p-0'>
        {/* Desktop Table */}
        <div className='hidden lg:block overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-border/50'>
                <th className='text-left p-4 text-sm font-medium text-muted-foreground'>Date & Time</th>
                <th className='text-left p-4 text-sm font-medium text-muted-foreground'>Pair</th>
                <th className='text-left p-4 text-sm font-medium text-muted-foreground'>Type</th>
                <th className='text-right p-4 text-sm font-medium text-muted-foreground'>Amount</th>
                <th className='text-right p-4 text-sm font-medium text-muted-foreground'>Price</th>
                <th className='text-right p-4 text-sm font-medium text-muted-foreground'>Filled</th>
                <th className='text-center p-4 text-sm font-medium text-muted-foreground'>Status</th>
                {showActions && <th className='text-center p-4 text-sm font-medium text-muted-foreground'>Actions</th>}
              </tr>
            </thead>
            <tbody className='divide-y divide-border/50'>
              {orders.map((order) => (
                <tr key={order.id} className='hover:bg-muted/30'>
                  <td className='p-4'>
                    <div className='text-sm text-foreground'>{order.timestamp.split(' ')[0]}</div>
                    <div className='text-xs text-muted-foreground'>{order.timestamp.split(' ')[1]}</div>
                  </td>
                  <td className='p-4'>
                    <div className='text-sm font-medium text-foreground'>{order.pair}</div>
                    <div className='text-xs text-muted-foreground'>{order.orderType}</div>
                  </td>
                  <td className='p-4'>
                    <span className={`text-sm font-medium ${getTypeColor(order.type)}`}>
                      {order.type}
                    </span>
                  </td>
                  <td className='text-right p-4'>
                    <span className='text-sm font-mono text-foreground'>{order.amount}</span>
                  </td>
                  <td className='text-right p-4'>
                    <span className='text-sm font-mono text-foreground'>${order.price}</span>
                  </td>
                  <td className='text-right p-4'>
                    <div className='text-sm font-mono text-foreground'>{order.filled}</div>
                    <div className='text-xs text-muted-foreground'>
                      {((parseFloat(order.filled) / parseFloat(order.amount)) * 100).toFixed(1)}%
                    </div>
                  </td>
                  <td className='text-center p-4'>
                    <Badge className={getStatusColor(order.status)} variant='outline'>
                      {order.status}
                    </Badge>
                  </td>
                  {showActions && (
                    <td className='text-center p-4'>
                      <div className='flex items-center justify-center gap-1'>
                        {(order.status === 'Open' || order.status === 'Partially Filled') && (
                          <Button variant='ghost' size='sm' className='text-red-400 hover:text-red-300'>
                            <X className='w-4 h-4' />
                          </Button>
                        )}
                        <Button variant='ghost' size='sm'>
                          <MoreVertical className='w-4 h-4' />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className='lg:hidden space-y-4 p-4'>
          {orders.map((order) => (
            <div key={order.id} className='p-4 bg-muted/30 rounded-lg border border-border/50'>
              <div className='flex items-start justify-between mb-3'>
                <div>
                  <div className='flex items-center gap-2 mb-1'>
                    <span className={`text-sm font-medium ${getTypeColor(order.type)}`}>
                      {order.type}
                    </span>
                    <span className='text-sm font-medium text-foreground'>{order.pair}</span>
                    <Badge className={getStatusColor(order.status)} variant='outline'>
                      {order.status}
                    </Badge>
                  </div>
                  <div className='text-xs text-muted-foreground'>{order.timestamp}</div>
                </div>
                {showActions && (
                  <div className='flex gap-1'>
                    {(order.status === 'Open' || order.status === 'Partially Filled') && (
                      <Button variant='ghost' size='sm' className='text-red-400'>
                        <X className='w-4 h-4' />
                      </Button>
                    )}
                    <Button variant='ghost' size='sm'>
                      <MoreVertical className='w-4 h-4' />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className='grid grid-cols-2 gap-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Type:</span>
                  <span className='text-foreground'>{order.orderType}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Amount:</span>
                  <span className='font-mono text-foreground'>{order.amount}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Price:</span>
                  <span className='font-mono text-foreground'>${order.price}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Filled:</span>
                  <span className='font-mono text-foreground'>
                    {order.filled} ({((parseFloat(order.filled) / parseFloat(order.amount)) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {orders.length === 0 && (
          <div className='text-center py-12'>
            <div className='text-muted-foreground mb-2'>No orders found</div>
            <div className='text-sm text-muted-foreground'>
              Try adjusting your search or filter criteria
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Orders;