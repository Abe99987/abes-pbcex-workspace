import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Activity, Fuel } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';

interface TopMoverData {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  volume: string;
  sparklineData: number[];
}

const MarketsAnalytics = () => {
  const [fearGreedScore, setFearGreedScore] = useState(53);
  const [fearGreedLabel, setFearGreedLabel] = useState('Neutral');

  // Mock data for demonstration
  const marketStats = {
    marketCapDelta: '+2.34%',
    volumeDelta: '-5.67%',
    gasPrice: '23.4 gwei',
  };

  const topMovers: TopMoverData[] = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: '$43,567',
      change: '+1,234',
      changePercent: '+2.91%',
      volume: '$2.4B',
      sparklineData: [100, 105, 102, 108, 112, 109, 115],
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: '$2,678',
      change: '+89',
      changePercent: '+3.44%',
      volume: '$1.2B',
      sparklineData: [100, 98, 105, 103, 110, 112, 108],
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      price: '$98.45',
      change: '+4.23',
      changePercent: '+4.49%',
      volume: '$456M',
      sparklineData: [100, 103, 101, 107, 109, 105, 111],
    },
  ];

  const mostTraded = topMovers;
  const trending = [...topMovers].reverse();
  const newlyListed = topMovers.slice(0, 2);

  const MiniSparkline = ({ data }: { data: number[] }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;

    return (
      <div className='w-16 h-8 flex items-end justify-between'>
        {data.map((point, index) => {
          const height = range > 0 ? ((point - min) / range) * 100 : 50;
          return (
            <div
              key={index}
              className='w-1 bg-green-500 rounded-t'
              style={{ height: `${Math.max(height, 10)}%` }}
            />
          );
        })}
      </div>
    );
  };

  const TableSection = ({
    title,
    data,
  }: {
    title: string;
    data: TopMoverData[];
  }) => (
    <Card className='bg-[#15171A] border-[#23262A]'>
      <CardHeader className='pb-4'>
        <CardTitle className='text-[#F2F3F5] text-lg font-semibold'>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        {data.map((item, index) => (
          <div
            key={item.symbol}
            className='flex items-center justify-between py-2 border-b border-[#23262A] last:border-b-0'
          >
            <div className='flex items-center space-x-3'>
              <span className='text-[#C8CDD3] text-sm w-4'>{index + 1}</span>
              <div>
                <div className='text-[#F2F3F5] font-medium'>{item.symbol}</div>
                <div className='text-[#C8CDD3] text-xs'>{item.name}</div>
              </div>
            </div>
            <div className='flex items-center space-x-4'>
              <div className='text-right'>
                <div className='text-[#F2F3F5]'>{item.price}</div>
                <div
                  className={`text-xs ${item.changePercent.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}
                >
                  {item.changePercent}
                </div>
              </div>
              <MiniSparkline data={item.sparklineData} />
              <Button
                size='sm'
                variant='outline'
                className='bg-transparent border-[#23262A] text-[#F2F3F5] hover:bg-[#23262A]'
              >
                Trade
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className='min-h-screen bg-[#0A0A0A] text-[#F2F3F5]'>
        {/* Header */}
        <div className='border-b border-[#23262A] bg-[#111214] px-6 py-6'>
          <h1 className='text-2xl font-bold'>Markets Analytics</h1>
          <p className='text-[#C8CDD3] mt-1'>
            Overview & key metrics dashboard
          </p>
        </div>

        <div className='container mx-auto px-6 py-8'>
          {/* Top Metrics Row */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            {/* Fear & Greed Index */}
            <Card className='bg-[#15171A] border-[#23262A]'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-[#F2F3F5] text-base font-semibold flex items-center'>
                  <Activity className='w-4 h-4 mr-2' />
                  Fear & Greed Index (BTC)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-center space-y-3'>
                  <img
                    src='https://alternative.me/crypto/fear-and-greed-index.png'
                    alt='Crypto Fear & Greed Index, 0–100 (BTC)'
                    className='w-full h-32 object-contain rounded-lg'
                    onError={e => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling!.textContent = '—';
                    }}
                  />
                  <div className='text-2xl font-bold text-[#F2F3F5]'>
                    {fearGreedScore}
                  </div>
                  <Badge
                    variant='secondary'
                    className='bg-[#23262A] text-[#C8CDD3]'
                  >
                    {fearGreedLabel}
                  </Badge>
                  <div className='text-xs text-[#C8CDD3]'>
                    Source: Alternative.me
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Cap Delta */}
            <Card className='bg-[#15171A] border-[#23262A]'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-[#F2F3F5] text-base font-semibold flex items-center'>
                  <TrendingUp className='w-4 h-4 mr-2' />
                  Market Cap Δ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-center space-y-2'>
                  <div className='text-2xl font-bold text-green-400'>
                    {marketStats.marketCapDelta}
                  </div>
                  <div className='text-[#C8CDD3] text-sm'>24h change</div>
                </div>
              </CardContent>
            </Card>

            {/* Trading Volume Delta */}
            <Card className='bg-[#15171A] border-[#23262A]'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-[#F2F3F5] text-base font-semibold flex items-center'>
                  <Activity className='w-4 h-4 mr-2' />
                  Trading Volume Δ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-center space-y-2'>
                  <div className='text-2xl font-bold text-red-400'>
                    {marketStats.volumeDelta}
                  </div>
                  <div className='text-[#C8CDD3] text-sm'>24h change</div>
                </div>
              </CardContent>
            </Card>

            {/* Gas Price */}
            <Card className='bg-[#15171A] border-[#23262A]'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-[#F2F3F5] text-base font-semibold flex items-center'>
                  <Fuel className='w-4 h-4 mr-2' />
                  Gas Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-center space-y-2'>
                  <div className='text-2xl font-bold text-[#F2F3F5]'>
                    {marketStats.gasPrice}
                  </div>
                  <div className='text-[#C8CDD3] text-sm'>Current ETH gas</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Movers Section */}
          <div className='mb-8'>
            <h2 className='text-xl font-bold text-[#F2F3F5] mb-4'>
              Top Movers (24h)
            </h2>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              <TableSection title='Most Traded' data={mostTraded} />
              <TableSection title='Trending' data={trending} />
              <TableSection title='Newly Listed' data={newlyListed} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MarketsAnalytics;
