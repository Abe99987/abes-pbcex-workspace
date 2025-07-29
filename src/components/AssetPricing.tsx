import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

const AssetPricing = () => {
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
            <Card key={asset.symbol} className="hover:shadow-lg transition-all duration-300 border-border/50 hover:border-gold/30">
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
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">{asset.name}</h3>
                  <div className="text-2xl font-bold text-primary">{asset.price}</div>
                  <p className="text-sm text-muted-foreground">{asset.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Prices updated every 30 seconds • Last update: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </section>
  );
};

export default AssetPricing;