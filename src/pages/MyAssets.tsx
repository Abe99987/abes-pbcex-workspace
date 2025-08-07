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

  // Asset categories
  const fxAssets = [
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
      isLive: true,
      category: "FX Assets"
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
      isLive: true,
      category: "FX Assets"
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
      isLive: true,
      category: "FX Assets"
    }
  ];

  const mineralAssets = [
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
      isLive: true,
      category: "Mineral Assets"
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
      isLive: true,
      category: "Mineral Assets"
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
      isLive: true,
      category: "Mineral Assets"
    }
  ];

  const cryptoAssets = [
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
      isLive: true,
      category: "Crypto Assets"
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
      isLive: true,
      category: "Crypto Assets"
    }
  ];

  const titledAssets = [
    {
      name: "Tesla Model Y",
      symbol: "TESLA",
      price: "$27,000",
      change: "0.0%",
      isPositive: true,
      icon: "🚗",
      description: "VIN: 5YJ3E1EA8MF123456",
      balance: "Market Value",
      value: "$27,000",
      isLive: false,
      category: "Titled Assets",
      remainingBalance: "$36,000",
      actions: ["Sell Asset", "Transfer Asset", "Pay", "View Title"]
    },
    {
      name: "Home — 1987 Future Drive, Pittsburgh, PA 15201",
      symbol: "HOME",
      price: "$307,000",
      change: "0.0%",
      isPositive: true,
      icon: "🏠",
      description: "Market Value",
      balance: "Remaining Balance",
      value: "$307,000",
      isLive: false,
      category: "Titled Assets",
      remainingBalance: "$180,000",
      debtAmount: "$127,000",
      actions: ["Sell Asset", "Transfer Asset", "Pay", "View Title"]
    }
  ];

  const allAssets = [...fxAssets, ...mineralAssets, ...cryptoAssets, ...titledAssets];

  const totalPortfolioValue = allAssets.reduce((total, asset) => {
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

        {/* Assets Grid by Category */}
        <div className="space-y-8">
          {/* FX Assets */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">FX Assets</h2>
            <div className="space-y-4">
              {fxAssets.map((asset) => (
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
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedAsset(asset); setBuyModalOpen(true); }}>
                            <ShoppingCart className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Buy</span>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setSelectedAsset(asset); setRealizeModalOpen(true); }}>
                            <Package className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Sell</span>
                          </Button>
                          <Button size="sm" variant="premium" onClick={() => { setSelectedAsset(asset); setRealizeModalOpen(true); }}>
                            <Package className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Realize</span>
                          </Button>
                          <Button size="sm" variant="outline">
                            <Send className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Send</span>
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                          <Button size="sm" variant="outline">
                            <CreditCard className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Spend</span>
                          </Button>
                          <Button size="sm" variant="outline">
                            <ArrowUpDown className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Convert</span>
                          </Button>
                          <Button size="sm" variant="outline">
                            <Upload className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Deposit</span>
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Withdraw</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Mineral Assets */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Mineral Assets</h2>
            <div className="space-y-4">
              {mineralAssets.map((asset) => (
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
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedAsset(asset); setBuyModalOpen(true); }}>
                            <ShoppingCart className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Buy</span>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setSelectedAsset(asset); setRealizeModalOpen(true); }}>
                            <Package className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Sell</span>
                          </Button>
                          <Button size="sm" variant="premium" onClick={() => { setSelectedAsset(asset); setRealizeModalOpen(true); }}>
                            <Package className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Realize</span>
                          </Button>
                          <Button size="sm" variant="outline">
                            <Send className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Send</span>
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                          <Button size="sm" variant="outline">
                            <CreditCard className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Spend</span>
                          </Button>
                          <Button size="sm" variant="outline">
                            <ArrowUpDown className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Convert</span>
                          </Button>
                          <Button size="sm" variant="outline">
                            <Upload className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Deposit</span>
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Withdraw</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Crypto Assets */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Crypto Assets</h2>
            <div className="space-y-4">
              {cryptoAssets.map((asset) => (
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
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedAsset(asset); setBuyModalOpen(true); }}>
                            <ShoppingCart className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Buy</span>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setSelectedAsset(asset); setRealizeModalOpen(true); }}>
                            <Package className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Sell</span>
                          </Button>
                          <Button size="sm" variant="premium" onClick={() => { setSelectedAsset(asset); setRealizeModalOpen(true); }}>
                            <Package className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Realize</span>
                          </Button>
                          <Button size="sm" variant="outline">
                            <Send className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Send</span>
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                          <Button size="sm" variant="outline">
                            <CreditCard className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Spend</span>
                          </Button>
                          <Button size="sm" variant="outline">
                            <ArrowUpDown className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Convert</span>
                          </Button>
                          <Button size="sm" variant="outline">
                            <Upload className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Deposit</span>
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-3 h-3 lg:mr-1" />
                            <span className="hidden lg:inline">Withdraw</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Titled Assets */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Titled Assets</h2>
            <div className="space-y-4">
              {titledAssets.map((asset) => (
                <Card key={asset.symbol} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-gold/30">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      
                      {/* Asset Info - Left Side */}
                      <div className="lg:col-span-4 flex items-center space-x-4">
                        <div className="text-3xl">{asset.icon}</div>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">{asset.name}</h3>
                          <p className="text-sm text-muted-foreground">{asset.description}</p>
                        </div>
                      </div>

                      {/* Value Information */}
                      <div className="lg:col-span-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Market Value:</span>
                          <span className="font-semibold text-primary">{asset.value}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Remaining Balance:</span>
                          <span className="font-semibold text-foreground">{asset.remainingBalance}</span>
                        </div>
                        {asset.debtAmount && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Debt Amount:</span>
                            <span className="font-semibold text-destructive">{asset.debtAmount}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons for Titled Assets */}
                      <div className="lg:col-span-4">
                        <div className="grid grid-cols-2 gap-2">
                          {asset.actions?.map((action, index) => (
                            <Button key={index} size="sm" variant="outline">
                              <span className="text-xs">{action}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
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