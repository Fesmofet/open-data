import type { AdvancedReportRawRow } from './hive-advanced-report-pager.service';
import {
  buildAdvancedReportAccountCursor,
  mergeAdvancedReportGlobalHasMore,
} from './hive-advanced-report-pagination';

function rawRow(operationIndex: number, userName = 'flowmaster'): AdvancedReportRawRow {
  return {
    userName,
    operationIndex,
    timestamp: operationIndex,
    dateYmd: '2020-01-01',
    type: 'transfer',
    from: userName,
    to: 'bob',
    amount: '1 HIVE',
    memo: '',
    payload: {},
  };
}

describe('buildAdvancedReportAccountCursor', () => {
  it('uses newest remaining op index when lookahead row is not in the limited page', () => {
    const fetched = Array.from({ length: 51 }, (_, i) => rawRow(1000 - i));
    const merged = fetched.slice(0, 50);

    const cursor = buildAdvancedReportAccountCursor({
      accountName: 'flowmaster',
      fetched,
      merged,
      hasMoreFromPager: true,
      pageLimit: 50,
    });

    expect(cursor).toEqual({
      name: 'flowmaster',
      cursor: 950,
      hasMore: true,
    });
  });

  it('returns hasMore when pager fetched lookahead but reported no more', () => {
    const fetched = Array.from({ length: 51 }, (_, i) => rawRow(200 - i));
    const merged = fetched.slice(0, 50);

    const cursor = buildAdvancedReportAccountCursor({
      accountName: 'flowmaster',
      fetched,
      merged,
      hasMoreFromPager: false,
      pageLimit: 50,
    });

    expect(cursor).toEqual({
      name: 'flowmaster',
      cursor: 150,
      hasMore: true,
    });
  });

  it('returns null when history is exhausted for the account', () => {
    const fetched = [rawRow(5), rawRow(4)];
    const merged = fetched;

    const cursor = buildAdvancedReportAccountCursor({
      accountName: 'flowmaster',
      fetched,
      merged,
      hasMoreFromPager: false,
      pageLimit: 50,
    });

    expect(cursor).toBeNull();
  });

  it('uses newest remaining op for accounts absent from the merged page', () => {
    const fetched = Array.from({ length: 51 }, (_, i) => ({
      ...rawRow(500 - i),
      userName: 'grampo',
    }));
    const merged = Array.from({ length: 50 }, (_, i) => rawRow(1000 - i));

    const cursor = buildAdvancedReportAccountCursor({
      accountName: 'grampo',
      fetched,
      merged,
      hasMoreFromPager: true,
      pageLimit: 50,
    });

    expect(cursor).toEqual({
      name: 'grampo',
      cursor: 500,
      hasMore: true,
    });
  });

  it('uses newest remaining op when it is newer than oldest displayed for the account', () => {
    const flowmasterRows = [
      rawRow(1000),
      rawRow(990),
      rawRow(985),
      rawRow(980),
      ...Array.from({ length: 47 }, (_, i) => rawRow(900 - i)),
    ];
    const merged = [
      rawRow(1000),
      rawRow(970),
      ...Array.from({ length: 48 }, (_, i) => ({
        ...rawRow(995 - i),
        userName: 'grampo',
      })),
    ];

    const cursor = buildAdvancedReportAccountCursor({
      accountName: 'flowmaster',
      fetched: flowmasterRows,
      merged,
      hasMoreFromPager: true,
      pageLimit: 50,
    });

    expect(cursor).toEqual({
      name: 'flowmaster',
      cursor: 990,
      hasMore: true,
    });
  });
});

describe('mergeAdvancedReportGlobalHasMore', () => {
  it('matches legacy usersJointArr.length > limitedWallet.length', () => {
    expect(
      mergeAdvancedReportGlobalHasMore({
        allMergedCount: 22,
        pageLimit: 10,
        accountCursors: [],
      }),
    ).toBe(true);
  });
});
