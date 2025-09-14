import { useState } from 'react';
import { ArrowUpDown, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import MarketData from './MarketData';
import OrderPanel from './OrderPanel';
import TradingFooter from './TradingFooter';

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

const CoinToCoinInterface = () => {
  const [selectedPair, setSelectedPair] = useState('BTC/ETH');
  const [fromAsset, setFromAsset] = useState<string>('BTC');
  const [toAsset, setToAsset] = useState<string>('ETH');
  const [fromAmount, setFromAmount] = useState<string>('');
  const [orderType, setOrderType] = useState('limit');

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

  return (
    <div className='min-h-screen bg-black text-white flex flex-col'>
      <div className='flex-1 flex flex-col'>
        <ResizablePanelGroup direction='horizontal' className='flex-1'>
          {/* Left Panel - Market Data */}
          <ResizablePanel
            defaultSize={25}
            minSize={20}
            className='hidden lg:block'
          >
            <div className='h-full border-r border-gray-800 bg-black'>
              <MarketData
                selectedPair={selectedPair}
                onSelectPair={setSelectedPair}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className='hidden lg:flex' />

          {/* Center Panel - Coin to Coin Trading */}
          <ResizablePanel defaultSize={75} minSize={60}>
            <div className='h-full p-6 bg-black overflow-y-auto'>
              <div className='max-w-2xl mx-auto space-y-6'>
                <div>
                  <h1 className='text-2xl font-bold text-white mb-2'>Coin-to-Coin Trading</h1>
                  <p className='text-gray-400'>Trade directly between cryptocurrencies and precious metals</p>
                </div>

                <Card className='bg-gray-900 border-gray-800'>
                  <CardHeader>
                    <CardTitle className='text-white'>Exchange Assets</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    {/* Order Type Selection */}
                    <div className='grid grid-cols-3 gap-1 bg-gray-800 rounded-md p-1'>
                      <Button
                        variant={orderType === 'limit' ? 'default' : 'ghost'}
                        size='sm'
                        onClick={() => setOrderType('limit')}
                        className='text-xs h-8'
                      >
                        Limit
                      </Button>
                      <Button
                        variant={orderType === 'market' ? 'default' : 'ghost'}
                        size='sm'
                        onClick={() => setOrderType('market')}
                        className='text-xs h-8'
                      >
                        Market
                      </Button>
                      <Button
                        variant={orderType === 'scale' ? 'default' : 'ghost'}
                        size='sm'
                        onClick={() => setOrderType('scale')}
                        className='text-xs h-8'
                      >
                        Scale
                      </Button>
                    </div>

                    {/* From Asset */}
                    <div className='space-y-2'>
                      <label className='text-sm font-medium text-gray-300'>From</label>
                      <div className='flex space-x-2'>
                        <Select value={fromAsset} onValueChange={setFromAsset}>
                          <SelectTrigger className='w-32 bg-gray-800 border-gray-700'>
                            <SelectValue placeholder='Asset' />
                          </SelectTrigger>
                          <SelectContent className='bg-gray-800 border-gray-700'>
                            {mockAssets.map(asset => (
                              <SelectItem key={asset.symbol} value={asset.symbol}>
                                {asset.symbol}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder='0.00'
                          value={fromAmount}
                          onChange={(e) => setFromAmount(e.target.value)}
                          className='flex-1 bg-gray-800 border-gray-700'
                        />
                      </div>
                      {fromAssetData && (
                        <p className='text-xs text-gray-400'>
                          {fromAssetData.name} • ${fromAssetData.price.toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Swap Button */}
                    <div className='flex justify-center'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={handleSwapAssets}
                        className='rounded-full p-2 bg-gray-800 border-gray-700 hover:bg-gray-700'
                      >
                        <ArrowUpDown className='w-4 h-4' />
                      </Button>
                    </div>

                    {/* To Asset */}
                    <div className='space-y-2'>
                      <label className='text-sm font-medium text-gray-300'>To</label>
                      <div className='flex space-x-2'>
                        <Select value={toAsset} onValueChange={setToAsset}>
                          <SelectTrigger className='w-32 bg-gray-800 border-gray-700'>
                            <SelectValue placeholder='Asset' />
                          </SelectTrigger>
                          <SelectContent className='bg-gray-800 border-gray-700'>
                            {mockAssets.map(asset => (
                              <SelectItem key={asset.symbol} value={asset.symbol}>
                                {asset.symbol}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder='0.00'
                          value={conversion ? conversion.estimatedReceive.toFixed(6) : ''}
                          readOnly
                          className='flex-1 bg-gray-700 border-gray-600'
                        />
                      </div>
                      {toAssetData && (
                        <p className='text-xs text-gray-400'>
                          {toAssetData.name} • ${toAssetData.price.toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Conversion Preview */}
                    {conversion && (
                      <div className='p-4 bg-gray-800 rounded-lg space-y-2'>
                        <div className='flex justify-between text-sm'>
                          <span className='text-gray-400'>Rate</span>
                          <span className='text-white'>1 {fromAsset} = {conversion.rate.toFixed(6)} {toAsset}</span>
                        </div>
                        <div className='flex justify-between text-sm'>
                          <span className='text-gray-400'>Fee (0.1%)</span>
                          <span className='text-white'>${conversion.fee.toFixed(2)}</span>
                        </div>
                        <div className='flex justify-between text-sm font-medium border-t border-gray-700 pt-2'>
                          <span className='text-gray-400'>You'll receive</span>
                          <span className='text-white'>{conversion.estimatedReceive.toFixed(6)} {toAsset}</span>
                        </div>
                      </div>
                    )}

                    {/* Provider Accepts */}
                    <div className='p-3 bg-gray-800 rounded-lg'>
                      <div className='text-xs text-gray-400 mb-2'>Provider accepts:</div>
                      <div className='flex flex-wrap gap-1'>
                        {['BTC', 'ETH', 'USDC', 'XAU'].map(asset => (
                          <Badge key={asset} variant='secondary' className='text-xs bg-gray-700'>
                            {asset}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className='p-4 bg-gray-900 border border-gray-800 rounded-lg mb-4'>
                      <div className='text-sm font-medium text-white mb-3'>Order Panel</div>
                      <OrderPanel pair={`${fromAsset}/${toAsset}`} settlementMode="coin" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <TradingFooter />
    </div>
  );
};

export default CoinToCoinInterface;