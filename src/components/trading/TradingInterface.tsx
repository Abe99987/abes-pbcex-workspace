import { useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TradingChart from "./TradingChart";
import OrderBook from "./OrderBook";
import OrderPanel from "./OrderPanel";
import MarketData from "./MarketData";
import OrderHistory from "./OrderHistory";

const TradingInterface = () => {
  const [selectedPair, setSelectedPair] = useState("GOLD/USD");

  return (
    <div className="h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="min-h-screen">
        {/* Left Panel - Market Data */}
        <ResizablePanel defaultSize={20} minSize={15}>
          <div className="h-full border-r border-slate-800">
            <MarketData 
              selectedPair={selectedPair} 
              onSelectPair={setSelectedPair} 
            />
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Center Panel - Chart and Orders */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <ResizablePanelGroup direction="vertical">
            {/* Chart */}
            <ResizablePanel defaultSize={70} minSize={50}>
              <div className="h-full border-b border-slate-800">
                <TradingChart pair={selectedPair} />
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            {/* Order Management */}
            <ResizablePanel defaultSize={30} minSize={20}>
              <Tabs defaultValue="orders" className="h-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-900">
                  <TabsTrigger value="orders">Active Orders</TabsTrigger>
                  <TabsTrigger value="history">Order History</TabsTrigger>
                </TabsList>
                <TabsContent value="orders" className="h-full pt-2">
                  <OrderHistory type="active" />
                </TabsContent>
                <TabsContent value="history" className="h-full pt-2">
                  <OrderHistory type="history" />
                </TabsContent>
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Right Panel - Order Book and Order Panel */}
        <ResizablePanel defaultSize={20} minSize={15}>
          <ResizablePanelGroup direction="vertical">
            {/* Order Book */}
            <ResizablePanel defaultSize={60} minSize={40}>
              <div className="h-full border-b border-slate-800">
                <OrderBook pair={selectedPair} />
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            {/* Order Panel */}
            <ResizablePanel defaultSize={40} minSize={30}>
              <OrderPanel pair={selectedPair} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default TradingInterface;