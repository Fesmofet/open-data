import { HIVE_OP } from '../hive-account-history/operation-types';
import {
  ADVANCED_REPORT_DEFAULT_PAGE_SIZE,
  ADVANCED_REPORT_MAX_PAGE_SIZE,
  calcDepositWithdrawals,
  classifyWithdrawDeposit,
  isAdvancedReportOperation,
  isMutualTransaction,
} from './index';

describe('hive-advanced-report', () => {
  it('page size constants', () => {
    expect(ADVANCED_REPORT_DEFAULT_PAGE_SIZE).toBe(50);
    expect(ADVANCED_REPORT_DEFAULT_PAGE_SIZE).toBeLessThanOrEqual(
      ADVANCED_REPORT_MAX_PAGE_SIZE,
    );
  });

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
    expect(
      classifyWithdrawDeposit({
        type: HIVE_OP.TRANSFER,
        record: { type: HIVE_OP.TRANSFER, from: 'alice', to: 'alice' },
        userName: 'alice',
        filterAccounts: ['alice'],
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
