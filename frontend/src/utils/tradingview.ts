/**
 * TradingView widget utilities and configuration
 * Centralized symbols, themes, and defaults for consistent widget integration
 */

// Widget themes
export type TradingViewTheme = 'light' | 'dark';

// Required timeframes for TradingView parity
export const REQUIRED_TIMEFRAMES = [
  '1m',
  '5m',
  '15m',
  '1h',
  '4h',
  '1D',
] as const;
export type Timeframe = (typeof REQUIRED_TIMEFRAMES)[number];

// Execution markers interface for trade visualization
export interface ExecutionMarker {
  id: string;
  time: number; // Unix timestamp
  position: 'above' | 'below';
  color: string;
  shape: 'circle' | 'square' | 'arrow_up' | 'arrow_down';
  text?: string;
  size?: 'tiny' | 'small' | 'normal' | 'large';
}

// Execution markers provider interface
export interface ExecutionMarkersProvider {
  getMarkers: (
    symbol: string,
    timeframe: Timeframe
  ) => Promise<ExecutionMarker[]>;
  subscribeToMarkers?: (
    symbol: string,
    callback: (markers: ExecutionMarker[]) => void
  ) => () => void;
}

// Canonical symbol mappings (aligned with backend PriceFeedService)
export const CANONICAL_SYMBOL_MAP = {
  // PBCEx asset codes to TradingView symbols (matches backend)
  XAU: 'OANDA:XAUUSD',
  AU: 'OANDA:XAUUSD', // Gold
  XAG: 'OANDA:XAGUSD',
  AG: 'OANDA:XAGUSD', // Silver
  XPT: 'OANDA:XPTUSD',
  PT: 'OANDA:XPTUSD', // Platinum
  XPD: 'OANDA:XPDUSD',
  PD: 'OANDA:XPDUSD', // Palladium
  XCU: 'COMEX:HG1!',
  CU: 'COMEX:HG1!', // Copper
  BTC: 'BINANCE:BTCUSDT',
  ETH: 'BINANCE:ETHUSDT',
  USD: 'OANDA:EURUSD', // For USD index
  PAXG: 'OANDA:XAUUSD', // PAXG tracks gold
} as const;

// Common trading symbols organized by category
export const SYMBOLS = {
  // Precious Metals (Primary focus for PBCEx) - Using canonical mappings
  METALS: {
    GOLD: 'OANDA:XAUUSD',
    SILVER: 'OANDA:XAGUSD',
    PLATINUM: 'OANDA:XPTUSD',
    PALLADIUM: 'OANDA:XPDUSD',
    COPPER: 'COMEX:HG1!', // Copper futures
  },

  // Cryptocurrencies - Using canonical mappings
  CRYPTO: {
    BITCOIN: 'BINANCE:BTCUSDT',
    ETHEREUM: 'BINANCE:ETHUSDT',
    LITECOIN: 'LTCUSD',
    RIPPLE: 'XRPUSD',
    CARDANO: 'ADAUSD',
    SOLANA: 'SOLUSD',
  },

  // Major Forex pairs
  FOREX: {
    EURUSD: 'EURUSD',
    GBPUSD: 'GBPUSD',
    USDJPY: 'USDJPY',
    USDCHF: 'USDCHF',
    AUDUSD: 'AUDUSD',
    USDCAD: 'USDCAD',
  },

  // Major indices
  INDICES: {
    SPX: 'SPX',
    NDX: 'NDX',
    DJI: 'DJI',
    RUT: 'RUT',
    VIX: 'VIX',
  },

  // Commodities
  COMMODITIES: {
    OIL_WTI: 'USOIL',
    OIL_BRENT: 'UKOIL',
    NATURAL_GAS: 'NATURALGAS',
    WHEAT: 'WHEAT',
    CORN: 'CORN',
    SOYBEANS: 'SOYBNUSD',
  },
} as const;

// Default ticker symbols for header ticker tape (focus on metals + major markets)
export const DEFAULT_TICKER_LIST = [
  // Primary metals (PBCEx focus)
  SYMBOLS.METALS.GOLD,
  SYMBOLS.METALS.SILVER,
  SYMBOLS.METALS.PLATINUM,
  SYMBOLS.METALS.PALLADIUM,
  SYMBOLS.METALS.COPPER,

  // Major crypto
  SYMBOLS.CRYPTO.BITCOIN,
  SYMBOLS.CRYPTO.ETHEREUM,

  // Key forex
  SYMBOLS.FOREX.EURUSD,
  SYMBOLS.FOREX.GBPUSD,

  // Major indices
  SYMBOLS.INDICES.SPX,
  SYMBOLS.INDICES.NDX,

  // Oil (commodity correlation)
  SYMBOLS.COMMODITIES.OIL_WTI,
];

