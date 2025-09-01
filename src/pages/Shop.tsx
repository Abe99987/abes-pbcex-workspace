import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toCommodityPath } from '@/lib/routes';
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
  CreditCard,
  Send,
  Upload,
  BarChart3,
  Truck,
  Home,
} from 'lucide-react';
import BuyAssetModal from '@/components/BuyAssetModal';
import SellAssetModal from '@/components/SellAssetModal';
import BuyPhysicalModal from '@/components/BuyPhysicalModal';
import BorrowingModal from '@/components/BorrowingModal';
import CryptoDepositModal from '@/components/modals/CryptoDepositModal';
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
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [mortgageModalOpen, setMortgageModalOpen] = useState(false);
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

  // Specific handlers for each action
  const handleBuyClick = (asset: Asset) => {
    track('shop_action_buy', { symbol: asset.symbol, source_page: '/shop' });
    setSelectedAsset(asset);
    setBuyModalOpen(true);
  };

  const handleSellClick = (asset: Asset) => {
    track('shop_action_sell', { symbol: asset.symbol, source_page: '/shop' });
    setSelectedAsset(asset);
    setSellModalOpen(true);
  };

  const handleOrderClick = (asset: Asset) => {
    track('shop_action_order', { symbol: asset.symbol, source_page: '/shop' });
    setSelectedAsset(asset);
    setOrderModalOpen(true);
  };

  const handleDepositClick = (asset: Asset) => {
    track('shop_action_deposit', { symbol: asset.symbol, source_page: '/shop' });
    setSelectedAsset(asset);
    setDepositModalOpen(true);
  };

  const handleSendClick = (asset: Asset) => {
    track('shop_action_send', { symbol: asset.symbol, source_page: '/shop' });
    setSelectedAsset(asset);
    setSendModalOpen(true);
  };

  const handleMortgageClick = (asset: Asset) => {
    track('shop_action_mortgage', { symbol: asset.symbol, source_page: '/shop' });
    setSelectedAsset(asset);
    setMortgageModalOpen(true);
  };

  const handleRowCardClick = (asset: Asset) => {
    track('shop_row_open_details', {
      symbol: asset.symbol,
      source_page: '/shop',
    });
    navigate(toCommodityPath(asset.symbol));
  };

  const handleTickerClick = (asset: Asset, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    track('shop_row_open_product', {
      symbol: asset.symbol,
      route: `/shop/${asset.symbol}`,
    });
    navigate(`/shop/${asset.symbol}`);
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
                  role='link'
                  tabIndex={0}
                  onClick={() => handleRowCardClick(asset)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleRowCardClick(asset);
                    }
                  }}
                   data-testid='row-card-link'
                   aria-label={`Open ${asset.name} details`}
                 >
                   {/* Asset Info - Left Side (Ticker Click Area) */}
                   <div 
                     className='lg:col-span-3 flex items-center space-x-4'
                     data-testid="ticker-click-area"
                   >
                    <div className='text-3xl group-hover:scale-110 transition-transform'>
                      {asset.icon}
                    </div>
                    <div>
                      <div className='font-semibold text-foreground text-lg group-hover:text-primary transition-colors'>
                        {asset.name}
                        <button
                          className='ml-2 text-sm font-normal text-muted-foreground hover:text-primary transition-colors z-10 relative'
                          aria-label={`Open ${asset.name} trading`}
                          data-testid='row-ticker-link'
                          onClick={e => handleTickerClick(asset, e)}
                          onMouseDown={e => e.stopPropagation()}
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
                  <div
                    className='lg:col-span-4'
                    data-row-actions
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                  >
                    {/* Row 1: Buy | Sell | Order */}
                    <div className='grid grid-cols-3 gap-3 mb-3'>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='outline'
                              className='h-10 px-4 min-h-[40px]'
                              onClick={() => handleBuyClick(asset)}
                              aria-label={`Buy ${asset.name}`}
                              data-testid="buy-btn"
                            >
                              <ShoppingCart className='w-4 h-4 mr-2' />
                              Buy
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Purchase tokens using USD, USDC, PAXG, bank wire, or debit card</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='outline'
                              className='h-10 px-4 min-h-[40px]'
                              onClick={() => handleSellClick(asset)}
                              aria-label={`Sell ${asset.name}`}
                              data-testid="sell-btn"
                            >
                              <CreditCard className='w-4 h-4 mr-2' />
                              Sell
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Realize/withdraw {asset.name} holdings</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='premium'
                              className='h-10 px-4 min-h-[40px] bg-black text-white hover:bg-black/90'
                              onClick={() => handleOrderClick(asset)}
                              aria-label={`Order ${asset.name}`}
                              data-testid="order-btn"
                            >
                              <Truck className='w-4 h-4 mr-2' />
                              Order
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Physical delivery (bars/coins/Goldbacks) with format selection</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* Row 2: Send | Deposit | Mortgage */}
                    <div className='grid grid-cols-3 gap-3'>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='outline'
                              className='h-10 px-4 min-h-[40px]'
                              onClick={() => handleSendClick(asset)}
                              aria-label={`Send ${asset.name}`}
                              data-testid="send-btn"
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
                              className='h-10 px-4 min-h-[40px]'
                              onClick={() => handleDepositClick(asset)}
                              aria-label={`Deposit ${asset.name}`}
                              data-testid="deposit-btn"
                            >
                              <Upload className='w-4 h-4 mr-2' />
                              Deposit
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Crypto deposit: PAXG, USDC, or related tokens</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant='outline'
                              className='h-10 px-4 min-h-[40px]'
                              onClick={() => handleMortgageClick(asset)}
                              aria-label={`Mortgage with ${asset.name}`}
                              data-testid="mortgage-btn"
                            >
                              <Home className='w-4 h-4 mr-2' />
                              Mortgage
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Asset-backed financing with {asset.name} as collateral</p>
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
          {/* Buy = Token Purchase */}
          <BuyAssetModal
            isOpen={buyModalOpen}
            onClose={() => setBuyModalOpen(false)}
            asset={selectedAsset}
          />
          
           {/* Sell = Convert/Withdraw */}
           <SellAssetModal
             isOpen={sellModalOpen}
             onClose={() => setSellModalOpen(false)}
             asset={selectedAsset}
           />
          
          {/* Order = Physical Delivery with Format Selection */}
          <BuyPhysicalModal
            isOpen={orderModalOpen}
            onClose={() => setOrderModalOpen(false)}
            asset={selectedAsset}
          />
          
          {/* Deposit = Crypto Deposit */}
          <CryptoDepositModal
            isOpen={depositModalOpen}
            onClose={() => setDepositModalOpen(false)}
            asset={selectedAsset}
          />
          
          {/* Mortgage = Asset-Backed Financing */}
          <BorrowingModal
            isOpen={mortgageModalOpen}
            onClose={() => setMortgageModalOpen(false)}
            asset={selectedAsset}
          />
          
          {/* Send = Development Modal */}
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
                <Button
                  variant='outline'
                  onClick={() => setSendModalOpen(false)}
                >
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
