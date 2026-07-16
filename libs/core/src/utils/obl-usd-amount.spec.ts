import { isOblUsdAmount, parseOblUsdAmount } from './obl-usd-amount';

describe('obl-usd-amount', () => {
  it('accepts valid positive decimals', () => {
    expect(parseOblUsdAmount('1.5', 'positive')).toBe('1.50000000');
    expect(parseOblUsdAmount('10', 'positive')).toBe('10.00000000');
  });

  it('rejects junk inside the string', () => {
    expect(parseOblUsdAmount('1dfdf.5', 'positive')).toBeNull();
    expect(isOblUsdAmount('1dfdf.5', 'positive')).toBe(false);
  });

  it('rejects partial or malformed decimals', () => {
    expect(parseOblUsdAmount('.5', 'positive')).toBeNull();
    expect(parseOblUsdAmount('1.', 'positive')).toBeNull();
    expect(parseOblUsdAmount('01.5', 'positive')).toBeNull();
    expect(parseOblUsdAmount('', 'positive')).toBeNull();
  });

  it('allows zero only for nonnegative amounts', () => {
    expect(parseOblUsdAmount('0', 'positive')).toBeNull();
    expect(parseOblUsdAmount('0', 'nonnegative')).toBe('0.00000000');
    expect(parseOblUsdAmount('0.5', 'nonnegative')).toBe('0.50000000');
  });

  it('rejects more than 8 decimal places', () => {
    expect(parseOblUsdAmount('1.123456789', 'positive')).toBeNull();
  });
});
