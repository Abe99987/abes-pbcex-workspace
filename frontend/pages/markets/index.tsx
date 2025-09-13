import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  MarketOverview,
  EconomicCalendar,
  SymbolOverview,
  Screener,
  StockHeatmap,
} from '@/components/tradingview';
import {
  MARKETS_OVERVIEW_SYMBOLS,
  getSymbolDisplayName,
} from '@/src/utils/tradingview';
import {
  TrendingUp,
  Calendar,
  Search,
  Grid3X3,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

export default function Markets() {
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
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
              Please log in to view market data
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
              <h1 className='text-3xl font-bold text-gray-900'>Markets</h1>
              <p className='text-gray-600 mt-1'>
                Real-time market data, charts, and analysis
              </p>
            </div>
            <div className='flex items-center space-x-3'>
              <button
                onClick={() => window.location.reload()}
                className='flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors'
              >
                <RefreshCw className='h-4 w-4' />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8'>
        {/* Market Overview Section */}
        <section>
          <div className='flex items-center space-x-2 mb-4'>
            <TrendingUp className='h-6 w-6 text-blue-600' />
            <h2 className='text-2xl font-bold text-gray-900'>
              Market Overview
            </h2>
          </div>
          <div className='bg-white rounded-lg shadow-sm border p-6'>
            <MarketOverview dateRange='12M' showChart={true} height={400} />
          </div>
        </section>

        {/* Featured Symbols Grid */}
        <section>
          <div className='flex items-center space-x-2 mb-4'>
            <BarChart3 className='h-6 w-6 text-green-600' />
            <h2 className='text-2xl font-bold text-gray-900'>Key Markets</h2>
          </div>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {MARKETS_OVERVIEW_SYMBOLS.slice(0, 6).map((symbol, index) => (
              <div
                key={symbol}
                className='bg-white rounded-lg shadow-sm border p-4'
              >
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    {getSymbolDisplayName(symbol)}
                  </h3>
                  <span className='text-sm text-gray-500 font-mono'>
                    {symbol}
                  </span>
                </div>
                <SymbolOverview
                  symbols={[[symbol, `${getSymbolDisplayName(symbol)}|1D`]]}
                  height={300}
                  showVolume={true}
                  valuesTracking='1'
                  changeMode='price-and-percent'
                />
              </div>
            ))}
          </div>
        </section>

        {/* Two-column layout for Calendar and Screener */}
        <div className='grid grid-cols-1 xl:grid-cols-2 gap-8'>
          {/* Economic Calendar */}
          <section>
            <div className='flex items-center space-x-2 mb-4'>
              <Calendar className='h-6 w-6 text-purple-600' />
              <h2 className='text-2xl font-bold text-gray-900'>
                Economic Calendar
              </h2>
            </div>
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <EconomicCalendar
                height={500}
                importanceFilter='-1,0,1'
                countryFilter='us,eu,jp,gb,ch,au,ca'
              />
            </div>
          </section>

          {/* Market Screener */}
          <section>
            <div className='flex items-center space-x-2 mb-4'>
              <Search className='h-6 w-6 text-orange-600' />
              <h2 className='text-2xl font-bold text-gray-900'>
                Market Screener
              </h2>
            </div>
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <Screener
                height={500}
                market='forex'
                defaultColumn='overview'
                defaultScreen='general'
                showToolbar={true}
              />
            </div>
          </section>
        </div>

        {/* Market Heatmap */}
        <section>
          <div className='flex items-center space-x-2 mb-4'>
            <Grid3X3 className='h-6 w-6 text-red-600' />
            <h2 className='text-2xl font-bold text-gray-900'>Market Heatmap</h2>
          </div>
          <div className='bg-white rounded-lg shadow-sm border p-6'>
            <StockHeatmap
              height={500}
              dataSource='SPX500'
              grouping='sector'
              blockSize='market_cap_basic'
              blockColor='change'
              isZoomEnabled={true}
              hasSymbolTooltip={true}
            />
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <div className='bg-white rounded-lg shadow-sm border p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Quick Access
            </h2>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              {MARKETS_OVERVIEW_SYMBOLS.map(symbol => (
                <a
                  key={symbol}
                  href={`/markets/${symbol}`}
                  className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
                >
                  <span className='text-sm font-medium text-gray-900'>
                    {getSymbolDisplayName(symbol)}
                  </span>
                  <span className='text-xs text-gray-500 font-mono'>
                    {symbol}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
