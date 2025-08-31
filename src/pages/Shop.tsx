import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toCommodityPath, toTradingPath } from '@/lib/routes';
import { track } from '@/lib/analytics';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  Send,
  CreditCard,
  ArrowUpDown,
  Download,
  Upload,
  BarChart3,
  Truck,
} from 'lucide-react';
import BuyAssetModal from '@/components/BuyAssetModal';
import RealizeAssetModal from '@/components/RealizeAssetModal';
import BuyPhysicalModal from '@/components/BuyPhysicalModal';
import BorrowingModal from '@/components/BorrowingModal';
import Navigation from '@/components/Navigation';

interface Asset {
  name: string;
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
  icon: string;
  description: string;
  isLive: boolean;
  minimumOrder: string;
  deliveryInfo: string;
}

const Shop = () => {
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [realizeModalOpen, setRealizeModalOpen] = useState(false);
  const [buyPhysicalModalOpen, setBuyPhysicalModalOpen] = useState(false);
  const [borrowingModalOpen, setBorrowingModalOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const navigate = useNavigate();

  // Asset list for shop page
  const assets = [
    {
      name: 'Gold (XAU)',
      symbol: 'XAU',
      price: '$2,048.50',
      change: '+1.2%',
      isPositive: true,
      icon: '🥇',
      description: 'Per Troy Ounce',
      isLive: true,
      minimumOrder: '1 gram',
      deliveryInfo:
        '3–5 business days (domestic), 7–14 business days (international). Fully insured and tracked by FedEx.',
    },
    {
      name: 'Silver (XAG)',
      symbol: 'XAG',
      price: '$24.85',
      change: '+0.8%',
      isPositive: true,
      icon: '🥈',
      description: 'Per Troy Ounce',
      isLive: true,
      minimumOrder: '1 gram',
      deliveryInfo:
        '3–5 business days (domestic), 7–14 business days (international). Fully insured and tracked by FedEx.',
    },
    {
      name: 'Platinum (XPT)',
      symbol: 'XPT',
      price: '$924.80',
      change: '+0.6%',
      isPositive: true,
      icon: '⚪',
      description: 'Per Troy Ounce',
      isLive: true,
      minimumOrder: '1 gram',
      deliveryInfo:
        '3–5 business days (domestic), 7–14 business days (international). Fully insured and tracked by FedEx.',
    },
    {
      name: 'Palladium (XPD)',
      symbol: 'XPD',
      price: '$1,156.30',
      change: '+2.1%',
      isPositive: true,
      icon: '⚫',
      description: 'Per Troy Ounce',
      isLive: true,
      minimumOrder: '1 gram',
      deliveryInfo:
        '3–5 business days (domestic), 7–14 business days (international). Fully insured and tracked by FedEx.',
    },
    {
      name: 'Copper (XCU)',
      symbol: 'XCU',
      price: '$8,450.00',
      change: '+1.5%',
      isPositive: true,
      icon: '🟤',
      description: 'Per Metric Ton',
      isLive: true,
      minimumOrder: '1 ton',
      deliveryInfo: '3–5 weeks. Fully insured and tracked by Maersk Shipping.',
    },
    {
      name: 'Crude Oil',
      symbol: 'OIL',
      price: '$76.45',
      change: '+1.8%',
      isPositive: true,
      icon: '🛢️',
      description: 'Per Barrel',
      isLive: true,
      minimumOrder: '500,000 barrels',
      deliveryInfo: '3–5 weeks. Fully insured and tracked by Maersk Shipping.',
    },
  ];

  const handleBuyClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setBuyModalOpen(true);
    track('shop_action_modal', { symbol: asset.symbol, action: 'buy', source_page: '/shop' });
  };

  const handleSellClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setRealizeModalOpen(true);
    track('shop_action_modal', { symbol: asset.symbol, action: 'sell', source_page: '/shop' });
  };

  const handleOrderClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setBuyPhysicalModalOpen(true);
    track('shop_action_modal', { symbol: asset.symbol, action: 'order', source_page: '/shop' });
  };

  const handleDepositClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setBorrowingModalOpen(true);
    track('shop_action_modal', { symbol: asset.symbol, action: 'deposit', source_page: '/shop' });
  };

  const handleSendClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setSendModalOpen(true);
    track('shop_action_modal', { symbol: asset.symbol, action: 'send', source_page: '/shop' });
  };

  const handleDetailsClick = (asset: Asset) => {
    track('shop_action_routed', { symbol: asset.symbol, action: 'details', source_page: '/shop' });
    navigate(toCommodityPath(asset.symbol, { action: 'details' }));
  };

  const handleRowCardClick = (asset: Asset) => {
    track('shop_row_open_details', { symbol: asset.symbol, source_page: '/shop' });
    navigate(toCommodityPath(asset.symbol));
  };

  const handleTickerClick = (asset: Asset, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    track('shop_row_open_trading', { symbol: asset.symbol, route: toTradingPath(asset.symbol) });
    navigate(toTradingPath(asset.symbol));
  };

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl md:text-4xl font-bold text-foreground mb-4'>
            Shop All - Physical Assets and Tokens
          </h1>
          <p className='text-xl text-muted-foreground max-w-2xl'>
            Purchase and receive physical delivery of precious metals and
            commodities. All shipments are insured and tracked by FedEx or
            Maersk.
          </p>
        </div>

        {/* Assets Grid */}
        <div className='space-y-6'>
          {assets.map(asset => (
            <Card
              key={asset.symbol}
              className='group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-gold/30'
            >
              <CardContent className='p-6'>
                <div 
                  className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/60 rounded-2xl -m-2 p-2'
                  role="link"
                  tabIndex={0}
                  onClick={() => handleRowCardClick(asset)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleRowCardClick(asset);
                    }
                  }}
                  data-testid="row-card-link"
                  aria-label={`Open ${asset.name} details`}
                >
                  {/* Asset Info - Left Side */}
                  <div className='lg:col-span-3 flex items-center space-x-4'>
                    <div className='text-3xl group-hover:scale-110 transition-transform'>
                      {asset.icon}
                    </div>
                    <div>
                      <div className='font-semibold text-foreground text-lg group-hover:text-primary transition-colors'>
                        {asset.name}
                        <button
                          className='ml-2 text-sm font-normal text-muted-foreground hover:text-primary transition-colors z-10 relative'
                          aria-label={`Open ${asset.name} trading`}
                          data-testid="row-ticker-link"
                          onClick={(e) => handleTickerClick(asset, e)}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          ({asset.symbol})
                        </button>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {asset.description}
                      </p>
                      {asset.minimumOrder && (
                        <p className='text-xs text-muted-foreground mt-1'>
                          Minimum Order: {asset.minimumOrder}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price & Change */}
                  <div className='lg:col-span-2 text-center lg:text-left'>
                    <div className='text-xl font-bold text-primary mb-1'>
                      {asset.price}
                    </div>
                    <Badge
                      variant={asset.isPositive ? 'default' : 'destructive'}
                      className='flex items-center space-x-1 w-fit'
                    >
                      {asset.isPositive ? (
                        <TrendingUp className='w-3 h-3' />
                      ) : (
                        <TrendingDown className='w-3 h-3' />
                      )}
                      <span>{asset.change}</span>
                    </Badge>
                  </div>

                  {/* Simplified Price Chart */}
                  <div className='lg:col-span-3 flex justify-center'>
                    <div className='w-32 h-16 bg-muted rounded-lg flex items-center justify-center relative overflow-hidden pointer-events-none'>
                      <div className='absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none'></div>
                      <BarChart3 className='w-6 h-6 text-primary z-10 pointer-events-none' />
                      <span className='text-xs text-muted-foreground absolute bottom-1 right-1 pointer-events-none'>
                        1Y
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className='lg:col-span-4' data-row-actions onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                    {/* Row 1: Buy, Sell, Order */}
                    <div className='grid grid-cols-3 gap-3 mb-3'>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='outline'
                              className='h-10 px-4'
                              onClick={() => handleBuyClick(asset)}
                              aria-label={`Buy ${asset.name}`}
                            >
                              <ShoppingCart className='w-4 h-4 mr-2' />
                              Buy
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Purchase using USDC, PAXG, bank wire, or debit
                              card
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='outline'
                              className='h-10 px-4'
                              onClick={() => handleSellClick(asset)}
                              aria-label={`Sell ${asset.name}`}
                            >
                              <Package className='w-4 h-4 mr-2' />
                              Sell
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Sell {asset.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='premium'
                              className='h-10 px-4 bg-black text-white hover:bg-black/90'
                              onClick={() => handleOrderClick(asset)}
                              aria-label={`Order ${asset.name}`}
                            >
                              <Truck className='w-4 h-4 mr-2' />
                              Order
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Ship physical asset to your address. Token will be
                              burned on fulfillment.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* Row 2: Deposit, Send, Details */}
                    <div className='grid grid-cols-3 gap-3'>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='outline'
                              className='h-10 px-4'
                              onClick={() => handleDepositClick(asset)}
                              aria-label={`Deposit ${asset.name}`}
                            >
                              <Upload className='w-4 h-4 mr-2' />
                              Deposit
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Deposit {asset.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='outline'
                              className='h-10 px-4'
                              onClick={() => handleSendClick(asset)}
                              aria-label={`Send ${asset.name}`}
                            >
                              <Send className='w-4 h-4 mr-2' />
                              Send
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Send/Receive {asset.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='outline'
                              className='h-10 px-4'
                              onClick={() => handleDetailsClick(asset)}
                              aria-label={`View ${asset.name} details`}
                            >
                              <Package className='w-4 h-4 mr-2' />
                              Details
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View commodity details and trading options</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* Delivery Note */}
                    <div className='mt-4 text-center lg:text-left'>
                      <p className='text-sm text-muted-foreground'>
                        Delivery ETA: {asset.deliveryInfo}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Note */}
        <div className='text-center mt-8 space-y-2'>
          <p className='text-sm text-muted-foreground'>
            All physical deliveries are fully insured and tracked via FedEx or
            Maersk
          </p>
          <p className='text-xs text-muted-foreground'>
            Delivery times vary by asset and location. See individual asset
            details above.
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
          <BuyPhysicalModal
            isOpen={buyPhysicalModalOpen}
            onClose={() => setBuyPhysicalModalOpen(false)}
            asset={selectedAsset}
          />
          <BorrowingModal
            isOpen={borrowingModalOpen}
            onClose={() => setBorrowingModalOpen(false)}
            asset={selectedAsset}
          />
          <Dialog open={sendModalOpen} onOpenChange={setSendModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send/Receive {selectedAsset?.name}</DialogTitle>
                <DialogDescription>
                  This feature is under development. Please use the
                  corresponding trading page for sending/receiving.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant='outline' onClick={() => setSendModalOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default Shop;