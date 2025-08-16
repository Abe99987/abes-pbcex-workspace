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
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
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

  // Calculate category totals
  const fxTotal = fxAssets.reduce((total, asset) => {
    return total + parseFloat(asset.value.replace(/[$,]/g, ''));
  }, 0);
  
  const mineralTotal = mineralAssets.reduce((total, asset) => {
    return total + parseFloat(asset.value.replace(/[$,]/g, ''));
  }, 0);
  
  const cryptoTotal = cryptoAssets.reduce((total, asset) => {
    return total + parseFloat(asset.value.replace(/[$,]/g, ''));
  }, 0);
  
  const titledTotal = titledAssets.reduce((total, asset) => {
    return total + parseFloat(asset.value.replace(/[$,]/g, ''));
  }, 0);

  const totalPortfolioValue = fxTotal + mineralTotal + cryptoTotal + titledTotal;

  // Data for donut chart
  const chartData = [
    { name: 'Minerals', value: mineralTotal, color: '#FFD700' },
    { name: 'Crypto', value: cryptoTotal, color: '#F7931A' },
    { name: 'FX', value: fxTotal, color: '#2E86C1' },
    { name: 'Titled', value: titledTotal, color: '#6B7280' }
  ].filter(item => item.value > 0); // Only show categories with value

  const COLORS = {
    'Minerals': '#FFD700',
    'Crypto': '#F7931A', 
    'FX': '#2E86C1',
    'Titled': '#6B7280'
  };

  const handleTradingChart = (asset: any) => {
    navigate(`/trading?symbol=${asset.symbol}`);
  };

  const handleTitledAssetClick = (asset: any) => {
    if (asset.symbol === "HOME") {
      navigate("/titled-asset/1987-future-drive-pittsburgh-pa");
    }
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

        {/* Portfolio Overview */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Aggregated Totals */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground mb-4">Portfolio Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">FX Assets:</span>
                <span className="text-xl font-bold text-primary">
                  ${fxTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Commodity Assets:</span>
                <span className="text-xl font-bold text-primary">
                  ${mineralTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Crypto Assets:</span>
                <span className="text-xl font-bold text-primary">
                  ${cryptoTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Titled Assets:</span>
                <span className="text-xl font-bold text-primary">
                  ${titledTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Total Portfolio Value:</span>
                  <span className="text-2xl font-bold text-primary">
                    ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Donut Chart */}
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold text-foreground mb-4">Asset Allocation</h2>
            <div className="w-full h-80 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number, name: string) => [
                      `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      name
                    ]}
                    labelFormatter={(name: string) => `${name} (${((chartData.find(d => d.name === name)?.value || 0) / totalPortfolioValue * 100).toFixed(1)}%)`}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center Value Display */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="text-sm text-muted-foreground">Total Value</div>
                <div className="text-lg font-bold text-primary">
                  ${(totalPortfolioValue / 1000).toFixed(0)}K
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              {chartData.map((entry) => (
                <div key={entry.name} className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-muted-foreground">{entry.name}</span>
                </div>
              ))}
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
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                          <Button size="default" variant="outline" onClick={() => { setSelectedAsset(asset); setBuyModalOpen(true); }}>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            <span>Buy</span>
                          </Button>
                          <Button size="default" variant="outline" onClick={() => { setSelectedAsset(asset); setRealizeModalOpen(true); }}>
                            <Package className="w-4 h-4 mr-2" />
                            <span>Sell</span>
                          </Button>
                          <Button size="default" variant="premium" onClick={() => { setSelectedAsset(asset); setRealizeModalOpen(true); }}>
                            <Package className="w-4 h-4 mr-2" />
                            <span>Realize</span>
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                          <Button size="default" variant="outline">
                            <Send className="w-4 h-4 mr-2" />
                            <span>Send</span>
                          </Button>
                          <Button size="default" variant="outline">
                            <CreditCard className="w-4 h-4 mr-2" />
                            <span>Spend</span>
                          </Button>
                          <Button size="default" variant="outline">
                            <ArrowUpDown className="w-4 h-4 mr-2" />
                            <span>Convert</span>
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                          <Button size="default" variant="outline">
                            <Upload className="w-4 h-4 mr-2" />
                            <span>Deposit</span>
                          </Button>
                          <Button size="default" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            <span>Withdraw</span>
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
            <h2 className="text-2xl font-bold text-foreground mb-4">Commodity Assets</h2>
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
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                          <Button size="default" variant="outline" onClick={() => { setSelectedAsset(asset); setBuyModalOpen(true); }}>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            <span>Buy</span>
                          </Button>
                          <Button size="default" variant="outline" onClick={() => { setSelectedAsset(asset); setRealizeModalOpen(true); }}>
                            <Package className="w-4 h-4 mr-2" />
                            <span>Sell</span>
                          </Button>
                          <Button size="default" variant="premium" onClick={() => { setSelectedAsset(asset); setRealizeModalOpen(true); }}>
                            <Package className="w-4 h-4 mr-2" />
                            <span>Realize</span>
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                          <Button size="default" variant="outline">
                            <Send className="w-4 h-4 mr-2" />
                            <span>Send</span>
                          </Button>
                          <Button size="default" variant="outline">
                            <CreditCard className="w-4 h-4 mr-2" />
                            <span>Spend</span>
                          </Button>
                          <Button size="default" variant="outline">
                            <ArrowUpDown className="w-4 h-4 mr-2" />
                            <span>Convert</span>
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                          <Button size="default" variant="outline">
                            <Upload className="w-4 h-4 mr-2" />
                            <span>Deposit</span>
                          </Button>
                          <Button size="default" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            <span>Withdraw</span>
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
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                          <Button size="default" variant="outline" onClick={() => { setSelectedAsset(asset); setBuyModalOpen(true); }}>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            <span>Buy</span>
                          </Button>
                          <Button size="default" variant="outline" onClick={() => { setSelectedAsset(asset); setRealizeModalOpen(true); }}>
                            <Package className="w-4 h-4 mr-2" />
                            <span>Sell</span>
                          </Button>
                          <Button size="default" variant="premium" onClick={() => { setSelectedAsset(asset); setRealizeModalOpen(true); }}>
                            <Package className="w-4 h-4 mr-2" />
                            <span>Realize</span>
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                          <Button size="default" variant="outline">
                            <Send className="w-4 h-4 mr-2" />
                            <span>Send</span>
                          </Button>
                          <Button size="default" variant="outline">
                            <CreditCard className="w-4 h-4 mr-2" />
                            <span>Spend</span>
                          </Button>
                          <Button size="default" variant="outline">
                            <ArrowUpDown className="w-4 h-4 mr-2" />
                            <span>Convert</span>
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                          <Button size="default" variant="outline">
                            <Upload className="w-4 h-4 mr-2" />
                            <span>Deposit</span>
                          </Button>
                          <Button size="default" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            <span>Withdraw</span>
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
                <Card 
                  key={asset.symbol} 
                  className={`group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-gold/30 ${
                    asset.symbol === "HOME" ? "cursor-pointer" : ""
                  }`}
                  onClick={() => asset.symbol === "HOME" && handleTitledAssetClick(asset)}
                >
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