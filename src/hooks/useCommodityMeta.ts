import { commodities } from '@/data/commodities/metadata';
import { CommodityMeta } from '@/types/commodities';

export const useCommodityMeta = (symbol: string): CommodityMeta => {
  const meta = commodities[symbol.toUpperCase()];
  
  if (!meta) {
    throw new Error(`Commodity metadata not found for symbol: ${symbol}`);
  }
  
  return meta;
};

export const getAllCommodities = (): Record<string, CommodityMeta> => {
  return commodities;
};