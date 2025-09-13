import React from 'react';
import Link from 'next/link';
// Navigation is rendered globally in _app
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, BarChart3, Activity, LineChart } from 'lucide-react';

export default function Analytics() {
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className='min-h-screen dark bg-slate-950'>
        <div className='flex items-center justify-center h-96'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-amber-500'></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='min-h-screen dark bg-slate-950'>
        <div className='flex items-center justify-center h-96'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-slate-50 mb-4'>
              Please log in to view Analytics
            </h1>
          </div>
        </div>
      </div>
    );
  }

  const tileClass = 'bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-1';
  const cardClass = 'bg-slate-900 border border-slate-800 rounded-xl p-4';
  const tableClass = 'w-full text-sm text-slate-200';

  const getHrefForPair = (pair: string): string => {
    const p = pair.toUpperCase();
    if (p.includes('XAU')) return '/markets/OANDA:XAUUSD';
    if (p.includes('XAG')) return '/markets/OANDA:XAGUSD';
    if (p.includes('XPT')) return '/markets/OANDA:XPTUSD';
    if (p.includes('HG1')) return '/markets/COMEX:HG1!';
    if (p.includes('ETH')) return '/markets/BINANCE:ETHUSDT';
    if (p.includes('BTC')) return '/markets/BINANCE:BTCUSDT';
    if (p.includes('SOL')) return '/markets/SOLUSD';
    if (p.includes('ADA')) return '/markets/ADAUSD';
    if (p.includes('PAXG')) return '/markets/OANDA:XAUUSD';
    return '/markets/OANDA:XAUUSD';
  };

  return (
    <div className='min-h-screen dark bg-slate-950'>
      <header className='border-b border-slate-800 bg-slate-950/50 backdrop-blur supports-[backdrop-filter]:bg-slate-950/50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-slate-50'>Analytics</h1>
              <p className='text-slate-400 mt-1'>Overview & key market metrics</p>
            </div>
            <div className='flex items-center gap-2'>
              <Link href='/markets' className='text-slate-300 hover:text-white text-sm'>Back to Markets</Link>
            </div>
          </div>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8'>
        {/* Top row tiles */}
        <section className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {/* Fear & Greed Index */}
          <div className={tileClass}>
            <div className='flex items-center justify-between'>
              <div className='text-slate-400 text-xs uppercase tracking-wide'>Fear & Greed</div>
              <Activity className='h-4 w-4 text-amber-400' />
            </div>
            <div className='relative mt-2 h-28 rounded-lg overflow-hidden border border-slate-800 bg-slate-950'>
              <img src='https://alternative.me/crypto/fear-and-greed-index.png' alt='Crypto Fear & Greed Index' className='w-full h-full object-contain' />
            </div>
            <div className='text-[10px] text-slate-500 mt-2'>Source: Alternative.me</div>
          </div>

          {/* Market Cap Δ (24h) */}
          <div className={tileClass}>
            <div className='flex items-center justify-between'>
              <div className='text-slate-400 text-xs uppercase tracking-wide'>Market Cap Δ (24h)</div>
              <BarChart3 className='h-4 w-4 text-emerald-400' />
            </div>
            <div className='mt-3 text-2xl font-semibold text-slate-50'>+2.3%</div>
            <div className='text-slate-500 text-xs'>vs. previous 24h</div>
          </div>

          {/* Trading Vol Δ (24h) */}
          <div className={tileClass}>
            <div className='flex items-center justify-between'>
              <div className='text-slate-400 text-xs uppercase tracking-wide'>Trading Vol Δ (24h)</div>
              <TrendingUp className='h-4 w-4 text-sky-400' />
            </div>
            <div className='mt-3 text-2xl font-semibold text-slate-50'>-1.1%</div>
            <div className='text-slate-500 text-xs'>vs. previous 24h</div>
          </div>

          {/* Gas Price */}
          <div className={tileClass}>
            <div className='flex items-center justify-between'>
              <div className='text-slate-400 text-xs uppercase tracking-wide'>Gas Price</div>
              <LineChart className='h-4 w-4 text-fuchsia-400' />
            </div>
            <div className='mt-3 text-2xl font-semibold text-slate-50'>26 gwei</div>
            <div className='text-slate-500 text-xs'>Ethereum mainnet (placeholder)</div>
          </div>
        </section>

        {/* Top Movers */}
        <section className={cardClass}>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold text-slate-50'>Top Movers</h2>
            <Link href='/markets' className='text-amber-400 hover:text-amber-300 text-sm'>View all</Link>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {[{t:'BTC',p:'+3.2%'},{t:'ETH',p:'-1.1%'},{t:'XAU',p:'+0.6%'}].map(({t,p}) => (
              <div key={t} className='border border-slate-800 rounded-lg p-3 flex items-center justify-between'>
                <div className='text-slate-200 font-medium'>{t}</div>
                <div className={`text-sm ${p.startsWith('-') ? 'text-red-400' : 'text-emerald-400'}`}>{p}</div>
                <Link href={`/markets/${t==='XAU'?'OANDA:XAUUSD':t==='ETH'?'BINANCE:ETHUSDT':'BINANCE:BTCUSDT'}`} className='ml-3 px-3 py-1.5 text-xs rounded bg-amber-500 text-slate-900 hover:bg-amber-400'>Trade</Link>
              </div>
            ))}
          </div>
        </section>

        {/* Compact tables */}
        <section className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {([
            { title: 'Most Traded', rows: ['BTC/USDT', 'ETH/USDT', 'XAU/USD'] },
            { title: 'Trending', rows: ['SOL/USDT', 'XAG/USD', 'ADA/USDT'] },
            { title: 'Newly Listed', rows: ['PAXG/USD', 'COMEX:HG1!', 'XPT/USD'] },
          ] as Array<{ title: string; rows: string[] }>).map(section => (
            <div key={section.title} className={cardClass}>
              <h3 className='text-base font-semibold text-slate-50 mb-3'>{section.title}</h3>
              <table className={tableClass}>
                <tbody>
                  {section.rows.map((pair) => (
                    <tr key={pair} className='border-t border-slate-800'>
                      <td className='py-2 text-slate-300'>{pair}</td>
                      <td className='py-2 text-slate-500'>—</td>
                      <td className='py-2 text-right'>
                        <Link href={getHrefForPair(pair)} className='px-3 py-1.5 text-xs rounded bg-amber-500 text-slate-900 hover:bg-amber-400'>Trade</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
