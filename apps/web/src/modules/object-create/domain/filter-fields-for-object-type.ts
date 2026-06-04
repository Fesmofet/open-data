import { OBJECT_TYPE_REGISTRY } from '@opden-data-layer/core/object-type-registry';

import type { FieldEntry } from './object-create.types';

/** Drops update rows that the chosen `object_type` does not support (e.g. recipe `ingredients` on restaurant). */
export function filterFieldsForObjectType(
  fields: readonly FieldEntry[],
  objectType: string,
): FieldEntry[] {
  const def = OBJECT_TYPE_REGISTRY[objectType];
  if (!def) {
    return [...fields];
  }
  const allowed = new Set(def.supported_updates);
  return fields.filter((entry) => allowed.has(entry.updateType));
}
