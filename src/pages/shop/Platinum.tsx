import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import OrderForm from '@/components/shop/OrderForm';

const Platinum = () => {
  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      
      <Helmet>
        <title>Buy Physical Platinum - PBCEx | Platinum Coins & Bars</title>
        <meta
          name='description'
          content='Purchase physical platinum coins and bars with insured shipping. Live platinum prices and secure delivery worldwide.'
        />
      </Helmet>

      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-foreground mb-4'>
              Buy Physical Platinum
            </h1>
            <p className='text-lg text-muted-foreground'>
              Purchase platinum coins and bars with secure, insured delivery worldwide
            </p>
          </div>

          <OrderForm
            metalType='platinum'
            symbol='XPT'
            price='$924.80'
            change='+0.6%'
            isPositive={true}
            icon='⚪'
            minimumOrder='1 gram'
            deliveryInfo='3–5 business days (domestic), 7–14 business days (international). Fully insured and tracked by FedEx.'
          />
        </div>
      </div>
    </div>
  );
};

export default Platinum;