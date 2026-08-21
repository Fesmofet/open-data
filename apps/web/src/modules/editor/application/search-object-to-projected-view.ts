import type { SearchObjectResult } from '@/modules/app-header/domain/search-response.schema';
import type { ProjectedObjectView } from '@/modules/feed/application/dto/object-fields';

import type { PostEditorLinkedObject } from '../domain/post-editor-linked-object';

export function searchObjectToProjectedView(
  result: SearchObjectResult,
  percent: number,
): ProjectedObjectView {
  const fields: Record<string, unknown> = {};
  if (result.name) {
    fields.name = result.name;
  }
  if (result.image_url) {
    fields.image = result.image_url;
  }
  return {
    object_id: result.object_id,
    object_type: result.object_type,
    semantic_type: null,
    weight: percent,
    fields,
    isFavorited: false,
    hasSupervisedOwnership: false,
    hasExclusiveOwnership: false,
  };
}

export function linkedObjectsToProjectedViews(
  linked: readonly PostEditorLinkedObject[],
  searchResultsById: Readonly<Record<string, SearchObjectResult>>,
): ProjectedObjectView[] {
  return linked.flatMap((o) => {
    const hit = searchResultsById[o.objectId];
    if (!hit) {
      return [];
    }
    return [searchObjectToProjectedView(hit, o.percent)];
  });
}
