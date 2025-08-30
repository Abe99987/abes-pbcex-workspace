/**
 * Formatting utilities for PBCEx frontend
 */

// Number formatting
export function formatCurrency(
  amount: string | number,
  currency = 'USD',
  decimals?: number
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) return '$0.00';

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
  };

  if (decimals !== undefined) {
    options.minimumFractionDigits = decimals;
    options.maximumFractionDigits = decimals;
  }

  return new Intl.NumberFormat('en-US', options).format(num);
}

export function formatNumber(amount: string | number, decimals = 2): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) return '0';

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatAssetAmount(
  amount: string | number,
  asset: string,
  showAsset = true
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) return showAsset ? `0 ${asset}` : '0';

  // Different precision for different assets
  let decimals = 8; // Default for precious metals

  if (['USD', 'USDC'].includes(asset)) {
    decimals = 2;
  } else if (asset.includes('XCU')) {
    decimals = 4; // Copper usually has fewer decimals
  }

  const formatted = formatNumber(num, decimals);
  return showAsset ? `${formatted} ${asset}` : formatted;
}

export function formatPercentage(
  value: string | number,
  decimals = 2,
  showSign = true
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) return '0%';

  const sign = showSign && num > 0 ? '+' : '';
  const formatted = formatNumber(num, decimals);
  return `${sign}${formatted}%`;
}

export function formatCompactNumber(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) return '0';

  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  });

  return formatter.format(num);
}

// Date formatting
export function formatDate(
  date: string | Date,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return 'Invalid date';

  const options: Intl.DateTimeFormatOptions = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    medium: {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    },
    long: {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    },
  }[format];

  return new Intl.DateTimeFormat('en-US', options).format(d);
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return 'Invalid date';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(d, 'short');
}

// Asset formatting
export function getAssetDisplayName(asset: string): string {
  const displayNames: Record<string, string> = {
    PAXG: 'Gold',
    USD: 'US Dollar',
    USDC: 'USD Coin',
    'XAU-s': 'Gold Synthetic',
    'XAG-s': 'Silver Synthetic',
    'XPT-s': 'Platinum Synthetic',
    'XPD-s': 'Palladium Synthetic',
    'XCU-s': 'Copper Synthetic',
  };

  return displayNames[asset] || asset;
}

export function getAssetSymbol(asset: string): string {
  const symbols: Record<string, string> = {
    PAXG: '🥇',
    'XAU-s': '🥇',
    'XAG-s': '🥈',
    'XPT-s': '⚪',
    'XPD-s': '⚫',
    'XCU-s': '🟤',
    USD: '$',
    USDC: '$',
  };

  return symbols[asset] || '';
}

export function getAssetColor(asset: string): string {
  const colors: Record<string, string> = {
    PAXG: 'text-yellow-600',
    'XAU-s': 'text-yellow-600',
    'XAG-s': 'text-slate-500',
    'XPT-s': 'text-slate-700',
    'XPD-s': 'text-slate-800',
    'XCU-s': 'text-orange-600',
    USD: 'text-green-600',
    USDC: 'text-blue-600',
  };

  return colors[asset] || 'text-slate-600';
}

// Status formatting
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // KYC statuses
    NOT_STARTED: 'text-slate-500 bg-slate-100',
    IN_PROGRESS: 'text-blue-700 bg-blue-100',
    PENDING_REVIEW: 'text-amber-700 bg-amber-100',
    APPROVED: 'text-green-700 bg-green-100',
    REJECTED: 'text-red-700 bg-red-100',
    EXPIRED: 'text-red-700 bg-red-100',

    // Trade statuses
    PENDING: 'text-amber-700 bg-amber-100',
    FILLED: 'text-green-700 bg-green-100',
    CANCELLED: 'text-slate-700 bg-slate-100',
    FAILED: 'text-red-700 bg-red-100',

    // Order statuses
    DRAFT: 'text-slate-500 bg-slate-100',
    QUOTE_LOCKED: 'text-blue-700 bg-blue-100',
    PAYMENT_PENDING: 'text-amber-700 bg-amber-100',
    PAYMENT_CONFIRMED: 'text-green-700 bg-green-100',
    PROCESSING: 'text-blue-700 bg-blue-100',
    SHIPPED: 'text-purple-700 bg-purple-100',
    DELIVERED: 'text-green-700 bg-green-100',
    REFUNDED: 'text-red-700 bg-red-100',
  };

  return colors[status] || 'text-slate-600 bg-slate-100';
}

export function formatStatusText(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Address formatting
export function formatAddress(address: {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}): string {
  const parts = [
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.postalCode}`,
  ].filter(Boolean);

  if (address.country && address.country !== 'US') {
    parts.push(address.country);
  }

  return parts.join(', ');
}

// Phone formatting
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone;
}

// Text utilities
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function toKebabCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Validation helpers
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone);
}

// Math utilities for financial calculations
export function calculatePercentageChange(
  oldValue: number,
  newValue: number
): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

export function roundToDecimals(value: number, decimals: number): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
