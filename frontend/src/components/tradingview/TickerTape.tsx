import React from 'react';
import TradingViewWidget from './TradingViewWidget';
import { WIDGET_CONFIGS } from '@/utils/tradingview';

interface TickerTapeProps {
  /** Custom symbols to display */
  symbols?: Array<{
    proName: string;
    title: string;
  }>;
  /** Show symbol logos */
  showSymbolLogo?: boolean;
  /** Display mode */
  displayMode?: 'adaptive' | 'compact' | 'regular';
  /** Custom className */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
}

export const TickerTape: React.FC<TickerTapeProps> = ({
  symbols,
  showSymbolLogo = true,
  displayMode = 'adaptive',
  className = '',
  style = {},
}) => {
  const config = {
    ...WIDGET_CONFIGS.TICKER_TAPE,
    ...(symbols && { symbols }),
    showSymbolLogo,
    displayMode,
  };

  return (
    <TradingViewWidget
      widgetType='ticker-tape'
      config={config}
      className={`ticker-tape-widget ${className}`}
      style={{ height: '62px', ...style }}
    />
  );
};

export default TickerTape;
