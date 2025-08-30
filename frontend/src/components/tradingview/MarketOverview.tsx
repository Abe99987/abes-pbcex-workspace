import React from 'react';
import TradingViewWidget from './TradingViewWidget';
import { WIDGET_CONFIGS } from '@/utils/tradingview';

interface MarketOverviewProps {
  /** Date range */
  dateRange?: '1D' | '1M' | '3M' | '12M' | 'YTD' | 'ALL';
  /** Show chart */
  showChart?: boolean;
  /** Widget width */
  width?: string | number;
  /** Widget height */
  height?: string | number;
  /** Show symbol logo */
  showSymbolLogo?: boolean;
  /** Show floating tooltip */
  showFloatingTooltip?: boolean;
  /** Custom className */
  className?: string;
  /** Container style */
  style?: React.CSSProperties;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({
  dateRange = '12M',
  showChart = true,
  width = '100%',
  height = 400,
  showSymbolLogo = true,
  showFloatingTooltip = false,
  className = '',
  style = {},
}) => {
  const config = {
    ...WIDGET_CONFIGS.MARKET_OVERVIEW,
    dateRange,
    showChart,
    width,
    height,
    showSymbolLogo,
    showFloatingTooltip,
  };

  return (
    <TradingViewWidget
      widgetType='market-overview'
      config={config}
      className={`market-overview-widget ${className}`}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
    />
  );
};

export default MarketOverview;
