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
    <div className="h-full bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-white mb-3">Markets</h3>
        <Input
          type="text"
          placeholder="Search markets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-slate-900 border-slate-700 text-white placeholder-slate-400 text-sm h-8"
        />
        
        {/* Filter Tabs */}
        <div className="flex mt-3 space-x-1">
          <Button size="sm" variant="ghost" className="text-xs h-6 px-2 bg-slate-800 text-white">All</Button>
          <Button size="sm" variant="ghost" className="text-xs h-6 px-2 text-slate-400">★</Button>
          <Button size="sm" variant="ghost" className="text-xs h-6 px-2 text-slate-400">Gold</Button>
          <Button size="sm" variant="ghost" className="text-xs h-6 px-2 text-slate-400">Oil</Button>
        </div>
      </div>

      {/* Market List */}
      <div className="flex-1 overflow-y-auto">
        {filteredData.map((market) => (
          <div
            key={market.pair}
            onClick={() => onSelectPair(market.pair)}
            className={`p-3 border-b border-slate-800 cursor-pointer hover:bg-slate-900/50 transition-colors ${
              selectedPair === market.pair ? 'bg-slate-900 border-l-2 border-l-gold' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-white text-sm">{market.pair}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(market.pair);
                  }}
                  className="p-0 h-4 w-4"
                >
                  <Star 
                    className={`w-3 h-3 ${
                      favorites.includes(market.pair) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`} 
                  />
                </Button>
              </div>
              <span 
                className={`text-xs font-medium ${
                  market.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {market.change >= 0 ? '+' : ''}{market.change.toFixed(2)}%
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white font-mono text-sm">${market.price.toFixed(2)}</span>
              <span className="text-slate-400 text-xs">Vol: {market.volume}</span>
            </div>
            
            <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
              <span>H: ${market.high24h.toFixed(2)}</span>
              <span>L: ${market.low24h.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketData;