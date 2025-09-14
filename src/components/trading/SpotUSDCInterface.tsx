import { useState } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import TradingChart from './TradingChart';
import OrderBook from './OrderBook';
import OrderPanel from './OrderPanel';
import MarketData from './MarketData';
import OrderHistory from './OrderHistory';
import TradingFooter from './TradingFooter';
import SettlementDropdown from './SettlementDropdown';

const SpotUSDCInterface = () => {
  const [selectedPair, setSelectedPair] = useState('GOLD/USDC');
  const [settlementAsset, setSettlementAsset] = useState('USDC');

  const handleSettlementChange = (settlement: string) => {
    setSettlementAsset(settlement);
    console.log('Settlement asset changed to:', settlement);
  };

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
                    <OrderHistory type="active" />
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
              {/* Settlement Dropdown */}
              <ResizablePanel defaultSize={10} minSize={8} maxSize={15}>
                <div className='h-full bg-black p-3 border-b border-gray-800'>
                  <SettlementDropdown
                    onSettlementChange={handleSettlementChange}
                  />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Order Book */}
              <ResizablePanel defaultSize={50} minSize={35}>
                <div className='h-full border-b border-gray-800 bg-black'>
                  <OrderBook pair={selectedPair} />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Order Panel - With settlement asset prop */}
              <ResizablePanel defaultSize={40} minSize={30}>
                <OrderPanel pair={selectedPair} settlementAsset={settlementAsset} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Mobile Order Panel */}
        <div className='lg:hidden border-t border-gray-800'>
          <div className='p-3 border-b border-gray-800'>
            <SettlementDropdown
              onSettlementChange={handleSettlementChange}
            />
          </div>
          <OrderPanel pair={selectedPair} settlementAsset={settlementAsset} />
        </div>
      </div>

      <TradingFooter />
    </div>
  );
};

export default SpotUSDCInterface;