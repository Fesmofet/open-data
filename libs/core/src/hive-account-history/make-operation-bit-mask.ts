export type OperationBitMask = {
  filterLow: number | string;
  filterHigh: number | string;
};

/** Indices 0–63 → `operation_filter_low`; 64–127 → `operation_filter_high` (Hive / dhive). */
function toRpcBitmaskWord(value: bigint): number | string {
  if (value === BigInt(0)) {
    return 0;
  }
  const asNumber = Number(value);
  if (Number.isSafeInteger(asNumber) && BigInt(asNumber) === value) {
    return asNumber;
  }
  return value.toString();
}

/** Build Hive `operation_filter_low` / `operation_filter_high` from protocol indices. */
export function makeOperationBitMask(indices: readonly number[]): OperationBitMask {
  let filterLow = BigInt(0);
  let filterHigh = BigInt(0);
  for (const index of indices) {
    if (!Number.isInteger(index) || index < 0) {
      continue;
    }
    if (index < 64) {
      filterLow |= BigInt(1) << BigInt(index);
    } else if (index < 128) {
      filterHigh |= BigInt(1) << BigInt(index - 64);
    }
  }
  return {
    filterLow: toRpcBitmaskWord(filterLow),
    filterHigh: toRpcBitmaskWord(filterHigh),
  };
}
