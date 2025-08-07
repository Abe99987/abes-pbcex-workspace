import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Package, 
  Send, 
  CreditCard, 
  ArrowUpDown, 
  Download,
  Upload,
  BarChart3,
  Truck
} from "lucide-react";
import BuyAssetModal from "@/components/BuyAssetModal";
import RealizeAssetModal from "@/components/RealizeAssetModal";
import BuyPhysicalModal from "@/components/BuyPhysicalModal";
import BorrowingModal from "@/components/BorrowingModal";
import Navigation from "@/components/Navigation";

const Realize = () => {
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [realizeModalOpen, setRealizeModalOpen] = useState(false);
  const [buyPhysicalModalOpen, setBuyPhysicalModalOpen] = useState(false);
  const [borrowingModalOpen, setBorrowingModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const navigate = useNavigate();

  // Asset list for shop page
  const assets = [
    {
      name: "Gold (XAU)",
      symbol: "AU",
      price: "$2,048.50",
      change: "+1.2%",
      isPositive: true,
      icon: "🥇",
      description: "Per Troy Ounce",
      isLive: true,
      minimumOrder: "1 gram",
      deliveryInfo: "3–5 business days (domestic), 7–14 business days (international). Fully insured and tracked by FedEx."
    },
    {
      name: "Silver (XAG)",
      symbol: "AG",
      price: "$24.85",
      change: "+0.8%",
      isPositive: true,
      icon: "🥈",
      description: "Per Troy Ounce",
      isLive: true,
      minimumOrder: "1 gram",
      deliveryInfo: "3–5 business days (domestic), 7–14 business days (international). Fully insured and tracked by FedEx."
    },
    {
      name: "Platinum (XPT)",
      symbol: "XPT",
      price: "$924.80",
      change: "+0.6%",
      isPositive: true,
      icon: "⚪",
      description: "Per Troy Ounce",
      isLive: true,
      minimumOrder: "1 gram",
      deliveryInfo: "3–5 business days (domestic), 7–14 business days (international). Fully insured and tracked by FedEx."
    },
    {
      name: "Palladium (XPD)",
      symbol: "XPD",
      price: "$1,156.30",
      change: "+2.1%",
      isPositive: true,
      icon: "⚫",
      description: "Per Troy Ounce",
      isLive: true,
      minimumOrder: "1 gram",
      deliveryInfo: "3–5 business days (domestic), 7–14 business days (international). Fully insured and tracked by FedEx."
    },
    {
      name: "Copper (XCU)",
      symbol: "XCU",
      price: "$8,450.00",
      change: "+1.5%",
      isPositive: true,
      icon: "🟤",
      description: "Per Metric Ton",
      isLive: true,
      minimumOrder: "1 ton",
      deliveryInfo: "3–5 weeks. Fully insured and tracked by Maersk Shipping."
    },
    {
      name: "Crude Oil",
      symbol: "OIL",
      price: "$76.45",
      change: "+1.8%",
      isPositive: true,
      icon: "🛢️",
      description: "Per Barrel",
      isLive: true,
      minimumOrder: "500,000 barrels",
      deliveryInfo: "3–5 weeks. Fully insured and tracked by Maersk Shipping."
    }
  ];

  const handleTradingChart = (asset: any) => {
    navigate(`/trading?symbol=${asset.symbol}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Buy Physical Assets and Tokens
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Purchase and receive physical delivery of precious metals and commodities. All shipments are insured and tracked by FedEx or Maersk.
          </p>
        </div>

        {/* Assets Grid */}
        <div className="space-y-6">
          {assets.map((asset) => (
            <Card key={asset.symbol} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-gold/30">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  
                  {/* Asset Info - Left Side */}
                  <div className="lg:col-span-3 flex items-center space-x-4">
                    <div className="text-3xl">{asset.icon}</div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{asset.name}</h3>
                      <p className="text-sm text-muted-foreground">{asset.description}</p>
                      {asset.minimumOrder && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Minimum Order: {asset.minimumOrder}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price & Change */}
                  <div className="lg:col-span-2 text-center lg:text-left">
                    <div className="text-xl font-bold text-primary mb-1">{asset.price}</div>
                    <Badge 
                      variant={asset.isPositive ? "default" : "destructive"}
                      className="flex items-center space-x-1 w-fit"
                    >
                      {asset.isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{asset.change}</span>
                    </Badge>
                  </div>

                  {/* Simplified Price Chart */}
                  <div className="lg:col-span-3 flex justify-center">
                    <div className="w-32 h-16 bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                      <BarChart3 className="w-6 h-6 text-primary z-10" />
                      <span className="text-xs text-muted-foreground absolute bottom-1 right-1">1Y</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="lg:col-span-4">
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              className="h-10 px-4"
                              onClick={() => {
                                setSelectedAsset(asset);
                                setBuyModalOpen(true);
                              }}
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Buy
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Purchase using USDC, PAXG, bank wire, or debit card</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              className="h-10 px-4"
                              onClick={() => {
                                setSelectedAsset(asset);
                                setRealizeModalOpen(true);
                              }}
                            >
                              <Package className="w-4 h-4 mr-2" />
                              Sell
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Sell {asset.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <Button
                               variant="premium"
                               className="h-10 px-4 bg-black text-white hover:bg-black/90"
                               onClick={() => {
                                 setSelectedAsset(asset);
                                 setBuyPhysicalModalOpen(true);
                               }}
                             >
                               <Truck className="w-4 h-4 mr-2" />
                               Order
                             </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ship physical asset to your address. Token will be burned on fulfillment.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              className="h-10 px-4"
                              onClick={() => {
                                setSelectedAsset(asset);
                              }}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Send
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Send/Receive {asset.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              className="h-10 px-4"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Deposit
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Deposit {asset.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* Delivery Note */}
                    <div className="mt-4 text-center lg:text-left">
                      <p className="text-sm text-muted-foreground">
                        Delivery ETA: {asset.deliveryInfo}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-sm text-muted-foreground">
            All physical deliveries are fully insured and tracked via FedEx or Maersk
          </p>
          <p className="text-xs text-muted-foreground">
            Delivery times vary by asset and location. See individual asset details above.
          </p>
        </div>
      </div>

      {/* Modals */}
      {selectedAsset && (
        <>
          <BuyAssetModal
            isOpen={buyModalOpen}
            onClose={() => setBuyModalOpen(false)}
            asset={selectedAsset}
          />
          <RealizeAssetModal
            isOpen={realizeModalOpen}
            onClose={() => setRealizeModalOpen(false)}
            asset={selectedAsset}
          />
          <BuyPhysicalModal
            isOpen={buyPhysicalModalOpen}
            onClose={() => setBuyPhysicalModalOpen(false)}
            asset={selectedAsset}
          />
          <BorrowingModal
            isOpen={borrowingModalOpen}
            onClose={() => setBorrowingModalOpen(false)}
            asset={selectedAsset}
          />
        </>
      )}
    </div>
  );
};

export default Realize;