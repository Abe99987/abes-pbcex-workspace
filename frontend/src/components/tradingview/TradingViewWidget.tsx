import React, { useEffect, useRef, useCallback } from 'react';
import { useClientOnly } from '@/hooks/useClientOnly';
import { getWidgetScriptUrl } from '@/utils/tradingview';

/**
 * Generic TradingView widget component
 * Loads any TradingView widget by type with SSR safety
 */

interface TradingViewWidgetProps {
  /** Widget type (e.g., 'ticker-tape', 'advanced-chart', 'symbol-overview') */
  widgetType: string;
  /** Widget configuration object */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: Record<string, any>;
  /** Container CSS classes */
  className?: string;
  /** Container style overrides */
  style?: React.CSSProperties;
  /** Loading placeholder component */
  loadingComponent?: React.ReactNode;
  /** Error placeholder component */
  errorComponent?: React.ReactNode;
  /** Callback when widget loads successfully */
  onLoad?: () => void;
  /** Callback when widget fails to load */
  onError?: (error: Error) => void;
}

/**
 * Generate a unique container ID for the widget
 */
function generateContainerId(widgetType: string): string {
  return `tradingview-widget-${widgetType}-${Math.random().toString(36).substr(2, 9)}`;
}

export const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({
  widgetType,
  config,
  className = '',
  style = {},
  loadingComponent,
  errorComponent,
  onLoad,
  onError,
}) => {
  const isClient = useClientOnly();
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const widgetLoadedRef = useRef(false);
  const containerIdRef = useRef<string>();

  // Generate container ID once
  if (!containerIdRef.current) {
    containerIdRef.current = generateContainerId(widgetType);
  }

  const loadWidget = useCallback(() => {
    if (!isClient || !containerRef.current || widgetLoadedRef.current) {
      return;
    }

    try {
      // Clear any existing content
      const container = containerRef.current;
      container.innerHTML = '';

      // Create and configure the script element
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = getWidgetScriptUrl(widgetType);

      // Configure widget with the container ID
      const widgetConfig = {
        ...config,
        container_id: containerIdRef.current,
      };

      script.innerHTML = JSON.stringify(widgetConfig);

      // Add load and error handlers
      script.onload = () => {
        widgetLoadedRef.current = true;
        onLoad?.();
      };

      script.onerror = error => {
        const errorObj = new Error(
          `Failed to load TradingView widget: ${widgetType}`
        );
        console.error('TradingView widget error:', errorObj, error);
        onError?.(errorObj);
      };

      // Create widget container div
      const widgetContainer = document.createElement('div');
      widgetContainer.id = containerIdRef.current;
      widgetContainer.className = 'tradingview-widget-container__widget';

      // Append elements
      container.appendChild(widgetContainer);
      container.appendChild(script);

      scriptRef.current = script;
    } catch (error) {
      const errorObj =
        error instanceof Error
          ? error
          : new Error('Unknown error loading widget');
      console.error('TradingView widget setup error:', errorObj);
      onError?.(errorObj);
    }
  }, [isClient, widgetType, config, onLoad, onError]);

  // Load widget when component mounts and is client-side
  useEffect(() => {
    if (isClient) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(loadWidget, 100);
      return () => clearTimeout(timer);
    }
  }, [isClient, loadWidget]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
      widgetLoadedRef.current = false;
    };
  }, []);

  // Default loading component
  const defaultLoading = (
    <div className='flex items-center justify-center p-8 bg-gray-50 rounded-lg animate-pulse'>
      <div className='text-center'>
        <div className='inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2'></div>
        <p className='text-sm text-gray-600'>Loading market data...</p>
      </div>
    </div>
  );

  // Default error component
  const defaultError = (
    <div className='flex items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200'>
      <div className='text-center'>
        <div className='text-red-500 mb-2'>
          <svg
            className='w-8 h-8 mx-auto'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        </div>
        <p className='text-sm text-red-600'>Failed to load market data</p>
        <button
          onClick={loadWidget}
          className='mt-2 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors'
        >
          Retry
        </button>
      </div>
    </div>
  );

  // Don't render anything on server-side
  if (!isClient) {
    return (
      <div
        className={`tradingview-widget-placeholder ${className}`}
        style={style}
      >
        {loadingComponent || defaultLoading}
      </div>
    );
  }

  return (
    <div className={`tradingview-widget-container ${className}`} style={style}>
      <div
        ref={containerRef}
        className='tradingview-widget-container__content'
        style={{ width: '100%', height: '100%' }}
      />
      {!widgetLoadedRef.current && (loadingComponent || defaultLoading)}
      {/* Attribution - required by TradingView */}
      <div className='tradingview-widget-copyright'>
        <a
          href='https://www.tradingview.com/'
          rel='noopener nofollow'
          target='_blank'
          className='text-xs text-gray-500 hover:text-gray-700'
        >
          Track all markets on TradingView
        </a>
      </div>
    </div>
  );
};

export default TradingViewWidget;
