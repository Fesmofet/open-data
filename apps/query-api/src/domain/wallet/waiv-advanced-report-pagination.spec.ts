import { buildWaivAdvancedReportAccountCursor } from './waiv-advanced-report-pagination';
import type { WaivAdvancedReportRawRow } from './waiv-advanced-report-pager.service';

function rawRow(
  operationIndex: number,
  cursor: string,
  userName = 'grampo',
): WaivAdvancedReportRawRow {
  return {
    userName,
    operationIndex,
    timestamp: operationIndex,
    dateYmd: '2024-01-01',
    type: 'comments_curationReward',
    from: '',
    to: userName,
    amount: '1',
    memo: '',
    withdrawDeposit: 'd',
    payload: {},
    cursor,
  };
}

describe('buildWaivAdvancedReportAccountCursor', () => {
  it('continues from the last delivered row, not the first undelivered one', () => {
    const delivered = [
      rawRow(50, 'c50'),
      rawRow(49, 'c49'),
      rawRow(48, 'c48'),
    ];
    // pagingRows = delivered + the first row that did NOT make it into `merged`.
    const fetched = [...delivered, rawRow(47, 'c47')];

    const result = buildWaivAdvancedReportAccountCursor({
      accountName: 'grampo',
      fetched,
      merged: delivered,
      hasMoreFromPager: true,
      pageLimit: 3,
      lastCursor: 'c48',
    });

    // Must be the oldest DELIVERED row (c48), so the next strict-older page still
    // returns c47. Using the undelivered c47 would skip it.
    expect(result).toEqual({ name: 'grampo', cursor: 'c48', hasMore: true });
  });

  it('returns null when there is nothing more to page', () => {
    const delivered = [rawRow(2, 'c2'), rawRow(1, 'c1')];
    const result = buildWaivAdvancedReportAccountCursor({
      accountName: 'grampo',
      fetched: delivered,
      merged: delivered,
      hasMoreFromPager: false,
      pageLimit: 50,
      lastCursor: 'c1',
    });
    expect(result).toBeNull();
  });
});
