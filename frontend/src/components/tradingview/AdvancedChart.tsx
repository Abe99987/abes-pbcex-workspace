import React from 'react';
import TradingViewWidget from './TradingViewWidget';
import { WIDGET_CONFIGS } from '@/utils/tradingview';

interface AdvancedChartProps {
  /** Symbol to display */
  symbol?: string;
  /** Chart interval */
  interval?: string;
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
  /** Custom className */
  className?: string;
  /** Container style */
  containerStyle?: React.CSSProperties;
}

export const AdvancedChart: React.FC<AdvancedChartProps> = ({
  symbol,
  interval = 'D',
  style: chartStyle = '1',
  autosize = true,
  width = '100%',
  height = 610,
  allowSymbolChange = true,
  studies,
  className = '',
  containerStyle = {},
}) => {
  const config = {
    ...WIDGET_CONFIGS.ADVANCED_CHART,
    ...(symbol && { symbol }),
    interval,
    style: chartStyle,
    autosize,
    width,
    height,
    allow_symbol_change: allowSymbolChange,
    ...(studies && { studies }),
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
