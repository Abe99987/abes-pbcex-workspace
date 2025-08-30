import { useEffect, useState } from 'react';

/**
 * Hook to detect if we're running on the client side
 * Useful for SSR-safe rendering of client-only components like TradingView widgets
 */
export function useClientOnly(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

export default useClientOnly;
