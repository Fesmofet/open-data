import type { ActivityFilterKey } from './activity-filter-keys';
import { makeOperationBitMask, type OperationBitMask } from './make-operation-bit-mask';
import { getOperationIndicesForActivityFilters } from './matches-activity-filters';
import { HIVE_OPERATION_INDEX } from './operation-indices';

/**
 * `interest` pollutes RPC results on some nodes when combined in the low-word mask;
 * still matched semantically via the savings filter.
 */
const RPC_MASK_EXCLUDED_INDICES = new Set<number>([
  HIVE_OPERATION_INDEX.interest,
]);

export function buildActivityFilterMask(
  filters: readonly ActivityFilterKey[],
): OperationBitMask | null {
  if (filters.length === 0) {
    return null;
  }
  const indices = getOperationIndicesForActivityFilters(filters).filter(
    (index) => !RPC_MASK_EXCLUDED_INDICES.has(index),
  );
  if (indices.length === 0) {
    return null;
  }
  return makeOperationBitMask(indices);
}