// Default symbols for My Assets overview (metals focus)
export const MY_ASSETS_SYMBOLS = [
  SYMBOLS.METALS.GOLD,
  SYMBOLS.METALS.SILVER,
  SYMBOLS.METALS.PLATINUM,
  SYMBOLS.METALS.PALLADIUM,
  SYMBOLS.CRYPTO.BITCOIN,
  SYMBOLS.CRYPTO.ETHEREUM,
];

// Symbols for Markets overview page
export const MARKETS_OVERVIEW_SYMBOLS = [
  SYMBOLS.METALS.GOLD,
  SYMBOLS.METALS.SILVER,
  SYMBOLS.METALS.COPPER,
  SYMBOLS.CRYPTO.BITCOIN,
  SYMBOLS.CRYPTO.ETHEREUM,
  SYMBOLS.FOREX.EURUSD,
  SYMBOLS.INDICES.SPX,
  SYMBOLS.COMMODITIES.OIL_WTI,
];

/**
 * Get appropriate theme for TradingView widgets
 * Can be extended to read from app theme context
 */
export function getTradingViewTheme(): TradingViewTheme {
  // TODO: Read from app theme context when available
  // For now, default to light theme
  return 'light';
}

/**
 * Common widget configuration defaults
 */
export const WIDGET_DEFAULTS = {
  theme: getTradingViewTheme(),
  locale: 'en',
  timezone: 'Etc/UTC',
  range: '1D' as const,
  style: '1' as const, // Candlestick
  toolbar_bg: '#f1f3f6',
  enable_publishing: false,
  hide_top_toolbar: false,
  hide_legend: false,
  save_image: true,
  container_id: 'tradingview_widget',
};

/**
 * Widget-specific defaults
 */
export const WIDGET_CONFIGS = {
  // Ticker Tape configuration
  TICKER_TAPE: {
    symbols: DEFAULT_TICKER_LIST.map(symbol => ({
      proName: symbol,
      title: symbol,
    })),
    showSymbolLogo: true,
    colorTheme: getTradingViewTheme(),
    isTransparent: false,
    displayMode: 'adaptive' as const,
    locale: 'en',
  },

  // Advanced Chart configuration
  ADVANCED_CHART: {
    autosize: true,
    symbol: SYMBOLS.METALS.GOLD,
    interval: 'D' as const,
    timezone: 'Etc/UTC',
    theme: getTradingViewTheme(),
    style: '1' as const,
    locale: 'en',
    toolbar_bg: '#f1f3f6',
    enable_publishing: false,
    allow_symbol_change: true,
    save_image: true,
    studies: ['Volume@tv-basicstudies'],
  },

  // Symbol Overview configuration
  SYMBOL_OVERVIEW: {
    symbols: [[SYMBOLS.METALS.GOLD, 'Gold|1D']],
    chartOnly: false,
    width: '100%',
    height: 500,
    locale: 'en',
    colorTheme: getTradingViewTheme(),
    autosize: true,
    showVolume: true,
    showMA: false,
    hideDateRanges: false,
    hideMarketStatus: false,
    hideSymbolLogo: false,
    scalePosition: 'right' as const,
    scaleMode: 'Normal' as const,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif',
    fontSize: '10',
    noTimeScale: false,
    valuesTracking: '1' as const,
    changeMode: 'price-and-percent' as const,
  },

  // Market Overview configuration
  MARKET_OVERVIEW: {
    colorTheme: getTradingViewTheme(),
    dateRange: '12M' as const,
    showChart: true,
    locale: 'en',
    width: '100%',
    height: 400,
    largeChartUrl: '',
    isTransparent: false,
    showSymbolLogo: true,
    showFloatingTooltip: false,
    plotLineColorGrowing: 'rgba(41, 98, 255, 1)',
    plotLineColorFalling: 'rgba(41, 98, 255, 1)',
    gridLineColor: 'rgba(240, 243, 250, 0)',
    scaleFontColor: 'rgba(120, 123, 134, 1)',
    belowLineFillColorGrowing: 'rgba(41, 98, 255, 0.12)',
    belowLineFillColorFalling: 'rgba(41, 98, 255, 0.12)',
    belowLineFillColorGrowingBottom: 'rgba(41, 98, 255, 0)',
    belowLineFillColorFallingBottom: 'rgba(41, 98, 255, 0)',
    symbolActiveColor: 'rgba(41, 98, 255, 0.12)',
  },

  // Economic Calendar configuration
  ECONOMIC_CALENDAR: {
    colorTheme: getTradingViewTheme(),
    isTransparent: false,
    width: '100%',
    height: 400,
    locale: 'en',
    importanceFilter: '-1,0,1' as const,
    countryFilter: 'us,eu,jp,gb,ch,au,ca,nz,cn' as const,
  },

  // Screener configuration
  SCREENER: {
    width: '100%',
    height: 490,
    defaultColumn: 'overview' as const,
    defaultScreen: 'general' as const,
    market: 'forex' as const,
    showToolbar: true,
    colorTheme: getTradingViewTheme(),
    locale: 'en',
    isTransparent: false,
  },

  // Stock Heatmap configuration
  STOCK_HEATMAP: {
    exchanges: [] as string[],
    dataSource: 'SPX500' as const,
    grouping: 'sector' as const,
    blockSize: 'market_cap_basic' as const,
    blockColor: 'change' as const,
    locale: 'en',
    symbolUrl: '',
    colorTheme: getTradingViewTheme(),
    hasTopBar: false,
    isDataSetEnabled: false,
    isZoomEnabled: true,
    hasSymbolTooltip: true,
    width: '100%',
    height: 400,
  },
} as const;

