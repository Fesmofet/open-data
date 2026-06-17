import type { ResolvedObjectView } from '@opden-data-layer/objects-domain';
import { UPDATE_TYPES } from '@opden-data-layer/core';
import { buildExcludedPostKeysFromRemoveUpdates } from '@opden-data-layer/core';

export function collectRemovePostKeysFromView(view: ResolvedObjectView): string[] {
  const field = view.fields[UPDATE_TYPES.REMOVE];
  if (!field) {
    return [];
  }
  const values: string[] = [];
  for (const u of field.values) {
    if (u.validity_status !== 'VALID') {
      continue;
    }
    const text = u.value_text?.trim();
    if (text) {
      values.push(text);
    }
  }
  return buildExcludedPostKeysFromRemoveUpdates(values);
}
