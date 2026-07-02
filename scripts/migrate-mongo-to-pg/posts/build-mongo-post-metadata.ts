import type { MongoPost } from './types';
import { extractFirstObjectPathSlug } from '../../../libs/core/src/post-objects/comment-post-object-candidates';

interface LegacyMetadataWobject {
  author_permlink?: string;
  object_id?: string;
  percent?: number;
  object_type?: string;
}

/** Mongo exports may store `json_metadata` as a string or embedded object. */
export function parseMongoPostJsonMetadata(
  raw: unknown,
): Record<string, unknown> | null {
  if (raw == null) {
    return null;
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw !== 'string' || !raw.trim()) {
    return null;
  }
  try {
    const o = JSON.parse(raw) as unknown;
    if (o !== null && typeof o === 'object' && !Array.isArray(o)) {
      return o as Record<string, unknown>;
    }
  } catch {
    /* invalid */
  }
  return null;
}

export function serializeMongoPostJsonMetadata(raw: unknown): string {
  if (typeof raw === 'string') {
    return raw;
  }
  if (raw == null) {
    return '';
  }
  if (typeof raw === 'object') {
    return JSON.stringify(raw);
  }
  return String(raw);
}

function mapLegacyWobjectsToMetaObjects(
  entries: readonly LegacyMetadataWobject[],
): Array<{ object_id: string; percent: number }> {
  const out: Array<{ object_id: string; percent: number }> = [];
  for (const w of entries) {
    const objectId = w.author_permlink?.trim() || w.object_id?.trim();
    if (!objectId) {
      continue;
    }
    const percent =
      w.percent != null && Number.isFinite(Number(w.percent))
        ? Math.round(Number(w.percent))
        : 0;
    out.push({ object_id: objectId, percent });
  }
  return out;
}

function legacyWobjectsFromJsonMetadata(
  jm: Record<string, unknown>,
): LegacyMetadataWobject[] {
  const linked = jm['linkedObjects'];
  if (Array.isArray(linked) && linked.length > 0) {
    return linked as LegacyMetadataWobject[];
  }
  const wobj = jm['wobj'];
  if (wobj && typeof wobj === 'object' && !Array.isArray(wobj)) {
    const nested = (wobj as Record<string, unknown>)['wobjects'];
    if (Array.isArray(nested) && nested.length > 0) {
      return nested as LegacyMetadataWobject[];
    }
  }
  return [];
}

function collectTagStrings(doc: MongoPost, jm: Record<string, unknown> | null): string[] {
  const tagStrings: string[] = [];
  if (Array.isArray(doc.tags)) {
    for (const t of doc.tags) {
      if (typeof t === 'string' && t.trim()) {
        tagStrings.push(t.trim());
      }
    }
  }
  if (tagStrings.length === 0 && jm) {
    const nested = jm['tags'];
    if (Array.isArray(nested)) {
      for (const t of nested) {
        if (typeof t === 'string' && t.trim()) {
          tagStrings.push(t.trim());
        }
      }
    }
  }
  return tagStrings;
}

function collectLinkStrings(doc: MongoPost, jm: Record<string, unknown> | null): string[] {
  const links: string[] = [];
  const maybeAdd = (link: string): void => {
    const trimmed = link.trim();
    if (!trimmed || extractFirstObjectPathSlug(trimmed) === null) {
      return;
    }
    links.push(trimmed);
  };
  if (Array.isArray(doc.links)) {
    for (const link of doc.links) {
      if (typeof link === 'string') {
        maybeAdd(link);
      }
    }
  }
  if (jm) {
    const nested = jm['links'];
    if (Array.isArray(nested)) {
      for (const link of nested) {
        if (typeof link === 'string') {
          maybeAdd(link);
        }
      }
    }
  }
  return [...new Set(links)];
}

function collectMetaObjects(
  doc: MongoPost,
  jm: Record<string, unknown> | null,
): Array<{ object_id: string; percent: number }> {
  if (Array.isArray(doc.objects) && doc.objects.length > 0) {
    return mapLegacyWobjectsToMetaObjects(doc.objects);
  }
  if (Array.isArray(doc.wobjects) && doc.wobjects.length > 0) {
    return mapLegacyWobjectsToMetaObjects(doc.wobjects);
  }
  if (jm) {
    const nested = jm['objects'];
    if (Array.isArray(nested) && nested.length > 0) {
      return mapLegacyWobjectsToMetaObjects(nested as LegacyMetadataWobject[]);
    }
    const legacy = legacyWobjectsFromJsonMetadata(jm);
    if (legacy.length > 0) {
      return mapLegacyWobjectsToMetaObjects(legacy);
    }
  }
  return [];
}

/**
 * Builds a metadata object compatible with chain-indexer `parsePostObjectsForInsert`.
 * Prefers top-level `objects` / `tags`; falls back to legacy `wobjects`, Waivio
 * `linkedObjects` / `wobj.wobjects`, and `json_metadata` strings.
 */
export function buildMongoPostMetadataRecord(doc: MongoPost): Record<string, unknown> | null {
  const meta: Record<string, unknown> = {};
  const jm = parseMongoPostJsonMetadata(doc.json_metadata);

  const objects = collectMetaObjects(doc, jm);
  if (objects.length > 0) {
    meta.objects = objects;
  }

  const tagStrings = collectTagStrings(doc, jm);
  if (tagStrings.length > 0) {
    meta.tags = tagStrings;
  }

  const linkStrings = collectLinkStrings(doc, jm);
  if (linkStrings.length > 0) {
    meta.links = linkStrings;
  }

  if (Object.keys(meta).length === 0) {
    return null;
  }
  return meta;
}

function addLegacyWobjectTypes(
  m: Map<string, string | null>,
  entries: readonly LegacyMetadataWobject[],
): void {
  for (const w of entries) {
    const id = w.author_permlink?.trim() || w.object_id?.trim();
    if (!id) {
      continue;
    }
    m.set(id, w.object_type?.trim() ?? null);
  }
}

/** Denormalized `object_type` from Mongo `wobjects` and legacy json_metadata wobject arrays. */
export function objectTypeByIdFromLegacyWobjects(
  doc: MongoPost,
): Map<string, string | null> {
  const m = new Map<string, string | null>();
  addLegacyWobjectTypes(m, doc.wobjects ?? []);
  const jm = parseMongoPostJsonMetadata(doc.json_metadata);
  if (jm) {
    addLegacyWobjectTypes(m, legacyWobjectsFromJsonMetadata(jm));
    const nested = jm['objects'];
    if (Array.isArray(nested)) {
      addLegacyWobjectTypes(m, nested as LegacyMetadataWobject[]);
    }
  }
  return m;
}
