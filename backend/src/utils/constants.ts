/**
 * Application-wide constants for PBCEx
 */

// Asset definitions
export const ASSETS = {
  // Real/custody assets
  GOLD: 'PAXG',
  USD: 'USD',
  USDC: 'USDC',
  
  // Synthetic assets (internal)
  GOLD_SYNTHETIC: 'XAU-s',
  SILVER_SYNTHETIC: 'XAG-s',
  PLATINUM_SYNTHETIC: 'XPT-s',
  PALLADIUM_SYNTHETIC: 'XPD-s',
  COPPER_SYNTHETIC: 'XCU-s',
} as const;

export const REAL_ASSETS = [ASSETS.GOLD, ASSETS.USD, ASSETS.USDC] as const;
export const SYNTHETIC_ASSETS = [
  ASSETS.GOLD_SYNTHETIC,
  ASSETS.SILVER_SYNTHETIC,
  ASSETS.PLATINUM_SYNTHETIC,
  ASSETS.PALLADIUM_SYNTHETIC,
  ASSETS.COPPER_SYNTHETIC,
] as const;

// Metal mappings (real to synthetic)
export const METAL_MAPPINGS = {
  [ASSETS.GOLD]: ASSETS.GOLD_SYNTHETIC,
  [ASSETS.GOLD_SYNTHETIC]: ASSETS.GOLD,
} as const;

// Account types
export const ACCOUNT_TYPES = {
  FUNDING: 'FUNDING',
  TRADING: 'TRADING',
} as const;

// User roles
export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  SUPPORT: 'SUPPORT',  // Remote customer service team
  TELLER: 'TELLER',    // Bank/franchise branch operator
} as const;

// KYC/KYB statuses
export const KYC_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;

// Type guards for KYC Status
export type KycStatus = typeof KYC_STATUS[keyof typeof KYC_STATUS];
export function isKycStatus(value: unknown): value is KycStatus {
  return typeof value === 'string' && Object.values(KYC_STATUS).includes(value as KycStatus);
}

export const KYC_TYPES = {
  PERSONAL: 'PERSONAL',
  BUSINESS: 'BUSINESS',
} as const;

// Trade/Order statuses
export const TRADE_STATUS = {
  PENDING: 'PENDING',
  FILLED: 'FILLED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
} as const;

// Type guards for Trade Status
export type TradeStatus = typeof TRADE_STATUS[keyof typeof TRADE_STATUS];
export function isTradeStatus(value: unknown): value is TradeStatus {
  return typeof value === 'string' && Object.values(TRADE_STATUS).includes(value as TradeStatus);
}

export const ORDER_STATUS = {
  DRAFT: 'DRAFT',
  QUOTE_LOCKED: 'QUOTE_LOCKED',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

// Type guards for Order Status
export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];
export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && Object.values(ORDER_STATUS).includes(value as OrderStatus);
}

// Trading constants
export const TRADING = {
  DEFAULT_FEE_RATE: 0.005, // 0.5%
  MIN_TRADE_AMOUNT: 0.01,
  MAX_TRADE_AMOUNT: 1000000,
  QUOTE_LOCK_DURATION_MS: 10 * 60 * 1000, // 10 minutes
  PRICE_TOLERANCE: 0.001, // 0.1% price tolerance
} as const;

// Hedging constants
export const HEDGING = {
  // Exposure thresholds (in troy ounces)
  GOLD_THRESHOLD: 100,
  SILVER_THRESHOLD: 5000,
  PLATINUM_THRESHOLD: 50,
  PALLADIUM_THRESHOLD: 50,
  COPPER_THRESHOLD: 10000, // in pounds
  
  // Target hedge ratios
  DEFAULT_HEDGE_RATIO: 0.8, // 80% hedged
  MAX_HEDGE_RATIO: 1.0,
  MIN_HEDGE_RATIO: 0.5,
  
  // ETF mappings
  ETF_MAPPINGS: {
    [ASSETS.SILVER_SYNTHETIC]: ['SLV', 'SIVR'],
    [ASSETS.PLATINUM_SYNTHETIC]: ['PPLT'],
    [ASSETS.PALLADIUM_SYNTHETIC]: ['PALL'],
    [ASSETS.COPPER_SYNTHETIC]: ['CPER'],
  },
} as const;

