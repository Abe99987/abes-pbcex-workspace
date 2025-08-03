import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, ShoppingCart, Package, Coins } from "lucide-react";
import BuyAssetModal from "./BuyAssetModal";
import RealizeAssetModal from "./RealizeAssetModal";
import BorrowingModal from "./BorrowingModal";

const AssetPricing = () => {
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [realizeModalOpen, setRealizeModalOpen] = useState(false);
  const [borrowingModalOpen, setBorrowingModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  const assets = [
    // Top Row Assets (live and tradable)
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
      isLive: true,
      tooltip: "OSPT is a fully redeemable platinum-backed token issued by Orbiko. Tokens are 1:1 backed by platinum stored in insured vaults and are transparently audited."
    },
    // Bottom Row Assets
    {
      name: "Libyan Crude Oil",
      symbol: "NOC",
      price: "$76.45",
      change: "+1.8%",
      isPositive: true,
      icon: "🇱🇾",
      description: "NOC Per Barrel",
      isLive: true
    },
    {
      name: "Brent Crude Oil",
      symbol: "BRENT",
      price: "$79.15",
      change: "+2.3%",
      isPositive: true,
      icon: "⚡",
      description: "Per Barrel",
      isLive: true
    },
    {
      name: "Lithium",
      symbol: "LI",
      price: "$28,500",
      change: "+0.0%",
      isPositive: true,
      icon: "🔋",
      description: "Per Metric Ton",
      isLive: false,
      comingSoon: true
    }
  ];

  return (
    <section id="assets" className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Live Asset Prices
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real-time pricing for all supported assets. Trade with confidence 
            knowing you're getting fair market value.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {assets.map((asset) => (
            <Card key={asset.symbol} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-gold/30 relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl">{asset.icon}</div>
                  <div className="flex items-center gap-2">
                    {asset.comingSoon && (
                      <Badge variant="outline" className="text-xs bg-gold/10 text-gold border-gold/30">
                        Early Access
                      </Badge>
                    )}
                    <Badge 
                      variant={asset.isPositive ? "default" : "destructive"}
                      className="flex items-center space-x-1"
                    >
                      {asset.isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{asset.change}</span>
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <h3 className="font-semibold text-foreground">{asset.name}</h3>
                  <div className="text-2xl font-bold text-primary">{asset.price}</div>
                  <p className="text-sm text-muted-foreground">{asset.description}</p>
                </div>

                {/* Action Buttons - Show for all assets except generic ones */}
                {asset.isLive && (
                  <div className="space-y-2 mt-4 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity duration-300">
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setSelectedAsset(asset);
                                setBuyModalOpen(true);
                              }}
                            >
                              <ShoppingCart className="w-3 h-3 mr-1" />
                              Buy
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {asset.symbol === "XPT" ? "Purchase tokenized platinum backed by OSPT" : 
                               asset.symbol === "NOC" ? "Buy Libyan NOC crude oil contracts" :
                               asset.symbol === "BRENT" ? "Buy Brent crude oil contracts" :
                               `Purchase tokenized ${asset.name.split(' ')[0].toLowerCase()} at real-time market price`}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setSelectedAsset(asset);
                                setRealizeModalOpen(true);
                              }}
                            >
                              <Package className="w-3 h-3 mr-1" />
                              Realize
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {asset.symbol === "XPT" ? "Redeem your digital platinum for physical delivery" :
                               asset.symbol === "NOC" ? "Sell NOC contracts or request delivery" :
                               asset.symbol === "BRENT" ? "Sell Brent contracts or request delivery" :
                               `Physically redeem your digital ${asset.name.split(' ')[0].toLowerCase()} balance`}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* Borrow Against Precious Metals - Gold and Platinum */}
                    {(asset.symbol === "AU" || asset.symbol === "XPT") && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="premium"
                              className="w-full"
                              onClick={() => {
                                setSelectedAsset(asset);
                                setBorrowingModalOpen(true);
                              }}
                            >
                              <Coins className="w-3 h-3 mr-1" />
                              {asset.symbol === "AU" ? "Borrow Against Gold" : "Borrow Against Platinum"}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{asset.tooltip || "Asset-Based Financing — No Credit Checks. Instant Cash. Always Backed."}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                )}

                {/* Token Raise Button - For coming soon assets */}
                {asset.comingSoon && (
                  <div className="space-y-2 mt-4">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="premium"
                            className="w-full"
                            disabled
                          >
                            <Coins className="w-3 h-3 mr-1" />
                            Token Raise - Coming Soon
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Early access token raise opportunity with 5% rebate - launching soon!</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Prices updated every 30 seconds • Last update: {new Date().toLocaleTimeString()}
          </p>
          <div className="mt-2 text-xs text-muted-foreground">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="underline decoration-dotted cursor-help">
                    Delivery insured by Dillon Gage, fully tracked & verified
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>All physical deliveries are insured, tracked, and verified by our trusted partner Dillon Gage</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
    </section>
  );
};

export default AssetPricing;