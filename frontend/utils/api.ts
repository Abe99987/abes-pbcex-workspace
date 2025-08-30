import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

/**
 * API client configuration for PBCEx frontend
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

// Create axios instance with default config
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  config => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Token expired or invalid
      removeAuthToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/account/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth token management
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
}

export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
}

// API response wrapper
export interface ApiResponse<T = unknown> {
  code: string;
  message?: string;
  data?: T;
  errors?: Array<{ path: string; message: string }>;
}

// Generic API functions
export const api = {
  // Authentication
  auth: {
    register: (data: RegisterData) =>
      apiClient.post<ApiResponse<AuthResponse>>('/api/auth/register', data),
    login: (data: LoginData) =>
      apiClient.post<ApiResponse<AuthResponse>>('/api/auth/login', data),
    logout: () => apiClient.post<ApiResponse>('/api/auth/logout'),
    me: () => apiClient.get<ApiResponse<{ user: User }>>('/api/auth/me'),
    changePassword: (data: ChangePasswordData) =>
      apiClient.post<ApiResponse>('/api/auth/change-password', data),
    forgotPassword: (email: string) =>
      apiClient.post<ApiResponse>('/api/auth/forgot-password', { email }),
  },

  // KYC
  kyc: {
    submitPersonal: (data: PersonalKycData) =>
      apiClient.post<ApiResponse>('/api/kyc/submit', data),
    submitBusiness: (data: BusinessKycData) =>
      apiClient.post<ApiResponse>('/api/kyc/kyb/submit', data),
    getStatus: () => apiClient.get<ApiResponse<KycStatus>>('/api/kyc/status'),
  },

  // Wallet
  wallet: {
    getBalances: () =>
      apiClient.get<ApiResponse<BalancesResponse>>('/api/wallet/balances'),
    transfer: (data: TransferData) =>
      apiClient.post<ApiResponse>('/api/wallet/transfer', data),
    deposit: (data: DepositData) =>
      apiClient.post<ApiResponse>('/api/wallet/deposit', data),
    withdraw: (data: WithdrawData) =>
      apiClient.post<ApiResponse>('/api/wallet/withdraw', data),
  },

  // Trading
  trade: {
    getPrices: (asset?: string) =>
      apiClient.get<ApiResponse<PricesResponse>>('/api/trade/prices', {
        params: asset ? { asset } : {},
      }),
    placeOrder: (data: TradeOrderData) =>
      apiClient.post<ApiResponse<{ trade: Trade }>>('/api/trade/order', data),
    getHistory: (limit?: number, offset?: number) =>
      apiClient.get<ApiResponse<TradeHistoryResponse>>('/api/trade/history', {
        params: { limit, offset },
      }),
    getPairs: () =>
      apiClient.get<ApiResponse<{ pairs: TradingPair[] }>>('/api/trade/pairs'),
  },

  // Shop
  shop: {
    getProducts: (params?: ProductQuery) =>
      apiClient.get<ApiResponse<ProductsResponse>>('/api/shop/products', {
        params,
      }),
    lockQuote: (data: LockQuoteData) =>
      apiClient.post<ApiResponse<{ quote: Quote }>>(
        '/api/shop/lock-quote',
        data
      ),
    checkout: (data: CheckoutData) =>
      apiClient.post<ApiResponse<{ order: Order }>>('/api/shop/checkout', data),
    getOrders: () =>
      apiClient.get<ApiResponse<{ orders: Order[] }>>('/api/shop/orders'),
  },

  // Admin (requires admin role)
  admin: {
    getExposure: () =>
      apiClient.get<ApiResponse<ExposureData>>('/api/admin/exposure'),
    rebalanceHedge: (data: RebalanceData) =>
      apiClient.post<ApiResponse>('/api/admin/hedge/rebalance', data),
    getUsers: () => apiClient.get<ApiResponse<UserStats>>('/api/admin/users'),
    getTrades: () =>
      apiClient.get<ApiResponse<TradeStats>>('/api/admin/trades'),
  },
};

// Type definitions
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  kycStatus: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface Balance {
  asset: string;
  amount: string;
  usdValue: string;
}

export interface BalancesResponse {
  funding: {
    id: string;
    type: string;
    balances: Balance[];
    totalUsdValue: string;
  };
  trading: {
    id: string;
    type: string;
    balances: Balance[];
    totalUsdValue: string;
  };
}

export interface Trade {
  id: string;
  fromAsset: string;
  toAsset: string;
  amount: string;
  price: string;
  fee: string;
  status: string;
  executedAt?: string;
}

export interface TradeOrderData {
  fromAsset: string;
  toAsset: string;
  amount: string;
}

export interface PricesResponse {
  [key: string]: {
    price: string;
    change24h: string;
  };
}

export interface TradingPair {
  pair: string;
  price: string;
  change24h: string;
  volume24h: string;
}

export interface TradeHistoryResponse {
  trades: Trade[];
  total: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  metal: string;
  weight: string;
  purity: string;
  unitPrice: string;
  inStock: boolean;
  image: string;
  description: string;
}

export interface ProductQuery {
  metal?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
}

export interface Quote {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  expiresAt: string;
}

export interface Order {
  id: string;
  status: string;
  total: string;
  estimatedDelivery: string;
}

export interface LockQuoteData {
  productId: string;
  quantity: number;
}

export interface CheckoutData {
  quoteId: string;
  paymentMethod: string;
  shippingAddress: Address;
  billingAddress?: Address;
  specialInstructions?: string;
}

export interface PersonalKycData {
  personal: PersonalInfo;
  address: Address;
  documents: DocumentInfo[];
  consent: ConsentInfo;
}

export interface BusinessKycData {
  company: CompanyInfo;
  documents: DocumentInfo[];
  ownership: OwnershipInfo[];
  licenses: Record<string, string>[];
  contacts: ContactInfo[];
  shippingProfile: ShippingProfile;
  consent: ConsentInfo;
}

export interface KycStatus {
  status: string;
  personalKyc: { status: string };
  businessKyb: { status: string };
}

export interface TransferData {
  fromAccount: string;
  toAccount: string;
  asset: string;
  amount: string;
}

export interface DepositData {
  asset: string;
  amount: string;
  paymentMethod: string;
}

export interface WithdrawData {
  asset: string;
  amount: string;
  destination: {
    type: string;
    details: Record<string, string>;
  };
}

export interface ExposureData {
  [asset: string]: {
    totalSynthetic: string;
    totalHedged: string;
    netExposure: string;
    hedgeRatio: string;
    recommendedAction: string;
  };
}

export interface RebalanceData {
  asset: string;
  action: string;
}

export interface UserStats {
  total: number;
  active: number;
  kycApproved: number;
  kycPending: number;
}

export interface TradeStats {
  totalTrades: number;
  volume24h: string;
  fees24h: string;
}

export default apiClient;
