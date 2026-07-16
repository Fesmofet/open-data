import { UPDATE_TYPES } from '@opden-data-layer/core';

/** Update types resolved by default for nested catalog navigation (list items, sort, page/legal body). */
export const NESTED_OBJECT_UPDATE_TYPES = [
  UPDATE_TYPES.LIST_ITEM,
  UPDATE_TYPES.SORT_CUSTOM,
  UPDATE_TYPES.PAGE_CONTENT,
  UPDATE_TYPES.LEGAL_TEXT,
  UPDATE_TYPES.NAME,
] as const;

export function effectiveUpdateTypes(
  requested: readonly string[] | undefined,
  endpointDefaults: readonly string[],
): string[] {
  if (requested == null || requested.length === 0) {
    return [...endpointDefaults];
  }
  return [...requested];
}
