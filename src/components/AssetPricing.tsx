import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, ShoppingCart, Package } from "lucide-react";
import BuyAssetModal from "./BuyAssetModal";
import RealizeAssetModal from "./RealizeAssetModal";

const AssetPricing = () => {
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [realizeModalOpen, setRealizeModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  const assets = [
    {
      name: "Gold (XAU)",
      symbol: "AU",
      price: "$2,048.50",
      change: "+1.2%",
      isPositive: true,
      icon: "🥇",
      description: "Per Troy Ounce"
    },
    {
      name: "Silver (XAG)",
      symbol: "AG",
      price: "$24.85",
      change: "+0.8%",
      isPositive: true,
      icon: "🥈",
      description: "Per Troy Ounce"
    },
    {
      name: "Libyan Dinar",
      symbol: "LYD",
      price: "$0.207",
      change: "-0.3%",
      isPositive: false,
      icon: "🏛️",
      description: "vs USD"
    },
    {
      name: "Crude Oil",
      symbol: "OIL",
      price: "$78.20",
      change: "+2.1%",
      isPositive: true,
      icon: "🛢️",
      description: "Per Barrel"
    }
  ];

  return (
    <section id="assets" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Live Asset Prices
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real-time pricing for all supported assets. Trade with confidence 
            knowing you're getting fair market value.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {assets.map((asset) => (
            <Card key={asset.symbol} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-gold/30 relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl">{asset.icon}</div>
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
                
                <div className="space-y-2 mb-4">
                  <h3 className="font-semibold text-foreground">{asset.name}</h3>
                  <div className="text-2xl font-bold text-primary">{asset.price}</div>
                  <p className="text-sm text-muted-foreground">{asset.description}</p>
                </div>

                {/* Action Buttons - Only show for Gold and Silver */}
                {(asset.symbol === "AU" || asset.symbol === "AG") && (
                  <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity duration-300">
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
                          <p>Purchase tokenized {asset.name.split(' ')[0].toLowerCase()} at real-time market price</p>
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
                          <p>Physically redeem your digital {asset.name.split(' ')[0].toLowerCase()} balance</p>
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
        </>
      )}
    </section>
  );
};

export default AssetPricing;