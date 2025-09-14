/**
 * API Client Layer for Markets and Spending with feature flag support
 * Provides adapters for live data integration with feature flag support
 */

import { FEATURE_FLAGS } from '@/config/features';

// Environment configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Common types - aligned with OpenAPI spec
export interface ApiResponse<T> {
  code: 'SUCCESS' | 'ERROR' | 'VALIDATION_ERROR' | 'NOT_FOUND';
  data: T;
  timestamp: string;
  path?: string;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  timestamp: string;
  path?: string;
  details?: Record<string, any>;
}

// ===== Markets domain types =====
export interface MarketSymbol {
  pair: string;
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: number;
  high24h: string;
  low24h: string;
  volume: string;
  sparklineData: number[];
  type: 'crypto' | 'commodity' | 'synthetic';
  isFavorite?: boolean;
  isNewlyListed?: boolean;
}

export interface MarketKPIs {
  fearGreedIndex: number;
  fearGreedLabel: string;
  ethGasPrice: string;
  ethGasPriceUsd: string;
  tradingVolumeUsd: string;
  tradingVolumeChange: string;
  longShortRatio: { long: number; short: number };
}

export interface SectorData {
  name: string;
  change: string;
  isPositive: boolean;
}

// ===== Spending domain types =====
export interface Transaction {
  id: string;
  date: string; // ISO
  merchant: string;
  description: string;
  amount: number; // negative = spend
  category: string;
  tags: string[];
  status: 'completed' | 'pending' | 'failed';
  recurring: boolean;
  type: 'card' | 'bank' | 'crypto';
  account: string;
}

export interface SpendingFilters {
  month?: string; // YYYY-MM format
  category?: string;
  merchant?: string;
  minAmount?: number;
  maxAmount?: number;
  tags?: string[];
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  spent: number;
  remaining: number;
}

export interface DCARule {
  id: string;
  alias: string;
  asset: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextExecution: string; // ISO date
  isActive: boolean;
}

