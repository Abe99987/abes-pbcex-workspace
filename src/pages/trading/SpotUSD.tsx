import Navigation from '@/components/Navigation';
import SpotUSDInterface from '@/components/trading/SpotUSDInterface';

const SpotUSD = () => {
  return (
    <div className='min-h-screen bg-background overflow-y-auto'>
      <Navigation />
      <SpotUSDInterface />
    </div>
  );
};

export default SpotUSD;