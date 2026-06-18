import type { ActivityFilterKey } from './activity-filter-keys';
import { makeOperationBitMask, type OperationBitMask } from './make-operation-bit-mask';
import { getOperationIndicesForActivityFilters } from './matches-activity-filters';

export function buildActivityFilterMask(
  filters: readonly ActivityFilterKey[],
): OperationBitMask | null {
  if (filters.length === 0) {
    return null;
  }
  const indices = getOperationIndicesForActivityFilters(filters);
  if (indices.length === 0) {
    return null;
  }
  return makeOperationBitMask(indices);
}
