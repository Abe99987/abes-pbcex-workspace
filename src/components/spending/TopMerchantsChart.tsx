import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { MerchantTrend } from '@/hooks/useSpendingData';

interface TopMerchantsChartProps {
  data: MerchantTrend[];
}

const TopMerchantsChart = ({ data }: TopMerchantsChartProps) => {
  const chartData = data.slice(0, 10).map(merchant => ({
    ...merchant,
    displayName: merchant.merchant.length > 10 ? 
      merchant.merchant.substring(0, 10) + '...' : 
      merchant.merchant
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.merchant}</p>
          <p className="text-sm text-muted-foreground">
            This Month: ${data.currentMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground">
            Transactions: {data.transactionCount}
          </p>
          <div className="flex items-center space-x-1 mt-1">
            {data.change > 0 ? (
              <TrendingUp className="w-3 h-3 text-destructive" />
            ) : (
              <TrendingDown className="w-3 h-3 text-primary" />
            )}
            <span className={`text-xs font-medium ${
              data.change > 0 ? 'text-destructive' : 'text-primary'
            }`}>
              {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}% MoM
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top Merchants</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <YAxis 
                type="category"
                dataKey="displayName"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="currentMonth" 
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend with change indicators */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.slice(0, 6).map((merchant) => (
            <div key={merchant.merchant} className="flex items-center justify-between text-sm">
              <span className="truncate">{merchant.merchant}</span>
              <Badge 
                variant={merchant.change > 0 ? "destructive" : "default"}
                className="flex items-center space-x-1 text-xs"
              >
                {merchant.change > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{merchant.change > 0 ? '+' : ''}{merchant.change.toFixed(0)}%</span>
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopMerchantsChart;