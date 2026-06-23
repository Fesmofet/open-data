import { HIVE_OP } from '../hive-account-history/operation-types';
import {
  calcDepositWithdrawals,
  classifyWithdrawDeposit,
  isAdvancedReportOperation,
  isMutualTransaction,
} from './index';

describe('hive-advanced-report', () => {
  const filterAccounts = ['alice', 'bob'];

  it('includes expected hive ops', () => {
    expect(isAdvancedReportOperation(HIVE_OP.TRANSFER)).toBe(true);
    expect(isAdvancedReportOperation(HIVE_OP.LIMIT_ORDER)).toBe(false);
  });

  it('classifies transfer direction', () => {
    expect(
      classifyWithdrawDeposit({
        type: HIVE_OP.TRANSFER,
        record: { type: HIVE_OP.TRANSFER, from: 'bob', to: 'alice' },
        userName: 'alice',
        filterAccounts: ['alice'],
      }),
    ).toBe('d');
    expect(
      classifyWithdrawDeposit({
        type: HIVE_OP.TRANSFER,
        record: { type: HIVE_OP.TRANSFER, from: 'alice', to: 'bob' },
        userName: 'alice',
        filterAccounts: ['alice'],
      }),
    ).toBe('w');
  });

  it('excludes mutual transfer between filter accounts', () => {
    expect(
      isMutualTransaction({
        record: { type: HIVE_OP.TRANSFER, from: 'alice', to: 'bob' },
        userName: 'alice',
        filterAccounts,
      }),
    ).toBe(true);
    expect(
      classifyWithdrawDeposit({
        type: HIVE_OP.TRANSFER,
        record: { type: HIVE_OP.TRANSFER, from: 'alice', to: 'bob' },
        userName: 'alice',
        filterAccounts,
      }),
    ).toBe('');
  });

  it('excludes self transfer from totals', () => {
    expect(
      classifyWithdrawDeposit({
        type: HIVE_OP.TRANSFER,
        record: { type: HIVE_OP.TRANSFER, from: 'alice', to: 'alice' },
        userName: 'alice',
        filterAccounts: ['alice', 'carol'],
      }),
    ).toBe('');
  });

  it('calcDepositWithdrawals skips checked and empty withdrawDeposit', () => {
    const totals = calcDepositWithdrawals([
      { withdrawDeposit: 'd', totalFiat: 10, checked: false },
      { withdrawDeposit: 'w', totalFiat: 3, checked: false },
      { withdrawDeposit: 'd', totalFiat: 99, checked: true },
      { withdrawDeposit: '', totalFiat: 5, checked: false },
    ]);
    expect(totals).toEqual({ deposits: 10, withdrawals: 3 });
  });
});
