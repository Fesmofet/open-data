import { HIVE_RC_DELEGATOR_RESERVE } from '../constants/hive-rc';
import type { HiveWalletSummaryView } from './types/hive-wallet-view';
import { getHiveDelegateRcMaxAmount } from './wallet-modal-balances';

describe('getHiveDelegateRcMaxAmount', () => {
  const baseRc: NonNullable<HiveWalletSummaryView['rc']> = {
    totalOwned: '430586252474',
    maxCapacity: '430586252474',
    currentMana: '430217626757',
    delegatedRc: '0',
    receivedDelegatedRc: '0',
  };

  it('uses available mana capped by undelegated max capacity', () => {
    expect(
      getHiveDelegateRcMaxAmount({
        account: 'flowmaster',
        balance: {} as HiveWalletSummaryView['balance'],
        display: {} as HiveWalletSummaryView['display'],
        flags: {} as HiveWalletSummaryView['flags'],
        pendingSavingsWithdrawals: [],
        chain: { totalVestingShares: '0', totalVestingFundSteem: '0' },
        rates: { hiveUsd: 0, hbdUsd: 0 },
        rc: baseRc,
      }),
    ).toBe('427217626757');
  });

  it('subtracts delegator RC reserve from max', () => {
    expect(
      getHiveDelegateRcMaxAmount({
        account: 'alice',
        balance: {} as HiveWalletSummaryView['balance'],
        display: {} as HiveWalletSummaryView['display'],
        flags: {} as HiveWalletSummaryView['flags'],
        pendingSavingsWithdrawals: [],
        chain: { totalVestingShares: '0', totalVestingFundSteem: '0' },
        rates: { hiveUsd: 0, hbdUsd: 0 },
        rc: {
          ...baseRc,
          maxCapacity: String(HIVE_RC_DELEGATOR_RESERVE + 1_000),
          currentMana: String(HIVE_RC_DELEGATOR_RESERVE + 1_000),
        },
      }),
    ).toBe('1000');
  });

  it('subtracts already delegated RC from capacity', () => {
    expect(
      getHiveDelegateRcMaxAmount({
        account: 'alice',
        balance: {} as HiveWalletSummaryView['balance'],
        display: {} as HiveWalletSummaryView['display'],
        flags: {} as HiveWalletSummaryView['flags'],
        pendingSavingsWithdrawals: [],
        chain: { totalVestingShares: '0', totalVestingFundSteem: '0' },
        rates: { hiveUsd: 0, hbdUsd: 0 },
        rc: { ...baseRc, delegatedRc: '1000000000' },
      }),
    ).toBe('426586252474');
  });

  it('returns 0 when RC snapshot is missing', () => {
    expect(getHiveDelegateRcMaxAmount(null)).toBe('0');
  });
});
