/**
 * Fixed-point decimal utilities with asset-aware rounding
 * - USD: 2dp banker’s rounding
 * - PAXG/XAU-s amounts: 8dp truncation by default (internal calc scale)
 */

function toStringValue(v: string | number): string {
  return typeof v === 'number' ? v.toString() : v;
}

/**
 * Banker's rounding to 2 decimal places for USD amounts
 */
export function roundUsdBankers(value: string | number): string {
  const s = toStringValue(value);
  const parts = s.split('.');
  const negative = s.startsWith('-');
  let intPartRaw = parts[0] ?? '0';
  if (negative && intPartRaw.startsWith('-')) intPartRaw = intPartRaw.slice(1);
  const fracPartRaw = parts[1] ?? '';
  const frac = (fracPartRaw + '000').slice(0, 3);

  let i0 = parseInt(frac[0] || '0', 10);
  let i1 = parseInt(frac[1] || '0', 10);
  const i2 = parseInt(frac[2] || '0', 10);

  // Half-even handling: when i2 == 5 and remaining are zeros
  if (i2 > 5) {
    i1 += 1;
  } else if (i2 < 5) {
    // no change
  } else {
    // exactly 5 in the third decimal place (ignore further digits by construction)
    if (i1 % 2 === 1) {
      i1 += 1; // round to even
    }
  }

  if (i1 >= 10) {
    i1 -= 10;
    i0 += 1;
  }

  let intNum = BigInt(intPartRaw || '0');
  if (i0 >= 10) {
    i0 -= 10;
    intNum += BigInt(1);
  }

  const sign = negative ? '-' : '';
  return `${sign}${intNum.toString()}.${i0}${i1}`;
}

/**
 * Truncate to 8 decimal places (string-safe)
 */
export function truncate8(value: string | number): string {
  const s = toStringValue(value);
  const [i, f = ''] = s.split('.');
  const outF = f.slice(0, 8).padEnd(8, '0');
  return `${i}.${outF}`;
}

export function add(a: string | number, b: string | number, scale: number = 8): string {
  const ai = BigInt(toScaled(a, scale));
  const bi = BigInt(toScaled(b, scale));
  return fromScaled((ai + bi).toString(), scale);
}

export function sub(a: string | number, b: string | number, scale: number = 8): string {
  const ai = BigInt(toScaled(a, scale));
  const bi = BigInt(toScaled(b, scale));
  return fromScaled((ai - bi).toString(), scale);
}

export function mul(a: string | number, b: string | number, scale: number = 8): string {
  const ai = BigInt(toScaled(a, scale));
  const bi = BigInt(toScaled(b, scale));
  const prod = ai * bi; // scaled^2
  const scaled = prod / BigInt(10 ** scale);
  return fromScaled(scaled.toString(), scale);
}

export function div(a: string | number, b: string | number, scale: number = 8): string {
  const ai = BigInt(toScaled(a, scale));
  const bi = BigInt(toScaled(b, scale));
  if (bi === BigInt(0)) throw new Error('Division by zero');
  const scaled = (ai * BigInt(10 ** scale)) / bi;
  return fromScaled(scaled.toString(), scale);
}

function toScaled(v: string | number, scale: number): string {
  const s = toStringValue(v);
  const neg = s.startsWith('-');
  const t = neg ? s.slice(1) : s;
  const parts = t.split('.');
  const i = parts[0] || '0';
  const f = parts[1] || '';
  const fPadded = (f + '0'.repeat(scale)).slice(0, scale);
  const iNorm = i.replace(/^0+(\d)/, '$1');
  const digits = (iNorm.length ? iNorm : '0') + fPadded;
  return (neg ? '-' : '') + digits;
}

function fromScaled(scaled: string, scale: number): string {
  const neg = scaled.startsWith('-');
  const t = neg ? scaled.slice(1) : scaled;
  const pad = t.padStart(scale + 1, '0');
  const intPart = pad.slice(0, pad.length - scale);
  const fracPart = pad.slice(pad.length - scale).padEnd(scale, '0');
  return (neg ? '-' : '') + intPart + '.' + fracPart;
}

/**
 * Asset-aware rounding to display scale
 */
export function roundAssetAmount(asset: string, value: string | number): string {
  if (asset === 'USD') return roundUsdBankers(value);
  // Default trading precision for metals/token amounts
  return truncate8(value);
}


