/** Max rows per HTTP activity page request (not the Hive RPC batch size). */
export const ACTIVITY_MAX_PAGE_SIZE = 500;

/** Default `get_account_history` limit when no activity filters (noise from hidden ops). */
export const HIVE_HISTORY_DEFAULT_BATCH_SIZE = 100;

/** Hive node max for `get_account_history` (`limit <= 1000`). */
export const HIVE_ACCOUNT_HISTORY_MAX_BATCH_SIZE = 1000;

/** @deprecated Use {@link HIVE_ACCOUNT_HISTORY_MAX_BATCH_SIZE}. */
export const ACTIVITY_HIVE_BATCH_LIMIT = HIVE_ACCOUNT_HISTORY_MAX_BATCH_SIZE;

/** Rows revealed per infinite-scroll step in the web activity tab. */
export const ACTIVITY_DISPLAY_PAGE_SIZE = 20;

export function resolveHiveAccountHistoryBatchSize(
  hasActivityFilters: boolean,
): number {
  return hasActivityFilters
    ? HIVE_ACCOUNT_HISTORY_MAX_BATCH_SIZE
    : HIVE_HISTORY_DEFAULT_BATCH_SIZE;
}

/**
 * Hive `get_account_history` requires `start >= limit - 1` (0-based operation index).
 * When paging backward into low indices, shrink the RPC limit (legacy walletHelper).
 */
export function resolveHiveAccountHistoryRequestLimit(
  from: number,
  batchSize: number,
): number {
  if (from < 0) {
    return batchSize;
  }
  return Math.min(batchSize, from + 1);
}
