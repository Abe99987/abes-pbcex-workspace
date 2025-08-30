import React from 'react';
import TradingViewWidget from './TradingViewWidget';
import { WIDGET_CONFIGS } from '@/utils/tradingview';

interface SymbolOverviewProps {
  /** Symbols to display - array of [symbol, title] pairs */
  symbols?: Array<[string, string]>;
  /** Chart only mode */
  chartOnly?: boolean;
  /** Widget width */
  width?: string | number;
  /** Widget height */
  height?: string | number;
  /** Show volume */
  showVolume?: boolean;
  /** Show moving averages */
  showMA?: boolean;
  /** Hide date ranges */
  hideDateRanges?: boolean;
  /** Hide market status */
  hideMarketStatus?: boolean;
  /** Values tracking */
  valuesTracking?: '0' | '1';
  /** Change mode */
  changeMode?: 'price-and-percent' | 'percent' | 'price';
  /** Custom className */
  className?: string;
  /** Container style */
  style?: React.CSSProperties;
}

export const SymbolOverview: React.FC<SymbolOverviewProps> = ({
  symbols,
  chartOnly = false,
  width = '100%',
  height = 500,
  showVolume = true,
  showMA = false,
  hideDateRanges = false,
  hideMarketStatus = false,
  valuesTracking = '1',
  changeMode = 'price-and-percent',
  className = '',
  style = {},
}) => {
  const config = {
    ...WIDGET_CONFIGS.SYMBOL_OVERVIEW,
    ...(symbols && { symbols }),
    chartOnly,
    width,
    height,
    showVolume,
    showMA,
    hideDateRanges,
    hideMarketStatus,
    valuesTracking,
    changeMode,
  };

  return (
    <TradingViewWidget
      widgetType='symbol-overview'
      config={config}
      className={`symbol-overview-widget ${className}`}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
    />
  );
};

export default SymbolOverview;
