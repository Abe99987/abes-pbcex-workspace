import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  marketsAdapter,
  type MarketSymbol,
  type MarketKPIs,
  type SectorData,
} from '@/lib/api';
import { FEATURE_FLAGS } from '@/config/features';
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
  Info,
  ExternalLink,
  Star,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Using MarketSymbol from API adapter
type MarketData = MarketSymbol;

const MiniSparkline = ({
  data,
  isPositive,
}: {
  data: number[];
  isPositive: boolean;
}) => {
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
      <svg width='40' height='20' className='overflow-visible'>
        <path
          d={pathD}
          fill='none'
          stroke={isPositive ? 'hsl(var(--gold))' : 'hsl(var(--destructive))'}
          strokeWidth='1.5'
        />
      </svg>
    </div>
  );
};

const FearGreedGauge = ({ score, label }: { score: number; label: string }) => {
  const rotation = (score / 100) * 180 - 90;

  return (
    <div className='flex flex-col items-center'>
      <div className='relative w-24 h-12 mb-2'>
        <svg
          width='96'
          height='48'
          viewBox='0 0 96 48'
          className='overflow-visible'
        >
          {/* Background arc */}
          <path
            d='M 8 40 A 40 40 0 0 1 88 40'
            fill='none'
            stroke='hsl(var(--border))'
            strokeWidth='6'
          />
          {/* Colored segments */}
          <path
            d='M 8 40 A 40 40 0 0 1 32 15'
            fill='none'
            stroke='hsl(var(--destructive))'
            strokeWidth='6'
          />
          <path
            d='M 32 15 A 40 40 0 0 1 64 15'
            fill='none'
            stroke='hsl(var(--gold))'
            strokeWidth='6'
          />
          <path
            d='M 64 15 A 40 40 0 0 1 88 40'
            fill='none'
            stroke='hsl(var(--primary))'
            strokeWidth='6'
          />
          {/* Needle */}
          <line
            x1='48'
            y1='40'
            x2='48'
            y2='15'
            stroke='hsl(var(--foreground))'
            strokeWidth='2'
            transform={`rotate(${rotation} 48 40)`}
            style={{ transformOrigin: '48px 40px' }}
          />
        </svg>
      </div>
      <div className='text-center'>
        <div className='text-2xl font-bold text-foreground'>{score}</div>
        <div className='text-xs text-muted-foreground'>{label}</div>
      </div>
    </div>
  );
};

