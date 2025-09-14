import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TradingNavigation from '@/components/trading/TradingNavigation';

interface Asset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  sparkline: number[];
}

const mockAssets: Asset[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 67850.32, change24h: 2.45, sparkline: [65000, 66000, 67000, 66500, 67850] },
  { symbol: 'ETH', name: 'Ethereum', price: 3425.67, change24h: -1.23, sparkline: [3500, 3450, 3400, 3380, 3425] },
  { symbol: 'SOL', name: 'Solana', price: 168.45, change24h: 5.67, sparkline: [160, 162, 165, 167, 168] },
  { symbol: 'XAU', name: 'Gold', price: 2048.50, change24h: 0.85, sparkline: [2045, 2046, 2047, 2048, 2048.5] },
  { symbol: 'XAG', name: 'Silver', price: 24.68, change24h: -0.45, sparkline: [24.8, 24.7, 24.6, 24.65, 24.68] },
];

const recentAssets = ['BTC', 'ETH', 'XAU'];

const BuyWithCard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [quantity, setQuantity] = useState('');

  const filteredAssets = mockAssets.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSparkline = (data: number[]) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;
    
    if (range === 0) return <div className="w-16 h-8 bg-muted/20 rounded" />;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 60;
      const y = 24 - ((value - min) / range) * 16;
      return `${x},${y}`;
    }).join(' ');

    const isPositive = data[data.length - 1] >= data[0];

    return (
      <svg width="60" height="24" className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'}
          strokeWidth="2"
          className="opacity-80"
        />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <TradingNavigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Buy with Card</h1>
            <p className="text-muted-foreground">Purchase crypto and precious metals using your Visa or Mastercard</p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          {/* Recent Assets */}
          {!searchQuery && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent</h3>
              <div className="flex gap-2">
                {recentAssets.map(symbol => {
                  const asset = mockAssets.find(a => a.symbol === symbol);
                  if (!asset) return null;
                  return (
                    <Badge
                      key={symbol}
                      variant="secondary"
                      className="px-3 py-2 cursor-pointer hover:bg-muted/80"
                      onClick={() => setSelectedAsset(asset)}
                    >
                      {symbol}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Assets */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-4">
              {searchQuery ? 'Search Results' : 'Top Assets'}
            </h3>
            <div className="space-y-2">
              {filteredAssets.map(asset => (
                <Card
                  key={asset.symbol}
                  className="cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => setSelectedAsset(asset)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                          <span className="font-bold text-sm">{asset.symbol}</span>
                        </div>
                        <div>
                          <div className="font-semibold">{asset.name}</div>
                          <div className="text-sm text-muted-foreground">{asset.symbol}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className="font-semibold">${asset.price.toLocaleString()}</div>
                          <div className={`text-sm flex items-center ${
                            asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {asset.change24h >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                            {Math.abs(asset.change24h)}%
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          {renderSparkline(asset.sparkline)}
                          <Button size="sm">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Buy
                          </Button>
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

      {/* Buy Modal */}
      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buy {selectedAsset?.name} with Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Amount</label>
              <Input
                placeholder="Enter amount"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="p-4 bg-muted/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CreditCard className="w-4 h-4" />
                <span className="font-medium">Card Payment</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Visa and Mastercard accepted. Processing fee: 2.9%
              </p>
            </div>
            
            <Button className="w-full">
              <CreditCard className="w-4 h-4 mr-2" />
              Pay with Card
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuyWithCard;