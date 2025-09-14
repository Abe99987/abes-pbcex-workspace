import { useEffect, useState } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

import TradingChart from './TradingChart';
import OrderBook from './OrderBook';
import OrderPanel from './OrderPanel';
import MarketData from './MarketData';
import OrderHistory from './OrderHistory';
import TradingFooter from './TradingFooter';
import { tradeAdapter } from '@/lib/api';

const SpotUSDCInterface = () => {
  const [selectedPair, setSelectedPair] = useState('GOLD/USDC');
  const [selectedStablecoin, setSelectedStablecoin] = useState('USDC');
  const [settlingBanner, setSettlingBanner] = useState('');

  useEffect(() => {
    setSettlingBanner(`Settling in ${selectedStablecoin}`);
    const sub = tradeAdapter.streamPrices(selectedPair);
    return () => sub.close();
  }, [selectedPair, selectedStablecoin]);

  return (
    <div className='min-h-screen bg-black text-white flex flex-col'>
      <div className='flex-1 flex flex-col'>
        <ResizablePanelGroup direction='horizontal' className='flex-1'>
          {/* Left Panel - Market Data */}
          <ResizablePanel
            defaultSize={20}
            minSize={15}
            className='hidden lg:block'
          >
            <div className='h-full border-r border-gray-800 bg-black'>
              <MarketData
                selectedPair={selectedPair}
                onSelectPair={setSelectedPair}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className='hidden lg:flex' />

          {/* Center Panel - Chart and Orders */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <ResizablePanelGroup direction='vertical'>
              {/* Chart */}
              <ResizablePanel defaultSize={75} minSize={60}>
                <div className='flex-1 min-h-[420px] border-b border-gray-800 bg-black'>
                  <TradingChart pair={selectedPair} />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Order History and Market Info */}
              <ResizablePanel defaultSize={25} minSize={20}>
                <Tabs defaultValue='orders' className='h-full bg-black'>
                  <TabsList className='w-full justify-start bg-gray-900 border-b border-gray-800 rounded-none h-10'>
                    <TabsTrigger value='orders' className='text-xs'>
                      Order History
                    </TabsTrigger>
                    <TabsTrigger value='trades' className='text-xs'>
                      Trade History
                    </TabsTrigger>
                    <TabsTrigger value='positions' className='text-xs'>
                      Positions
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value='orders' className='flex-1 mt-0'>
                    <OrderHistory type='active' />
                  </TabsContent>
                  <TabsContent value='trades' className='p-4'>
                    <div className='text-gray-400 text-sm'>
                      No recent trades
                    </div>
                  </TabsContent>
                  <TabsContent value='positions' className='p-4'>
                    <div className='text-gray-400 text-sm'>
                      No open positions
                    </div>
                  </TabsContent>
                </Tabs>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle className='hidden lg:flex' />

          {/* Right Panel - Order Book and Order Entry */}
          <ResizablePanel
            defaultSize={20}
            minSize={15}
            className='hidden lg:block'
          >
            <ResizablePanelGroup direction='vertical'>
              {/* Order Book */}
              <ResizablePanel defaultSize={60} minSize={40}>
                <div className='h-full border-b border-gray-800 bg-black'>
                  <OrderBook pair={selectedPair} />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Order Panel - USDC settlement mode with toggle */}
              <ResizablePanel defaultSize={40} minSize={30}>
                <div className='h-full bg-black'>
                  {/* USDC/USDT Toggle */}
                  <div className='p-3 border-b border-gray-800'>
                    <div className='flex gap-2 mb-3'>
                      <Button
                        variant={
                          selectedStablecoin === 'USDC' ? 'default' : 'outline'
                        }
                        size='sm'
                        onClick={() => setSelectedStablecoin('USDC')}
                        className={`flex-1 text-xs h-10 ${selectedStablecoin === 'USDC' ? 'bg-yellow-500 text-black hover:bg-yellow-600' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}
                      >
                        USDC • $12,450
                      </Button>
                      <Button
                        variant={
                          selectedStablecoin === 'USDT' ? 'default' : 'outline'
                        }
                        size='sm'
                        onClick={() => setSelectedStablecoin('USDT')}
                        className={`flex-1 text-xs h-10 ${selectedStablecoin === 'USDT' ? 'bg-yellow-500 text-black hover:bg-yellow-600' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}
                      >
                        USDT • $8,250
                      </Button>
                    </div>

                    {/* Locked Settlement Line */}
                    <div className='text-xs text-gray-400 mb-2'>
                      {settlingBanner}
                    </div>

                    {/* Trading Balance */}
                    <div className='p-2 bg-gray-900/50 rounded border border-gray-700'>
                      <div className='text-xs text-gray-400 mb-1'>
                        Trading balance — {selectedStablecoin}:
                      </div>
                      <div className='text-sm font-mono text-white'>
                        {selectedStablecoin === 'USDC'
                          ? '12,450.00 USDC'
                          : '8,250.00 USDT'}
                      </div>
                    </div>
                  </div>

                  {/* Rest of Order Panel */}
                  <OrderPanel
                    pair={selectedPair}
                    settlementAsset={selectedStablecoin}
                    settlementMode='usdc'
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Mobile Order Panel */}
        <div className='lg:hidden border-t border-gray-800'>
          <div className='bg-black'>
            {/* Mobile USDC/USDT Toggle */}
            <div className='p-3 border-b border-gray-800'>
              <div className='flex gap-2 mb-3'>
                <Button
                  variant={
                    selectedStablecoin === 'USDC' ? 'default' : 'outline'
                  }
                  size='sm'
                  onClick={() => setSelectedStablecoin('USDC')}
                  className={`flex-1 text-xs h-10 ${selectedStablecoin === 'USDC' ? 'bg-yellow-500 text-black hover:bg-yellow-600' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}
                >
                  USDC • $12,450
                </Button>
                <Button
                  variant={
                    selectedStablecoin === 'USDT' ? 'default' : 'outline'
                  }
                  size='sm'
                  onClick={() => setSelectedStablecoin('USDT')}
                  className={`flex-1 text-xs h-10 ${selectedStablecoin === 'USDT' ? 'bg-yellow-500 text-black hover:bg-yellow-600' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}
                >
                  USDT • $8,250
                </Button>
              </div>

              <div className='text-xs text-gray-400 mb-2'>{settlingBanner}</div>

              <div className='p-2 bg-gray-900/50 rounded border border-gray-700'>
                <div className='text-xs text-gray-400 mb-1'>
                  Trading balance — {selectedStablecoin}:
                </div>
                <div className='text-sm font-mono text-white'>
                  {selectedStablecoin === 'USDC'
                    ? '12,450.00 USDC'
                    : '8,250.00 USDT'}
                </div>
              </div>
            </div>

            <OrderPanel
              pair={selectedPair}
              settlementAsset={selectedStablecoin}
              settlementMode='usdc'
            />
          </div>
        </div>
      </div>

      <TradingFooter />
    </div>
  );
};

export default SpotUSDCInterface;
