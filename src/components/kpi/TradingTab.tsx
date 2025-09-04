import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Download,
  Eye,
  Calculator,
} from 'lucide-react';

const TradingTab = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');

  // Mock trading P&L data
  const tradingMetrics = {
    '24h': {
      grossSpread: 12500.0,
      netSpread: 8750.0,
      venueMix: {
        'Spot Trading': 65.2,
        Futures: 23.8,
        Options: 11.0,
      },
      rejectRate: 2.3,
      totalVolume: 2500000.0,
      totalTrades: 15420,
      avgTradeSize: 162.15,
    },
    '7d': {
      grossSpread: 87500.0,
      netSpread: 61250.0,
      venueMix: {
        'Spot Trading': 68.5,
        Futures: 21.2,
        Options: 10.3,
      },
      rejectRate: 1.8,
      totalVolume: 17500000.0,
      totalTrades: 108500,
      avgTradeSize: 161.29,
    },
    '30d': {
      grossSpread: 375000.0,
      netSpread: 262500.0,
      venueMix: {
        'Spot Trading': 70.1,
        Futures: 19.8,
        Options: 10.1,
      },
      rejectRate: 1.5,
      totalVolume: 75000000.0,
      totalTrades: 465000,
      avgTradeSize: 161.29,
    },
  };

  const currentMetrics =
    tradingMetrics[selectedTimeframe as keyof typeof tradingMetrics];

  const handleCSVExport = () => {
    // Mock CSV export
    const csvData = [
      ['Metric', 'Value'],
      ['Gross Spread', `$${currentMetrics.grossSpread.toLocaleString()}`],
      ['Net Spread', `$${currentMetrics.netSpread.toLocaleString()}`],
      ['Reject Rate', `${currentMetrics.rejectRate}%`],
      ['Total Volume', `$${currentMetrics.totalVolume.toLocaleString()}`],
      ['Total Trades', currentMetrics.totalTrades.toLocaleString()],
      ['Avg Trade Size', `$${currentMetrics.avgTradeSize.toFixed(2)}`],
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-metrics-${selectedTimeframe}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Trading P&L</h2>
          <p className='text-muted-foreground'>
            Trading performance and venue analytics
          </p>
        </div>
        <div className='flex space-x-2'>
          <Button variant='outline' size='sm' onClick={handleCSVExport}>
            <Download className='h-4 w-4 mr-2' />
            Export CSV
          </Button>
          <Button variant='outline' size='sm'>
            <Eye className='h-4 w-4 mr-2' />
            Inspect
          </Button>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className='flex space-x-2'>
        {Object.keys(tradingMetrics).map(timeframe => (
          <Button
            key={timeframe}
            variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
            size='sm'
            onClick={() => setSelectedTimeframe(timeframe)}
          >
            {timeframe === '24h'
              ? '24 Hours'
              : timeframe === '7d'
                ? '7 Days'
                : '30 Days'}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Gross Spread
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center space-x-2'>
              <span className='text-2xl font-bold text-green-600'>
                ${currentMetrics.grossSpread.toLocaleString()}
              </span>
              <TrendingUp className='h-5 w-5 text-green-600' />
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Total trading revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Net Spread
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center space-x-2'>
              <span className='text-2xl font-bold text-blue-600'>
                ${currentMetrics.netSpread.toLocaleString()}
              </span>
              <TrendingUp className='h-5 w-5 text-blue-600' />
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              After costs and fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Reject Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center space-x-2'>
              <span className='text-2xl font-bold text-orange-600'>
                {currentMetrics.rejectRate}%
              </span>
              <TrendingDown className='h-5 w-5 text-orange-600' />
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Failed order rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Total Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center space-x-2'>
              <span className='text-2xl font-bold text-purple-600'>
                ${(currentMetrics.totalVolume / 1000000).toFixed(1)}M
              </span>
              <BarChart3 className='h-5 w-5 text-purple-600' />
            </div>
            <p className='text-xs text-muted-foreground mt-1'>Trading volume</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Venue Mix */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <BarChart3 className='h-5 w-5 mr-2' />
              Venue Mix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {Object.entries(currentMetrics.venueMix).map(
                ([venue, percentage]) => (
                  <div key={venue} className='space-y-2'>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm font-medium'>{venue}</span>
                      <span className='text-sm text-muted-foreground'>
                        {percentage}%
                      </span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-2'>
                      <div
                        className='bg-blue-600 h-2 rounded-full'
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trade Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center'>
              <Calculator className='h-5 w-5 mr-2' />
              Trade Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <span className='text-sm font-medium'>Total Trades</span>
                <span className='text-sm font-semibold'>
                  {currentMetrics.totalTrades.toLocaleString()}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm font-medium'>Average Trade Size</span>
                <span className='text-sm font-semibold'>
                  ${currentMetrics.avgTradeSize.toFixed(2)}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm font-medium'>Success Rate</span>
                <span className='text-sm font-semibold text-green-600'>
                  {(100 - currentMetrics.rejectRate).toFixed(1)}%
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm font-medium'>Net Margin</span>
                <span className='text-sm font-semibold text-blue-600'>
                  {(
                    (currentMetrics.netSpread / currentMetrics.grossSpread) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-64 bg-muted/50 rounded-lg flex items-center justify-center'>
            <div className='text-center'>
              <BarChart3 className='h-12 w-12 text-muted-foreground mx-auto mb-2' />
              <p className='text-muted-foreground'>Trading P&L Trend Chart</p>
              <p className='text-xs text-muted-foreground mt-1'>
                Gross/Net spread over time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradingTab;
