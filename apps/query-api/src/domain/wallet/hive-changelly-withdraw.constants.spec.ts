import {
  hasHiveBalanceForChangellyWithdraw,
  isHiveWithdrawAmountWithinPairLimits,
  isHiveWithdrawAmountWithinUsdCap,
  parseLiquidHiveBalance,
} from './hive-changelly-withdraw.constants';

describe('hive-changelly-withdraw.constants', () => {
  it('parses liquid HIVE balance', () => {
    expect(parseLiquidHiveBalance('10.000 HIVE')).toBe(10);
  });

  it('enforces USD cap', () => {
    expect(isHiveWithdrawAmountWithinUsdCap({ amountHive: 50, hiveUsd: 2 })).toBe(
      true,
    );
    expect(isHiveWithdrawAmountWithinUsdCap({ amountHive: 51, hiveUsd: 2 })).toBe(
      false,
    );
  });

  it('checks pair min/max', () => {
    expect(
      isHiveWithdrawAmountWithinPairLimits({ amount: 5, min: 5, max: 20 }),
    ).toBe(true);
    expect(
      isHiveWithdrawAmountWithinPairLimits({ amount: 4.999, min: 5, max: 20 }),
    ).toBe(false);
  });

  it('requires tracking reserve HIVE', () => {
    expect(
      hasHiveBalanceForChangellyWithdraw({ liquidHive: 10.001, amount: 10 }),
    ).toBe(true);
    expect(
      hasHiveBalanceForChangellyWithdraw({ liquidHive: 10, amount: 10 }),
    ).toBe(false);
  });
});
