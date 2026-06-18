import type { ActivityFilterKey } from './activity-filter-keys';
import { makeOperationBitMask, type OperationBitMask } from './make-operation-bit-mask';
import { getOperationIndicesForActivityFilters } from './matches-activity-filters';

/**
 * Hive `condenser_api.get_account_history` only reliably applies `operation_filter_low`
 * for protocol indices 0–31. Higher indices (savings, rewards, virtual ops) must be
 * matched by semantic post-filter — passing a bitmask for them returns empty or wrong rows.
 */
const HIVE_RPC_FILTER_MAX_INDEX = 31;

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
  if (indices.some((index) => index > HIVE_RPC_FILTER_MAX_INDEX)) {
    return null;
  }
  return makeOperationBitMask(indices);
}
