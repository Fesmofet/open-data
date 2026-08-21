import type { ResolvedObjectView } from '@opden-data-layer/objects-domain';
import { PostObject } from '@opden-data-layer/odl-db-types';

import type {
  BatchProjectOptions,
  ObjectProjectionService,
} from '../object-projection/object-projection.service';
import { normalizeProjectedObjectForJson } from '../object-projection/normalize-projected-object-for-json';
import type { ProjectedObject } from '../object-projection/projected-object.types';
import { LINKED_OBJECT_DESCRIPTION_MAX } from './feed.constants';
import { stripHtmlForExcerpt, truncateExcerpt } from './post-excerpt';

function placeholderProjectedObject(o: PostObject): ProjectedObject {
  return normalizeProjectedObjectForJson({
    object_id: o.object_id,
    object_type: o.object_type ?? '',
    semantic_type: null,
    status: 'active',
    weight: null,
    fields: {},
    isFavorited: false,
    hasSupervisedOwnership: false,
    hasExclusiveOwnership: false,
    hasOwnershipAuthority: false,
  });
}

function hasDisplayImage(p: ProjectedObject): boolean {
  const img = p.fields['image'];
  return typeof img === 'string' && img.length > 0;
}

/**
 * Tagged / linked objects: prefer avatar (`image` field) resolved, then higher `objects_core.weight`, then id.
 */
export function sortProjectedObjectsForDisplay(
  items: Array<{ projected: ProjectedObject; weight: number | null }>,
): ProjectedObject[] {
  const sorted = [...items].sort((a, b) => {
    const ha = hasDisplayImage(a.projected) ? 1 : 0;
    const hb = hasDisplayImage(b.projected) ? 1 : 0;
    if (ha !== hb) {
      return hb - ha;
    }
    const wa = a.weight ?? Number.NEGATIVE_INFINITY;
    const wb = b.weight ?? Number.NEGATIVE_INFINITY;
    if (wa !== wb) {
      return wb - wa;
    }
    return a.projected.object_id.localeCompare(b.projected.object_id);
  });
  return sorted.map((x) => x.projected);
}

function applyLinkedDescriptionExcerpt(projected: ProjectedObject): ProjectedObject {
  const desc = projected.fields['description'];
  if (typeof desc !== 'string' || desc === '') {
    return projected;
  }
  const plain = stripHtmlForExcerpt(desc);
  const excerpt = truncateExcerpt(plain, LINKED_OBJECT_DESCRIPTION_MAX);
  return {
    ...projected,
    fields: {
      ...projected.fields,
      description: excerpt,
    },
  };
}

function rowsForPostObjects(
  objectsForPost: PostObject[],
  projectedById: Map<string, ProjectedObject>,
  weightByObjectId: Map<string, number | null>,
): Array<{ projected: ProjectedObject; weight: number | null }> {
  return objectsForPost.map((o) => ({
    projected: projectedById.get(o.object_id) ?? placeholderProjectedObject(o),
    weight: weightByObjectId.get(o.object_id) ?? null,
  }));
}

/** Sync assembly after a single page-level `batchProject`. */
export function assembleFeedObjectChipsForPost(
  objectsForPost: PostObject[],
  projectedById: Map<string, ProjectedObject>,
  weightByObjectId: Map<string, number | null>,
  limit: number,
): ProjectedObject[] {
  const rows = rowsForPostObjects(objectsForPost, projectedById, weightByObjectId);
  return sortProjectedObjectsForDisplay(rows).slice(0, limit);
}

export function groupPostObjectsByPostKey(
  postObjects: PostObject[],
): Map<string, PostObject[]> {
  const byKey = new Map<string, PostObject[]>();
  for (const o of postObjects) {
    const key = `${o.author}\0${o.permlink}`;
    const list = byKey.get(key);
    if (list) {
      list.push(o);
    } else {
      byKey.set(key, [o]);
    }
  }
  return byKey;
}

async function projectObjectsForPost(
  objectsForPost: PostObject[],
  viewsByObjectId: Map<string, ResolvedObjectView>,
  weightByObjectId: Map<string, number | null>,
  projection: ObjectProjectionService,
  options: BatchProjectOptions,
): Promise<Array<{ projected: ProjectedObject; weight: number | null }>> {
  const uniqueIds = [...new Set(objectsForPost.map((o) => o.object_id))];
  const viewsToProject = uniqueIds
    .map((id) => viewsByObjectId.get(id))
    .filter((v): v is ResolvedObjectView => v != null);

  const projectedBatch =
    viewsToProject.length > 0 ? await projection.batchProject(viewsToProject, options) : [];
  const projectedById = new Map(projectedBatch.map((p) => [p.object_id, p]));

  return rowsForPostObjects(objectsForPost, projectedById, weightByObjectId);
}

export async function buildFeedObjectChips(
  objectsForPost: PostObject[],
  viewsByObjectId: Map<string, ResolvedObjectView>,
  weightByObjectId: Map<string, number | null>,
  projection: ObjectProjectionService,
  options: BatchProjectOptions,
  limit: number,
): Promise<ProjectedObject[]> {
  const rows = await projectObjectsForPost(
    objectsForPost,
    viewsByObjectId,
    weightByObjectId,
    projection,
    options,
  );
  return sortProjectedObjectsForDisplay(rows).slice(0, limit);
}

export async function buildLinkedObjectSummaries(
  objectsForPost: PostObject[],
  viewsByObjectId: Map<string, ResolvedObjectView>,
  weightByObjectId: Map<string, number | null>,
  projection: ObjectProjectionService,
  options: BatchProjectOptions,
): Promise<ProjectedObject[]> {
  const rows = await projectObjectsForPost(
    objectsForPost,
    viewsByObjectId,
    weightByObjectId,
    projection,
    options,
  );
  const sorted = sortProjectedObjectsForDisplay(rows);
  return sorted.map(applyLinkedDescriptionExcerpt);
}
