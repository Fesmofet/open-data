import {
  HIVE_ACCOUNT_HISTORY_MAX_BATCH_SIZE,
  HIVE_HISTORY_DEFAULT_BATCH_SIZE,
  resolveHiveAccountHistoryBatchSize,
  resolveHiveAccountHistoryRequestLimit,
} from './activity-feed.constants';

describe('activity-feed.constants', () => {
  it('uses larger batch when filters are active', () => {
    expect(resolveHiveAccountHistoryBatchSize(false)).toBe(
      HIVE_HISTORY_DEFAULT_BATCH_SIZE,
    );
    expect(resolveHiveAccountHistoryBatchSize(true)).toBe(
      HIVE_ACCOUNT_HISTORY_MAX_BATCH_SIZE,
    );
  });

  it('shrinks request limit for low operation indices', () => {
    expect(resolveHiveAccountHistoryRequestLimit(-1, 1000)).toBe(1000);
    expect(resolveHiveAccountHistoryRequestLimit(1032, 1000)).toBe(1000);
    expect(resolveHiveAccountHistoryRequestLimit(4, 1000)).toBe(5);
  });
});
