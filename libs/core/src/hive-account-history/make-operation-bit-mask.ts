export type OperationBitMask = {
  filterLow: number;
  filterHigh: number;
};

/** Build Hive `operation_filter_low` / `operation_filter_high` from protocol indices. */
export function makeOperationBitMask(indices: readonly number[]): OperationBitMask {
  let filterLow = 0;
  let filterHigh = 0;
  for (const index of indices) {
    if (!Number.isInteger(index) || index < 0) {
      continue;
    }
    if (index < 64) {
      filterLow |= 1 << index;
    } else if (index < 128) {
      filterHigh |= 1 << (index - 64);
    }
  }
  return {
    filterLow: filterLow >>> 0,
    filterHigh: filterHigh >>> 0,
  };
}
