import {
  buildHiveWalletSummary,
  canClaimHbdInterest,
  estimateHbdInterestBalance,
  mapHiveAccountToBalanceFields,
  mapRcAccountToSnapshot,
} from './build-hive-wallet-summary';

const CHAIN = {
  totalVestingShares: '1000000000 VESTS',
  totalVestingFundSteem: '500000000 HIVE',
  hbdInterestRatePercent: 20,
};

describe('estimateHbdInterestBalance', () => {
  it('returns 0 when balance is zero', () => {
    expect(
      estimateHbdInterestBalance({
        savingsHbdBalance: '0 HBD',
        savingsHbdSeconds: '0',
        savingsHbdSecondsLastUpdate: '2024-01-01T00:00:00',
        interestRatePercent: 20,
        nowMs: Date.parse('2024-06-01T00:00:00'),
      }),
    ).toBe(0);
  });

  it('accrues interest from savings_hbd_seconds accumulator', () => {
    const interest = estimateHbdInterestBalance({
      savingsHbdBalance: '100 HBD',
      savingsHbdSeconds: '1000000000',
      savingsHbdSecondsLastUpdate: '2024-01-01T00:00:00',
      interestRatePercent: 20,
      nowMs: Date.parse('2024-01-02T00:00:00'),
    });
    expect(interest).toBeGreaterThan(0);
  });
});

describe('canClaimHbdInterest', () => {
  it('allows claim on epoch payment date', () => {
    expect(canClaimHbdInterest('1970-01-01T00:00:00')).toBe(true);
  });

  it('blocks claim within 30 days', () => {
    const now = Date.parse('2024-02-15T00:00:00');
    expect(canClaimHbdInterest('2024-02-01T00:00:00', now)).toBe(false);
  });
});

describe('buildHiveWalletSummary', () => {
  it('formats display fields and flags', () => {
    const balance = mapHiveAccountToBalanceFields(
      {
        balance: '22.645 HIVE',
        hbd_balance: '0.014 HBD',
        vesting_shares: '400000000 VESTS',
        delegated_vesting_shares: '100000000 VESTS',
        received_vesting_shares: '250000000 VESTS',
        savings_balance: '0 HIVE',
        savings_hbd_balance: '0.836 HBD',
        savings_hbd_seconds: '1000000',
        savings_hbd_seconds_last_update: '2024-01-01T00:00:00',
        savings_hbd_last_interest_payment: '1970-01-01T00:00:00',
        to_withdraw: '0 VESTS',
        vesting_withdraw_rate: '0 VESTS',
      },
      CHAIN,
      '432210000000',
    );

    const summary = buildHiveWalletSummary(
      balance,
      { hiveUsd: 0.25, hbdUsd: 1 },
      {
        canClaimInterest: true,
        daysUntilInterestClaim: 0,
        nextVestingWithdrawal: null,
        pendingSavingsWithdrawals: [],
      },
    );

    expect(summary.display.liquidHive).toBe('22.645');
    expect(summary.display.hivePower).toBeTruthy();
    expect(summary.display.delegationsNetHp).toMatch(/^\+/);
    expect(summary.display.rcMax).toBe('432.21b');
    expect(summary.flags.showDelegationsRow).toBe(true);
    expect(summary.flags.showPowerDownRow).toBe(false);
    expect(Number.parseFloat(summary.display.estAccountValueUsd)).toBeGreaterThan(0);
  });

  it('shows power down row when to_withdraw is non-zero', () => {
    const balance = mapHiveAccountToBalanceFields(
      {
        balance: '1 HIVE',
        vesting_shares: '1000000 VESTS',
        to_withdraw: '500000 VESTS',
        vesting_withdraw_rate: '100000 VESTS',
        next_vesting_withdrawal: '2026-06-26T15:10:00',
      },
      CHAIN,
      '1000',
    );

    const summary = buildHiveWalletSummary(
      balance,
      { hiveUsd: 1, hbdUsd: 1 },
      {
        canClaimInterest: false,
        daysUntilInterestClaim: 12,
        nextVestingWithdrawal: '2026-06-26T15:10:00',
        pendingSavingsWithdrawals: [],
      },
    );

    expect(summary.flags.showPowerDownRow).toBe(true);
    expect(summary.powerDown?.nextVestingWithdrawal).toBe('2026-06-26T15:10:00');
    expect(summary.powerDown?.weeksRemaining).toBeGreaterThan(0);
  });

  it('formats RC when max_rc is numeric from rc_api', () => {
    const balance = mapHiveAccountToBalanceFields(
      { balance: '1 HIVE', vesting_shares: '0 VESTS' },
      CHAIN,
      432_210_000_000,
    );

    const summary = buildHiveWalletSummary(
      balance,
      { hiveUsd: 1, hbdUsd: 1 },
      {
        canClaimInterest: false,
        daysUntilInterestClaim: 0,
        nextVestingWithdrawal: null,
        pendingSavingsWithdrawals: [],
        rc: mapRcAccountToSnapshot({
          max_rc: '432210000000',
          delegated_rc: '1000000000',
          received_delegated_rc: '0',
          rc_manabar: { current_mana: '120000000000' },
        }),
      },
    );

    expect(summary.display.rcMax).toBe('433.21');
    expect(summary.flags.showRcDelegationsRow).toBe(true);
  });
});
