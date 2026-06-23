import {
  appendAdvancedReportWalletPage,
  dedupeIncomingAdvancedReportRows,
  mergeAdvancedReportWalletRows,
  totalsFromAdvancedReportWallet,
} from './load-full-hive-advanced-report.helpers';
import type { AdvancedReportRowApi } from '../dto/hive-advanced-report-api.schema';

describe('load-full-hive-advanced-report helpers', () => {
  const row = (operationIndex: number, totalFiat: number): AdvancedReportRowApi => ({
    userName: 'alice',
    operationIndex,
    timestamp: operationIndex,
    type: 'transfer',
    from: 'bob',
    to: 'alice',
    amount: '1 HIVE',
    memo: '',
    withdrawDeposit: 'd',
    checked: false,
    hiveUsd: 1,
    hbdUsd: 1,
    hiveRateFiat: 1,
    hbdRateFiat: 1,
    hiveFiat: totalFiat,
    hbdFiat: 0,
    hpFiat: 0,
    totalFiat,
    payload: {},
  });

  it('merges pages without duplicates and keeps newest first', () => {
    const merged = mergeAdvancedReportWalletRows(
      [row(2, 1)],
      [row(2, 1), row(1, 2)],
    );
    expect(merged).toHaveLength(2);
    expect(merged[0]?.operationIndex).toBe(2);
    expect(merged[1]?.operationIndex).toBe(1);
  });

  it('recalculates totals from full wallet', () => {
    const totals = totalsFromAdvancedReportWallet([
      row(1, 5),
      { ...row(2, 3), withdrawDeposit: 'w' },
    ]);
    expect(totals.deposits).toBe(5);
    expect(totals.withdrawals).toBe(3);
  });

  it('dedupes incoming rows against existing wallet', () => {
    const appended = dedupeIncomingAdvancedReportRows([row(2, 1)], [row(2, 1), row(1, 2)]);
    expect(appended).toHaveLength(1);
    expect(appended[0]?.operationIndex).toBe(1);
  });

  it('appends pages with merge-sort instead of full re-sort', () => {
    const first = [row(5, 1), row(3, 1)];
    const appended = appendAdvancedReportWalletPage(first, [row(4, 1), row(3, 1)]);
    expect(appended.map((item) => item.operationIndex)).toEqual([5, 4, 3]);
  });
});
