import Navigation from '@/components/Navigation';
import CoinTradingInterface from '@/components/trading/CoinTradingInterface';

const CoinTrading = () => {
  return (
    <div className='min-h-screen bg-background overflow-y-auto'>
      <Navigation />
      <CoinTradingInterface />
    </div>
  );
};

export default CoinTrading;
