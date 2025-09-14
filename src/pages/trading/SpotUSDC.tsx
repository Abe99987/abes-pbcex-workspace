import Navigation from '@/components/Navigation';
import SpotUSDCInterface from '@/components/trading/SpotUSDCInterface';

const SpotUSDC = () => {
  return (
    <div className='min-h-screen bg-background overflow-y-auto'>
      <Navigation />
      <SpotUSDCInterface />
    </div>
  );
};

export default SpotUSDC;