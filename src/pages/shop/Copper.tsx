import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import OrderForm from '@/components/shop/OrderForm';

const Copper = () => {
  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      
      <Helmet>
        <title>Buy Physical Copper - PBCEx | Copper Rounds & Bars</title>
        <meta
          name='description'
          content='Purchase physical copper rounds and bars with insured shipping. Live copper prices and secure delivery worldwide.'
        />
      </Helmet>

      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-4xl mx-auto'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-foreground mb-4'>
              Buy Physical Copper
            </h1>
            <p className='text-lg text-muted-foreground'>
              Purchase copper rounds and bars with secure, insured delivery worldwide
            </p>
          </div>

          <OrderForm
            metalType='copper'
            symbol='XCU'
            price='$8,450.00'
            change='+1.5%'
            isPositive={true}
            icon='🟤'
            minimumOrder='1 ton'
            deliveryInfo='3–5 weeks. Fully insured and tracked by Maersk Shipping.'
          />
        </div>
      </div>
    </div>
  );
};

export default Copper;