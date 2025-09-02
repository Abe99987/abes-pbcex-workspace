import React from 'react';
import TradingViewWidget from './TradingViewWidget';
import { WIDGET_CONFIGS } from '@/utils/tradingview';

interface StockHeatmapProps {
  /** Widget width */
  width?: string | number;
  /** Widget height */
  height?: string | number;
  /** Data source */
  dataSource?: 'SPX500' | 'QQQ' | 'DJI' | 'RUT' | 'ASX200' | 'TSX60' | 'UKX';
  /** Grouping */
  grouping?: 'sector' | 'industry' | 'no_group';
  /** Block size */
  blockSize?: 'market_cap_basic' | 'volume' | 'relative_volume_10d_calc';
  /** Block color */
  blockColor?:
    | 'change'
    | 'change_abs'
    | 'Perf.W'
    | 'Perf.1M'
    | 'Perf.3M'
    | 'Perf.6M'
    | 'Perf.Y'
    | 'Perf.YTD';
  /** Has top bar */
  hasTopBar?: boolean;
  /** Is zoom enabled */
  isZoomEnabled?: boolean;
  /** Has symbol tooltip */
  hasSymbolTooltip?: boolean;
  /** Custom className */
  className?: string;
  /** Container style */
  style?: React.CSSProperties;
}

export const StockHeatmap: React.FC<StockHeatmapProps> = ({
  width = '100%',
  height = 400,
  dataSource = 'SPX500',
  grouping = 'sector',
  blockSize = 'market_cap_basic',
  blockColor = 'change',
  hasTopBar = false,
  isZoomEnabled = true,
  hasSymbolTooltip = true,
  className = '',
  style = {},
}) => {
  const config = {
    ...WIDGET_CONFIGS.STOCK_HEATMAP,
    width,
    height,
    dataSource,
    grouping,
    blockSize,
    blockColor,
    hasTopBar,
    isZoomEnabled,
    hasSymbolTooltip,
  };

  return (
    <TradingViewWidget
      widgetType='stock-heatmap'
      config={config}
      className={`stock-heatmap-widget ${className}`}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
    />
  );
};

interface CryptoHeatmapProps {
  /** Widget width */
  width?: string | number;
  /** Widget height */
  height?: string | number;
  /** Data source */
  dataSource?: 'Crypto';
  /** Block size */
  blockSize?: 'market_cap_calc' | 'volume' | 'change' | 'change_abs';
  /** Block color */
  blockColor?: 'change' | 'change_abs' | 'Perf.W' | 'Perf.1M';
  /** Custom className */
  className?: string;
  /** Container style */
  style?: React.CSSProperties;
}

export const CryptoHeatmap: React.FC<CryptoHeatmapProps> = ({
  width = '100%',
  height = 400,
  dataSource = 'Crypto',
  blockSize = 'market_cap_calc',
  blockColor = 'change',
  className = '',
  style = {},
}) => {
  const config = {
    exchanges: [],
    dataSource,
    grouping: 'no_group',
    blockSize,
    blockColor,
    locale: 'en',
    symbolUrl: '',
    colorTheme: 'light',
    hasTopBar: false,
    isDataSetEnabled: false,
    isZoomEnabled: true,
    hasSymbolTooltip: true,
    width,
    height,
  };

  return (
    <TradingViewWidget
      widgetType='crypto-coins-heatmap'
      config={config}
      className={`crypto-heatmap-widget ${className}`}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
    />
  );
};

interface ForexHeatmapProps {
  /** Widget width */
  width?: string | number;
  /** Widget height */
  height?: string | number;
  /** Currencies to display */
  currencies?: string[];
  /** Custom className */
  className?: string;
  /** Container style */
  style?: React.CSSProperties;
}

export const ForexHeatmap: React.FC<ForexHeatmapProps> = ({
  width = '100%',
  height = 400,
  currencies = ['EUR', 'USD', 'JPY', 'GBP', 'CHF', 'AUD', 'CAD', 'NZD'],
  className = '',
  style = {},
}) => {
  const config = {
    currencies,
    isTransparent: false,
    colorTheme: 'light',
    locale: 'en',
    width,
    height,
  };

  return (
    <TradingViewWidget
      widgetType='forex-heat-map'
      config={config}
      className={`forex-heatmap-widget ${className}`}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
    />
  );
};

// Export all heatmap components
export default StockHeatmap;
