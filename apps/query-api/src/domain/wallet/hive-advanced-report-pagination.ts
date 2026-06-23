import type { AdvancedReportRawRow } from './hive-advanced-report-pager.service';

export type AdvancedReportAccountCursor = {
  name: string;
  cursor: number | null;
  hasMore: boolean;
};

/**
 * Legacy `accumulateHiveAcc` parity:
 * - `filterWallet` = account rows not present in the global limited page
 * - next cursor = newest remaining op index, or oldest-in-batch - 1 when none remain
 */
export function buildAdvancedReportAccountCursor(params: {
  accountName: string;
  fetched: readonly AdvancedReportRawRow[];
  merged: readonly AdvancedReportRawRow[];
  hasMoreFromPager: boolean;
  pageLimit: number;
}): AdvancedReportAccountCursor | null {
  const { accountName, fetched, merged, hasMoreFromPager, pageLimit } = params;
  const name = accountName.trim().toLowerCase();

  const limitedKeys = new Set(
    merged.map((row) => `${row.userName}:${row.operationIndex}`),
  );
  const filterWallet = fetched.filter(
    (row) =>
      row.userName === name &&
      !limitedKeys.has(`${row.userName}:${row.operationIndex}`),
  );

  const accountHasMore =
    hasMoreFromPager ||
    filterWallet.length > 0 ||
    fetched.length > pageLimit;

  if (!accountHasMore) {
    return null;
  }

  if (filterWallet.length > 0) {
    const operationNum = filterWallet[0]?.operationIndex;
    if (operationNum == null || operationNum < 0) {
      return null;
    }
    return { name, cursor: operationNum, hasMore: true };
  }

  const lastOp = fetched.at(-1);
  if (!lastOp || lastOp.operationIndex <= 0) {
    return null;
  }

  return {
    name,
    cursor: lastOp.operationIndex - 1,
    hasMore: true,
  };
}

export function mergeAdvancedReportGlobalHasMore(params: {
  allMergedCount: number;
  pageLimit: number;
  accountCursors: readonly AdvancedReportAccountCursor[];
}): boolean {
  return (
    params.allMergedCount > params.pageLimit ||
    params.accountCursors.some((account) => account.hasMore)
  );
}
