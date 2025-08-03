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
  BarChart3
} from "lucide-react";
import BuyAssetModal from "@/components/BuyAssetModal";
import RealizeAssetModal from "@/components/RealizeAssetModal";
import BorrowingModal from "@/components/BorrowingModal";
import Navigation from "@/components/Navigation";

const MyAssets = () => {
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [realizeModalOpen, setRealizeModalOpen] = useState(false);
  const [borrowingModalOpen, setBorrowingModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const navigate = useNavigate();

  // Extended asset list for wallet view
  const assets = [
    {
      name: "Gold (XAU)",
      symbol: "AU",
      price: "$2,048.50",
      change: "+1.2%",
      isPositive: true,
      icon: "🥇",
      description: "Per Troy Ounce",
      balance: "2.5 oz",
      value: "$5,121.25",
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
      balance: "100.0 oz",
      value: "$2,485.00",
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
      balance: "1.0 oz",
      value: "$924.80",
      isLive: true
    },
    {
      name: "USD",
      symbol: "USD",
      price: "$1.00",
      change: "0.0%",
      isPositive: true,
      icon: "💵",
      description: "United States Dollar",
      balance: "$5,000.00",
      value: "$5,000.00",
      isLive: true
    },
    {
      name: "Libyan Dinar",
      symbol: "LYD",
      price: "$0.206",
      change: "+0.1%",
      isPositive: true,
      icon: "🇱🇾",
      description: "Libyan Dinar",
      balance: "10,000.00 LYD",
      value: "$2,060.00",
      isLive: true
    },
    {
      name: "Euro",
      symbol: "EUR",
      price: "$1.085",
      change: "-0.3%",
      isPositive: false,
      icon: "💶",
      description: "European Euro",
      balance: "€1,000.00",
      value: "$1,085.00",
      isLive: true
    },
    {
      name: "Bitcoin",
      symbol: "BTC",
      price: "$43,250.00",
      change: "+2.8%",
      isPositive: true,
      icon: "₿",
      description: "Bitcoin",
      balance: "0.1 BTC",
      value: "$4,325.00",
      isLive: true
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      price: "$2,650.00",
      change: "+1.5%",
      isPositive: true,
      icon: "⟠",
      description: "Ethereum",
      balance: "2.0 ETH",
      value: "$5,300.00",
      isLive: true
    }
  ];

  const totalPortfolioValue = assets.reduce((total, asset) => {
    const numericValue = parseFloat(asset.value.replace(/[$,]/g, ''));
    return total + numericValue;
  }, 0);

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
            My Assets
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-xl text-muted-foreground">
              Manage your digital and physical assets
            </p>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
              <p className="text-2xl font-bold text-primary">
                ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Assets Grid */}
        <div className="space-y-4">
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

                  {/* Mini Chart Placeholder */}
                  <div className="lg:col-span-2 flex justify-center">
                    <div className="w-24 h-12 bg-muted rounded flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Balance & Value */}
                  <div className="lg:col-span-2 text-center lg:text-left">
                    <div className="text-sm text-muted-foreground">Balance</div>
                    <div className="font-semibold text-foreground">{asset.balance}</div>
                    <div className="text-sm text-primary font-medium">{asset.value}</div>
                  </div>

                  {/* Action Buttons */}
                  <div className="lg:col-span-3">
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
                            <p>Buy more {asset.name}</p>
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
                              variant="outline"
                              onClick={() => {
                                setSelectedAsset(asset);
                                setRealizeModalOpen(true);
                              }}
                            >
                              <Send className="w-3 h-3 lg:mr-1" />
                              <span className="hidden lg:inline">Send</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Send {asset.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTradingChart(asset)}
                            >
                              <BarChart3 className="w-3 h-3 lg:mr-1" />
                              <span className="hidden lg:inline">Chart</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Trading Chart</p>
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
                              <Download className="w-3 h-3 lg:mr-1" />
                              <span className="hidden lg:inline">Withdraw</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Withdraw {asset.name}</p>
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
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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

export default MyAssets;