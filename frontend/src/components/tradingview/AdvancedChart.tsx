import React from 'react';
import TradingViewWidget from './TradingViewWidget';
import {
  WIDGET_CONFIGS,
  getCanonicalSymbol,
  REQUIRED_TIMEFRAMES,
  type ExecutionMarkersProvider,
} from '@/utils/tradingview';

interface AdvancedChartProps {
  /** Symbol to display (will be converted to canonical format) */
  symbol?: string;
  /** Chart interval (defaults to supported timeframes) */
  interval?: (typeof REQUIRED_TIMEFRAMES)[number];
  /** Chart style */
  style?: '1' | '2' | '3' | '4' | '9';
  /** Auto resize */
  autosize?: boolean;
  /** Widget width */
  width?: string | number;
  /** Widget height */
  height?: string | number;
  /** Allow symbol change */
  allowSymbolChange?: boolean;
  /** Studies to include */
  studies?: string[];
  /** Enable crosshair (default: true for parity) */
  enableCrosshair?: boolean;
  /** Execution markers provider for trade visualization */
  executionMarkersProvider?: ExecutionMarkersProvider;
  /** Custom className */
  className?: string;
  /** Container style */
  containerStyle?: React.CSSProperties;
}

export const AdvancedChart: React.FC<AdvancedChartProps> = ({
  symbol,
  interval = '1D',
  style: chartStyle = '1',
  autosize = true,
  width = '100%',
  height = 610,
  allowSymbolChange = true,
  studies,
  enableCrosshair = true,
  executionMarkersProvider,
  className = '',
  containerStyle = {},
}) => {
  // Convert symbol to canonical format if provided
  const canonicalSymbol = symbol
    ? getCanonicalSymbol(symbol)
    : WIDGET_CONFIGS.ADVANCED_CHART.symbol;

  const config = {
    ...WIDGET_CONFIGS.ADVANCED_CHART,
    symbol: canonicalSymbol,
    interval,
    style: chartStyle,
    autosize,
    width,
    height,
    allow_symbol_change: allowSymbolChange,
    // Enable crosshair for TradingView parity
    hide_top_toolbar: false,
    hide_legend: false,
    hide_side_toolbar: false,
    toolbar_bg: '#f1f3f6',
    // Ensure required timeframes are available
    time_frames: REQUIRED_TIMEFRAMES,
    // Crosshair configuration
    crosshair_options: enableCrosshair
      ? {
          visible: true,
          style: 0, // Dotted
          width: 1,
          color: 'rgba(32, 38, 46, 0.1)',
        }
      : undefined,
    ...(studies && { studies }),
    // Execution markers hook (placeholder for future implementation)
    ...(executionMarkersProvider && {
      customMarkersProvider: executionMarkersProvider,
      enable_publishing: false, // Security: disable publishing
    }),
  };

  return (
    <TradingViewWidget
      widgetType='advanced-chart'
      config={config}
      className={`advanced-chart-widget ${className}`}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        ...containerStyle,
      }}
    />
  );
};

export default AdvancedChart;
