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
import BorrowingModal from "@/components/BorrowingModal";
import Navigation from "@/components/Navigation";

const Realize = () => {
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [realizeModalOpen, setRealizeModalOpen] = useState(false);
  const [borrowingModalOpen, setBorrowingModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const navigate = useNavigate();

  // Asset list for realize page
  const assets = [
    {
      name: "Gold (XAU)",
      symbol: "AU",
      price: "$2,048.50",
      change: "+1.2%",
      isPositive: true,
      icon: "🥇",
      description: "Per Troy Ounce",
      isLive: true
    },
    {
      name: "Silver (XAG)",
      symbol: "AG",
      price: "$24.85",
      change: "+0.8%",
      isPositive: true,
      icon: "🥈",
      description: "Per Troy Ounce",
      isLive: true
    },
    {
      name: "Platinum (XPT)",
      symbol: "XPT",
      price: "$924.80",
      change: "+0.6%",
      isPositive: true,
      icon: "⚪",
      description: "Per Troy Ounce",
      isLive: true
    },
    {
      name: "Palladium (XPD)",
      symbol: "XPD",
      price: "$1,156.30",
      change: "+2.1%",
      isPositive: true,
      icon: "⚫",
      description: "Per Troy Ounce",
      isLive: true
    },
    {
      name: "Copper (XCU)",
      symbol: "XCU",
      price: "$8,450.00",
      change: "+1.5%",
      isPositive: true,
      icon: "🟤",
      description: "Per Metric Ton",
      isLive: true
    },
    {
      name: "Oil Fulfillment",
      symbol: "OIL",
      price: "$76.45",
      change: "+1.8%",
      isPositive: true,
      icon: "🛢️",
      description: "Per Barrel",
      isLive: true
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
            Realize Assets
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Convert your digital assets into physical delivery. All shipments are insured and tracked by FedEx.
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
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedAsset(asset);
                                setBuyModalOpen(true);
                              }}
                            >
                              <ShoppingCart className="w-3 h-3 lg:mr-1" />
                              <span className="hidden lg:inline">Buy</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Buy {asset.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedAsset(asset);
                                setRealizeModalOpen(true);
                              }}
                            >
                              <Package className="w-3 h-3 lg:mr-1" />
                              <span className="hidden lg:inline">Sell</span>
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
                               size="sm"
                               variant="premium"
                               onClick={() => {
                                 setSelectedAsset(asset);
                                 setRealizeModalOpen(true);
                               }}
                             >
                               <Truck className="w-3 h-3 lg:mr-1" />
                               <span className="hidden lg:inline">Receive Physical {asset.name.split(' ')[0]}</span>
                             </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Request physical delivery of {asset.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedAsset(asset);
                              }}
                            >
                              <Send className="w-3 h-3 lg:mr-1" />
                              <span className="hidden lg:inline">Send</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Send/Receive {asset.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* Second Row of Buttons */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                            >
                              <CreditCard className="w-3 h-3 lg:mr-1" />
                              <span className="hidden lg:inline">Spend</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Spend {asset.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                            >
                              <ArrowUpDown className="w-3 h-3 lg:mr-1" />
                              <span className="hidden lg:inline">Convert</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Convert {asset.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                            >
                              <Upload className="w-3 h-3 lg:mr-1" />
                              <span className="hidden lg:inline">Deposit</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Deposit {asset.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                            >
                              <Download className="w-3 h-3 lg:mr-1" />
                              <span className="hidden lg:inline">Withdraw</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Withdraw {asset.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* Delivery Note */}
                    <div className="mt-3 text-center lg:text-left">
                      <p className="text-xs text-muted-foreground">
                        📦 Send or receive this asset anywhere FedEx delivers
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
            All physical deliveries are fully insured and tracked via FedEx
          </p>
          <p className="text-xs text-muted-foreground">
            Delivery times: 1-3 business days domestic, 3-7 business days international
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