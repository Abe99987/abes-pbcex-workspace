import React, { useState, useEffect } from 'react';
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  startOfWeek,
  addDays
} from 'date-fns';

// Mock data for demonstration
const generateMockData = () => {
  const balanceData = [];
  const currentDate = new Date();
  
  // Generate 30 days of mock balance data
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    balanceData.push({
      date: format(date, 'MMM dd'),
      balance: 10000 + Math.random() * 2000 - 1000 + i * 50,
    });
  }

  // Generate monthly PnL data
  const monthlyPnL = {};
  const currentMonth = startOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({
    start: currentMonth,
    end: endOfMonth(currentMonth)
  });

  daysInMonth.forEach(day => {
    const dayKey = format(day, 'yyyy-MM-dd');
    monthlyPnL[dayKey] = {
      pnl: (Math.random() - 0.5) * 500,
      trades: Math.floor(Math.random() * 15),
    };
  });

  return { balanceData, monthlyPnL };
};

const PnL = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [data, setData] = useState(generateMockData);

  // Mock performance metrics
  const performanceMetrics = {
    totalPnL: 1847.32,
    winRate: 68.4,
    profitFactor: 1.85,
    avgWin: 125.50,
    avgLoss: -67.80,
    bestDayPercent: 12.4,
    dayWinPercent: 71.2
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    
    const days = [];
    let day = calendarStart;
    
    // Generate calendar grid
    for (let i = 0; i < 42; i++) { // 6 weeks × 7 days
      const dayKey = format(day, 'yyyy-MM-dd');
      const dayPnL = data.monthlyPnL[dayKey];
      const isCurrentMonth = day >= monthStart && day <= monthEnd;
      const isCurrentDay = isToday(day);
      
      days.push(
        <div
          key={dayKey}
          className={`
            min-h-[80px] p-2 border border-border/20 
            ${isCurrentMonth ? 'bg-card' : 'bg-muted/10'}
            ${isCurrentDay ? 'ring-2 ring-primary' : ''}
            hover:bg-muted/20 transition-colors
          `}
        >
          <div className="text-sm text-muted-foreground mb-1">
            {format(day, 'd')}
          </div>
          {dayPnL && isCurrentMonth && (
            <div className="space-y-1">
              <div className={`text-xs font-medium ${
                dayPnL.pnl >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {dayPnL.pnl >= 0 ? '+' : ''}${dayPnL.pnl.toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">
                {dayPnL.trades} trades
              </div>
            </div>
          )}
        </div>
      );
      day = addDays(day, 1);
    }

    return days;
  };

  const weeklyTotals = () => {
    const weeks = [];
    let weekTotal = 0;
    let weekStart = startOfWeek(startOfMonth(currentMonth));
    
    for (let week = 0; week < 6; week++) {
      weekTotal = 0;
      for (let day = 0; day < 7; day++) {
        const currentDay = addDays(weekStart, day);
        const dayKey = format(currentDay, 'yyyy-MM-dd');
        const dayPnL = data.monthlyPnL[dayKey];
        if (dayPnL) weekTotal += dayPnL.pnl;
      }
      
      weeks.push(
        <div key={week} className={`
          p-2 text-center text-sm font-medium border border-border/20
          ${weekTotal >= 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}
        `}>
          {weekTotal >= 0 ? '+' : ''}${weekTotal.toFixed(0)}
        </div>
      );
      weekStart = addDays(weekStart, 7);
    }
    
    return weeks;
  };

  console.log('PnL component rendering, Navigation:', Navigation);
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profit & Loss Analytics</h1>
          <p className="text-muted-foreground">Track your trading performance and analyze your results</p>
        </div>

        {/* Performance Summary Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Total PnL */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total PnL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className={`text-2xl font-bold ${
                  performanceMetrics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {performanceMetrics.totalPnL >= 0 ? '+' : ''}${performanceMetrics.totalPnL.toLocaleString()}
                </span>
                {performanceMetrics.totalPnL >= 0 ? 
                  <TrendingUp className="h-5 w-5 text-green-400" /> : 
                  <TrendingDown className="h-5 w-5 text-red-400" />
                }
              </div>
            </CardContent>
          </Card>

          {/* Win Rate */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceMetrics.winRate}%</div>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div 
                  className="bg-green-400 h-2 rounded-full transition-all"
                  style={{ width: `${performanceMetrics.winRate}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Profit Factor */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Profit Factor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceMetrics.profitFactor}</div>
              <div className="text-sm text-muted-foreground mt-1">
                Total Gains / Total Losses
              </div>
            </CardContent>
          </Card>

          {/* Best Day % */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Best Day %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {performanceMetrics.bestDayPercent}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Of Total Profit
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Avg Win/Loss & Day Win % */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Average Win / Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Avg Win</span>
                  <span className="text-green-400 font-bold">+${performanceMetrics.avgWin}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Avg Loss</span>
                  <span className="text-red-400 font-bold">${performanceMetrics.avgLoss}</span>
                </div>
                <div className="flex h-4 rounded-full overflow-hidden">
                  <div className="bg-green-400 flex-[3]" />
                  <div className="bg-red-400 flex-[2]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Day Win Percentage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{performanceMetrics.dayWinPercent}%</div>
              <div className="text-muted-foreground text-sm mb-4">Profitable trading days</div>
              <div className="w-full bg-secondary rounded-full h-3">
                <div 
                  className="bg-green-400 h-3 rounded-full transition-all"
                  style={{ width: `${performanceMetrics.dayWinPercent}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Account Balance Chart */}
        <Card className="bg-card border-border mb-8">
          <CardHeader>
            <CardTitle>Daily Account Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.balanceData}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    domain={['dataMin - 100', 'dataMax + 100']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="white" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Calendar View */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Monthly Calendar View</CardTitle>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-lg font-medium min-w-[120px] text-center">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-8 gap-0 border border-border rounded-lg overflow-hidden">
              {/* Calendar Headers */}
              <div className="bg-muted p-3 text-center text-sm font-medium">Sun</div>
              <div className="bg-muted p-3 text-center text-sm font-medium">Mon</div>
              <div className="bg-muted p-3 text-center text-sm font-medium">Tue</div>
              <div className="bg-muted p-3 text-center text-sm font-medium">Wed</div>
              <div className="bg-muted p-3 text-center text-sm font-medium">Thu</div>
              <div className="bg-muted p-3 text-center text-sm font-medium">Fri</div>
              <div className="bg-muted p-3 text-center text-sm font-medium">Sat</div>
              <div className="bg-muted p-3 text-center text-sm font-medium">Week PnL</div>
              
              {/* Calendar Days */}
              {renderCalendar()}
              
              {/* Weekly Totals */}
              {weeklyTotals()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PnL;