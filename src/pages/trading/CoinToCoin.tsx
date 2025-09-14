import Navigation from '@/components/Navigation';
import CoinToCoinInterface from '@/components/trading/CoinToCoinInterface';

const CoinToCoin = () => {
  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      <div className='overflow-y-auto' style={{ height: 'calc(100vh - 64px)' }}>
        <CoinToCoinInterface />
      </div>
    </div>
  );
};

export default CoinToCoin;