const Markets = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeMainTab, setActiveMainTab] = useState(() => {
    return searchParams.get('tab') || 'overview';
  });
  const [activeMarketTab, setActiveMarketTab] = useState(() => {
    const marketTab = searchParams.get('market');
    if (marketTab) return marketTab;

    // Check for preselection from home page asset cards
    const preselect = searchParams.get('preselect');
    if (preselect === 'crypto') return 'crypto-spot';
    if (preselect === 'commodities') return 'commodities';

    return 'favorites';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'change' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<string>('all');

  // API data states
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [kpis, setKpis] = useState<MarketKPIs | null>(null);
  const [cryptoSectors, setCryptoSectors] = useState<SectorData[]>([]);
  const [commoditySectors, setCommoditySectors] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceUpdates, setPriceUpdates] = useState<
    Map<string, { price: string; change: number }>
  >(new Map());

  // Load market data on component mount
  useEffect(() => {
    const loadMarketData = async () => {
      try {
        setLoading(true);
        const [symbols, kpisData, sectorsData] = await Promise.all([
          marketsAdapter.getSymbols(),
          marketsAdapter.getKPIs(),
          marketsAdapter.getSectors(),
        ]);

        setMarketData(symbols);
        setKpis(kpisData);
        setCryptoSectors(sectorsData.crypto);
        setCommoditySectors(sectorsData.commodity);
      } catch (error) {
        console.error('Failed to load market data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMarketData();
  }, []);

  // Start SSE price stream
  useEffect(() => {
    const eventSource = marketsAdapter.startPriceStream(
      (symbol, price, changePercent) => {
        setPriceUpdates(
          prev =>
            new Map(
              prev.set(symbol, {
                price,
                change: changePercent,
              })
            )
        );
      }
    );

    return () => {
      eventSource?.close();
    };
  }, []);

  // Apply live price updates to market data
  const liveMarketData = useMemo(() => {
    return marketData.map(item => {
      const liveUpdate = priceUpdates.get(item.symbol);
      if (liveUpdate) {
        return {
          ...item,
          price: liveUpdate.price,
          change: `${liveUpdate.change >= 0 ? '+' : ''}${liveUpdate.change.toFixed(1)}%`,
          changePercent: liveUpdate.change,
        };
      }
      return item;
    });
  }, [marketData, priceUpdates]);

  const getFilteredData = () => {
    let filtered = liveMarketData;

    // Filter by market tab
    switch (activeMarketTab) {
      case 'favorites':
        filtered = filtered.filter(item => item.isFavorite);
        break;
      case 'crypto-spot':
        filtered = filtered.filter(item => item.type === 'crypto');
        break;
      case 'commodities':
        filtered = filtered.filter(item => item.type === 'commodity');
        break;
      case 'synthetics':
        filtered = filtered.filter(item => item.type === 'synthetic');
        break;
      case 'newly-listed':
        filtered = filtered.filter(item => item.isNewlyListed);
        break;
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        item =>
          item.pair.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort data
    if (sortBy) {
      filtered.sort((a, b) => {
        let aVal, bVal;
        if (sortBy === 'price') {
          aVal = parseFloat(a.price.replace(/[,$]/g, ''));
          bVal = parseFloat(b.price.replace(/[,$]/g, ''));
        } else {
          aVal = a.changePercent;
          bVal = b.changePercent;
        }
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    return filtered;
  };

  const filteredAndSortedData = useMemo(
    () => getFilteredData(),
    [activeMarketTab, searchQuery, sortBy, sortOrder, liveMarketData]
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeMainTab !== 'overview') params.set('tab', activeMainTab);
    if (activeMarketTab !== 'favorites') params.set('market', activeMarketTab);
    setSearchParams(params);
  }, [activeMainTab, activeMarketTab, setSearchParams]);

  // Feature flag check after all hooks
  if (!FEATURE_FLAGS['markets.v1']) {
    return (
      <Layout>
        <div className='min-h-screen flex items-center justify-center bg-background'>
          <div className='text-center space-y-4'>
            <h1 className='text-2xl font-bold text-foreground'>
              Markets Coming Soon
            </h1>
            <p className='text-muted-foreground'>
              The markets feature is currently in development.
            </p>
            <Button onClick={() => navigate('/')} variant='default'>
              Return Home
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleSort = (column: 'price' | 'change') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleTrade = (pair: string) => {
    navigate(`/trade/${pair.replace('/', '-')}`);
  };

  const getFilterChips = () => {
    if (activeMarketTab === 'crypto-spot') {
      return ['All', 'USDC', 'USD', 'BTC'];
    } else if (activeMarketTab === 'commodities') {
      return ['All', 'Metals', 'Energy', 'Agriculture'];
    }
    return ['All'];
  };

  return (
    <Layout>
      <Helmet>
        <title>Markets - PBCEx | Live Asset Prices & Trading</title>
        <meta
          name='description'
          content='Browse live cryptocurrency, commodity, and synthetic asset prices. Real-time market data and advanced trading tools for global markets.'
        />
      </Helmet>

      <div className='min-h-screen bg-background'>
        <div className='container mx-auto px-4 py-6'>
          {/* Primary Tabs */}
          <div className='mb-8'>
            <Tabs value={activeMainTab} onValueChange={setActiveMainTab}>
              <TabsList className='bg-card/50 border border-border/50 mb-6'>
                <TabsTrigger value='overview' className='text-sm font-medium'>
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value='key-metrics'
                  className='text-sm font-medium'
                >
                  Key Metrics
                </TabsTrigger>
              </TabsList>

              <TabsContent value='overview' className='space-y-8'>
                {/* Loading state */}
                {loading && (
                  <div className='flex items-center justify-center py-12'>
                    <div className='text-center'>
                      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
                      <p className='text-muted-foreground'>
                        Loading market data...
                      </p>
                    </div>
                  </div>
                )}

                {!loading && (
                  <>
                    {/* KPI Strip */}
                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
                      {/* Market Sentiment */}
                      <Card className='bg-card/50 border-border/50'>
                        <CardContent className='p-6'>
                          <div className='flex items-center justify-between mb-4'>
                            <h3 className='text-lg font-semibold text-foreground'>
                              Market Sentiment
                            </h3>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='text-gold hover:text-gold/80 h-auto p-0'
                            >
                              View More
                              <ExternalLink className='w-3 h-3 ml-1' />
                            </Button>
                          </div>
                          <FearGreedGauge
                            score={kpis?.fearGreedIndex || 53}
                            label={kpis?.fearGreedLabel || 'Neutral'}
                          />
                          <div className='grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/30'>
                            <div className='text-center'>
                              <div className='text-lg font-bold text-primary'>
                                {kpis?.longShortRatio?.long || 77}
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                Long
                              </div>
                            </div>
                            <div className='text-center'>
                              <div className='text-lg font-bold text-destructive'>
                                {kpis?.longShortRatio?.short || 23}
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                Short
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Market Data */}
                      <Card className='bg-card/50 border-border/50'>
                        <CardContent className='p-6'>
                          <div className='flex items-center justify-between mb-4'>
                            <h3 className='text-lg font-semibold text-foreground'>
                              Market Data
                            </h3>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='text-gold hover:text-gold/80 h-auto p-0'
                            >
                              View More
                              <ExternalLink className='w-3 h-3 ml-1' />
                            </Button>
                          </div>
                          <div className='space-y-4'>
                            <div>
                              <div className='text-sm text-muted-foreground mb-1'>
                                Current ETH Gas Price
                              </div>
                              <div className='text-lg font-bold text-foreground'>
                                {kpis?.ethGasPrice || '0.127955129'}{' '}
                                <span className='text-sm font-normal text-muted-foreground'>
                                  Gwei
                                </span>
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                ≈ {kpis?.ethGasPriceUsd || '0.013'} USD
                              </div>
                            </div>
                            <div className='flex items-center justify-between'>
                              <div>
                                <div className='text-sm text-muted-foreground mb-1'>
                                  Trading Vol.
                                </div>
                                <div className='flex items-center gap-2'>
                                  <span className='text-lg font-bold text-foreground'>
                                    {kpis?.tradingVolumeUsd || '1525.04 B USD'}
                                  </span>
                                  <Badge className='bg-primary/10 text-primary border-primary/30 text-xs'>
                                    {kpis?.tradingVolumeChange || '+14.66%'}
                                  </Badge>
                                </div>
                              </div>
                              <div className='w-16 h-8'>
                                <MiniSparkline
                                  data={[
                                    1400, 1450, 1480, 1520, 1525, 1530, 1525,
                                    1525,
                                  ]}
                                  isPositive={true}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Trending Sectors */}
                      <Card className='bg-card/50 border-border/50'>
                        <CardContent className='p-6'>
                          <h3 className='text-lg font-semibold text-foreground mb-4'>
                            Trending Sectors
                          </h3>
                          <div className='space-y-4'>
                            <div>
                              <div className='text-sm font-medium text-foreground mb-2'>
                                Crypto Sectors
                              </div>
                              <div className='space-y-1'>
                                {cryptoSectors.map((sector, index) => (
                                  <div
                                    key={sector.name}
                                    className='flex items-center justify-between text-sm'
                                  >
                                    <span className='text-muted-foreground'>
                                      {sector.name}
                                    </span>
                                    <span
                                      className={
                                        sector.isPositive
                                          ? 'text-primary'
                                          : 'text-destructive'
                                      }
                                    >
                                      {sector.change}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className='text-sm font-medium text-foreground mb-2'>
                                Commodities
                              </div>
                              <div className='space-y-1'>
                                {commoditySectors.map((sector, index) => (
                                  <div
                                    key={sector.name}
                                    className='flex items-center justify-between text-sm'
                                  >
                                    <span className='text-muted-foreground'>
                                      {sector.name}
                                    </span>
                                    <span
                                      className={
                                        sector.isPositive
                                          ? 'text-primary'
                                          : 'text-destructive'
                                      }
                                    >
                                      {sector.change}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Market List Section */}
                    <div>
                      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6'>
                        <h2 className='text-2xl font-bold text-foreground'>
                          Markets
                        </h2>
                        <div className='relative w-full lg:w-80'>
                          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
                          <Input
                            placeholder='Search assets...'
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className='pl-9 bg-card/50 border-border/50'
                          />
                        </div>
                      </div>

                      {/* Market Sub-tabs */}
                      <div className='mb-4'>
                        <Tabs
                          value={activeMarketTab}
                          onValueChange={setActiveMarketTab}
                        >
                          <div className='flex flex-wrap gap-2 mb-4'>
                            <TabsList className='bg-card/50 border border-border/50'>
                              <TabsTrigger
                                value='favorites'
                                className='text-sm'
                              >
                                <Star className='w-3 h-3 mr-1' />
                                Favorites
                              </TabsTrigger>
                              <TabsTrigger
                                value='crypto-spot'
                                className='text-sm'
                              >
                                Crypto (Spot)
                              </TabsTrigger>
                              <TabsTrigger
                                value='commodities'
                                className='text-sm'
                              >
                                Commodities
                              </TabsTrigger>
                              <TabsTrigger
                                value='synthetics'
                                className='text-sm'
                              >
                                Synthetics
                              </TabsTrigger>
                              <TabsTrigger
                                value='newly-listed'
                                className='text-sm'
                              >
                                Newly Listed
                              </TabsTrigger>
                            </TabsList>
                          </div>

                          {/* Filter Chips */}
                          <div className='flex flex-wrap gap-2 mb-6'>
                            {getFilterChips().map(chip => (
                              <Button
                                key={chip}
                                variant={
                                  filterBy === chip.toLowerCase()
                                    ? 'default'
                                    : 'outline'
                                }
                                size='sm'
                                onClick={() => setFilterBy(chip.toLowerCase())}
                                className='text-xs h-7'
                              >
                                {chip}
                              </Button>
                            ))}
                          </div>

                          {/* Synthetics Disclaimer */}
                          {activeMarketTab === 'synthetics' && (
                            <div className='mb-4 p-3 bg-card/30 border border-border/50 rounded-lg'>
                              <p className='text-sm text-muted-foreground'>
                                Synthetics are cash-settled and not physically
                                redeemable.{' '}
                                <a
                                  href='/legal/disclosures#synthetics'
                                  className='text-gold hover:text-gold/80 underline inline-flex items-center gap-1'
                                >
                                  Learn more
                                  <ExternalLink className='w-3 h-3' />
                                </a>
                              </p>
                            </div>
                          )}

                          {/* Markets Table */}
                          <TabsContent value={activeMarketTab} className='mt-0'>
                            <Card className='bg-card/50 border-border/50 overflow-hidden'>
                              <div className='overflow-x-auto'>
                                <table className='w-full'>
                                  <thead>
                                    <tr className='border-b border-border/50'>
                                      <th className='text-left p-4 text-muted-foreground font-medium'>
                                        Pair
                                      </th>
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
                                      <th className='text-right p-4 text-muted-foreground font-medium'>
                                        24h High
                                      </th>
                                      <th className='text-right p-4 text-muted-foreground font-medium'>
                                        24h Low
                                      </th>
                                      <th className='text-right p-4 text-muted-foreground font-medium'>
                                        24h Volume
                                      </th>
                                      <th className='text-center p-4 text-muted-foreground font-medium'>
                                        Chart
                                      </th>
                                      <th className='text-center p-4 text-muted-foreground font-medium'>
                                        Action
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {filteredAndSortedData.map(asset => (
                                      <tr
                                        key={asset.pair}
                                        className='border-b border-border/30 hover:bg-card/30 transition-colors'
                                      >
                                        <td className='p-4'>
                                          <div className='flex items-center gap-3'>
                                            <div>
                                              <div className='flex items-center gap-2'>
                                                <span className='font-medium text-foreground'>
                                                  {asset.pair}
                                                </span>
                                                {asset.type === 'synthetic' && (
                                                  <div className='flex items-center gap-1'>
                                                    <Badge
                                                      variant='outline'
                                                      className='text-xs'
                                                    >
                                                      Synthetic
                                                    </Badge>
                                                    <TooltipProvider>
                                                      <Tooltip>
                                                        <TooltipTrigger asChild>
                                                          <Info className='w-3 h-3 text-muted-foreground cursor-help' />
                                                        </TooltipTrigger>
                                                        <TooltipContent className='max-w-sm p-3'>
                                                          <p className='text-sm'>
                                                            Cash-settled
                                                            synthetic exposure.
                                                            Lower trading fees;
                                                            positions can be
                                                            held and used at
                                                            checkout. Not
                                                            redeemable for
                                                            physical delivery.
                                                            Settlement pays the
                                                            value of your
                                                            position
                                                            (contract-for-difference–style),
                                                            subject to regional
                                                            availability. This
                                                            is informational,
                                                            not financial
                                                            advice.{' '}
                                                            <a
                                                              href='/legal/disclosures#synthetics'
                                                              className='text-gold hover:text-gold/80 underline inline-flex items-center gap-1'
                                                            >
                                                              Learn more
                                                              <ExternalLink className='w-3 h-3' />
                                                            </a>
                                                          </p>
                                                        </TooltipContent>
                                                      </Tooltip>
                                                    </TooltipProvider>
                                                  </div>
                                                )}
                                              </div>
                                              <div className='text-sm text-muted-foreground'>
                                                {asset.name}
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className='p-4 text-right'>
                                          <span className='font-medium text-foreground'>
                                            ${asset.price}
                                          </span>
                                        </td>
                                        <td className='p-4 text-right'>
                                          <span
                                            className={`flex items-center justify-end gap-1 ${
                                              asset.changePercent >= 0
                                                ? 'text-primary'
                                                : 'text-destructive'
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
                                          <span className='text-muted-foreground'>
                                            ${asset.high24h}
                                          </span>
                                        </td>
                                        <td className='p-4 text-right'>
                                          <span className='text-muted-foreground'>
                                            ${asset.low24h}
                                          </span>
                                        </td>
                                        <td className='p-4 text-right'>
                                          <span className='text-muted-foreground'>
                                            ${asset.volume}
                                          </span>
                                        </td>
                                        <td className='p-4 text-center'>
                                          <div className='flex justify-center'>
                                            <MiniSparkline
                                              data={asset.sparklineData}
                                              isPositive={
                                                asset.changePercent >= 0
                                              }
                                            />
                                          </div>
                                        </td>
                                        <td className='p-4 text-center'>
                                          <Button
                                            size='sm'
                                            variant='gold'
                                            onClick={() =>
                                              handleTrade(asset.pair)
                                            }
                                            className='text-xs'
                                          >
                                            Trade
                                          </Button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </Card>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value='key-metrics' className='space-y-8'>
                {/* Replicate KPI tiles */}
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
                  {/* Market Sentiment */}
                  <Card className='bg-card/50 border-border/50'>
                    <CardContent className='p-6'>
                      <div className='flex items-center justify-between mb-4'>
                        <h3 className='text-lg font-semibold text-foreground'>
                          Market Sentiment
                        </h3>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-gold hover:text-gold/80 h-auto p-0'
                        >
                          View More
                          <ExternalLink className='w-3 h-3 ml-1' />
                        </Button>
                      </div>
                      <FearGreedGauge
                        score={kpis?.fearGreedIndex || 53}
                        label={kpis?.fearGreedLabel || 'Neutral'}
                      />
                    </CardContent>
                  </Card>

                  {/* Market Data */}
                  <Card className='bg-card/50 border-border/50'>
                    <CardContent className='p-6'>
                      <div className='flex items-center justify-between mb-4'>
                        <h3 className='text-lg font-semibold text-foreground'>
                          Market Data
                        </h3>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-gold hover:text-gold/80 h-auto p-0'
                        >
                          View More
                          <ExternalLink className='w-3 h-3 ml-1' />
                        </Button>
                      </div>
                      <div className='space-y-4'>
                        <div>
                          <div className='text-sm text-muted-foreground mb-1'>
                            Current ETH Gas Price
                          </div>
                          <div className='text-lg font-bold text-foreground'>
                            0.127955129{' '}
                            <span className='text-sm font-normal text-muted-foreground'>
                              Gwei
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className='text-sm text-muted-foreground mb-1'>
                            Trading Vol.
                          </div>
                          <div className='text-lg font-bold text-foreground'>
                            1525.04 B USD
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trending Sectors */}
                  <Card className='bg-card/50 border-border/50'>
                    <CardContent className='p-6'>
                      <h3 className='text-lg font-semibold text-foreground mb-4'>
                        Trending Sectors
                      </h3>
                      <div className='space-y-2'>
                        {cryptoSectors.slice(0, 3).map(sector => (
                          <div
                            key={sector.name}
                            className='flex items-center justify-between text-sm'
                          >
                            <span className='text-muted-foreground'>
                              {sector.name}
                            </span>
                            <span
                              className={
                                sector.isPositive
                                  ? 'text-primary'
                                  : 'text-destructive'
                              }
                            >
                              {sector.change}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Key Metrics Panels */}
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                  {[
                    { title: 'Most Traded', data: marketData.slice(0, 5) },
                    { title: 'Trending', data: marketData.slice(2, 7) },
                    {
                      title: 'Newly Listed',
                      data: marketData.filter(item => item.isNewlyListed),
                    },
                  ].map(({ title, data }) => (
                    <Card key={title} className='bg-card/50 border-border/50'>
                      <CardContent className='p-6'>
                        <h3 className='text-lg font-semibold text-foreground mb-4'>
                          {title}
                        </h3>
                        <div className='space-y-3'>
                          {data.map((item, index) => (
                            <div
                              key={item.pair}
                              className='flex items-center justify-between py-2 border-b border-border/30 last:border-b-0'
                            >
                              <div className='flex items-center gap-3'>
                                <span className='text-muted-foreground text-sm w-4'>
                                  {index + 1}
                                </span>
                                <div>
                                  <div className='text-foreground font-medium text-sm'>
                                    {item.symbol}
                                  </div>
                                  <div className='text-muted-foreground text-xs'>
                                    {item.name}
                                  </div>
                                </div>
                              </div>
                              <div className='flex items-center gap-2'>
                                <div className='text-right'>
                                  <div className='text-foreground text-sm'>
                                    ${item.price}
                                  </div>
                                  <div
                                    className={`text-xs ${item.changePercent >= 0 ? 'text-primary' : 'text-destructive'}`}
                                  >
                                    {item.change}
                                  </div>
                                </div>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  onClick={() => handleTrade(item.pair)}
                                  className='text-xs h-6 px-2'
                                >
                                  Trade
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Markets;
