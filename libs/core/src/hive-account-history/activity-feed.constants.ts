/** Max rows per HTTP activity page request (not the Hive RPC batch size). */
export const ACTIVITY_MAX_PAGE_SIZE = 500;

/** @deprecated Use {@link ACTIVITY_MAX_PAGE_SIZE}. */
export const ACTIVITY_HIVE_BATCH_LIMIT = ACTIVITY_MAX_PAGE_SIZE;

/** Rows revealed per infinite-scroll step in the web activity tab. */
export const ACTIVITY_DISPLAY_PAGE_SIZE = 20;
