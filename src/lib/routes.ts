export const toCommodityPath = (symbol: string, params?: Record<string, string>) => {
  const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
  return `/shop/${symbol}${qs}`;
};