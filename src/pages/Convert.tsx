import React, { useState } from 'react';
import { ArrowUpDown, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TradingNavigation from '@/components/trading/TradingNavigation';

interface Asset {
  symbol: string;
  name: string;
  price: number;
}

const mockAssets: Asset[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 67850.32 },
  { symbol: 'ETH', name: 'Ethereum', price: 3425.67 },
  { symbol: 'SOL', name: 'Solana', price: 168.45 },
  { symbol: 'XAU', name: 'Gold', price: 2048.50 },
  { symbol: 'XAG', name: 'Silver', price: 24.68 },
  { symbol: 'USDC', name: 'USD Coin', price: 1.00 },
  { symbol: 'USDT', name: 'Tether', price: 1.00 },
];

const Convert = () => {
  const [fromAsset, setFromAsset] = useState<string>('');
  const [toAsset, setToAsset] = useState<string>('');
  const [fromAmount, setFromAmount] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);

  const fromAssetData = mockAssets.find(a => a.symbol === fromAsset);
  const toAssetData = mockAssets.find(a => a.symbol === toAsset);

  const calculateConversion = () => {
    if (!fromAssetData || !toAssetData || !fromAmount) return null;
    
    const fromValue = parseFloat(fromAmount) * fromAssetData.price;
    const toAmount = fromValue / toAssetData.price;
    const fee = fromValue * 0.001; // 0.1% fee
    const netReceive = (fromValue - fee) / toAssetData.price;
    
    return {
      rate: fromAssetData.price / toAssetData.price,
      fee,
      estimatedReceive: netReceive,
      fromValue
    };
  };

  const conversion = calculateConversion();

  const handleSwapAssets = () => {
    const temp = fromAsset;
    setFromAsset(toAsset);
    setToAsset(temp);
    setFromAmount('');
  };

  const handleConvert = async () => {
    setIsConverting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsConverting(false);
    // Reset form or show success
  };

  return (
    <div className="min-h-screen bg-background">
      <TradingNavigation />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Quick Convert</h1>
            <p className="text-muted-foreground">Swap between assets instantly</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Convert Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* From Asset */}
              <div className="space-y-2">
                <label className="text-sm font-medium">From</label>
                <div className="flex space-x-2">
                  <Select value={fromAsset} onValueChange={setFromAsset}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockAssets.map(asset => (
                        <SelectItem key={asset.symbol} value={asset.symbol}>
                          {asset.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="0.00"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="flex-1"
                  />
                </div>
                {fromAssetData && (
                  <p className="text-xs text-muted-foreground">
                    {fromAssetData.name} • ${fromAssetData.price.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSwapAssets}
                  className="rounded-full p-2"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </Button>
              </div>

              {/* To Asset */}
              <div className="space-y-2">
                <label className="text-sm font-medium">To</label>
                <div className="flex space-x-2">
                  <Select value={toAsset} onValueChange={setToAsset}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockAssets.map(asset => (
                        <SelectItem key={asset.symbol} value={asset.symbol}>
                          {asset.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="0.00"
                    value={conversion ? conversion.estimatedReceive.toFixed(6) : ''}
                    readOnly
                    className="flex-1 bg-muted"
                  />
                </div>
                {toAssetData && (
                  <p className="text-xs text-muted-foreground">
                    {toAssetData.name} • ${toAssetData.price.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Conversion Preview */}
              {conversion && (
                <div className="p-4 bg-muted/20 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Rate</span>
                    <span>1 {fromAsset} = {conversion.rate.toFixed(6)} {toAsset}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Fee (0.1%)</span>
                    <span>${conversion.fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium border-t pt-2">
                    <span>You'll receive</span>
                    <span>{conversion.estimatedReceive.toFixed(6)} {toAsset}</span>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                disabled={!conversion || isConverting}
                onClick={handleConvert}
              >
                {isConverting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Converting...
                  </>
                ) : (
                  'Convert'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Convert;