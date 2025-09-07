import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  Target,
  Zap,
  Award,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  LineChart,
  Search,
} from 'lucide-react';
import { MiniChart, Screener, AdvancedChart } from '@/components/tradingview';
import {
  MY_ASSETS_SYMBOLS,
  getSymbolDisplayName,
} from '@/src/utils/tradingview';

interface PnLData {
  totalPnL: number;
  winRate: number;
  profitFactor: number;
  bestDay: {
    date: string;
    pnl: number;
  };
  worstDay: {
    date: string;
    pnl: number;
  };
  averageWin: number;
  averageLoss: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  dailyPnL: Array<{
    date: string;
    pnl: number;
    cumulativePnL: number;
    trades: number;
  }>;
}

interface CalendarDay {
  date: string;
  pnl: number;
  trades: number;
  isToday: boolean;
  isCurrentMonth: boolean;
}

type TimeRange = 'DAY' | 'MONTH' | 'YEAR';

// Mock PnL data
const generateMockPnLData = (): PnLData => {
  const dailyPnL = [];
  let cumulativePnL = 0;

  // Generate 90 days of mock data
  for (let i = 89; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Random PnL between -500 and 800 with some bias towards positive
    const pnl = (Math.random() - 0.3) * 800;
    cumulativePnL += pnl;

    dailyPnL.push({
      date: date.toISOString().split('T')[0],
      pnl: Math.round(pnl * 100) / 100,
      cumulativePnL: Math.round(cumulativePnL * 100) / 100,
      trades: Math.floor(Math.random() * 10) + 1,
    });
  }

  const positiveDay = dailyPnL.filter(d => d.pnl > 0);
  const negativeDay = dailyPnL.filter(d => d.pnl < 0);

  const totalTrades = dailyPnL.reduce((sum, d) => sum + d.trades, 0);
  const totalPnL = cumulativePnL;
  const winningTrades = positiveDay.length;
  const losingTrades = negativeDay.length;
  const winRate = (winningTrades / (winningTrades + losingTrades)) * 100;

  const averageWin =
    positiveDay.length > 0
      ? positiveDay.reduce((sum, d) => sum + d.pnl, 0) / positiveDay.length
      : 0;
  const averageLoss =
    negativeDay.length > 0
      ? Math.abs(
          negativeDay.reduce((sum, d) => sum + d.pnl, 0) / negativeDay.length
        )
      : 0;

  const profitFactor = averageLoss > 0 ? averageWin / averageLoss : 0;

  const bestDay =
    dailyPnL.length > 0
      ? dailyPnL.reduce((best, current) =>
          current.pnl > best.pnl ? current : best
        )
      : { date: '', pnl: 0, cumulativePnL: 0, trades: 0 };

  const worstDay =
    dailyPnL.length > 0
      ? dailyPnL.reduce((worst, current) =>
          current.pnl < worst.pnl ? current : worst
        )
      : { date: '', pnl: 0, cumulativePnL: 0, trades: 0 };

  return {
    totalPnL,
    winRate,
    profitFactor,
    bestDay: {
      date: bestDay.date || '',
      pnl: bestDay.pnl,
    },
    worstDay: {
      date: worstDay.date || '',
      pnl: worstDay.pnl,
    },
    averageWin,
    averageLoss,
    totalTrades,
    winningTrades,
    losingTrades,
    dailyPnL: dailyPnL.filter(
      (
        day
      ): day is {
        date: string;
        pnl: number;
        cumulativePnL: number;
        trades: number;
      } => day.date != null
    ),
  };
};

