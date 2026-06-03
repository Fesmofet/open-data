import { UPDATE_TYPES } from '@opden-data-layer/core';

import type { ProjectedObject, RefSummary } from '../object-projection/projected-object.types';
import type { SearchObjectResult } from './search.types';

/** Update types projected for search / linked-object card display. */
export const SEARCH_OBJECT_DISPLAY_UPDATE_TYPES = [
  UPDATE_TYPES.NAME,
  UPDATE_TYPES.IMAGE,
  UPDATE_TYPES.PARENT,
] as const;

function parentDisplayName(parent: unknown): string | null {
  if (!parent || typeof parent !== 'object') {
    return null;
  }
  const ref = parent as RefSummary;
  const raw = ref.fields?.[UPDATE_TYPES.NAME];
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim();
  }
  return null;
}

export function mapProjectedToSearchObject(p: ProjectedObject): SearchObjectResult {
  const nameVal = p.fields[UPDATE_TYPES.NAME];
  const imageVal = p.fields[UPDATE_TYPES.IMAGE];
  const parentVal = p.fields[UPDATE_TYPES.PARENT];
  return {
    object_id: p.object_id,
    object_type: p.object_type,
    name: typeof nameVal === 'string' ? nameVal : null,
    image_url: typeof imageVal === 'string' ? imageVal : null,
    parent_name: parentDisplayName(parentVal),
  };
}
