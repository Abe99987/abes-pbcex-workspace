import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  TrendingUp,
  TrendingDown,
  Search,
  BarChart3,
  DollarSign,
  Activity,
  Fuel,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface MarketData {
  pair: string;
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: number;
  volume: string;
  sparklineData: number[];
  type: 'crypto' | 'commodity' | 'synthetic';
}

const MiniSparkline = ({ data, isPositive }: { data: number[]; isPositive: boolean }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const normalize = (val: number) => ((val - min) / (max - min)) * 20;
  
  const pathD = data
    .map((point, index) => {
      const x = (index / (data.length - 1)) * 40;
      const y = 20 - normalize(point);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className='w-10 h-5'>
      <svg width="40" height="20" className='overflow-visible'>
        <path
          d={pathD}
          fill="none"
          stroke={isPositive ? 'hsl(var(--gold))' : 'hsl(var(--destructive))'}
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
};

const KPICard = ({ 
  title, 
  value, 
  change, 
  isPositive, 
  icon: Icon, 
  tooltip 
}: {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ElementType;
  tooltip: string;
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Card className='bg-card/50 border-border/50 hover:border-gold/30 transition-all duration-300'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between mb-2'>
              <Icon className='w-4 h-4 text-gold' />
              <Badge
                variant={isPositive ? 'default' : 'destructive'}
                className='text-xs bg-gold/10 text-gold border-gold/30'
              >
                {isPositive ? '+' : ''}{change}
              </Badge>
            </div>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground'>{title}</p>
              <p className='text-lg font-bold text-foreground'>{value}</p>
            </div>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const Markets = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || localStorage.getItem('markets-tab') || 'crypto';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'change' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const marketData: MarketData[] = [
    // Crypto
    {
      pair: 'BTC/USDC',
      symbol: 'BTC',
      name: 'Bitcoin',
      price: '$43,567.89',
      change: '+2.8%',
      changePercent: 2.8,
      volume: '$2.1B',
      sparklineData: [42000, 42500, 41800, 43000, 43200, 43600, 43500, 43567],
      type: 'crypto',
    },
    {
      pair: 'ETH/USDC',
      symbol: 'ETH',
      name: 'Ethereum',
      price: '$2,687.45',
      change: '+1.9%',
      changePercent: 1.9,
      volume: '$1.8B',
      sparklineData: [2650, 2660, 2640, 2670, 2680, 2690, 2685, 2687],
      type: 'crypto',
    },
    {
      pair: 'SOL/USDC',
      symbol: 'SOL',
      name: 'Solana',
      price: '$142.33',
      change: '+4.2%',
      changePercent: 4.2,
      volume: '$845M',
      sparklineData: [135, 138, 140, 142, 144, 143, 142.5, 142.33],
      type: 'crypto',
    },
    // Commodities
    {
      pair: 'XAU/USD',
      symbol: 'XAU',
      name: 'Gold',
      price: '$2,048.50',
      change: '+1.2%',
      changePercent: 1.2,
      volume: '$1.2B',
      sparklineData: [2040, 2045, 2038, 2042, 2048, 2050, 2049, 2048],
      type: 'commodity',
    },
    {
      pair: 'XAG/USD',
      symbol: 'XAG',
      name: 'Silver',
      price: '$24.85',
      change: '+0.8%',
      changePercent: 0.8,
      volume: '$456M',
      sparklineData: [24.2, 24.5, 24.3, 24.7, 24.8, 24.9, 24.85, 24.85],
      type: 'commodity',
    },
    {
      pair: 'XPT/USD',
      symbol: 'XPT',
      name: 'Platinum',
      price: '$924.80',
      change: '+0.6%',
      changePercent: 0.6,
      volume: '$234M',
      sparklineData: [920, 922, 918, 925, 924, 926, 925, 924.8],
      type: 'commodity',
    },
    // Synthetics
    {
      pair: 'OIL-s/USD',
      symbol: 'OIL-s',
      name: 'Synthetic Oil',
      price: '$78.45',
      change: '-1.2%',
      changePercent: -1.2,
      volume: '$123M',
      sparklineData: [80, 79.5, 78.8, 78.2, 78.5, 78.3, 78.4, 78.45],
      type: 'synthetic',
    },
    {
      pair: 'STEEL-s/USD',
      symbol: 'STEEL-s',
      name: 'Synthetic Steel',
      price: '$0.85',
      change: '+0.5%',
      changePercent: 0.5,
      volume: '$67M',
      sparklineData: [0.82, 0.83, 0.84, 0.85, 0.86, 0.85, 0.85, 0.85],
      type: 'synthetic',
    },
  ];

  const filteredAndSortedData = useMemo(() => {
    let filtered = marketData.filter(item => {
      const tabMatch = activeTab === 'crypto' ? item.type === 'crypto' :
                     activeTab === 'commodities' ? item.type === 'commodity' :
                     activeTab === 'synthetics' ? item.type === 'synthetic' : true;
      const searchMatch = item.pair.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return tabMatch && searchMatch;
    });

    if (sortBy) {
      filtered.sort((a, b) => {
        let aVal, bVal;
        if (sortBy === 'price') {
          aVal = parseFloat(a.price.replace(/[$,]/g, ''));
          bVal = parseFloat(b.price.replace(/[$,]/g, ''));
        } else {
          aVal = a.changePercent;
          bVal = b.changePercent;
        }
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    return filtered;
  }, [activeTab, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    localStorage.setItem('markets-tab', activeTab);
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleSort = (column: 'price' | 'change') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleTrade = (pair: string) => {
    navigate(`/trade/${pair}`);
  };

  return (
    <Layout>
      <Helmet>
        <title>Markets - PBCEx | Live Asset Prices & Trading</title>
        <meta
          name='description'
          content='Browse live cryptocurrency, commodity, and synthetic asset prices. Start trading with real-time market data and advanced charting tools.'
        />
      </Helmet>

      <div className='min-h-screen bg-background'>
        <div className='container mx-auto px-4 py-8'>
          {/* Header */}
          <div className='mb-8'>
            <h1 className='text-3xl md:text-4xl font-bold text-foreground mb-2'>
              Markets
            </h1>
            <p className='text-muted-foreground'>
              Browse assets and jump straight into trading.
            </p>
          </div>

          {/* KPI Row */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
            <KPICard
              title='Market Cap'
              value='$1.2T'
              change='2.4%'
              isPositive={true}
              icon={DollarSign}
              tooltip='Total market capitalization across all supported assets'
            />
            <KPICard
              title='24h Volume'
              value='$45.6B'
              change='8.1%'
              isPositive={true}
              icon={Activity}
              tooltip='Total trading volume in the last 24 hours'
            />
            <KPICard
              title='Gas Price'
              value='12 gwei'
              change='-5.2%'
              isPositive={false}
              icon={Fuel}
              tooltip='Current Ethereum network gas price'
            />
          </div>

          {/* Tabs and Search */}
          <div className='mb-6'>
            <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6'>
              <Tabs value={activeTab} onValueChange={handleTabChange} className='w-full md:w-auto'>
                <TabsList className='grid w-full md:w-auto grid-cols-3 bg-card/50'>
                  <TabsTrigger value='crypto'>Crypto</TabsTrigger>
                  <TabsTrigger value='commodities'>Commodities</TabsTrigger>
                  <TabsTrigger value='synthetics'>Synthetics</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className='relative w-full md:w-64'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
                <Input
                  placeholder='Search assets...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-9 bg-card/50 border-border/50'
                />
              </div>
            </div>

            {/* Synthetics Disclosure */}
            {activeTab === 'synthetics' && (
              <div className='mb-4 p-3 bg-card/30 border border-border/50 rounded-lg'>
                <p className='text-sm text-muted-foreground'>
                  Synthetic assets track the price of underlying commodities without direct ownership. Trading involves additional risks.
                </p>
              </div>
            )}
          </div>

          {/* Markets Table */}
          <Card className='bg-card/50 border-border/50 overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-border/50'>
                    <th className='text-left p-4 text-muted-foreground font-medium'>Pair</th>
                    <th className='text-right p-4 text-muted-foreground font-medium'>
                      <button
                        onClick={() => handleSort('price')}
                        className='flex items-center gap-1 hover:text-foreground transition-colors ml-auto'
                      >
                        Last Price
                        <ArrowUpDown className='w-3 h-3' />
                      </button>
                    </th>
                    <th className='text-right p-4 text-muted-foreground font-medium'>
                      <button
                        onClick={() => handleSort('change')}
                        className='flex items-center gap-1 hover:text-foreground transition-colors ml-auto'
                      >
                        24h Change
                        <ArrowUpDown className='w-3 h-3' />
                      </button>
                    </th>
                    <th className='text-right p-4 text-muted-foreground font-medium'>24h Volume</th>
                    <th className='text-center p-4 text-muted-foreground font-medium'>Chart</th>
                    <th className='text-center p-4 text-muted-foreground font-medium'>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData.map((asset, index) => (
                    <tr
                      key={asset.pair}
                      className='border-b border-border/30 hover:bg-card/30 transition-colors'
                    >
                      <td className='p-4'>
                        <div className='flex items-center gap-3'>
                          <div>
                            <div className='flex items-center gap-2'>
                              <span className='font-medium text-foreground'>{asset.pair}</span>
                              {asset.type === 'synthetic' && (
                                <Badge variant='outline' className='text-xs'>
                                  Synthetic
                                </Badge>
                              )}
                            </div>
                            <div className='text-sm text-muted-foreground'>{asset.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className='p-4 text-right'>
                        <span className='font-medium text-foreground'>{asset.price}</span>
                      </td>
                      <td className='p-4 text-right'>
                        <span
                          className={`flex items-center justify-end gap-1 ${
                            asset.changePercent >= 0 ? 'text-gold' : 'text-destructive'
                          }`}
                        >
                          {asset.changePercent >= 0 ? (
                            <TrendingUp className='w-3 h-3' />
                          ) : (
                            <TrendingDown className='w-3 h-3' />
                          )}
                          {asset.change}
                        </span>
                      </td>
                      <td className='p-4 text-right'>
                        <span className='text-muted-foreground'>{asset.volume}</span>
                      </td>
                      <td className='p-4 text-center'>
                        <div className='flex justify-center'>
                          <MiniSparkline
                            data={asset.sparklineData}
                            isPositive={asset.changePercent >= 0}
                          />
                        </div>
                      </td>
                      <td className='p-4 text-center'>
                        <Button
                          size='sm'
                          variant='gold'
                          onClick={() => handleTrade(asset.pair.replace('/', '-'))}
                        >
                          <BarChart3 className='w-3 h-3 mr-1' />
                          Trade
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Footer */}
          <div className='mt-8 text-center'>
            <Button
              variant='outline'
              onClick={() => navigate('/markets/analytics')}
              className='gap-2'
            >
              <BarChart3 className='w-4 h-4' />
              View Analytics Dashboard
              <ExternalLink className='w-3 h-3' />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Markets;