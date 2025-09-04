import { useState } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Bot,
  Settings,
} from 'lucide-react';

interface AdminTradeInterfaceProps {
  className?: string;
}

const AdminTradeInterface = ({ className }: AdminTradeInterfaceProps) => {
  const [selectedPair, setSelectedPair] = useState('GOLD/USD');
  const [settlementAsset, setSettlementAsset] = useState('PAXG');
  const [orderType, setOrderType] = useState('limit');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');

  // Mock market categories
  const marketCategories = [
    {
      name: 'Metals',
      pairs: ['GOLD/USD', 'SILVER/USD', 'PLATINUM/USD', 'PALLADIUM/USD'],
    },
    {
      name: 'Commodities',
      pairs: ['OIL/USD', 'NATURAL_GAS/USD', 'COPPER/USD', 'WHEAT/USD'],
    },
    { name: 'Crypto', pairs: ['BTC/USD', 'ETH/USD', 'LTC/USD', 'XRP/USD'] },
    { name: 'FX', pairs: ['EUR/USD', 'GBP/USD', 'JPY/USD', 'AUD/USD'] },
  ];

  // Mock order book data
  const orderBookData = {
    bids: [
      { price: 2380.5, amount: 1.25, total: 2975.63 },
      { price: 2380.25, amount: 2.1, total: 4998.53 },
      { price: 2380.0, amount: 0.85, total: 2023.0 },
    ],
    asks: [
      { price: 2380.75, amount: 1.5, total: 3571.13 },
      { price: 2381.0, amount: 0.75, total: 1785.75 },
      { price: 2381.25, amount: 2.25, total: 5357.81 },
    ],
  };

  // Mock positions data
  const positionsData = [
    {
      pair: 'GOLD/USD',
      side: 'long',
      amount: 1.5,
      entryPrice: 2375.0,
      currentPrice: 2380.5,
      pnl: 8.25,
    },
    {
      pair: 'SILVER/USD',
      side: 'short',
      amount: 10.0,
      entryPrice: 31.5,
      currentPrice: 31.45,
      pnl: 0.5,
    },
  ];

  // Mock scale ladder data
  const scaleLadderData = [
    { level: 1, price: 2375.0, amount: 0.25, total: 593.75 },
    { level: 2, price: 2370.0, amount: 0.25, total: 592.5 },
    { level: 3, price: 2365.0, amount: 0.25, total: 591.25 },
    { level: 4, price: 2360.0, amount: 0.25, total: 590.0 },
  ];

  const parsedPrice = parseFloat(price || '0');
  const parsedAmount = parseFloat(amount || '0');
  const isPriceValid = Number.isFinite(parsedPrice) && parsedPrice > 0;
  const isAmountValid = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const total =
    isPriceValid && isAmountValid
      ? (parsedPrice * parsedAmount).toFixed(2)
      : '0.00';

  return (
    <div
      className={`min-h-screen bg-black text-white flex flex-col ${className}`}
    >
      <div className='flex-1 flex flex-col'>
        <ResizablePanelGroup direction='horizontal' className='flex-1'>
          {/* Left Panel - Markets */}
          <ResizablePanel
            defaultSize={20}
            minSize={15}
            className='hidden lg:block'
          >
            <div className='h-full border-r border-gray-800 bg-black p-4'>
              <h3 className='text-sm font-semibold text-white mb-4'>Markets</h3>
              {marketCategories.map(category => (
                <div key={category.name} className='mb-4'>
                  <h4 className='text-xs font-medium text-gray-400 mb-2'>
                    {category.name}
                  </h4>
                  <div className='space-y-1'>
                    {category.pairs.map(pair => (
                      <button
                        key={pair}
                        onClick={() => setSelectedPair(pair)}
                        className={`w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                          selectedPair === pair
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        {pair}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className='hidden lg:flex' />

          {/* Center Panel - Chart */}
          <ResizablePanel defaultSize={50} minSize={40}>
            <div className='h-full border-r border-gray-800 bg-black flex flex-col'>
              {/* Chart Header */}
              <div className='flex items-center justify-between p-4 border-b border-gray-800'>
                <div>
                  <h2 className='text-lg font-semibold'>{selectedPair}</h2>
                  <div className='flex items-center space-x-2 text-sm'>
                    <span className='text-green-400'>$2,380.50</span>
                    <TrendingUp className='h-4 w-4 text-green-400' />
                    <span className='text-green-400'>+1.25%</span>
                  </div>
                </div>
                <div className='flex space-x-2'>
                  <Button size='sm' variant='outline' className='text-xs'>
                    <Activity className='h-3 w-3 mr-1' />
                    Live
                  </Button>
                  <Button size='sm' variant='outline' className='text-xs'>
                    <BarChart3 className='h-3 w-3 mr-1' />
                    Indicators
                  </Button>
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className='flex-1 flex items-center justify-center'>
                <div className='text-center'>
                  <BarChart3 className='h-16 w-16 text-gray-600 mx-auto mb-4' />
                  <p className='text-gray-400'>TradingView Chart</p>
                  <p className='text-xs text-gray-500 mt-2'>
                    Candlestick chart with scaling ladder overlay
                  </p>
                </div>
              </div>

              {/* Scale Ladder Preview */}
              {orderType === 'scale' && (
                <div className='border-t border-gray-800 p-4'>
                  <h4 className='text-sm font-medium mb-2'>
                    Scale Ladder Preview
                  </h4>
                  <div className='space-y-1'>
                    {scaleLadderData.map(level => (
                      <div
                        key={level.level}
                        className='flex justify-between text-xs'
                      >
                        <span>
                          Level {level.level}: ${level.price}
                        </span>
                        <span>{level.amount} oz</span>
                        <span>${level.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className='hidden lg:flex' />

          {/* Right Panel - Order Ticket */}
          <ResizablePanel defaultSize={30} minSize={25}>
            <div className='h-full bg-black p-4'>
              {/* Order Type Tabs */}
              <Tabs
                value={orderType}
                onValueChange={setOrderType}
                className='mb-4'
              >
                <TabsList className='grid w-full grid-cols-3 bg-gray-900'>
                  <TabsTrigger value='limit' className='text-xs'>
                    Limit
                  </TabsTrigger>
                  <TabsTrigger value='market' className='text-xs'>
                    Market
                  </TabsTrigger>
                  <TabsTrigger value='scale' className='text-xs'>
                    Scale
                  </TabsTrigger>
                </TabsList>

                <TabsContent value='limit' className='space-y-4'>
                  {/* Settlement Asset */}
                  <div>
                    <Label className='text-xs text-gray-400'>Settle in</Label>
                    <Select
                      value={settlementAsset}
                      onValueChange={setSettlementAsset}
                    >
                      <SelectTrigger className='bg-gray-900 border-gray-700'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='PAXG'>PAXG</SelectItem>
                        <SelectItem value='XAU-s'>XAU-s</SelectItem>
                        <SelectItem value='USD'>USD</SelectItem>
                        <SelectItem value='USDC'>USDC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price */}
                  <div>
                    <Label className='text-xs text-gray-400'>Price</Label>
                    <Input
                      type='number'
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      className='bg-gray-900 border-gray-700'
                      placeholder='0.00'
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <Label className='text-xs text-gray-400'>Amount</Label>
                    <Input
                      type='number'
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className='bg-gray-900 border-gray-700'
                      placeholder='0.00'
                    />
                  </div>

                  {/* Size Shortcuts */}
                  <div>
                    <Label className='text-xs text-gray-400'>Size</Label>
                    <div className='grid grid-cols-4 gap-1 mt-1'>
                      {[25, 50, 75, 100].map(percent => (
                        <Button
                          key={percent}
                          size='sm'
                          variant='outline'
                          className='text-xs bg-gray-900 border-gray-700'
                          onClick={() =>
                            setAmount(
                              ((parseFloat(price) * percent) / 100).toFixed(2)
                            )
                          }
                        >
                          {percent}%
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* TP/SL */}
                  <div className='grid grid-cols-2 gap-2'>
                    <div>
                      <Label className='text-xs text-gray-400'>
                        Take Profit
                      </Label>
                      <Input
                        type='number'
                        value={takeProfit}
                        onChange={e => setTakeProfit(e.target.value)}
                        className='bg-gray-900 border-gray-700'
                        placeholder='0.00'
                      />
                    </div>
                    <div>
                      <Label className='text-xs text-gray-400'>Stop Loss</Label>
                      <Input
                        type='number'
                        value={stopLoss}
                        onChange={e => setStopLoss(e.target.value)}
                        className='bg-gray-900 border-gray-700'
                        placeholder='0.00'
                      />
                    </div>
                  </div>

                  {/* Total */}
                  <div className='text-center py-2 border-t border-gray-800'>
                    <div className='text-xs text-gray-400'>Total</div>
                    <div className='text-lg font-semibold'>${total}</div>
                  </div>

                  {/* Action Buttons */}
                  <div className='grid grid-cols-2 gap-2'>
                    <Button className='bg-green-600 hover:bg-green-700'>
                      Buy
                    </Button>
                    <Button variant='destructive'>Sell</Button>
                  </div>
                </TabsContent>

                <TabsContent value='market' className='space-y-4'>
                  <div className='text-center py-8 text-gray-400'>
                    <p>Market orders execute immediately</p>
                    <p className='text-xs mt-2'>Enter amount only</p>
                  </div>
                </TabsContent>

                <TabsContent value='scale' className='space-y-4'>
                  <div className='text-center py-8 text-gray-400'>
                    <p>Scale orders with ladder</p>
                    <p className='text-xs mt-2'>
                      Configure multiple price levels
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Balances */}
              <Card className='bg-gray-900 border-gray-700 mb-4'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm'>Balances</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  <div className='flex justify-between text-xs'>
                    <span>PAXG</span>
                    <span>1.25</span>
                  </div>
                  <div className='flex justify-between text-xs'>
                    <span>USD</span>
                    <span>$2,500.00</span>
                  </div>
                  <div className='flex justify-between text-xs'>
                    <span>Buying Power</span>
                    <span>$5,000.00</span>
                  </div>
                </CardContent>
              </Card>

              {/* Order Book */}
              <Card className='bg-gray-900 border-gray-700 mb-4'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm'>Order Book</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-1'>
                    {orderBookData.asks
                      .slice()
                      .reverse()
                      .map((ask, index) => (
                        <div
                          key={index}
                          className='flex justify-between text-xs text-red-400'
                        >
                          <span>{ask.price}</span>
                          <span>{ask.amount}</span>
                          <span>{ask.total}</span>
                        </div>
                      ))}
                    <div className='border-t border-gray-700 my-1'></div>
                    {orderBookData.bids.map((bid, index) => (
                      <div
                        key={index}
                        className='flex justify-between text-xs text-green-400'
                      >
                        <span>{bid.price}</span>
                        <span>{bid.amount}</span>
                        <span>{bid.total}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Positions */}
              <Card className='bg-gray-900 border-gray-700'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm'>Positions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    {positionsData.map((position, index) => (
                      <div key={index} className='flex justify-between text-xs'>
                        <div>
                          <div className='font-medium'>{position.pair}</div>
                          <div className='text-gray-400'>
                            {position.side} {position.amount}
                          </div>
                        </div>
                        <div className='text-right'>
                          <div
                            className={
                              position.pnl >= 0
                                ? 'text-green-400'
                                : 'text-red-400'
                            }
                          >
                            {position.pnl >= 0 ? '+' : ''}${position.pnl}
                          </div>
                          <div className='text-gray-400'>
                            ${position.currentPrice}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default AdminTradeInterface;
