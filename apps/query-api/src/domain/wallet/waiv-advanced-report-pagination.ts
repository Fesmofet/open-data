import type { WaivAdvancedReportRawRow } from './waiv-advanced-report-pager.service';

export type WaivAdvancedReportAccountCursor = {
  name: string;
  cursor: string | null;
  hasMore: boolean;
};

function rowKey(row: WaivAdvancedReportRawRow): string {
  return `${row.userName}:${row.operationIndex}`;
}

/**
 * Legacy `accumulateAcc` parity for WAIV string cursors.
 */
export function buildWaivAdvancedReportAccountCursor(params: {
  accountName: string;
  fetched: readonly WaivAdvancedReportRawRow[];
  merged: readonly WaivAdvancedReportRawRow[];
  hasMoreFromPager: boolean;
  pageLimit: number;
  lastCursor: string | null;
}): WaivAdvancedReportAccountCursor | null {
  const { accountName, fetched, merged, hasMoreFromPager, pageLimit, lastCursor } =
    params;
  const name = accountName.trim().toLowerCase();

  const limitedKeys = new Set(merged.map(rowKey));
  const filterWallet = fetched.filter(
    (row) => row.userName === name && !limitedKeys.has(rowKey(row)),
  );

  const accountHasMore =
    hasMoreFromPager || filterWallet.length > 0 || fetched.length > pageLimit;

  if (!accountHasMore) {
    return null;
  }

  // Cursor pagination is strict-older: the next page excludes any row at/above the
  // cursor. Continue from the LAST DELIVERED row (oldest of this account in `merged`),
  // never from the first undelivered row — otherwise that boundary row is skipped.
  const deliveredForAccount = merged.filter((row) => row.userName === name);
  const lastDelivered = deliveredForAccount.at(-1);
  if (lastDelivered) {
    return { name, cursor: lastDelivered.cursor, hasMore: true };
  }

  if (lastCursor) {
    return { name, cursor: lastCursor, hasMore: true };
  }

  return null;
}

export function mergeWaivAdvancedReportGlobalHasMore(params: {
  allMergedCount: number;
  pageLimit: number;
  accountCursors: readonly WaivAdvancedReportAccountCursor[];
}): boolean {
  return (
    params.allMergedCount > params.pageLimit ||
    params.accountCursors.some((account) => account.hasMore)
  );
}
