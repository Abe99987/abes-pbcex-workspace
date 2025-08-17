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
import SettlementDropdown from "./SettlementDropdown";
import CopperInfoPanel from "./CopperInfoPanel";

const CoinTradingInterface = () => {
  const [selectedPair, setSelectedPair] = useState("GOLD/USD");
  const [settlementAsset, setSettlementAsset] = useState("PAXG");
  const [activeTab, setActiveTab] = useState("chart");

  const handleSettlementChange = (settlement: string) => {
    setSettlementAsset(settlement);
    // Here you would typically update the trading logic based on settlement asset
    console.log("Settlement asset changed to:", settlement);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
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
              {/* Chart/Info Tabs */}
              <ResizablePanel defaultSize={75} minSize={60}>
                <div className="flex-1 min-h-[420px] border-b border-gray-800 bg-black flex flex-col">
                  {/* Chart/Info Toggle - Styled like BloFin */}
                  <div className="flex border-b border-gray-800 bg-black px-4 py-2">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setActiveTab("chart")}
                        className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
                          activeTab === "chart" 
                            ? "text-white border-gold bg-gray-800/50" 
                            : "text-gray-400 border-transparent hover:text-white hover:bg-gray-800/30"
                        }`}
                      >
                        Chart
                      </button>
                      <button
                        onClick={() => setActiveTab("info")}
                        className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
                          activeTab === "info" 
                            ? "text-white border-gold bg-gray-800/50" 
                            : "text-gray-400 border-transparent hover:text-white hover:bg-gray-800/30"
                        }`}
                      >
                        Info
                      </button>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    {activeTab === "chart" ? (
                      <TradingChart pair={selectedPair} />
                    ) : (
                      <CopperInfoPanel />
                    )}
                  </div>
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              {/* Order Management */}
              <ResizablePanel defaultSize={25} minSize={20}>
                <div className="bg-black flex-none min-h-[300px] pb-6">
                  <Tabs defaultValue="positions" className="h-full">
                    <TabsList className="grid w-full grid-cols-5 bg-gray-900 border-b border-gray-800">
                      <TabsTrigger value="positions" className="text-xs">Positions</TabsTrigger>
                      <TabsTrigger value="orders" className="text-xs">Open Orders</TabsTrigger>
                      <TabsTrigger value="history" className="text-xs">Order History</TabsTrigger>
                      <TabsTrigger value="assets" className="text-xs">Assets</TabsTrigger>
                      <TabsTrigger value="bots" className="text-xs">Trading Bots</TabsTrigger>
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
                    <TabsContent value="assets" className="h-full pt-2 px-4">
                      <div className="text-gray-400 text-sm">Assets coming soon</div>
                    </TabsContent>
                    <TabsContent value="bots" className="h-full pt-2 px-4">
                      <div className="text-gray-400 text-sm">Trading Bots coming soon</div>
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        
          <ResizableHandle withHandle className="hidden lg:flex" />
          
          {/* Right Panel - Order Book, Settlement Dropdown and Order Panel */}
          <ResizablePanel defaultSize={20} minSize={15} className="hidden lg:block">
            <ResizablePanelGroup direction="vertical">
              {/* Order Book */}
              <ResizablePanel defaultSize={50} minSize={35}>
                <div className="h-full border-b border-gray-800 bg-black">
                  <OrderBook pair={selectedPair} />
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              {/* Settlement Dropdown + Order Panel */}
              <ResizablePanel defaultSize={50} minSize={35}>
                <div className="bg-black h-full flex flex-col">
                  {/* Settlement Dropdown */}
                  <SettlementDropdown onSettlementChange={handleSettlementChange} />
                  
                  {/* Order Panel */}
                  <div className="flex-1">
                    <OrderPanel pair={selectedPair} settlementAsset={settlementAsset} />
                  </div>
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

export default CoinTradingInterface;