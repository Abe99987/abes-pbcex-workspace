import React from 'react';
import TradingViewWidget from './TradingViewWidget';
import { WIDGET_CONFIGS } from '@/utils/tradingview';

interface EconomicCalendarProps {
  /** Widget width */
  width?: string | number;
  /** Widget height */
  height?: string | number;
  /** Importance filter (-1=low, 0=medium, 1=high) */
  importanceFilter?: string;
  /** Country filter (comma-separated country codes) */
  countryFilter?: string;
  /** Custom className */
  className?: string;
  /** Container style */
  style?: React.CSSProperties;
}

export const EconomicCalendar: React.FC<EconomicCalendarProps> = ({
  width = '100%',
  height = 400,
  importanceFilter = '-1,0,1',
  countryFilter = 'us,eu,jp,gb,ch,au,ca,nz,cn',
  className = '',
  style = {},
}) => {
  const config = {
    ...WIDGET_CONFIGS.ECONOMIC_CALENDAR,
    width,
    height,
    importanceFilter,
    countryFilter,
  };

  return (
    <TradingViewWidget
      widgetType='events'
      config={config}
      className={`economic-calendar-widget ${className}`}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
    />
  );
};

export default EconomicCalendar;
