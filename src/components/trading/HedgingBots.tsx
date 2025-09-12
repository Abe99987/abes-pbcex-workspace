import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Pause,
  Square,
  Bot,
  TrendingUp,
  BarChart3,
  ExternalLink,
  Settings,
} from 'lucide-react';

interface BotConfig {
  id: string;
  name: string;
  type: 'DCA' | 'Grid';
  status: 'stopped' | 'running' | 'paused';
  pair: string;
  interval?: string;
  quantity?: string;
  priceBounds?: {
    upper: string;
    lower: string;
  };
  gridLevels?: number;
  profitTarget?: string;
}

const HedgingBots = () => {
  const [bots, setBots] = useState<BotConfig[]>([
    {
      id: '1',
      name: 'Gold DCA Bot',
      type: 'DCA',
      status: 'stopped',
      pair: 'GOLD/USD',
      interval: '1h',
      quantity: '0.1',
    },
    {
      id: '2',
      name: 'Silver Grid Bot',
      type: 'Grid',
      status: 'stopped',
      pair: 'SILVER/USD',
      priceBounds: { upper: '32.00', lower: '30.00' },
      gridLevels: 10,
      profitTarget: '2.00',
    },
  ]);

  const [selectedBot, setSelectedBot] = useState<BotConfig | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  const handleBotAction = (
    botId: string,
    action: 'start' | 'pause' | 'stop'
  ) => {
    setBots(prev =>
      prev.map(bot =>
        bot.id === botId
          ? {
              ...bot,
              status:
                action === 'start'
                  ? 'running'
                  : action === 'pause'
                    ? 'paused'
                    : 'stopped',
            }
          : bot
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'stopped':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running':
        return 'Running';
      case 'paused':
        return 'Paused';
      case 'stopped':
        return 'Stopped';
      default:
        return 'Unknown';
    }
  };

  // Mock backtest data
  const mockBacktestData = {
    totalTrades: 45,
    winRate: 68.9,
    totalProfit: 125.5,
    maxDrawdown: -8.2,
    sharpeRatio: 1.85,
    trades: [
      {
        date: '2024-01-15',
        type: 'buy',
        price: 2375.0,
        amount: 0.1,
        profit: 2.5,
      },
      {
        date: '2024-01-15',
        type: 'sell',
        price: 2380.0,
        amount: 0.1,
        profit: 0.5,
      },
      {
        date: '2024-01-16',
        type: 'buy',
        price: 2378.5,
        amount: 0.1,
        profit: 1.25,
      },
    ],
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Hedging Bots</h2>
          <p className='text-muted-foreground'>
            Automated trading strategies for risk management
          </p>
        </div>
        <Button onClick={() => setShowConfig(true)}>
          <Bot className='h-4 w-4 mr-2' />
          Create Bot
        </Button>
      </div>

      {/* Bot Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {bots.map(bot => (
          <Card key={bot.id} className='relative'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='text-lg'>{bot.name}</CardTitle>
                  <div className='flex items-center space-x-2 mt-1'>
                    <Badge variant='outline'>{bot.type}</Badge>
                    <Badge variant='outline'>{bot.pair}</Badge>
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <div
                    className={`w-3 h-3 rounded-full ${getStatusColor(bot.status)}`}
                  ></div>
                  <span className='text-sm text-muted-foreground'>
                    {getStatusText(bot.status)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {/* Bot Details */}
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  {bot.type === 'DCA' && (
                    <>
                      <div>
                        <Label className='text-xs text-muted-foreground'>
                          Interval
                        </Label>
                        <div>{bot.interval}</div>
                      </div>
                      <div>
                        <Label className='text-xs text-muted-foreground'>
                          Quantity
                        </Label>
                        <div>{bot.quantity} oz</div>
                      </div>
                    </>
                  )}
                  {bot.type === 'Grid' && (
                    <>
                      <div>
                        <Label className='text-xs text-muted-foreground'>
                          Price Range
                        </Label>
                        <div>
                          ${bot.priceBounds?.lower} - ${bot.priceBounds?.upper}
                        </div>
                      </div>
                      <div>
                        <Label className='text-xs text-muted-foreground'>
                          Grid Levels
                        </Label>
                        <div>{bot.gridLevels}</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Performance Summary */}
                <div className='bg-muted/50 rounded-lg p-3'>
                  <div className='grid grid-cols-3 gap-2 text-center text-sm'>
                    <div>
                      <div className='text-xs text-muted-foreground'>
                        Trades
                      </div>
                      <div className='font-medium'>
                        {mockBacktestData.totalTrades}
                      </div>
                    </div>
                    <div>
                      <div className='text-xs text-muted-foreground'>
                        Win Rate
                      </div>
                      <div className='font-medium text-green-600'>
                        {mockBacktestData.winRate}%
                      </div>
                    </div>
                    <div>
                      <div className='text-xs text-muted-foreground'>
                        Profit
                      </div>
                      <div className='font-medium text-green-600'>
                        ${mockBacktestData.totalProfit}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='flex space-x-2'>
                  {bot.status === 'stopped' && (
                    <Button
                      size='sm'
                      onClick={() => handleBotAction(bot.id, 'start')}
                      className='flex-1'
                    >
                      <Play className='h-3 w-3 mr-1' />
                      Start
                    </Button>
                  )}
                  {bot.status === 'running' && (
                    <>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleBotAction(bot.id, 'pause')}
                        className='flex-1'
                      >
                        <Pause className='h-3 w-3 mr-1' />
                        Pause
                      </Button>
                      <Button
                        size='sm'
                        variant='destructive'
                        onClick={() => handleBotAction(bot.id, 'stop')}
                      >
                        <Square className='h-3 w-3' />
                      </Button>
                    </>
                  )}
                  {bot.status === 'paused' && (
                    <>
                      <Button
                        size='sm'
                        onClick={() => handleBotAction(bot.id, 'start')}
                        className='flex-1'
                      >
                        <Play className='h-3 w-3 mr-1' />
                        Resume
                      </Button>
                      <Button
                        size='sm'
                        variant='destructive'
                        onClick={() => handleBotAction(bot.id, 'stop')}
                      >
                        <Square className='h-3 w-3' />
                      </Button>
                    </>
                  )}
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => setSelectedBot(bot)}
                  >
                    <Settings className='h-3 w-3' />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Backtest Preview */}
      {selectedBot && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <BarChart3 className='h-5 w-5 mr-2' />
              Backtest Results - {selectedBot.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue='summary' className='w-full'>
              <TabsList className='grid w-full grid-cols-3'>
                <TabsTrigger value='summary'>Summary</TabsTrigger>
                <TabsTrigger value='trades'>Trades</TabsTrigger>
                <TabsTrigger value='chart'>Chart</TabsTrigger>
              </TabsList>

              <TabsContent value='summary' className='space-y-4'>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-green-600'>
                      ${mockBacktestData.totalProfit}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Total Profit
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold'>
                      {mockBacktestData.winRate}%
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Win Rate
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-red-600'>
                      {mockBacktestData.maxDrawdown}%
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Max Drawdown
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold'>
                      {mockBacktestData.sharpeRatio}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Sharpe Ratio
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value='trades' className='space-y-2'>
                <div className='space-y-2'>
                  {mockBacktestData.trades.map((trade, index) => (
                    <div
                      key={index}
                      className='flex justify-between items-center p-2 bg-muted/50 rounded'
                    >
                      <div className='flex items-center space-x-4'>
                        <Badge
                          variant={
                            trade.type === 'buy' ? 'default' : 'secondary'
                          }
                        >
                          {trade.type.toUpperCase()}
                        </Badge>
                        <span className='text-sm'>{trade.date}</span>
                        <span className='text-sm'>${trade.price}</span>
                        <span className='text-sm'>{trade.amount} oz</span>
                      </div>
                      <span
                        className={`text-sm font-medium ${trade.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {trade.profit >= 0 ? '+' : ''}${trade.profit}
                      </span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value='chart' className='space-y-4'>
                <div className='h-64 bg-muted/50 rounded-lg flex items-center justify-center'>
                  <div className='text-center'>
                    <TrendingUp className='h-12 w-12 text-muted-foreground mx-auto mb-2' />
                    <p className='text-muted-foreground'>Performance Chart</p>
                    <p className='text-xs text-muted-foreground mt-1'>
                      Equity curve visualization
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Learn More Links */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Learn More</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'>
              <div>
                <h4 className='font-medium'>DCA Bot Strategy</h4>
                <p className='text-sm text-muted-foreground'>
                  Dollar-cost averaging for consistent accumulation
                </p>
              </div>
              <Button variant='outline' size='sm'>
                <ExternalLink className='h-3 w-3 mr-1' />
                Bybit Docs
              </Button>
            </div>
            <div className='flex items-center justify-between p-3 bg-muted/50 rounded-lg'>
              <div>
                <h4 className='font-medium'>Grid Trading Strategy</h4>
                <p className='text-sm text-muted-foreground'>
                  Profit from price oscillations within a range
                </p>
              </div>
              <Button variant='outline' size='sm'>
                <ExternalLink className='h-3 w-3 mr-1' />
                Pionex Docs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HedgingBots;
