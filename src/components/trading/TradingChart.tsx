import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  subscribePrices,
  pairToBaseSymbol,
  type PriceTick,
} from '@/lib/pricesSSE';

interface TradingChartProps {
  pair: string;
}

const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];

const TradingChart = ({ pair }: TradingChartProps) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [chartType, setChartType] = useState('line');
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [series, setSeries] = useState<Array<{ t: number; p: number }>>([]);
  const unsubRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    // subscribe to SSE for base symbol
    const base = pairToBaseSymbol(pair);
    if (unsubRef.current) unsubRef.current();
    unsubRef.current = subscribePrices(
      [base],
      (tick: PriceTick) => {
        if (typeof tick.usd === 'number') {
          setLastPrice(tick.usd);
          setSeries(prev => {
            const next = [...prev, { t: tick.ts, p: tick.usd! }];
            // keep ≤300 points
            return next.length > 300 ? next.slice(next.length - 300) : next;
          });
        }
      },
      { maxPerSecond: 2 }
    );

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [pair]);

  const pathD = useMemo(() => {
    if (series.length < 2) return '';
    const width = 1000; // virtual width
    const height = 300; // virtual height
    const times = series.map(d => d.t);
    const prices = series.map(d => d.p);
    const tMin = Math.min(...times);
    const tMax = Math.max(...times);
    const pMin = Math.min(...prices);
    const pMax = Math.max(...prices);
    const nx = (t: number) => (t - tMin) / Math.max(1, tMax - tMin);
    const ny = (p: number) => 1 - (p - pMin) / Math.max(1e-9, pMax - pMin);
    const pts = series.map(d => `${nx(d.t) * width},${ny(d.p) * height}`);
    return `M ${pts[0]} L ${pts.slice(1).join(' ')}`;
  }, [series]);

  return (
    <div className='h-full flex flex-col bg-black'>
      {/* Header */}
      <div className='flex items-center justify-between p-3 border-b border-slate-800'>
        <div className='flex items-center space-x-6'>
          <div className='flex items-center space-x-3'>
            <h3 className='text-xl font-bold text-gold'>{pair}</h3>
            <div className='flex items-center space-x-1'>
              <span className='text-2xl font-bold text-white'>$2,380.50</span>
              <span className='text-green-400 text-sm font-medium'>+1.25%</span>
              <span className='text-green-400 text-sm'>+$29.42</span>
            </div>
          </div>

          <div className='flex items-center space-x-4 text-xs text-slate-400'>
            <div>
              Last:{' '}
              <span className='text-white'>
                {lastPrice ? `$${lastPrice.toFixed(2)}` : '—'}
              </span>
            </div>
            <div>
              Points: <span className='text-white'>{series.length}</span>
            </div>
            <div>
              TF: <span className='text-white'>{selectedTimeframe}</span>
            </div>
          </div>
        </div>

        {/* Chart Controls */}
        <div className='flex items-center space-x-3'>
          {/* Chart Type Toggle */}
          <div className='flex bg-gray-900 rounded-md p-1'>
            <Button
              size='sm'
              variant={chartType === 'candles' ? 'default' : 'ghost'}
              onClick={() => setChartType('candles')}
              className='text-xs px-3 py-1 h-7'
            >
              Candles
            </Button>
            <Button
              size='sm'
              variant={chartType === 'line' ? 'default' : 'ghost'}
              onClick={() => setChartType('line')}
              className='text-xs px-3 py-1 h-7'
            >
              Line
            </Button>
          </div>

          {/* Indicators Toggle */}
          <div className='flex bg-gray-900 rounded-md p-1'>
            <Button
              size='sm'
              variant='ghost'
              className='text-xs px-2 py-1 h-7 text-gray-400 hover:text-white'
            >
              MA
            </Button>
            <Button
              size='sm'
              variant='ghost'
              className='text-xs px-2 py-1 h-7 text-gray-400 hover:text-white'
            >
              RSI
            </Button>
          </div>

          {/* Timeframe buttons */}
          <div className='flex bg-gray-900 rounded-md p-1'>
            {timeframes.map(tf => (
              <Button
                key={tf}
                variant={selectedTimeframe === tf ? 'gold' : 'ghost'}
                size='sm'
                onClick={() => setSelectedTimeframe(tf)}
                className='text-xs px-2 py-1 h-7'
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Lightweight live line chart (SVG) */}
      <div className='flex-1 bg-black relative'>
        <svg
          viewBox='0 0 1000 300'
          preserveAspectRatio='none'
          className='w-full h-full'
        >
          <defs>
            <linearGradient id='goldLine' x1='0' x2='0' y1='0' y2='1'>
              <stop offset='0%' stopColor='#f5c542' />
              <stop offset='100%' stopColor='#b8860b' />
            </linearGradient>
          </defs>
          <rect x='0' y='0' width='1000' height='300' fill='transparent' />
          {pathD && (
            <path
              d={pathD}
              fill='none'
              stroke='url(#goldLine)'
              strokeWidth='2'
            />
          )}
        </svg>
        <div className='absolute top-4 right-4 bg-black/80 text-white text-xs px-3 py-2 rounded border border-gray-600 backdrop-blur-sm'>
          Live prices via SSE — {lastPrice ? 'updating' : 'waiting...'}
        </div>
      </div>
    </div>
  );
};

export default TradingChart;
