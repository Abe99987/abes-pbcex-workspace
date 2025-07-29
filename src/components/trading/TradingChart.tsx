import { useState, useEffect } from "react";
import { ComposedChart, XAxis, YAxis, ResponsiveContainer, Line } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { generateCandlestickData } from "./TradingUtils";

interface TradingChartProps {
  pair: string;
}

const timeframes = ["1m", "5m", "15m", "1h", "4h", "1d"];

const TradingChart = ({ pair }: TradingChartProps) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h");
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // Generate mock candlestick data
    const data = generateCandlestickData(100, selectedTimeframe);
    setChartData(data);
  }, [pair, selectedTimeframe]);

  const config = {
    price: {
      label: "Price",
      color: "hsl(var(--gold))",
    },
    volume: {
      label: "Volume",
      color: "hsl(var(--gold-light))",
    },
  };

  // Custom candlestick component
  const Candlestick = (props: any) => {
    const { payload, x, y, width, height } = props;
    if (!payload) return null;

    const { open, high, low, close } = payload;
    const isGreen = close > open;
    const bodyHeight = Math.abs(close - open) * height / (high - low);
    const bodyY = y + (Math.min(close, open) - low) * height / (high - low);
    
    return (
      <g>
        {/* Wick */}
        <line
          x1={x + width / 2}
          y1={y}
          x2={x + width / 2}
          y2={y + height}
          stroke={isGreen ? "#10b981" : "#ef4444"}
          strokeWidth={1}
        />
        {/* Body */}
        <rect
          x={x + width * 0.2}
          y={bodyY}
          width={width * 0.6}
          height={bodyHeight}
          fill={isGreen ? "#10b981" : "#ef4444"}
          stroke={isGreen ? "#10b981" : "#ef4444"}
        />
      </g>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gold">{pair}</h3>
          <div className="text-sm text-slate-400">
            Last: <span className="text-green-400">$2,380.50</span>
            <span className="text-green-400 ml-2">+1.25%</span>
          </div>
        </div>
        
        {/* Timeframe buttons */}
        <div className="flex space-x-1">
          {timeframes.map((tf) => (
            <Button
              key={tf}
              variant={selectedTimeframe === tf ? "gold" : "ghost"}
              size="sm"
              onClick={() => setSelectedTimeframe(tf)}
              className="text-xs"
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 p-4">
        <ChartContainer config={config} className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis 
                domain={['dataMin - 10', 'dataMax + 10']}
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 rounded p-2 text-xs">
                        <p className="text-slate-300">Time: {label}</p>
                        <p className="text-green-400">Open: ${data.open}</p>
                        <p className="text-red-400">High: ${data.high}</p>
                        <p className="text-blue-400">Low: ${data.low}</p>
                        <p className="text-yellow-400">Close: ${data.close}</p>
                        <p className="text-slate-400">Volume: {data.volume}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Custom candlestick rendering */}
              <Line
                type="monotone"
                dataKey="close"
                stroke="transparent"
                dot={false}
                activeDot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default TradingChart;