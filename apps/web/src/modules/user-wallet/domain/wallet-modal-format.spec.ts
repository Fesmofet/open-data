import {
  formatHiveRcBillionsDisplay,
  formatRcDelegationBillions,
  formatWalletModalBalanceDisplay,
} from './wallet-modal-format';

describe('formatWalletModalBalanceDisplay', () => {
  it('rounds long balances to 3 decimal places', () => {
    expect(formatWalletModalBalanceDisplay('208.77862426266893')).toBe('208.778');
  });

  it('keeps shorter fractional values as-is', () => {
    expect(formatWalletModalBalanceDisplay('10.5')).toBe('10.5');
  });

  it('shows up to 6 decimals for dust balances', () => {
    expect(formatWalletModalBalanceDisplay('0.00005444')).toBe('0.000054');
  });
});

describe('formatHiveRcBillionsDisplay', () => {
  it('formats available RC in billions with 3 decimals', () => {
    expect(formatHiveRcBillionsDisplay('430217626757')).toBe('430.217');
  });
});

describe('formatRcDelegationBillions', () => {
  it('formats raw RC as billions with 2 decimals', () => {
    expect(formatRcDelegationBillions(1_500_000_000)).toBe('1.50');
  });
});