/**
 * Get widget script URL for a specific widget type
 */
export function getWidgetScriptUrl(widgetType: string): string {
  return `https://s3.tradingview.com/external-embedding/embed-widget-${widgetType}.js`;
}

/**
 * Convert PBCEx asset code to canonical TradingView symbol
 */
export function getCanonicalSymbol(assetCode: string): string {
  return (
    CANONICAL_SYMBOL_MAP[assetCode as keyof typeof CANONICAL_SYMBOL_MAP] ||
    assetCode
  );
}

/**
 * Get symbol display name for UI
 */
export function getSymbolDisplayName(symbol: string): string {
  // Check canonical mappings first
  for (const [key, value] of Object.entries(CANONICAL_SYMBOL_MAP)) {
    if (value === symbol || key === symbol) {
      // Return asset-friendly name
      switch (key) {
        case 'AU':
        case 'XAU':
          return 'Gold';
        case 'AG':
        case 'XAG':
          return 'Silver';
        case 'PT':
        case 'XPT':
          return 'Platinum';
        case 'PD':
        case 'XPD':
          return 'Palladium';
        case 'CU':
        case 'XCU':
          return 'Copper';
        case 'BTC':
          return 'Bitcoin';
        case 'ETH':
          return 'Ethereum';
        case 'PAXG':
          return 'Pax Gold';
        default:
          break;
      }
    }
  }

  // Find the symbol in our constants and return a friendly name
  for (const category of Object.values(SYMBOLS)) {
    for (const [key, value] of Object.entries(category)) {
      if (value === symbol) {
        return key
          .replace('_', ' ')
          .toLowerCase()
          .replace(/\b\w/g, l => l.toUpperCase());
      }
    }
  }
  return symbol; // Fallback to the symbol itself
}

/**
 * Validate if a symbol exists in our predefined list
 */
export function isValidSymbol(symbol: string): boolean {
  for (const category of Object.values(SYMBOLS)) {
    if (Object.values(category).includes(symbol as any)) {
      return true;
    }
  }
  return false;
}

/**
 * Get symbols by category
 */
export function getSymbolsByCategory(category: keyof typeof SYMBOLS): string[] {
  return Object.values(SYMBOLS[category]);
}

/**
 * Create responsive dimensions for widgets
 */
export function getResponsiveDimensions(
  baseWidth: number = 100,
  baseHeight: number = 400
) {
  return {
    width: '100%',
    height: Math.max(300, Math.min(baseHeight, 600)), // Min 300px, max 600px
  };
}
