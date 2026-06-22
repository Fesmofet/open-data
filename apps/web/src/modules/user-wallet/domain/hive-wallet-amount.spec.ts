import { parseHiveAmount, hpToVestingShares } from './hive-wallet-amount';

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
});
