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
    type: "Commodities",
  },
  {
    pair: "SILVER/USD",
    price: 31.45,
    change: -0.75,
    volume: "850K",
    high24h: 32.10,
    low24h: 31.20,
    type: "Commodities",
  },
  {
    pair: "OIL/USD",
    price: 85.30,
    change: 2.15,
    volume: "2.1M",
    high24h: 86.00,
    low24h: 83.50,
    type: "Commodities",
  },
  {
    pair: "LYD/USD",
    price: 0.21,
    change: 0.45,
    volume: "500K",
    high24h: 0.215,
    low24h: 0.208,
    type: "FX",
  },
  {
    pair: "EUR/USD",
    price: 1.0850,
    change: -0.15,
    volume: "5.5M",
    high24h: 1.0875,
    low24h: 1.0840,
    type: "FX",
  },
  {
    pair: "GBP/USD",
    price: 1.2650,
    change: 0.35,
    volume: "3.2M",
    high24h: 1.2680,
    low24h: 1.2620,
    type: "FX",
  },
  {
    pair: "JPY/USD",
    price: 0.0067,
    change: -0.25,
    volume: "4.1M",
    high24h: 0.0068,
    low24h: 0.0066,
    type: "FX",
  },
  {
    pair: "AED/USD",
    price: 0.2722,
    change: 0.05,
    volume: "800K",
    high24h: 0.2725,
    low24h: 0.2720,
    type: "FX",
  },
  {
    pair: "BTC/USD",
    price: 43250.00,
    change: 2.85,
    volume: "8.5M",
    high24h: 43800.00,
    low24h: 42100.00,
    type: "Crypto",
  },
  {
    pair: "ETH/USD",
    price: 2650.00,
    change: 1.45,
    volume: "6.2M",
    high24h: 2680.00,
    low24h: 2590.00,
    type: "Crypto",
  },
  {
    pair: "SOL/USD",
    price: 98.50,
    change: 4.25,
    volume: "2.8M",
    high24h: 102.00,
    low24h: 94.20,
    type: "Crypto",
  },
  {
    pair: "XRP/USD",
    price: 0.62,
    change: -1.15,
    volume: "1.9M",
    high24h: 0.64,
    low24h: 0.61,
    type: "Crypto",
  },
  {
    pair: "SUI/USD",
    price: 3.85,
    change: 3.75,
    volume: "1.1M",
    high24h: 4.02,
    low24h: 3.70,
    type: "Crypto",
  },
];

const MarketData = ({ selectedPair, onSelectPair }: MarketDataProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<string[]>(["GOLD/USD"]);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const filteredData = marketData.filter(item => {
    // First apply search filter
    const matchesSearch = item.pair.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Then apply category filter
    if (activeFilter === "All") {
      return matchesSearch;
    } else if (activeFilter === "★") {
      return matchesSearch && favorites.includes(item.pair);
    } else if (activeFilter === "FX") {
      return matchesSearch && item.type === "FX";
    } else if (activeFilter === "Commodities") {
      return matchesSearch && item.type === "Commodities";
    } else if (activeFilter === "Crypto") {
      return matchesSearch && item.type === "Crypto";
    }
    return matchesSearch;
  });

  const toggleFavorite = (pair: string) => {
    setFavorites(prev =>
      prev.includes(pair)
        ? prev.filter(p => p !== pair)
        : [...prev, pair]
    );
  };

  return (
    <div className="h-full bg-black flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-white mb-3">Markets</h3>
        <Input
          type="text"
          placeholder="Search markets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 text-sm h-8"
        />
        
        {/* Filter Tabs */}
        <div className="flex mt-3 space-x-1">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setActiveFilter("All")}
            className={`text-xs h-6 px-2 ${activeFilter === "All" ? "bg-gray-800 text-white" : "text-gray-400"}`}
          >
            All
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setActiveFilter("★")}
            className={`text-xs h-6 px-2 ${activeFilter === "★" ? "bg-gray-800 text-white" : "text-gray-400"}`}
          >
            ★
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setActiveFilter("FX")}
            className={`text-xs h-6 px-2 ${activeFilter === "FX" ? "bg-gray-800 text-white" : "text-gray-400"}`}
          >
            FX
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setActiveFilter("Commodities")}
            className={`text-xs h-6 px-2 ${activeFilter === "Commodities" ? "bg-gray-800 text-white" : "text-gray-400"}`}
          >
            Commodities
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setActiveFilter("Crypto")}
            className={`text-xs h-6 px-2 ${activeFilter === "Crypto" ? "bg-gray-800 text-white" : "text-gray-400"}`}
          >
            Crypto
          </Button>
        </div>
      </div>

      {/* Market List */}
      <div className="flex-1 overflow-y-auto">
        {filteredData.map((market) => (
          <div
            key={market.pair}
            onClick={() => onSelectPair(market.pair)}
            className={`p-3 border-b border-gray-800 cursor-pointer hover:bg-gray-900/50 transition-colors ${
              selectedPair === market.pair ? 'bg-gray-900 border-l-2 border-l-gold' : ''
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
                        : 'text-gray-500 hover:text-gray-300'
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
              <span className="text-gray-400 text-xs">Vol: {market.volume}</span>
            </div>
            
            <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
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