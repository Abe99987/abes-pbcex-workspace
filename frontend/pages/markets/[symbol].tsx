import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import {
  AdvancedChart,
  SymbolOverview,
  MiniChart,
} from '@/components/tradingview';
import {
  getSymbolDisplayName,
  isValidSymbol,
  SYMBOLS,
} from '@/src/utils/tradingview';
import {
  ArrowLeft,
  TrendingUp,
  BarChart3,
  Activity,
  ExternalLink,
  Star,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

export default function SymbolDetail() {
  const router = useRouter();
  const { symbol } = router.query;
  const { user, isLoading: authLoading } = useAuth();

  const symbolStr = Array.isArray(symbol) ? symbol[0] : symbol;
  const isValid = symbolStr ? isValidSymbol(symbolStr) : false;

  if (authLoading) {
    return (
      <div className='min-h-screen bg-slate-50'>
        <Navigation />
        <div className='flex items-center justify-center h-96'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500'></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='min-h-screen bg-slate-50'>
        <Navigation />
        <div className='flex items-center justify-center h-96'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-gray-800 mb-4'>
              Please log in to view symbol details
            </h1>
          </div>
        </div>
      </div>
    );
  }

  if (!symbolStr || !isValid) {
    return (
      <div className='min-h-screen bg-slate-50'>
        <Navigation />
        <div className='flex items-center justify-center h-96'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-gray-800 mb-4'>
              Invalid Symbol
            </h1>
            <p className='text-gray-600 mb-6'>
              The symbol "{symbolStr}" is not recognized or supported.
            </p>
            <Link
              href='/markets'
              className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Markets
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayName = getSymbolDisplayName(symbolStr);

  // Get related symbols for the sidebar
  const getRelatedSymbols = (currentSymbol: string) => {
    // Find the category of the current symbol
    for (const [category, symbols] of Object.entries(SYMBOLS)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (Object.values(symbols).includes(currentSymbol as any)) {
        return Object.values(symbols)
          .filter(s => s !== currentSymbol)
          .slice(0, 4);
      }
    }
    return [];
  };

  const relatedSymbols = getRelatedSymbols(symbolStr);

  return (
    <div className='min-h-screen bg-slate-50'>
      <Navigation />

      {/* Page Header */}
      <div className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <Link
                href='/markets'
                className='flex items-center text-gray-500 hover:text-gray-700 transition-colors'
              >
                <ArrowLeft className='h-5 w-5 mr-1' />
                Markets
              </Link>
              <div className='text-gray-300'>/</div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  {displayName}
                </h1>
                <p className='text-gray-600 mt-1 font-mono'>{symbolStr}</p>
              </div>
            </div>
            <div className='flex items-center space-x-3'>
              <button className='flex items-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors'>
                <Star className='h-4 w-4' />
                <span>Watch</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className='flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors'
              >
                <RefreshCw className='h-4 w-4' />
                <span>Refresh</span>
              </button>
              <a
                href={`https://www.tradingview.com/chart/?symbol=${symbolStr}`}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              >
                <ExternalLink className='h-4 w-4' />
                <span>View on TradingView</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='grid grid-cols-1 xl:grid-cols-4 gap-8'>
          {/* Main Chart - Takes 3/4 of the width */}
          <div className='xl:col-span-3 space-y-6'>
            {/* Symbol Overview */}
            <section>
              <div className='flex items-center space-x-2 mb-4'>
                <Activity className='h-6 w-6 text-blue-600' />
                <h2 className='text-2xl font-bold text-gray-900'>Overview</h2>
              </div>
              <div className='bg-white rounded-lg shadow-sm border p-6'>
                <SymbolOverview
                  symbols={[[symbolStr, `${displayName}|1D`]]}
                  height={350}
                  showVolume={true}
                  showMA={false}
                  valuesTracking='1'
                  changeMode='price-and-percent'
                />
              </div>
            </section>

            {/* Advanced Chart */}
            <section>
              <div className='flex items-center space-x-2 mb-4'>
                <BarChart3 className='h-6 w-6 text-green-600' />
                <h2 className='text-2xl font-bold text-gray-900'>
                  Advanced Chart
                </h2>
              </div>
              <div className='bg-white rounded-lg shadow-sm border p-6'>
                <AdvancedChart
                  symbol={symbolStr}
                  height={600}
                  interval='D'
                  allowSymbolChange={true}
                  studies={['Volume@tv-basicstudies']}
                />
              </div>
            </section>
          </div>

          {/* Sidebar - Takes 1/4 of the width */}
          <div className='xl:col-span-1 space-y-6'>
            {/* Quick Stats */}
            <section>
              <div className='bg-white rounded-lg shadow-sm border p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Quick Stats
                </h3>
                <div className='space-y-3'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>Symbol</span>
                    <span className='text-sm font-mono font-medium'>
                      {symbolStr}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-gray-600'>Name</span>
                    <span className='text-sm font-medium'>{displayName}</span>
                  </div>
                  <div className='border-t pt-3'>
                    <div className='text-xs text-gray-500'>
                      Live data provided by TradingView
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Related Symbols */}
            {relatedSymbols.length > 0 && (
              <section>
                <div className='bg-white rounded-lg shadow-sm border p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    Related Symbols
                  </h3>
                  <div className='space-y-3'>
                    {relatedSymbols.map(relatedSymbol => (
                      <Link
                        key={relatedSymbol}
                        href={`/markets/${relatedSymbol}`}
                        className='block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
                      >
                        <div className='flex justify-between items-center'>
                          <span className='text-sm font-medium text-gray-900'>
                            {getSymbolDisplayName(relatedSymbol)}
                          </span>
                          <span className='text-xs text-gray-500 font-mono'>
                            {relatedSymbol}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Mini Charts for Related */}
            {relatedSymbols.length > 0 && (
              <section>
                <div className='bg-white rounded-lg shadow-sm border p-6'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    Mini Charts
                  </h3>
                  <div className='space-y-4'>
                    {relatedSymbols.slice(0, 2).map(relatedSymbol => (
                      <div
                        key={relatedSymbol}
                        className='border rounded-lg p-3'
                      >
                        <div className='text-sm font-medium text-gray-900 mb-2'>
                          {getSymbolDisplayName(relatedSymbol)}
                        </div>
                        <MiniChart
                          symbol={relatedSymbol}
                          width='100%'
                          height={150}
                          dateRange='1M'
                          hideSymbolLogo={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Actions */}
            <section>
              <div className='bg-white rounded-lg shadow-sm border p-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Actions
                </h3>
                <div className='space-y-2'>
                  <button className='w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
                    Add to Portfolio
                  </button>
                  <button className='w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'>
                    Set Alert
                  </button>
                  <button className='w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors'>
                    Share Chart
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
