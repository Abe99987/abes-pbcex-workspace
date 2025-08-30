import React from 'react';
import TradingViewWidget from './TradingViewWidget';
import { getTradingViewTheme } from '@/utils/tradingview';

interface MiniChartProps {
  /** Symbol to display */
  symbol?: string;
  /** Widget width */
  width?: string | number;
  /** Widget height */
  height?: string | number;
  /** Date range */
  dateRange?: '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL';
  /** Hide symbol logo */
  hideSymbolLogo?: boolean;
  /** Transparent background */
  isTransparent?: boolean;
  /** Auto size */
  autosize?: boolean;
  /** Custom className */
  className?: string;
  /** Container style */
  style?: React.CSSProperties;
}

export const MiniChart: React.FC<MiniChartProps> = ({
  symbol = 'XAUUSD',
  width = 350,
  height = 220,
  dateRange = '1M',
  hideSymbolLogo = false,
  isTransparent = false,
  autosize = false,
  className = '',
  style = {},
}) => {
  const config = {
    symbol,
    width,
    height,
    dateRange,
    trendLineColor: 'rgba(41, 98, 255, 1)',
    underLineColor: 'rgba(41, 98, 255, 0.3)',
    underLineBottomColor: 'rgba(41, 98, 255, 0)',
    locale: 'en',
    colorTheme: getTradingViewTheme(),
    isTransparent,
    autosize,
    largeChartUrl: '',
    hideSymbolLogo,
  };

  return (
    <TradingViewWidget
      widgetType='mini-symbol-overview'
      config={config}
      className={`mini-chart-widget ${className}`}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
    />
  );
};

export default MiniChart;
