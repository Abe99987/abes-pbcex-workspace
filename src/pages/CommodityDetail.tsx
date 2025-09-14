import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import OrderForm from '@/components/shop/OrderForm';

// Map symbols to their data
const commodityData: Record<string, {
  metalType: string;
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
  icon: string;
  minimumOrder: string;
  deliveryInfo: string;
  displayName: string;
}> = {
  'XAU': {
    metalType: 'gold',
    symbol: 'XAU',
    price: '$2,048.50',
    change: '+1.2%',
    isPositive: true,
    icon: '🥇',
    minimumOrder: '1 gram',
    deliveryInfo: '3–5 business days (domestic), 7–14 business days (international). Fully insured and tracked by FedEx.',
    displayName: 'Gold'
  },
  'XAG': {
    metalType: 'silver',
    symbol: 'XAG',
    price: '$24.85',
    change: '+0.8%',
    isPositive: true,
    icon: '🥈',
    minimumOrder: '1 gram',
    deliveryInfo: '3–5 business days (domestic), 7–14 business days (international). Fully insured and tracked by FedEx.',
    displayName: 'Silver'
  },
  'XPT': {
    metalType: 'platinum',
    symbol: 'XPT',
    price: '$924.80',
    change: '+0.6%',
    isPositive: true,
    icon: '⚪',
    minimumOrder: '1 gram',
    deliveryInfo: '3–5 business days (domestic), 7–14 business days (international). Fully insured and tracked by FedEx.',
    displayName: 'Platinum'
  },
  'XPD': {
    metalType: 'palladium',
    symbol: 'XPD',
    price: '$1,156.30',
    change: '+2.1%',
    isPositive: true,
    icon: '⚫',
    minimumOrder: '1 gram',
    deliveryInfo: '3–5 business days (domestic), 7–14 business days (international). Fully insured and tracked by FedEx.',
    displayName: 'Palladium'
  },
  'XCU': {
    metalType: 'copper',
    symbol: 'XCU',
    price: '$8,450.00',
    change: '+1.5%',
    isPositive: true,
    icon: '🟤',
    minimumOrder: '1 ton',
    deliveryInfo: '3–5 weeks. Fully insured and tracked by Maersk Shipping.',
    displayName: 'Copper'
  },
  'OIL': {
    metalType: 'oil',
    symbol: 'OIL',
    price: '$76.45',
    change: '+1.8%',
    isPositive: true,
    icon: '🛢️',
    minimumOrder: '500,000 barrels',
    deliveryInfo: '3–5 weeks. Fully insured and tracked by Maersk Shipping.',
    displayName: 'Crude Oil'
  }
};

const CommodityDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  
  if (!symbol) {
    return <Navigate to="/shop" replace />;
  }

  const commodity = commodityData[symbol.toUpperCase()];
  
  if (!commodity) {
    return <Navigate to="/shop" replace />;
  }

  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      
      <Helmet>
        <title>Buy {commodity.displayName} - PBCEx | Physical {commodity.displayName}</title>
        <meta
          name='description'
          content={`Purchase physical ${commodity.displayName.toLowerCase()} with insured shipping. Live ${commodity.displayName.toLowerCase()} prices and secure delivery worldwide.`}
        />
      </Helmet>

      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-foreground mb-4'>
              Buy Physical {commodity.displayName}
            </h1>
            <p className='text-lg text-muted-foreground'>
              Purchase {commodity.displayName.toLowerCase()} with secure, insured delivery worldwide
            </p>
          </div>

          <OrderForm
            metalType={commodity.metalType}
            symbol={commodity.symbol}
            price={commodity.price}
            change={commodity.change}
            isPositive={commodity.isPositive}
            icon={commodity.icon}
            minimumOrder={commodity.minimumOrder}
            deliveryInfo={commodity.deliveryInfo}
          />
        </div>
      </div>
    </div>
  );
};

export default CommodityDetail;