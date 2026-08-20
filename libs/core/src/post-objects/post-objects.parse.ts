import type { NewPostObject } from '@opden-data-layer/odl-db-types';
import { MAX_POST_OBJECTS_PER_POST } from './post-objects.constants';
import {
  extractFirstObjectPathSlug,
  extractHashtagObjectIdsFromBody,
  extractObjectPathSlugsFromBody,
} from './comment-post-object-candidates';

interface MetadataObjectEntry {
  object_id?: unknown;
  /** Legacy Waivio field; treated like `object_id`. */
  author_permlink?: unknown;
  percent?: unknown;
}

function toStr(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) {
    return v.trim();
  }
  return null;
}

function toPercent(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) {
    return Math.round(v);
  }
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  return null;
}

/** Sum of percents must be in [0, 101] when non-empty (per legacy Waivio rule). */
export function validateWobjectPercentSum(objects: NewPostObject[]): boolean {
  if (objects.length === 0) {
    return true;
  }
  let sum = 0;
  for (const o of objects) {
    if (o.percent != null) {
      sum += o.percent;
    }
  }
  return sum >= 0 && sum <= 101;
}

/** When sum is outside [0, 101], set every linked object to percent 0 instead of dropping the post. */
export function normalizeWobjectPercentsIfInvalid(objects: NewPostObject[]): NewPostObject[] {
  if (objects.length === 0 || validateWobjectPercentSum(objects)) {
    return objects;
  }
  return objects.map((o) => ({ ...o, percent: 0 }));
}

function parseMetadataObjects(raw: unknown): Array<{ object_id: string; percent: number }> {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: Array<{ object_id: string; percent: number }> = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const o = item as MetadataObjectEntry;
    const id = toStr(o.object_id) ?? toStr(o.author_permlink);
    const pct = toPercent(o.percent);
    if (!id || pct === null) {
      continue;
    }
    out.push({ object_id: id, percent: pct });
  }
  return out;
}

function normalizeMetadataStringToObjectId(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return extractFirstObjectPathSlug(trimmed) ?? trimmed;
}

function parseMetadataStringArray(
  metadata: Record<string, unknown> | null,
  field: 'tags' | 'links',
): string[] {
  const raw = metadata?.[field];
  if (!Array.isArray(raw)) {
    return [];
  }
  const ids: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') {
      continue;
    }
    const id = normalizeMetadataStringToObjectId(item);
    if (id) {
      ids.push(id);
    }
  }
  return ids;
}

function parseMetadataTagStrings(metadata: Record<string, unknown> | null): string[] {
  return parseMetadataStringArray(metadata, 'tags');
}

function parseMetadataLinkStrings(metadata: Record<string, unknown> | null): string[] {
  const raw = metadata?.['links'];
  if (!Array.isArray(raw)) {
    return [];
  }
  const ids: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') {
      continue;
    }
    const id = extractFirstObjectPathSlug(item);
    if (id) {
      ids.push(id);
    }
  }
  return ids;
}

/**
 * Objects from `json_metadata.objects` (manual percents), `json_metadata.tags` / `links` (Hive string[] →
 * percent 0; Waivio URLs → first `/object/<id>` slug only), body `/object/slug`, body `#hashtags`, then
 * `objects` overwrites by `object_id`.
 *
 * @see docs/spec/data-model/post-json-metadata-objects.md
 */
export function parsePostObjectsForInsert(
  metadata: Record<string, unknown> | null,
  body: string,
): NewPostObject[] {
  const byId = new Map<string, number>();

  for (const id of parseMetadataTagStrings(metadata)) {
    byId.set(id, 0);
  }

  for (const id of parseMetadataLinkStrings(metadata)) {
    if (!byId.has(id)) {
      byId.set(id, 0);
    }
  }

  for (const id of extractObjectPathSlugsFromBody(body)) {
    if (!byId.has(id)) {
      byId.set(id, 0);
    }
  }

  for (const id of extractHashtagObjectIdsFromBody(body)) {
    if (!byId.has(id)) {
      byId.set(id, 0);
    }
  }

  for (const { object_id, percent } of parseMetadataObjects(metadata?.['objects'])) {
    byId.set(object_id, percent);
  }

  const rows = [...byId.entries()].map(([object_id, percent]) => ({
    author: '',
    permlink: '',
    object_id,
    percent,
    object_type: null,
  }));
  return rows.length <= MAX_POST_OBJECTS_PER_POST
    ? rows
    : rows.slice(0, MAX_POST_OBJECTS_PER_POST);
}

/** Sets author/permlink for insert rows (batched per post). */
export function bindPostObjectsToPost(
  objects: NewPostObject[],
  author: string,
  permlink: string,
): NewPostObject[] {
  return objects.map((o) => ({ ...o, author, permlink }));
}