export default function PnL() {
  const { user, isLoading: authLoading } = useAuth();
  const [pnlData, setPnlData] = useState<PnLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('MONTH');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!user) return;

    // Simulate API call - replace with actual API call
    const fetchPnLData = async () => {
      try {
        // For now, use mock data. Replace with actual API call:
        // const response = await api.trade.getPnLAnalytics();
        setPnlData(generateMockPnLData());
      } catch (error) {
        console.error('Failed to fetch PnL data:', error);
        toast.error('Failed to load PnL analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchPnLData();
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-600';
    if (pnl < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPnLBgColor = (pnl: number) => {
    if (pnl > 0) return 'bg-green-50 border-green-200';
    if (pnl < 0) return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200';
  };

  const generateCalendarDays = (date: Date): CalendarDay[] => {
    if (!pnlData) return [];

    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

    const days: CalendarDay[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 42; i++) {
      // 6 weeks × 7 days
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = pnlData.dailyPnL.find(d => d.date === dateStr);

      if (dateStr) {
        days.push({
          date: dateStr,
          pnl: dayData?.pnl || 0,
          trades: dayData?.trades || 0,
          isToday: dateStr === today,
          isCurrentMonth: currentDate.getMonth() === month,
        });
      }
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const calendarDays = generateCalendarDays(currentDate);

  if (authLoading || loading) {
    return (
      <div className='min-h-screen bg-slate-50'>
        <Navigation />
        <div className='flex items-center justify-center h-96'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500'></div>
        </div>
      </div>
    );
  }

  if (!user || !pnlData) {
    return (
      <div className='min-h-screen bg-slate-50'>
        <Navigation />
        <div className='flex items-center justify-center h-96'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-gray-800 mb-4'>
              Please log in to view your PnL analytics
            </h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <Navigation />

      {/* Page Header */}
      <div className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex justify-between items-center'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Profit & Loss Analytics
              </h1>
              <p className='text-gray-600 mt-1'>
                Comprehensive analysis of your trading performance
              </p>
            </div>
            <div className='flex items-center space-x-3'>
              {/* Time Range Selector */}
              <div className='flex bg-gray-100 rounded-lg p-1'>
                {(['DAY', 'MONTH', 'YEAR'] as TimeRange[]).map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      timeRange === range
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <button
                onClick={() => window.location.reload()}
                className='flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200'
              >
                <RefreshCw className='h-4 w-4' />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => toast.success('PnL report exported')}
                className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
              >
                <Download className='h-4 w-4' />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Summary Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {/* Total PnL */}
          <div className='bg-white rounded-lg shadow-sm border p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='text-sm font-medium text-gray-500'>
                  Total P&L
                </div>
                <div
                  className={`text-2xl font-bold ${getPnLColor(pnlData.totalPnL)}`}
                >
                  {formatCurrency(pnlData.totalPnL)}
                </div>
              </div>
              <div
                className={`p-3 rounded-full ${pnlData.totalPnL >= 0 ? 'bg-green-100' : 'bg-red-100'}`}
              >
                {pnlData.totalPnL >= 0 ? (
                  <TrendingUp className='h-6 w-6 text-green-600' />
                ) : (
                  <TrendingDown className='h-6 w-6 text-red-600' />
                )}
              </div>
            </div>
          </div>

          {/* Win Rate */}
          <div className='bg-white rounded-lg shadow-sm border p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='text-sm font-medium text-gray-500'>
                  Win Rate
                </div>
                <div className='text-2xl font-bold text-gray-900'>
                  {formatPercentage(pnlData.winRate)}
                </div>
                <div className='text-xs text-gray-500'>
                  {pnlData.winningTrades}W / {pnlData.losingTrades}L
                </div>
              </div>
              <div className='p-3 rounded-full bg-blue-100'>
                <Target className='h-6 w-6 text-blue-600' />
              </div>
            </div>
          </div>

          {/* Profit Factor */}
          <div className='bg-white rounded-lg shadow-sm border p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='text-sm font-medium text-gray-500'>
                  Profit Factor
                </div>
                <div className='text-2xl font-bold text-gray-900'>
                  {pnlData.profitFactor.toFixed(2)}
                </div>
                <div className='text-xs text-gray-500'>Avg Win / Avg Loss</div>
              </div>
              <div className='p-3 rounded-full bg-purple-100'>
                <Zap className='h-6 w-6 text-purple-600' />
              </div>
            </div>
          </div>

          {/* Best Day */}
          <div className='bg-white rounded-lg shadow-sm border p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='text-sm font-medium text-gray-500'>
                  Best Day
                </div>
                <div className='text-2xl font-bold text-green-600'>
                  {formatCurrency(pnlData.bestDay.pnl)}
                </div>
                <div className='text-xs text-gray-500'>
                  {new Date(pnlData.bestDay.date).toLocaleDateString()}
                </div>
              </div>
              <div className='p-3 rounded-full bg-yellow-100'>
                <Award className='h-6 w-6 text-yellow-600' />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          <div className='bg-white rounded-lg shadow-sm border p-6'>
            <div className='text-sm font-medium text-gray-500 mb-2'>
              Average Win
            </div>
            <div className='text-xl font-bold text-green-600'>
              {formatCurrency(pnlData.averageWin)}
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-sm border p-6'>
            <div className='text-sm font-medium text-gray-500 mb-2'>
              Average Loss
            </div>
            <div className='text-xl font-bold text-red-600'>
              -{formatCurrency(pnlData.averageLoss)}
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-sm border p-6'>
            <div className='text-sm font-medium text-gray-500 mb-2'>
              Total Trades
            </div>
            <div className='text-xl font-bold text-gray-900'>
              {pnlData.totalTrades.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Balance Chart */}
        <div className='bg-white rounded-lg shadow-sm border p-6 mb-8'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Daily Balance Chart
            </h3>
            <div className='flex items-center space-x-2'>
              <BarChart3 className='h-5 w-5 text-gray-500' />
              <span className='text-sm text-gray-500'>Last 90 Days</span>
            </div>
          </div>

          {/* Simple chart placeholder */}
          <div className='h-64 bg-gray-50 rounded-lg flex items-center justify-center'>
            <div className='text-center'>
              <BarChart3 className='h-12 w-12 text-gray-300 mx-auto mb-4' />
              <p className='text-gray-500'>Cumulative P&L Chart</p>
              <p className='text-sm text-gray-400 mt-2'>
                Final Balance: {formatCurrency(pnlData.totalPnL)}
              </p>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div className='bg-white rounded-lg shadow-sm border p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Daily P&L Calendar
            </h3>
            <div className='flex items-center space-x-4'>
              <button
                onClick={() => navigateMonth('prev')}
                className='p-2 hover:bg-gray-100 rounded-lg'
              >
                <ChevronLeft className='h-5 w-5' />
              </button>
              <span className='text-lg font-medium text-gray-900'>
                {currentDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <button
                onClick={() => navigateMonth('next')}
                className='p-2 hover:bg-gray-100 rounded-lg'
              >
                <ChevronRight className='h-5 w-5' />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className='grid grid-cols-7 gap-1'>
            {/* Week Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div
                key={day}
                className='p-2 text-center text-sm font-medium text-gray-500'
              >
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day, index) => (
              <div
                key={index}
                onClick={() => setSelectedCalendarDate(day.date)}
                className={`p-2 text-center cursor-pointer rounded-lg border transition-colors ${
                  !day.isCurrentMonth
                    ? 'text-gray-300 bg-gray-50'
                    : day.isToday
                      ? 'bg-blue-100 border-blue-300 text-blue-900'
                      : selectedCalendarDate === day.date
                        ? 'bg-blue-50 border-blue-200'
                        : getPnLBgColor(day.pnl)
                } hover:bg-gray-100`}
              >
                <div className='text-sm font-medium'>
                  {new Date(day.date).getDate()}
                </div>
                {day.isCurrentMonth && day.trades > 0 && (
                  <div
                    className={`text-xs font-medium ${getPnLColor(day.pnl)}`}
                  >
                    {day.pnl > 0 ? '+' : ''}
                    {day.pnl.toFixed(0)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Calendar Legend */}
          <div className='flex items-center justify-center space-x-6 mt-6 text-sm text-gray-600'>
            <div className='flex items-center space-x-2'>
              <div className='w-4 h-4 bg-green-100 border border-green-200 rounded'></div>
              <span>Profitable Day</span>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-4 h-4 bg-red-100 border border-red-200 rounded'></div>
              <span>Loss Day</span>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-4 h-4 bg-blue-100 border border-blue-300 rounded'></div>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Market Analysis Tools */}
        <section className='mt-12'>
          <div className='flex items-center space-x-2 mb-6'>
            <LineChart className='h-6 w-6 text-purple-600' />
            <h2 className='text-2xl font-bold text-gray-900'>
              Market Analysis Tools
            </h2>
          </div>

          {/* Trading Tools Grid */}
          <div className='grid grid-cols-1 xl:grid-cols-2 gap-8'>
            {/* Advanced Chart for Main Instrument */}
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Advanced Chart
                </h3>
                <span className='text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded'>
                  Real-time
                </span>
              </div>
              <AdvancedChart
                symbol='XAUUSD'
                height={400}
                interval='1h'
                allowSymbolChange={true}
                studies={['Volume@tv-basicstudies', 'RSI@tv-basicstudies']}
              />
            </div>

            {/* Market Screener */}
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <div className='flex items-center space-x-2 mb-4'>
                <Search className='h-5 w-5 text-purple-600' />
                <h3 className='text-lg font-semibold text-gray-900'>
                  Market Screener
                </h3>
              </div>
              <Screener
                height={400}
                market='forex'
                defaultColumn='performance'
                defaultScreen='general'
                showToolbar={true}
              />
            </div>
          </div>

          {/* Performance Correlation Charts */}
          <div className='mt-8'>
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Performance Correlation - Key Assets
              </h3>
              <p className='text-sm text-gray-600 mb-6'>
                Monitor how your portfolio assets are performing relative to
                market movements
              </p>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {MY_ASSETS_SYMBOLS.slice(0, 6).map(symbol => (
                  <div key={symbol} className='border rounded-lg p-4'>
                    <div className='flex items-center justify-between mb-3'>
                      <div>
                        <div className='text-sm font-medium text-gray-900'>
                          {getSymbolDisplayName(symbol)}
                        </div>
                        <div className='text-xs text-gray-500 font-mono'>
                          {symbol}
                        </div>
                      </div>
                      <a
                        href={`/markets/${symbol}`}
                        className='text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 transition-colors'
                      >
                        Analyze
                      </a>
                    </div>
                    <MiniChart
                      symbol={symbol}
                      width='100%'
                      height={140}
                      dateRange='3M'
                      hideSymbolLogo={true}
                      isTransparent={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trading Insights */}
          <div className='mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              💡 Trading Insights
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm'>
              <div className='bg-white rounded-lg p-4'>
                <div className='font-medium text-purple-700 mb-2'>
                  Diversification Tip
                </div>
                <div className='text-gray-600'>
                  Consider spreading trades across different asset classes to
                  reduce correlation risk.
                </div>
              </div>
              <div className='bg-white rounded-lg p-4'>
                <div className='font-medium text-blue-700 mb-2'>
                  Risk Management
                </div>
                <div className='text-gray-600'>
                  Keep position sizes balanced and use stop-losses to protect
                  against large drawdowns.
                </div>
              </div>
              <div className='bg-white rounded-lg p-4'>
                <div className='font-medium text-green-700 mb-2'>
                  Performance Review
                </div>
                <div className='text-gray-600'>
                  Regularly analyze your win rate and profit factor to identify
                  improvement areas.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
