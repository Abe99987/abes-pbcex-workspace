export const toCommodityPath = (
  symbol: string,
  params?: Record<string, string>
) => {
  const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
  return `/shop/${symbol}${qs}`;
};

export const toTradingPath = (symbol: string, feedCode?: string) => {
  const inferred = feedCode?.split(':').pop() || `${symbol}USD`;
  return `/coin-trading?symbol=${inferred}`;
};
