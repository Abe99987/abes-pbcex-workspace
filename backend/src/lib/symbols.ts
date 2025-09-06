// Canonical trading symbols used across the backend

export type CanonicalSymbol = 'XAU' | 'PAXG' | 'BTC' | 'ETH' | 'USD';

export const CANONICAL_SYMBOLS: ReadonlyArray<CanonicalSymbol> = [
  'XAU',
  'PAXG',
  'BTC',
  'ETH',
  'USD',
];

// Aliases map inputs to canonical symbols (case-insensitive via uppercasing)
const SYMBOL_ALIASES: Record<string, CanonicalSymbol> = {
  XAU: 'XAU',
  GOLD: 'XAU',
  PAXG: 'PAXG',
  BTC: 'BTC',
  XBT: 'BTC',
  ETH: 'ETH',
  USD: 'USD',
  USDC: 'USD',
};

export function normalizeSymbol(input: string | undefined | null): CanonicalSymbol | null {
  if (!input || typeof input !== 'string') return null;
  const key = input.trim().toUpperCase();
  if (SYMBOL_ALIASES[key]) return SYMBOL_ALIASES[key];
  if ((CANONICAL_SYMBOLS as readonly string[]).includes(key)) return key as CanonicalSymbol;
  return null;
}

export const VALID_SYMBOLS: ReadonlySet<string> = new Set([
  ...CANONICAL_SYMBOLS,
  ...Object.keys(SYMBOL_ALIASES),
]);


