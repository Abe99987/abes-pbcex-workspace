/**
 * TradingView widgets exports
 * Centralized export point for all TradingView widget components
 */

// Core widget
export { default as TradingViewWidget } from './TradingViewWidget';

// Chart widgets
export { default as AdvancedChart } from './AdvancedChart';
export { default as SymbolOverview } from './SymbolOverview';
export { default as MiniChart } from './MiniChart';

// Market widgets
export { default as MarketOverview } from './MarketOverview';
export { default as TickerTape } from './TickerTape';
export { default as Screener } from './Screener';

// Analysis widgets
export { default as EconomicCalendar } from './EconomicCalendar';
export {
  default as StockHeatmap,
  CryptoHeatmap,
  ForexHeatmap,
} from './Heatmaps';

// Type exports
export type { TradingViewTheme } from '@/utils/tradingview';
