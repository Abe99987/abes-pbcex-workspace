import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import OrderForm from '@/components/shop/OrderForm';

const Palladium = () => {
  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      
      <Helmet>
        <title>Buy Physical Palladium - PBCEx | Palladium Coins & Bars</title>
        <meta
          name='description'
          content='Purchase physical palladium coins and bars with insured shipping. Live palladium prices and secure delivery worldwide.'
        />
      </Helmet>

      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-foreground mb-4'>
              Buy Physical Palladium
            </h1>
            <p className='text-lg text-muted-foreground'>
              Purchase palladium coins and bars with secure, insured delivery worldwide
            </p>
          </div>

          <OrderForm
            metalType='palladium'
            symbol='XPD'
            price='$1,156.30'
            change='+2.1%'
            isPositive={true}
            icon='⚫'
            minimumOrder='1 gram'
            deliveryInfo='3–5 business days (domestic), 7–14 business days (international). Fully insured and tracked by FedEx.'
          />
        </div>
      </div>
    </div>
  );
};

export default Palladium;