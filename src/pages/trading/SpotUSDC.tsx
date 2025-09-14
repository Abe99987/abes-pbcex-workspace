import Navigation from '@/components/Navigation';
import SpotUSDCInterface from '@/components/trading/SpotUSDCInterface';

const SpotUSDC = () => {
  return (
    <div className='min-h-screen bg-background'>
      <Navigation />
      <div className='overflow-y-auto' style={{ height: 'calc(100vh - 64px)' }}>
        <SpotUSDCInterface />
      </div>
    </div>
  );
};

export default SpotUSDC;