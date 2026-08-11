import {
  parseHiveAmount,
  hpToVestingShares,
  estimateHiveUsdValue,
  truncateHiveAmountForInput,
  resolvePowerDownProgress,
} from './hive-wallet-amount';

describe('hive-wallet-amount', () => {
  it('parses positive amounts', () => {
    expect(parseHiveAmount('1.5')).toBe(1.5);
    expect(parseHiveAmount('0.001')).toBe(0.001);
    expect(parseHiveAmount('0')).toBeNull();
  });

  it('rejects more than 3 decimal places', () => {
    expect(parseHiveAmount('0.0001')).toBeNull();
    expect(parseHiveAmount('1.2345')).toBeNull();
  });

  it('converts hp to vesting shares', () => {
    const vests = hpToVestingShares(
      500,
      '1000000000 VESTS',
      '500000000 HIVE',
    );
    expect(vests).toBe('1000.000000 VESTS');
  });

  it('estimates USD for hp amounts with chain precision', () => {
    expect(estimateHiveUsdValue('1234.567890123', 0.25)).toBe('308.64');
    expect(estimateHiveUsdValue('100', 0.25)).toBe('25.00');
    expect(estimateHiveUsdValue('100', 0)).toBe('0.00');
  });

  it('truncates hp amounts to 3 decimals for form input', () => {
    expect(truncateHiveAmountForInput('23.23907190900226')).toBe('23.239');
    expect(truncateHiveAmountForInput('100.5')).toBe('100.5');
    expect(truncateHiveAmountForInput('100')).toBe('100');
  });
});

describe('resolvePowerDownProgress', () => {
  it('clamps remaining weeks to total', () => {
    expect(resolvePowerDownProgress(13, 13)).toEqual({
      remaining: 13,
      completed: 0,
      total: 13,
    });
  });

  it('caps inflated remaining weeks at total', () => {
    expect(resolvePowerDownProgress(13_000_000, 13)).toEqual({
      remaining: 13,
      completed: 0,
      total: 13,
    });
  });

  it('computes completed weeks when partially done', () => {
    expect(resolvePowerDownProgress(10, 13)).toEqual({
      remaining: 10,
      completed: 3,
      total: 13,
    });
  });
});
