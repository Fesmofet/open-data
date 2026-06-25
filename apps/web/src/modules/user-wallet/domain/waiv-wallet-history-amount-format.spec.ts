import {
  divideNumericStrings,
  formatWalletHistoryAmountLabel,
  formatWalletHistoryQuantity,
  WAIV_FRACTION_PRECISION,
} from './waiv-wallet-history-amount-format';

describe('formatWalletHistoryQuantity', () => {
  it('strips trailing zeros for whole numbers', () => {
    expect(formatWalletHistoryQuantity('0.01000000')).toBe('0.01');
    expect(formatWalletHistoryQuantity('4.00000000')).toBe('4');
  });

  it('truncates fractional amounts to 3 decimals with grouping when |value| >= 1', () => {
    expect(formatWalletHistoryQuantity('2506.75')).toBe('2,506.750');
    expect(formatWalletHistoryQuantity('621.50211415')).toBe('621.502');
    expect(formatWalletHistoryQuantity('208.778624')).toBe('208.778');
    expect(formatWalletHistoryQuantity('10.500')).toBe('10.500');
  });

  it('formats integers with grouping', () => {
    expect(formatWalletHistoryQuantity('100')).toBe('100');
    expect(formatWalletHistoryQuantity('2506')).toBe('2,506');
  });

  it('compact-formats sub-unit values with leading zeros (curation rewards)', () => {
    expect(formatWalletHistoryQuantity('0.00026163')).toBe('0.00026');
    expect(formatWalletHistoryQuantity('0.000261234')).toBe('0.00026');
    expect(formatWalletHistoryQuantity('0.00026')).toBe('0.00026');
    expect(formatWalletHistoryQuantity('0.00020000')).toBe('0.0002');
    expect(formatWalletHistoryQuantity('0.00000001')).toBe('0.00000001');
    expect(formatWalletHistoryQuantity('0.000000012')).toBe('0.00000001');
  });

  it('keeps sub-unit values without leading zeros up to 3 decimals', () => {
    expect(formatWalletHistoryQuantity('0.248')).toBe('0.248');
    expect(formatWalletHistoryQuantity('0.24812345')).toBe('0.248');
    expect(formatWalletHistoryQuantity('0.56251968')).toBe('0.562');
  });
});

describe('formatWalletHistoryAmountLabel', () => {
  it('formats quantity and symbol', () => {
    expect(formatWalletHistoryAmountLabel('4.00000000', 'WP')).toBe('4 WP');
    expect(formatWalletHistoryAmountLabel('0.01000000', 'WP')).toBe('0.01 WP');
    expect(formatWalletHistoryAmountLabel('0.00026163', 'WAIV')).toBe('0.00026 WAIV');
    expect(formatWalletHistoryAmountLabel('0.00000001', 'WAIV')).toBe('0.00000001 WAIV');
    expect(formatWalletHistoryAmountLabel('2506.75', 'WAIV')).toBe('2,506.750 WAIV');
    expect(formatWalletHistoryAmountLabel('621.50211415', 'SWAP.HIVE')).toBe(
      '621.502 SWAP.HIVE',
    );
  });
});

describe('divideNumericStrings', () => {
  it('divides without float drift', () => {
    expect(divideNumericStrings('1', '4.048', WAIV_FRACTION_PRECISION)).toBe(
      '0.24703557',
    );
  });
});
