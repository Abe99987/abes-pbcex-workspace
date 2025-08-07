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
  const [chartType, setChartType] = useState("candles");
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
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-bold text-gold">{pair}</h3>
            <div className="flex items-center space-x-1">
              <span className="text-2xl font-bold text-white">$2,380.50</span>
              <span className="text-green-400 text-sm font-medium">+1.25%</span>
              <span className="text-green-400 text-sm">+$29.42</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-slate-400">
            <div>24h High: <span className="text-white">$2,395.80</span></div>
            <div>24h Low: <span className="text-white">$2,351.20</span></div>
            <div>Volume: <span className="text-white">1.2M</span></div>
          </div>
        </div>
        
          {/* Chart Controls */}
          <div className="flex items-center space-x-3">
            {/* Chart Type Toggle */}
            <div className="flex bg-gray-900 rounded-md p-1">
              <Button
                size="sm"
                variant={chartType === "candles" ? "default" : "ghost"}
                onClick={() => setChartType("candles")}
                className="text-xs px-3 py-1 h-7"
              >
                Candles
              </Button>
              <Button
                size="sm"
                variant={chartType === "line" ? "default" : "ghost"}
                onClick={() => setChartType("line")}
                className="text-xs px-3 py-1 h-7"
              >
                Line
              </Button>
            </div>

            {/* Indicators Toggle */}
            <div className="flex bg-gray-900 rounded-md p-1">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs px-2 py-1 h-7 text-gray-400 hover:text-white"
              >
                MA
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs px-2 py-1 h-7 text-gray-400 hover:text-white"
              >
                RSI
              </Button>
            </div>
            
            {/* Timeframe buttons */}
            <div className="flex bg-gray-900 rounded-md p-1">
            {timeframes.map((tf) => (
              <Button
                key={tf}
                variant={selectedTimeframe === tf ? "gold" : "ghost"}
                size="sm"
                onClick={() => setSelectedTimeframe(tf)}
                className="text-xs px-2 py-1 h-7"
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart - Replace with placeholder image */}
      <div className="flex-1 bg-black relative">
        <img 
          src="/api/placeholder/800/400" 
          alt="Trading Chart Placeholder - TradingView integration coming soon"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4 bg-black/80 text-white text-xs px-2 py-1 rounded border border-gray-600">
          TradingView integration coming soon — showing sample liquidity view
        </div>
      </div>
    </div>
  );
};

export default TradingChart;