import { OBJECT_TYPE_REGISTRY } from '@opden-data-layer/core/object-type-registry';
import { UPDATE_TYPES } from '@opden-data-layer/core/update-types';

import { getTagCategoryNamesForObjectType } from '@/modules/discover/domain/discover-registry';

/** Whether any shop type has TAG_CATEGORY in supposed_updates. */
export function shopTypesHaveTagFilters(types: readonly string[]): boolean {
  return types.some((objectType) => {
    const def = OBJECT_TYPE_REGISTRY[objectType];
    if (!def) {
      return false;
    }
    return def.supposed_updates.some((u) => u.update_type === UPDATE_TYPES.TAG_CATEGORY);
  });
}

/** Whether any shop type has AGGREGATE_RATING in supposed_updates. */
export function shopTypesHaveRatingFilters(types: readonly string[]): boolean {
  return types.some((objectType) => {
    const def = OBJECT_TYPE_REGISTRY[objectType];
    if (!def) {
      return false;
    }
    return def.supposed_updates.some((u) => u.update_type === UPDATE_TYPES.AGGREGATE_RATING);
  });
}

/** Registry tag category names merged across shop object types (deduped, stable). */
export function getTagCategoryNamesForShopTypes(types: readonly string[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const objectType of types) {
    for (const category of getTagCategoryNamesForObjectType(objectType)) {
      if (!seen.has(category)) {
        seen.add(category);
        order.push(category);
      }
    }
  }
  return order;
}

/** Legacy rating threshold (10-point scale) to star count for display. */
export function shopRatingThresholdToStars(threshold: number): number {
  return threshold / 2;
}
