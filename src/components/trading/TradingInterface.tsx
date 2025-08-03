import { useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import TradingChart from "./TradingChart";
import OrderBook from "./OrderBook";
import OrderPanel from "./OrderPanel";
import MarketData from "./MarketData";
import OrderHistory from "./OrderHistory";
import TradingFooter from "./TradingFooter";

const TradingInterface = () => {
  const [selectedPair, setSelectedPair] = useState("GOLD/USD");

  return (
    <div className="h-screen bg-black text-white overflow-hidden flex flex-col">
      <div className="flex-1 flex flex-col">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left Panel - Market Data */}
          <ResizablePanel defaultSize={20} minSize={15} className="hidden lg:block">
            <div className="h-full border-r border-gray-800 bg-black">
              <MarketData 
                selectedPair={selectedPair} 
                onSelectPair={setSelectedPair} 
              />
            </div>
          </ResizablePanel>
        
          <ResizableHandle withHandle className="hidden lg:flex" />
          
          {/* Center Panel - Chart and Orders */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <ResizablePanelGroup direction="vertical">
              {/* Chart */}
              <ResizablePanel defaultSize={75} minSize={60}>
                <div className="h-full border-b border-gray-800 bg-black">
                  <TradingChart pair={selectedPair} />
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              {/* Order Management */}
              <ResizablePanel defaultSize={25} minSize={20}>
                <div className="bg-black h-full">
                  <Tabs defaultValue="positions" className="h-full">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-900 border-b border-gray-800">
                      <TabsTrigger value="positions" className="text-xs">Positions</TabsTrigger>
                      <TabsTrigger value="orders" className="text-xs">Open Orders</TabsTrigger>
                      <TabsTrigger value="history" className="text-xs">Order History</TabsTrigger>
                    </TabsList>
                    <TabsContent value="positions" className="h-full pt-2 px-4">
                      <div className="text-gray-400 text-sm">No open positions</div>
                    </TabsContent>
                    <TabsContent value="orders" className="h-full pt-2">
                      <OrderHistory type="active" />
                    </TabsContent>
                    <TabsContent value="history" className="h-full pt-2">
                      <OrderHistory type="history" />
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        
          <ResizableHandle withHandle className="hidden lg:flex" />
          
          {/* Right Panel - Order Book and Order Panel */}
          <ResizablePanel defaultSize={20} minSize={15} className="hidden lg:block">
            <ResizablePanelGroup direction="vertical">
              {/* Order Book */}
              <ResizablePanel defaultSize={60} minSize={40}>
                <div className="h-full border-b border-gray-800 bg-black">
                  <OrderBook pair={selectedPair} />
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              {/* Order Panel */}
              <ResizablePanel defaultSize={40} minSize={30}>
                <div className="bg-black h-full">
                  <OrderPanel pair={selectedPair} />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
        
        <TradingFooter />
      </div>
    </div>
  );
};

export default TradingInterface;