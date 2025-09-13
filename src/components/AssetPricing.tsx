import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Package,
  Coins,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BuyAssetModal from './BuyAssetModal';
import RealizeAssetModal from './RealizeAssetModal';
import BorrowingModal from './BorrowingModal';

interface Asset {
  name: string;
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
  icon: string;
  type: 'metal' | 'crypto';
  sparklineData: number[];
}

const Sparkline = ({ data }: { data: number[] }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const normalize = (val: number) => ((val - min) / (max - min)) * 40;
  
  const pathD = data
    .map((point, index) => {
      const x = (index / (data.length - 1)) * 80;
      const y = 40 - normalize(point);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className='w-20 h-10 flex items-center justify-end'>
      <svg width="80" height="40" className='overflow-visible'>
        <path
          d={pathD}
          fill="none"
          stroke="hsl(var(--gold))"
          strokeWidth="2"
          className='drop-shadow-sm'
        />
      </svg>
    </div>
  );
};

const AssetPricing = () => {
  const navigate = useNavigate();
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [realizeModalOpen, setRealizeModalOpen] = useState(false);
  const [borrowingModalOpen, setBorrowingModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const assets: Asset[] = [
    {
      name: 'Gold',
      symbol: 'XAU',
      price: '$2,048.50',
      change: '+1.2%',
      isPositive: true,
      icon: '🥇',
      type: 'metal',
      sparklineData: [2040, 2045, 2038, 2042, 2048, 2050, 2049, 2048],
    },
    {
      name: 'Silver',
      symbol: 'XAG',
      price: '$24.85',
      change: '+0.8%',
      isPositive: true,
      icon: '🥈',
      type: 'metal',
      sparklineData: [24.2, 24.5, 24.3, 24.7, 24.8, 24.9, 24.85, 24.85],
    },
    {
      name: 'Platinum',
      symbol: 'XPT',
      price: '$924.80',
      change: '+0.6%',
      isPositive: true,
      icon: '⚪',
      type: 'metal',
      sparklineData: [920, 922, 918, 925, 924, 926, 925, 924.8],
    },
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      price: '$43,567.89',
      change: '+2.8%',
      isPositive: true,
      icon: '₿',
      type: 'crypto',
      sparklineData: [42000, 42500, 41800, 43000, 43200, 43600, 43500, 43567],
    },
    {
      name: 'Ethereum',
      symbol: 'ETH',
      price: '$2,687.45',
      change: '+1.9%',
      isPositive: true,
      icon: '⧫',
      type: 'crypto',
      sparklineData: [2650, 2660, 2640, 2670, 2680, 2690, 2685, 2687],
    },
    {
      name: 'Solana',
      symbol: 'SOL',
      price: '$142.33',
      change: '+4.2%',
      isPositive: true,
      icon: '◎',
      type: 'crypto',
      sparklineData: [135, 138, 140, 142, 144, 143, 142.5, 142.33],
    },
  ];

  const handleCardClick = (asset: Asset) => {
    if (asset.type === 'metal') {
      navigate('/markets?tab=commodities');
    } else {
      navigate('/markets?tab=crypto');
    }
  };

  const handleTradeClick = (asset: Asset, e: React.MouseEvent) => {
    e.stopPropagation();
    const tradePair = asset.type === 'crypto' ? `${asset.symbol}-USDC` : asset.symbol;
    navigate(`/trade/${tradePair}`);
  };

  return (
    <section id='assets' className='py-12 bg-background'>
      <div className='container mx-auto px-4'>
        <div className='text-center mb-8'>
          <h2 className='text-3xl md:text-4xl font-bold text-foreground mb-4'>
            Live Asset Prices
          </h2>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
            Real-time pricing for all supported assets. Trade with confidence
            knowing you're getting fair market value.
          </p>
        </div>

        <div className='grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto'>
          {assets.map(asset => (
            <Card
              key={asset.symbol}
              className='group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-gold/30 cursor-pointer bg-card/80 backdrop-blur'
              onClick={() => handleCardClick(asset)}
            >
              <CardContent className='p-4 md:p-6'>
                <div className='flex items-start justify-between mb-3'>
                  <div className='flex items-center space-x-2'>
                    <span className='text-xl md:text-2xl'>{asset.icon}</span>
                    <div>
                      <div className='font-semibold text-foreground text-sm md:text-base'>
                        {asset.name}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        {asset.symbol}
                      </div>
                    </div>
                  </div>
                  <Sparkline data={asset.sparklineData} />
                </div>

                <div className='mb-3'>
                  <div className='text-lg md:text-xl font-bold text-foreground mb-1'>
                    {asset.price}
                  </div>
                  <Badge
                    variant={asset.isPositive ? 'default' : 'destructive'}
                    className='text-xs bg-gold/10 text-gold border-gold/30 hover:bg-gold/20'
                  >
                    {asset.isPositive ? (
                      <TrendingUp className='w-3 h-3 mr-1' />
                    ) : (
                      <TrendingDown className='w-3 h-3 mr-1' />
                    )}
                    {asset.change}
                  </Badge>
                </div>

                <div className='space-y-2'>
                  <div className='hidden md:flex gap-2'>
                    <Button
                      size='sm'
                      variant='gold'
                      className='flex-1'
                      onClick={(e) => handleTradeClick(asset, e)}
                    >
                      <BarChart3 className='w-3 h-3 mr-1' />
                      Trade
                    </Button>
                    {asset.type === 'metal' && (
                      <Button
                        size='sm'
                        variant='outline'
                        className='flex-1'
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAsset(asset);
                          setRealizeModalOpen(true);
                        }}
                      >
                        <Package className='w-3 h-3 mr-1' />
                        Realize
                      </Button>
                    )}
                  </div>
                  
                  {/* Mobile: Single Trade button */}
                  <div className='md:hidden'>
                    <Button
                      size='sm'
                      variant='gold'
                      className='w-full'
                      onClick={(e) => handleTradeClick(asset, e)}
                    >
                      Trade
                    </Button>
                  </div>

                  {/* Borrow buttons for XAU and XPT */}
                  {(asset.symbol === 'XAU' || asset.symbol === 'XPT') && (
                    <Button
                      size='sm'
                      variant='outline'
                      className='w-full hidden md:flex'
                      disabled
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAsset(asset);
                        setBorrowingModalOpen(true);
                      }}
                    >
                      <Coins className='w-3 h-3 mr-1' />
                      Borrow Against {asset.name}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className='text-center mt-8'>
          <p className='text-sm text-muted-foreground'>
            Prices updated every 30 seconds • Last update:{' '}
            {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Modals */}
      {selectedAsset && (
        <>
          <BuyAssetModal
            isOpen={buyModalOpen}
            onClose={() => setBuyModalOpen(false)}
            asset={selectedAsset}
          />
          <RealizeAssetModal
            isOpen={realizeModalOpen}
            onClose={() => setRealizeModalOpen(false)}
            asset={selectedAsset}
          />
          <BorrowingModal
            isOpen={borrowingModalOpen}
            onClose={() => setBorrowingModalOpen(false)}
            asset={selectedAsset}
          />
        </>
      )}
    </section>
  );
};

export default AssetPricing;
