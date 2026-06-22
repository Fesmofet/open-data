import { normalizeRcAmount } from './rc-amount';

describe('normalizeRcAmount', () => {
  it('truncates legacy float RC values', () => {
    expect(normalizeRcAmount(1096003999999.9999)).toBe(1096003999999);
  });

  it('parses numeric strings', () => {
    expect(normalizeRcAmount('5000000000.5')).toBe(5000000000);
  });

  it('returns 0 for non-positive or invalid', () => {
    expect(normalizeRcAmount(0)).toBe(0);
    expect(normalizeRcAmount(-1)).toBe(0);
    expect(normalizeRcAmount('nope')).toBe(0);
  });
});
