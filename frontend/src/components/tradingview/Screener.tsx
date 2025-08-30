import React from 'react';
import TradingViewWidget from './TradingViewWidget';
import { WIDGET_CONFIGS } from '@/utils/tradingview';

interface ScreenerProps {
  /** Widget width */
  width?: string | number;
  /** Widget height */
  height?: string | number;
  /** Default column */
  defaultColumn?: 'overview' | 'performance' | 'technical' | 'fundamentals';
  /** Default screen */
  defaultScreen?:
    | 'general'
    | 'most_capitalized'
    | 'day_gainers'
    | 'day_losers'
    | 'most_active';
  /** Market */
  market?:
    | 'forex'
    | 'crypto'
    | 'america'
    | 'australia'
    | 'canada'
    | 'egypt'
    | 'germany'
    | 'india'
    | 'israel'
    | 'italy'
    | 'turkey'
    | 'uk';
  /** Show toolbar */
  showToolbar?: boolean;
  /** Custom className */
  className?: string;
  /** Container style */
  style?: React.CSSProperties;
}

export const Screener: React.FC<ScreenerProps> = ({
  width = '100%',
  height = 490,
  defaultColumn = 'overview',
  defaultScreen = 'general',
  market = 'forex',
  showToolbar = true,
  className = '',
  style = {},
}) => {
  const config = {
    ...WIDGET_CONFIGS.SCREENER,
    width,
    height,
    defaultColumn,
    defaultScreen,
    market,
    showToolbar,
  };

  return (
    <TradingViewWidget
      widgetType='screener'
      config={config}
      className={`screener-widget ${className}`}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
    />
  );
};

export default Screener;