// ===== Markets Adapter =====
export class MarketsAdapter {
  private baseUrl: string;
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getSymbols(): Promise<MarketSymbol[]> {
    if (!FEATURE_FLAGS['markets.v1']) return this.getMockSymbols();
    try {
      const response = await fetch(`${this.baseUrl}/markets/symbols`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const result = await response.json();
      if (this.isOpenAPIResponse(result)) {
        if (result.code === 'SUCCESS') return this.normalizeMarketSymbols(result.data);
        throw new Error(`API Error: ${result.message || result.code}`);
      }
      return this.normalizeMarketSymbols(result.data || result);
    } catch (e) {
      console.warn('Markets API failed, falling back to mock data:', e);
      return this.getMockSymbols();
    }
  }

  async getKpis(): Promise<MarketKPIs> {
    if (!FEATURE_FLAGS['markets.v1']) return this.getMockKPIs();
    try {
      const response = await fetch(`${this.baseUrl}/markets/kpis`, {
        method: 'GET', headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const result = await response.json();
      if (this.isOpenAPIResponse(result)) {
        if (result.code === 'SUCCESS') return this.normalizeMarketKPIs(result.data);
        throw new Error(`API Error: ${result.message || result.code}`);
      }
      return this.normalizeMarketKPIs(result.data || result);
    } catch (e) {
      console.warn('Markets KPIs API failed, falling back to mock:', e);
      return this.getMockKPIs();
    }
  }

  async getSectors(): Promise<{ crypto: SectorData[]; commodity: SectorData[] }> {
    if (!FEATURE_FLAGS['markets.v1']) return this.getMockSectors();
    try {
      const response = await fetch(`${this.baseUrl}/markets/sectors`, {
        method: 'GET', headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const result = await response.json();
      if (this.isOpenAPIResponse(result)) {
        if (result.code === 'SUCCESS') return result.data;
        throw new Error(`API Error: ${result.message || result.code}`);
      }
      return result.data || result;
    } catch (e) {
      console.warn('Markets sectors API failed, falling back to mock:', e);
      return this.getMockSectors();
    }
  }

  startPriceStream(onUpdate: (symbol: string, price: string, change: number) => void): EventSource | null {
    if (!FEATURE_FLAGS['markets.v1']) return null;
    try {
      const es = new EventSource(`${this.baseUrl}/markets/stream`);
      es.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          onUpdate(update.symbol, update.price, update.changePercent);
        } catch (err) {
          console.warn('Price stream parse error:', err);
        }
      };
      es.onerror = (err) => console.warn('Price stream error:', err);
      return es;
    } catch (e) {
      console.warn('Failed to start price stream:', e);
      return null;
    }
  }

  streamPrices(onUpdate: (symbol: string, price: string, change: number) => void) {
    const source = this.startPriceStream(onUpdate);
    return { source, close: () => source?.close() };
  }

  private isOpenAPIResponse(response: any): response is ApiResponse<any> {
    return response && typeof response.code === 'string' && response.data !== undefined && typeof response.timestamp === 'string';
  }

  private normalizeMarketSymbols(data: any): MarketSymbol[] {
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => ({
      pair: item.pair || item.symbol || 'UNKNOWN',
      symbol: item.symbol || item.pair?.split('/')[0] || 'UNKNOWN',
      name: item.name || item.symbol || 'Unknown Asset',
      price: item.price?.toString() || '0.00',
      change: item.change || '+0.0%',
      changePercent: typeof item.changePercent === 'number' ? item.changePercent : 0,
      high24h: item.high24h?.toString() || item.price?.toString() || '0.00',
      low24h: item.low24h?.toString() || item.price?.toString() || '0.00',
      volume: item.volume?.toString() || '0',
      sparklineData: Array.isArray(item.sparklineData) ? item.sparklineData : [0,0,0,0,0,0,0,0],
      type: item.type || 'crypto',
      isFavorite: Boolean(item.isFavorite),
      isNewlyListed: Boolean(item.isNewlyListed),
    }));
  }

  private normalizeMarketKPIs(data: any): MarketKPIs {
    return {
      fearGreedIndex: typeof data?.fearGreedIndex === 'number' ? data.fearGreedIndex : 53,
      fearGreedLabel: data?.fearGreedLabel || 'Neutral',
      ethGasPrice: data?.ethGasPrice?.toString() || '0.127955129',
      ethGasPriceUsd: data?.ethGasPriceUsd?.toString() || '0.013',
      tradingVolumeUsd: data?.tradingVolumeUsd?.toString() || '1525.04 B USD',
      tradingVolumeChange: data?.tradingVolumeChange?.toString() || '+14.66%',
      longShortRatio: {
        long: typeof data?.longShortRatio?.long === 'number' ? data.longShortRatio.long : 77,
        short: typeof data?.longShortRatio?.short === 'number' ? data.longShortRatio.short : 23,
      },
    };
  }

  private getMockSymbols(): MarketSymbol[] {
    return [
      { pair:'BTC/USDC', symbol:'BTC', name:'Bitcoin', price:'43,567.89', change:'+2.8%', changePercent:2.8, high24h:'44,120.50', low24h:'42,890.20', volume:'2.1B', sparklineData:[42000,42500,41800,43000,43200,43600,43500,43567], type:'crypto', isFavorite:true },
      { pair:'ETH/USDC', symbol:'ETH', name:'Ethereum', price:'2,687.45', change:'+1.9%', changePercent:1.9, high24h:'2,720.80', low24h:'2,640.10', volume:'1.8B', sparklineData:[2650,2660,2640,2670,2680,2690,2685,2687], type:'crypto', isFavorite:true },
      { pair:'SOL/USDC', symbol:'SOL', name:'Solana', price:'142.33', change:'+4.2%', changePercent:4.2, high24h:'145.80', low24h:'138.90', volume:'845M', sparklineData:[135,138,140,142,144,143,142.5,142.33], type:'crypto', isNewlyListed:true },
      { pair:'XAU/USD', symbol:'XAU', name:'Gold', price:'2,048.50', change:'+1.2%', changePercent:1.2, high24h:'2,055.20', low24h:'2,035.80', volume:'1.2B', sparklineData:[2040,2045,2038,2042,2048,2050,2049,2048], type:'commodity', isFavorite:true },
      { pair:'XAG/USD', symbol:'XAG', name:'Silver', price:'24.85', change:'+0.8%', changePercent:0.8, high24h:'25.12', low24h:'24.42', volume:'456M', sparklineData:[24.2,24.5,24.3,24.7,24.8,24.9,24.85,24.85], type:'commodity' },
      { pair:'XPT/USD', symbol:'XPT', name:'Platinum', price:'924.80', change:'+0.6%', changePercent:0.6, high24h:'932.40', low24h:'918.60', volume:'234M', sparklineData:[920,922,918,925,924,926,925,924.8], type:'commodity' },
      { pair:'OIL-s/USD', symbol:'OIL-s', name:'Synthetic Oil', price:'78.45', change:'-1.2%', changePercent:-1.2, high24h:'79.80', low24h:'77.90', volume:'123M', sparklineData:[80,79.5,78.8,78.2,78.5,78.3,78.4,78.45], type:'synthetic' },
      { pair:'STEEL-s/USD', symbol:'STEEL-s', name:'Synthetic Steel', price:'0.85', change:'+0.5%', changePercent:0.5, high24h:'0.87', low24h:'0.83', volume:'67M', sparklineData:[0.82,0.83,0.84,0.85,0.86,0.85,0.85,0.85], type:'synthetic', isNewlyListed:true },
    ];
  }

  private getMockKPIs(): MarketKPIs {
    return { fearGreedIndex: 53, fearGreedLabel: 'Neutral', ethGasPrice: '0.127955129', ethGasPriceUsd: '0.013', tradingVolumeUsd: '1525.04 B USD', tradingVolumeChange: '+14.66%', longShortRatio: { long: 77, short: 23 } };
  }

  private getMockSectors(): { crypto: SectorData[]; commodity: SectorData[] } {
    return {
      crypto: [
        { name: 'Memes', change: '+12.4%', isPositive: true },
        { name: 'AI', change: '+8.7%', isPositive: true },
        { name: 'DeFi', change: '+5.2%', isPositive: true },
        { name: 'Gaming', change: '-2.1%', isPositive: false },
      ],
      commodity: [
        { name: 'Metals', change: '+1.8%', isPositive: true },
        { name: 'Energy', change: '-0.9%', isPositive: false },
        { name: 'Agriculture', change: '+2.3%', isPositive: true },
      ],
    };
  }
}

// ===== Spending Adapter =====
export class SpendingAdapter {
  private baseUrl: string;
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getTransactions(filters: SpendingFilters = {}): Promise<Transaction[]> {
    if (!FEATURE_FLAGS['spending.v1']) return this.getMockTransactions();
    try {
      const params = new URLSearchParams();
      if (filters.month) params.append('month', filters.month);
      if (filters.category) params.append('category', filters.category);
      if (filters.merchant) params.append('merchant', filters.merchant);
      const response = await fetch(`${this.baseUrl}/spending/transactions?${params}`, { headers: { 'Content-Type':'application/json', Accept:'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const result = await response.json();
      if (this.isOpenAPIResponse(result)) {
        if (result.code === 'SUCCESS') return this.normalizeTransactions(result.data);
        throw new Error(`API Error: ${result.message || result.code}`);
      }
      return this.normalizeTransactions(result.data || result);
    } catch (e) {
      console.warn('Spending API failed, falling back to mock:', e);
      return this.getMockTransactions();
    }
  }

  async getTags(): Promise<string[]> {
    if (!FEATURE_FLAGS['spending.v1']) return ['electronics','coffee','groceries','gas','subscription'];
    try {
      const response = await fetch(`${this.baseUrl}/spending/tags`);
      const result = await response.json();
      return result.data;
    } catch (e) {
      console.warn('Tags API failed:', e);
      return [];
    }
  }

  async addTag(transactionId: string, tag: string): Promise<void> {
    if (!FEATURE_FLAGS['spending.v1']) return;
    try {
      await fetch(`${this.baseUrl}/spending/transactions/${transactionId}/tags`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ tag }) });
    } catch (e) {
      console.warn('Add tag failed:', e);
    }
  }

  async getBudgets(): Promise<Budget[]> {
    if (!FEATURE_FLAGS['spending.v1']) return this.getMockBudgets();
    try {
      const response = await fetch(`${this.baseUrl}/spending/budgets`, { headers:{ 'Content-Type':'application/json', Accept:'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const result = await response.json();
      if (this.isOpenAPIResponse(result)) {
        if (result.code === 'SUCCESS') return this.normalizeBudgets(result.data);
        throw new Error(`API Error: ${result.message || result.code}`);
      }
      return this.normalizeBudgets(result.data || result);
    } catch (e) {
      console.warn('Budgets API failed:', e);
      return this.getMockBudgets();
    }
  }

  async saveBudget(categoryId: string, monthlyLimit: number): Promise<void> {
    if (!FEATURE_FLAGS['spending.v1']) return;
    try {
      await fetch(`${this.baseUrl}/spending/budgets`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ categoryId, monthlyLimit }) });
    } catch (e) {
      console.warn('Save budget failed:', e);
    }
  }

  async exportCsv(filters: SpendingFilters = {}): Promise<Blob> {
    if (!FEATURE_FLAGS['spending.v1']) {
      const csvData = '\uFEFFDate,Merchant,Description,Amount,Category\n2024-01-15,Amazon,Electronics,-189.99,Shopping\n';
      return new Blob([csvData], { type: 'text/csv;charset=utf-8' });
    }
    try {
      const params = new URLSearchParams();
      if (filters.month) params.append('month', filters.month);
      const response = await fetch(`${this.baseUrl}/spending/export/csv?${params}`);
      return await response.blob();
    } catch (e) {
      console.warn('CSV export failed:', e);
      throw e;
    }
  }

  async getRules(): Promise<DCARule[]> {
    if (!FEATURE_FLAGS['spending.v1']) return this.getMockDCARules();
    try {
      const response = await fetch(`${this.baseUrl}/spending/rules`, { headers:{ 'Content-Type':'application/json', Accept:'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const result = await response.json();
      if (this.isOpenAPIResponse(result)) {
        if (result.code === 'SUCCESS') return this.normalizeDCARules(result.data);
        throw new Error(`API Error: ${result.message || result.code}`);
      }
      return this.normalizeDCARules(result.data || result);
    } catch (e) {
      console.warn('DCA rules API failed:', e);
      return this.getMockDCARules();
    }
  }

  async createRule(rule: Omit<DCARule, 'id'>): Promise<DCARule> {
    if (!FEATURE_FLAGS['spending.v1']) return { ...rule, id: `mock_${Date.now()}` } as DCARule;
    try {
      const response = await fetch(`${this.baseUrl}/dca/rules`, { method:'POST', headers:{ 'Content-Type':'application/json', 'X-Idempotency-Key': `${rule.alias}_${Date.now()}` }, body: JSON.stringify(rule) });
      const result = await response.json();
      return result.data;
    } catch (e) {
      console.warn('Create DCA rule failed:', e);
      throw e;
    }
  }

  private isOpenAPIResponse(response: any): response is ApiResponse<any> {
    return response && typeof response.code === 'string' && response.data !== undefined && typeof response.timestamp === 'string';
  }

  private normalizeTransactions(data: any): Transaction[] {
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => ({
      id: item.id?.toString() || 'unknown',
      date: item.date || item.createdAt || new Date().toISOString(),
      merchant: item.merchant || item.description || 'Unknown Merchant',
      description: item.description || item.memo || item.merchant || '',
      amount: typeof item.amount === 'number' ? item.amount : 0,
      category: item.category || item.categoryId || 'Other',
      tags: Array.isArray(item.tags) ? item.tags : [],
      status: item.status || 'completed',
      recurring: Boolean(item.recurring || item.isRecurring),
      type: item.type || 'card',
      account: item.account || item.accountName || 'Unknown Account',
    }));
  }

  private normalizeBudgets(data: any): Budget[] {
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => ({
      id: item.id?.toString() || 'unknown',
      category: item.category || item.categoryId || 'Other',
      monthlyLimit: typeof item.monthlyLimit === 'number' ? item.monthlyLimit : 0,
      spent: typeof item.spent === 'number' ? item.spent : 0,
      remaining: typeof item.remaining === 'number' ? item.remaining : 0,
    }));
  }

  private normalizeDCARules(data: any): DCARule[] {
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => ({
      id: item.id?.toString() || 'unknown',
      alias: item.alias || item.name || 'unnamed_rule',
      asset: item.asset || item.symbol || 'UNKNOWN',
      amount: typeof item.amount === 'number' ? item.amount : 0,
      frequency: item.frequency || item.cadence?.toLowerCase() || 'monthly',
      nextExecution: item.nextExecution || item.nextRun || new Date().toISOString(),
      isActive: Boolean(item.isActive !== false),
    }));
  }

  private getMockTransactions(): Transaction[] {
    return [
      { id:'1', date:'2024-01-15', merchant:'Amazon', description:'Online shopping - Electronics', category:'Shopping', tags:['electronics','online'], amount:-189.99, status:'completed', recurring:false, type:'card', account:'Funding' },
      { id:'2', date:'2024-01-14', merchant:'Starbucks', description:'Coffee and pastry', category:'Food & Dining', tags:['coffee'], amount:-12.45, status:'completed', recurring:false, type:'card', account:'Funding' },
      { id:'3', date:'2024-01-14', merchant:'Netflix', description:'Monthly subscription', category:'Entertainment', tags:['subscription'], amount:-15.99, status:'completed', recurring:true, type:'card', account:'Funding' },
    ];
  }

  private getMockBudgets(): Budget[] {
    return [
      { id:'1', category:'Shopping', monthlyLimit:1500, spent:1234.56, remaining:265.44 },
      { id:'2', category:'Food & Dining', monthlyLimit:400, spent:398.45, remaining:1.55 },
      { id:'3', category:'Transportation', monthlyLimit:600, spent:543.21, remaining:56.79 },
    ];
  }

  private getMockDCARules(): DCARule[] {
    return [ { id:'dca_1', alias:'monthly_gold', asset:'Gold', amount:100, frequency:'monthly', nextExecution:'2024-02-01T10:00:00Z', isActive:true } ];
  }
}

// Export singletons
export const marketsAdapter = new MarketsAdapter();
export const spendingAdapter = new SpendingAdapter();
