import { roundUsdBankers, truncate8, add, sub, mul, div, roundAssetAmount } from '../../src/lib/decimal';

describe('decimal utils', () => {
  it('roundUsdBankers rounds half to even at 2dp', () => {
    expect(roundUsdBankers('1.005')).toBe('1.00'); // 0.5 to even
    expect(roundUsdBankers('1.015')).toBe('1.02');
    expect(roundUsdBankers('2.675')).toBe('2.68');
  });

  it('truncate8 truncates to 8dp', () => {
    expect(truncate8('1.123456789')).toBe('1.12345678');
    expect(truncate8('2')).toBe('2.00000000');
  });

  it('basic fixed-point arithmetic at scale 8', () => {
    expect(add('1.10000000', '0.90000000')).toBe('2.00000000');
    expect(sub('2.00000000', '0.12500000')).toBe('1.87500000');
    expect(mul('2.00000000', '0.50000000')).toBe('1.00000000');
    expect(div('1.00000000', '4')).toBe('0.25000000');
  });

  it('roundAssetAmount respects asset defaults', () => {
    expect(roundAssetAmount('USD', '10.015')).toBe('10.02');
    expect(roundAssetAmount('PAXG', '1.123456789')).toBe('1.12345678');
    expect(roundAssetAmount('XAU-s', '0.100000001')).toBe('0.10000000');
  });
});


