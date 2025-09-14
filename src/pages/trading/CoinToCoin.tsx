import Navigation from '@/components/Navigation';
import CoinToCoinInterface from '@/components/trading/CoinToCoinInterface';

const CoinToCoin = () => {
  return (
    <div className='min-h-screen bg-background overflow-y-auto'>
      <Navigation />
      <CoinToCoinInterface />
    </div>
  );
};

export default CoinToCoin;