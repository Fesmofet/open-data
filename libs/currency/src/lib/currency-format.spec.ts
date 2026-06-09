import { formatMoneyLabel, convertUsdAmount } from './currency-format';

describe('formatMoneyLabel', () => {
  it('formats USD with $ prefix', () => {
    expect(formatMoneyLabel(1.87, 'USD')).toBe('$ 1.87');
  });

  it('formats EUR with euro prefix', () => {
    expect(formatMoneyLabel(2.5, 'EUR')).toBe('€ 2.50');
  });

  it('uses 3 decimals for tiny non-zero amounts', () => {
    expect(formatMoneyLabel(0.005, 'USD')).toBe('$ 0.005');
  });
});

describe('convertUsdAmount', () => {
  it('returns same amount for USD', () => {
    expect(convertUsdAmount(10, 'USD', {})).toBe(10);
  });

  it('multiplies by fiat rate', () => {
    expect(convertUsdAmount(10, 'EUR', { EUR: 0.9 })).toBe(9);
  });
});