// Rate limiting
export const RATE_LIMITS = {
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
  },
  KYC: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 submissions per hour
  },
  TRADE: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 trades per minute
  },
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window
  },
} as const;

// Validation constants
export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL: true,
  },
  EMAIL: {
    MAX_LENGTH: 254,
  },
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 15,
  },
  SSN: {
    PATTERN: /^\d{3}-\d{2}-\d{4}$|^\d{9}$/,
  },
  EIN: {
    PATTERN: /^\d{2}-\d{7}$/,
  },
} as const;

// File upload limits
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
    DOCUMENT: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  MAX_FILES_PER_REQUEST: 10,
} as const;

// Shipping constants
export const SHIPPING = {
  CARRIERS: {
    FEDEX: 'FEDEX',
    UPS: 'UPS',
    USPS: 'USPS',
  },
  SERVICE_TYPES: {
    STANDARD: 'STANDARD',
    EXPEDITED: 'EXPEDITED',
    OVERNIGHT: 'OVERNIGHT',
  },
  INSURANCE_REQUIRED_THRESHOLD: 1000, // $1000 USD
} as const;

// Product categories for shop
export const PRODUCT_CATEGORIES = {
  COINS: 'COINS',
  BARS: 'BARS',
  ROUNDS: 'ROUNDS',
  JEWELRY: 'JEWELRY',
} as const;

// Database constants
export const DB = {
  SCHEMA: 'public',
  MAX_CONNECTIONS: 20,
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  IDLE_TIMEOUT: 30000, // 30 seconds
} as const;

// Cache TTLs (in seconds)
export const CACHE_TTL = {
  PRICES: 30, // 30 seconds for live prices
  USER_SESSION: 3600, // 1 hour
  KYC_STATUS: 300, // 5 minutes
  PRODUCT_CATALOG: 3600, // 1 hour
  EXCHANGE_RATES: 60, // 1 minute
} as const;

// API response codes
export const API_CODES = {
  SUCCESS: 'SUCCESS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

// External service timeouts (in milliseconds)
export const SERVICE_TIMEOUTS = {
  PLAID: 30000, // 30 seconds
  CUSTODY_PROVIDERS: 45000, // 45 seconds
  FULFILLMENT: 30000, // 30 seconds
  SHIPPING: 15000, // 15 seconds
  PAYMENT: 30000, // 30 seconds
  PRICE_FEED: 10000, // 10 seconds
  NOTIFICATION: 15000, // 15 seconds
} as const;

// Phase-3 Constants

// Fulfillment strategies
export const FULFILLMENT_STRATEGIES = {
  JM: 'JM',
  BRINKS: 'BRINKS',
} as const;

// Vault locations
export const VAULT_LOCATIONS = {
  MAIN: 'VAULT-MAIN',
  SECONDARY: 'VAULT-SECONDARY',
  BRINKS_MEMPHIS: 'BRINKS-MEMPHIS',
  BRINKS_DELAWARE: 'BRINKS-DELAWARE',
} as const;

// Redemption constants
export const REDEMPTION = {
  LOCK_DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
  MIN_REDEMPTION_VALUE: 1000, // $1000 minimum
  MAX_REDEMPTION_VALUE: 100000, // $100k maximum per request
  DEFAULT_PROCESSING_DAYS: 3, // Business days
  INSURANCE_THRESHOLD: 2500, // $2500 insurance required
} as const;

// Vault inventory formats
export const VAULT_FORMATS = {
  BAR: 'BAR',
  COIN: 'COIN',
  SHEET: 'SHEET',
  COIL: 'COIL',
  ROUND: 'ROUND',
} as const;

// Support ticket priorities
export const SUPPORT_PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

// Support ticket types
export const SUPPORT_TICKET_TYPES = {
  ACCOUNT: 'ACCOUNT',
  TRADING: 'TRADING',
  KYC: 'KYC',
  REDEMPTION: 'REDEMPTION',
  TECHNICAL: 'TECHNICAL',
  BILLING: 'BILLING',
  OTHER: 'OTHER',
} as const;
