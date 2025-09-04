import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  TrendingUp,
  Zap,
  DollarSign,
  BarChart3,
  Globe,
  ArrowLeftRight,
} from 'lucide-react';

const AssetTrading = () => {
  const features = [
    {
      icon: <ArrowLeftRight className='w-8 h-8 text-gold' />,
      title: 'Barter-Style Settlement',
      description:
        'Trade gold against oil, copper against USD, or silver against BTC. All order books settle transparently with real-time pricing and instant execution.',
    },
    {
      icon: <Zap className='w-8 h-8 text-blue-500' />,
      title: 'Direct Fill & Limit Orders',
      description:
        'Institutional providers can directly fill orders at scale via bonded warehouses, Maersk logistics, and Dillon Gage APIs for seamless large-volume transactions.',
    },
    {
      icon: <DollarSign className='w-8 h-8 text-green-500' />,
      title: 'Spreads & Fees',
      description:
        'Tight spreads across metals, FX, and crypto pairs, with rebates for liquidity providers and competitive rates for all market participants.',
    },
  ];

  const tradingPairs = [
    { pair: 'XAU/USD', price: '$2,034.50', change: '+1.24%' },
    { pair: 'XAG/USD', price: '$24.18', change: '+0.89%' },
    { pair: 'XAU/XAG', price: '84.15', change: '+0.35%' },
    { pair: 'CU/USD', price: '$8,345', change: '-0.12%' },
    { pair: 'XAU/BTC', price: '0.0456', change: '+2.10%' },
    { pair: 'OIL/XAU', price: '0.0351', change: '-0.45%' },
  ];

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />

      <main className='py-20'>
        <div className='container mx-auto px-4'>
          <div className='max-w-6xl mx-auto'>
            {/* Hero Section */}
            <div className='text-center mb-16'>
              <div className='w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-gold to-gold-light rounded-2xl flex items-center justify-center'>
                <TrendingUp className='w-8 h-8 text-primary-foreground' />
              </div>
              <h1 className='text-4xl md:text-5xl font-bold mb-6'>
                Asset Trading
              </h1>
              <p className='text-xl text-muted-foreground max-w-3xl mx-auto'>
                Trade precious metals, commodities, and currencies with
                institutional-grade execution and transparent settlement.
              </p>
            </div>

            {/* Features Grid */}
            <div className='grid md:grid-cols-3 gap-8 mb-16'>
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className='border-border/50 bg-card/50 backdrop-blur-sm'
                >
                  <CardHeader>
                    <div className='mb-4'>{feature.icon}</div>
                    <CardTitle className='text-xl'>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className='text-base leading-relaxed'>
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Trading Pairs */}
            <div className='grid md:grid-cols-2 gap-12 items-start mb-16'>
              <div>
                <div className='flex items-center space-x-3 mb-6'>
                  <BarChart3 className='w-8 h-8 text-gold' />
                  <h2 className='text-2xl font-bold'>Live Trading Pairs</h2>
                </div>
                <Card className='bg-gradient-to-br from-muted/20 to-muted/5 border-gold/20'>
                  <CardContent className='p-6'>
                    <div className='space-y-3'>
                      {tradingPairs.map((pair, index) => (
                        <div
                          key={index}
                          className='flex items-center justify-between p-3 bg-background/50 rounded-lg'
                        >
                          <span className='font-medium'>{pair.pair}</span>
                          <div className='text-right'>
                            <div className='font-bold'>{pair.price}</div>
                            <div
                              className={`text-sm ${pair.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}
                            >
                              {pair.change}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <div className='flex items-center space-x-3 mb-6'>
                  <Globe className='w-8 h-8 text-silver' />
                  <h2 className='text-2xl font-bold'>Global Liquidity</h2>
                </div>
                <div className='space-y-6 text-muted-foreground'>
                  <p>
                    Our trading engine connects global commodity markets,
                    providing deep liquidity across all major asset classes.
                    Whether you're trading spot metals, futures contracts, or
                    cross-commodity pairs, you get institutional-grade
                    execution.
                  </p>
                  <p>
                    Advanced order types including limit orders, stop losses,
                    and algorithmic trading strategies ensure you have the tools
                    needed for sophisticated trading operations.
                  </p>
                  <div className='grid grid-cols-2 gap-4 pt-4'>
                    <div className='text-center p-4 bg-muted/20 rounded-lg'>
                      <div className='text-2xl font-bold text-gold'>$2.1B+</div>
                      <div className='text-sm'>Daily Volume</div>
                    </div>
                    <div className='text-center p-4 bg-muted/20 rounded-lg'>
                      <div className='text-2xl font-bold text-silver'>
                        0.01%
                      </div>
                      <div className='text-sm'>Avg Spread</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Institutional Features */}
            <Card className='bg-gradient-to-r from-gold/5 to-silver/5 border-gold/20'>
              <CardHeader className='text-center'>
                <CardTitle className='text-2xl'>
                  Built for Institutions
                </CardTitle>
                <CardDescription className='text-lg'>
                  Professional trading tools and infrastructure for serious
                  traders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid md:grid-cols-3 gap-8'>
                  <div className='text-center'>
                    <h3 className='font-semibold mb-2'>API Trading</h3>
                    <p className='text-sm text-muted-foreground'>
                      RESTful and WebSocket APIs for algorithmic trading and
                      system integration
                    </p>
                  </div>
                  <div className='text-center'>
                    <h3 className='font-semibold mb-2'>Bulk Settlement</h3>
                    <p className='text-sm text-muted-foreground'>
                      Large order execution with minimal market impact through
                      dark pool liquidity
                    </p>
                  </div>
                  <div className='text-center'>
                    <h3 className='font-semibold mb-2'>Compliance Ready</h3>
                    <p className='text-sm text-muted-foreground'>
                      Full audit trails and regulatory reporting for
                      institutional compliance
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AssetTrading;
