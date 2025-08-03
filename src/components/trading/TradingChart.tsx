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
          {/* View Toggle */}
          <div className="flex bg-slate-900 rounded-md p-1">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs px-3 py-1 bg-slate-800 text-white"
            >
              Chart
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs px-3 py-1 text-slate-400 hover:text-white"
            >
              Depth
            </Button>
          </div>
          
          {/* Timeframe buttons */}
          <div className="flex bg-slate-900 rounded-md p-1">
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

      {/* Chart */}
      <div className="flex-1 p-2 bg-black">
        <ChartContainer config={config} className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['dataMin - 5', 'dataMax + 5']}
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                width={60}
              />
              
              {/* Grid Lines */}
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e293b" strokeWidth="0.5"/>
                </pattern>
              </defs>
              
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const isGreen = data.close > data.open;
                    return (
                      <div className="bg-black border border-slate-600 rounded-lg p-3 shadow-xl">
                        <p className="text-slate-300 text-xs mb-2 font-medium">{label}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400">O: </span>
                            <span className="text-white font-mono">${data.open}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">H: </span>
                            <span className="text-green-400 font-mono">${data.high}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">L: </span>
                            <span className="text-red-400 font-mono">${data.low}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">C: </span>
                            <span className={`font-mono ${isGreen ? 'text-green-400' : 'text-red-400'}`}>
                              ${data.close}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-700">
                          <span className="text-slate-400 text-xs">Vol: </span>
                          <span className="text-slate-300 text-xs font-mono">{data.volume}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              
              {/* Render custom candlesticks */}
              {chartData.map((entry, index) => {
                if (!entry) return null;
                const x = index * (100 / chartData.length);
                return (
                  <Candlestick 
                    key={index} 
                    payload={entry} 
                    x={x} 
                    y={0} 
                    width={5} 
                    height={100} 
                  />
                );
              })}
              
              {/* Price line for current value */}
              <Line
                type="monotone"
                dataKey="close"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#10b981', stroke: '#000', strokeWidth: 2 }}
                fill="url(#priceGradient)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default TradingChart;