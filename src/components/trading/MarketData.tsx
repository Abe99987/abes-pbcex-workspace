import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Star } from "lucide-react";

interface MarketDataProps {
  selectedPair: string;
  onSelectPair: (pair: string) => void;
}

const marketData = [
  {
    pair: "GOLD/USD",
    price: 2380.50,
    change: 1.25,
    volume: "1.2M",
    high24h: 2395.00,
    low24h: 2365.00,
  },
  {
    pair: "SILVER/USD",
    price: 31.45,
    change: -0.75,
    volume: "850K",
    high24h: 32.10,
    low24h: 31.20,
  },
  {
    pair: "OIL/USD",
    price: 85.30,
    change: 2.15,
    volume: "2.1M",
    high24h: 86.00,
    low24h: 83.50,
  },
  {
    pair: "LYD/USD",
    price: 0.21,
    change: 0.45,
    volume: "500K",
    high24h: 0.215,
    low24h: 0.208,
  },
  {
    pair: "EUR/USD",
    price: 1.0850,
    change: -0.15,
    volume: "5.5M",
    high24h: 1.0875,
    low24h: 1.0840,
  },
];

const MarketData = ({ selectedPair, onSelectPair }: MarketDataProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<string[]>(["GOLD/USD"]);

  const filteredData = marketData.filter(item =>
    item.pair.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFavorite = (pair: string) => {
    setFavorites(prev =>
      prev.includes(pair)
        ? prev.filter(p => p !== pair)
        : [...prev, pair]
    );
  };

  return (
    <div className="h-full bg-slate-950 p-4">
      <h3 className="text-sm font-semibold text-gold mb-4">Markets</h3>
      
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search pairs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-900 border-slate-700 text-slate-100"
        />
      </div>

      {/* Market List */}
      <div className="space-y-2">
        {filteredData.map((market) => (
          <div
            key={market.pair}
            className={`p-3 rounded cursor-pointer transition-colors ${
              selectedPair === market.pair
                ? "bg-gold/20 border border-gold/40"
                : "bg-slate-900 hover:bg-slate-800"
            }`}
            onClick={() => onSelectPair(market.pair)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-slate-100">{market.pair}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(market.pair);
                  }}
                >
                  <Star
                    className={`h-3 w-3 ${
                      favorites.includes(market.pair)
                        ? "fill-gold text-gold"
                        : "text-slate-400"
                    }`}
                  />
                </Button>
              </div>
              <div
                className={`text-sm font-medium ${
                  market.change >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {market.change >= 0 ? "+" : ""}{market.change}%
              </div>
            </div>
            
            <div className="space-y-1 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Price:</span>
                <span className="text-slate-100">${market.price}</span>
              </div>
              <div className="flex justify-between">
                <span>24h Vol:</span>
                <span>{market.volume}</span>
              </div>
              <div className="flex justify-between">
                <span>24h High:</span>
                <span className="text-green-400">${market.high24h}</span>
              </div>
              <div className="flex justify-between">
                <span>24h Low:</span>
                <span className="text-red-400">${market.low24h}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketData;