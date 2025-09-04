import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Download,
  Calendar,
  ArrowUpDown,
  Filter,
  MoreHorizontal,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import { format } from 'date-fns';

interface Order {
  id: string;
  date: Date;
  pair: string;
  side: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT';
  price: number;
  amount: number;
  filled: number;
  status: 'PENDING' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  fee: number;
  orderId: string;
  avgPrice?: number;
  total?: number;
}

const OrderHistory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pairFilter, setPairFilter] = useState('all');
  const [sideFilter, setSideFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [orderType, setOrderType] = useState('all');

  // Mock order data
  const mockOrders: Order[] = [
    {
      id: 'ord_001',
      date: new Date('2024-01-15T14:30:00'),
      pair: 'XAU/USDC',
      side: 'BUY',
      orderType: 'MARKET',
      price: 2048.5,
      amount: 2.5,
      filled: 2.5,
      status: 'FILLED',
      fee: 5.12,
      orderId: 'ORD_XAU_789123',
      avgPrice: 2048.5,
      total: 5121.25,
    },
    {
      id: 'ord_002',
      date: new Date('2024-01-14T10:15:00'),
      pair: 'XAG/USDC',
      side: 'SELL',
      orderType: 'LIMIT',
      price: 24.85,
      amount: 100.0,
      filled: 75.0,
      status: 'PARTIALLY_FILLED',
      fee: 1.86,
      orderId: 'ORD_XAG_456789',
      avgPrice: 24.87,
      total: 1865.25,
    },
    {
      id: 'ord_003',
      date: new Date('2024-01-13T16:45:00'),
      pair: 'BTC/USDC',
      side: 'BUY',
      orderType: 'LIMIT',
      price: 43200.0,
      amount: 0.1,
      filled: 0.0,
      status: 'CANCELLED',
      fee: 0,
      orderId: 'ORD_BTC_123456',
    },
    {
      id: 'ord_004',
      date: new Date('2024-01-12T09:20:00'),
      pair: 'XPT/USDC',
      side: 'BUY',
      orderType: 'MARKET',
      price: 924.8,
      amount: 1.0,
      filled: 1.0,
      status: 'FILLED',
      fee: 0.92,
      orderId: 'ORD_XPT_987654',
      avgPrice: 924.8,
      total: 924.8,
    },
    {
      id: 'ord_005',
      date: new Date('2024-01-11T13:10:00'),
      pair: 'ETH/USDC',
      side: 'SELL',
      orderType: 'STOP_LOSS',
      price: 2650.0,
      amount: 2.0,
      filled: 0.0,
      status: 'PENDING',
      fee: 0,
      orderId: 'ORD_ETH_654321',
    },
    {
      id: 'ord_006',
      date: new Date('2024-01-10T11:30:00'),
      pair: 'XAU/USDC',
      side: 'SELL',
      orderType: 'MARKET',
      price: 2045.2,
      amount: 1.0,
      filled: 0.0,
      status: 'REJECTED',
      fee: 0,
      orderId: 'ORD_XAU_112233',
    },
  ];

  // Filter orders based on current filters
  const filteredOrders = useMemo(() => {
    return mockOrders.filter(order => {
      const matchesSearch =
        !searchQuery ||
        order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.pair.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPair = pairFilter === 'all' || order.pair === pairFilter;
      const matchesSide = sideFilter === 'all' || order.side === sideFilter;
      const matchesStatus =
        statusFilter === 'all' || order.status === statusFilter;
      const matchesType = orderType === 'all' || order.orderType === orderType;

      return (
        matchesSearch &&
        matchesPair &&
        matchesSide &&
        matchesStatus &&
        matchesType
      );
    });
  }, [
    mockOrders,
    searchQuery,
    pairFilter,
    sideFilter,
    statusFilter,
    orderType,
  ]);

  const getSideColor = (side: Order['side']) => {
    return side === 'BUY'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'FILLED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'PARTIALLY_FILLED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'PENDING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTypeColor = (type: Order['orderType']) => {
    switch (type) {
      case 'MARKET':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'LIMIT':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'STOP_LOSS':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'TAKE_PROFIT':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const calculateFillPercentage = (filled: number, amount: number) => {
    if (amount === 0) return 0;
    return (filled / amount) * 100;
  };

  const handleExport = (format: 'csv' | 'excel') => {
    console.log(`Exporting ${filteredOrders.length} orders as ${format}`);
    // Implementation would go here
  };

  const pairs = [
    'XAU/USDC',
    'XAG/USDC',
    'XPT/USDC',
    'XPD/USDC',
    'BTC/USDC',
    'ETH/USDC',
    'XAU/USD',
    'XAG/USD',
  ];
  const sides = ['BUY', 'SELL'];
  const statuses = [
    'PENDING',
    'PARTIALLY_FILLED',
    'FILLED',
    'CANCELLED',
    'REJECTED',
  ];
  const orderTypes = ['MARKET', 'LIMIT', 'STOP_LOSS', 'TAKE_PROFIT'];

  // Calculate summary stats
  const totalOrders = filteredOrders.length;
  const filledOrders = filteredOrders.filter(o => o.status === 'FILLED').length;
  const totalVolume = filteredOrders.reduce(
    (sum, o) => sum + (o.total || 0),
    0
  );
  const totalFees = filteredOrders.reduce((sum, o) => sum + o.fee, 0);

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl md:text-4xl font-bold text-foreground mb-4'>
            Order History
          </h1>
          <p className='text-xl text-muted-foreground'>
            Track all your trading activity and order performance
          </p>
        </div>

        {/* Summary Stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div className='text-2xl font-bold text-foreground'>
                  {totalOrders}
                </div>
                <TrendingUp className='h-4 w-4 text-muted-foreground' />
              </div>
              <p className='text-xs text-muted-foreground'>Total Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div className='text-2xl font-bold text-green-600'>
                  {filledOrders}
                </div>
                <TrendingUp className='h-4 w-4 text-green-600' />
              </div>
              <p className='text-xs text-muted-foreground'>Filled Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div className='text-2xl font-bold text-primary'>
                  $
                  {totalVolume.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </div>
                <TrendingUp className='h-4 w-4 text-primary' />
              </div>
              <p className='text-xs text-muted-foreground'>Total Volume</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div className='text-2xl font-bold text-orange-600'>
                  ${totalFees.toFixed(2)}
                </div>
                <TrendingDown className='h-4 w-4 text-orange-600' />
              </div>
              <p className='text-xs text-muted-foreground'>Total Fees</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className='mb-6'>
          <CardContent className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-4'>
              <div className='lg:col-span-2'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                  <Input
                    placeholder='Search by order ID or trading pair...'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>

              <Select value={pairFilter} onValueChange={setPairFilter}>
                <SelectTrigger>
                  <SelectValue placeholder='Pair' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Pairs</SelectItem>
                  {pairs.map(pair => (
                    <SelectItem key={pair} value={pair}>
                      {pair}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sideFilter} onValueChange={setSideFilter}>
                <SelectTrigger>
                  <SelectValue placeholder='Side' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Sides</SelectItem>
                  {sides.map(side => (
                    <SelectItem key={side} value={side}>
                      {side}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={orderType} onValueChange={setOrderType}>
                <SelectTrigger>
                  <SelectValue placeholder='Type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  {orderTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder='Date' />
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

            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0'>
              <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
                <span>Showing {filteredOrders.length} orders</span>
                <Button variant='ghost' size='sm' className='h-6 px-2'>
                  <RefreshCw className='h-3 w-3' />
                </Button>
              </div>

              <div className='flex space-x-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleExport('csv')}
                >
                  <Download className='h-4 w-4 mr-2' />
                  Export CSV
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleExport('excel')}
                >
                  <Download className='h-4 w-4 mr-2' />
                  Export Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardContent className='p-0'>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[140px]'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-auto p-0 font-semibold'
                      >
                        Date <ArrowUpDown className='ml-1 h-3 w-3' />
                      </Button>
                    </TableHead>
                    <TableHead>Pair</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className='text-right'>Price</TableHead>
                    <TableHead className='text-right'>Amount</TableHead>
                    <TableHead className='text-right'>Filled</TableHead>
                    <TableHead className='text-right'>Total</TableHead>
                    <TableHead className='text-right'>Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead className='w-[50px]'></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map(order => (
                    <TableRow key={order.id} className='hover:bg-muted/50'>
                      <TableCell className='font-mono text-sm'>
                        {format(order.date, 'MMM dd, HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline'>{order.pair}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getSideColor(order.side)}
                          variant='secondary'
                        >
                          {order.side}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getTypeColor(order.orderType)}
                          variant='secondary'
                        >
                          {order.orderType}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right font-mono'>
                        $
                        {order.price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className='text-right font-mono'>
                        {order.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='font-mono'>
                          {order.filled.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          {calculateFillPercentage(
                            order.filled,
                            order.amount
                          ).toFixed(1)}
                          %
                        </div>
                      </TableCell>
                      <TableCell className='text-right font-mono'>
                        {order.total
                          ? `$${order.total.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : '-'}
                      </TableCell>
                      <TableCell className='text-right font-mono text-muted-foreground'>
                        {order.fee > 0 ? `$${order.fee.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getStatusColor(order.status)}
                          variant='secondary'
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className='font-mono text-sm'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-auto p-0 text-blue-600 hover:text-blue-800'
                        >
                          {order.orderId}
                          <ExternalLink className='ml-1 h-3 w-3' />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button variant='ghost' size='sm'>
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredOrders.length === 0 && (
              <div className='text-center py-12'>
                <div className='text-muted-foreground mb-2'>
                  No orders found
                </div>
                <div className='text-sm text-muted-foreground'>
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

export default OrderHistory;
