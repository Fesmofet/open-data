import type { SearchObjectResult } from '@/modules/app-header/domain/search-response.schema';

import {
  MAX_POST_EDITOR_ATTACHED_OBJECTS,
  POST_EDITOR_OBJECTS_PERCENT_TOTAL,
  type PostEditorLinkedObject,
  type PostEditorMetadataObject,
  type PostEditorObjectsValidation,
} from '../domain/post-editor-linked-object';

type MetadataObjectEntry = {
  object_id?: unknown;
  author_permlink?: unknown;
  percent?: unknown;
};

function toObjectId(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) {
    return v.trim();
  }
  return null;
}

function toPercent(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) {
    return Math.round(Math.max(0, Math.min(POST_EDITOR_OBJECTS_PERCENT_TOTAL, v)));
  }
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n)
      ? Math.round(Math.max(0, Math.min(POST_EDITOR_OBJECTS_PERCENT_TOTAL, n)))
      : null;
  }
  return null;
}

function parseMetadataObjectsArray(raw: unknown): PostEditorMetadataObject[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: PostEditorMetadataObject[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const o = item as MetadataObjectEntry;
    const id = toObjectId(o.object_id) ?? toObjectId(o.author_permlink);
    const pct = toPercent(o.percent);
    if (!id || pct === null) {
      continue;
    }
    out.push({ object_id: id, percent: pct });
  }
  return out;
}

/** Reads `objects` from draft `jsonMetadata`. */
export function parseLinkedObjectsFromJsonMetadata(
  jsonMetadata: unknown,
): PostEditorLinkedObject[] {
  if (!jsonMetadata || typeof jsonMetadata !== 'object') {
    return [];
  }
  const raw = (jsonMetadata as Record<string, unknown>).objects;
  return parseMetadataObjectsArray(raw).map((o) => ({
    objectId: o.object_id,
    percent: o.percent,
  }));
}

/** Splits `POST_EDITOR_OBJECTS_PERCENT_TOTAL` across `count` items (integers, sum = 100). */
export function equalSplitPercents(count: number): number[] {
  if (count <= 0) {
    return [];
  }
  const base = Math.floor(POST_EDITOR_OBJECTS_PERCENT_TOTAL / count);
  let remainder = POST_EDITOR_OBJECTS_PERCENT_TOTAL - base * count;
  return Array.from({ length: count }, () => {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) {
      remainder -= 1;
    }
    return base + extra;
  });
}

/** Equal split across all linked objects (used on add/remove). */
export function withEqualPercents(
  objects: readonly PostEditorLinkedObject[],
): PostEditorLinkedObject[] {
  const percents = equalSplitPercents(objects.length);
  return objects.map((o, i) => ({ ...o, percent: percents[i] ?? 0 }));
}

/** Updates one linked object's percent only (0–100); others unchanged. */
export function applySliderPercent(
  objects: readonly PostEditorLinkedObject[],
  objectId: string,
  newPercent: number,
): PostEditorLinkedObject[] {
  const clamped = Math.round(
    Math.max(0, Math.min(POST_EDITOR_OBJECTS_PERCENT_TOTAL, newPercent)),
  );
  return objects.map((o) =>
    o.objectId === objectId ? { ...o, percent: clamped } : o,
  );
}

export function sumLinkedObjectPercents(
  objects: readonly PostEditorLinkedObject[],
): number {
  return objects.reduce((s, o) => s + o.percent, 0);
}

export function remainingPercentWeight(
  objects: readonly PostEditorLinkedObject[],
): number {
  return POST_EDITOR_OBJECTS_PERCENT_TOTAL - sumLinkedObjectPercents(objects);
}

export function validateLinkedObjectPercents(
  objects: readonly PostEditorLinkedObject[],
): PostEditorObjectsValidation {
  if (objects.length === 0) {
    return { ok: true };
  }
  const sum = sumLinkedObjectPercents(objects);
  if (sum > POST_EDITOR_OBJECTS_PERCENT_TOTAL) {
    return { ok: false, reason: 'sum_over_total' };
  }
  return { ok: true };
}

export function toMetadataObjects(
  objects: readonly PostEditorLinkedObject[],
): PostEditorMetadataObject[] {
  return objects.map((o) => ({
    object_id: o.objectId,
    percent: o.percent,
  }));
}

/** Merges `objects` into existing draft metadata without dropping other keys. */
export function mergeJsonMetadataWithObjects(
  jsonMetadata: unknown,
  objects: readonly PostEditorLinkedObject[],
): Record<string, unknown> {
  const base =
    jsonMetadata && typeof jsonMetadata === 'object' && !Array.isArray(jsonMetadata)
      ? { ...(jsonMetadata as Record<string, unknown>) }
      : {};
  if (objects.length === 0) {
    const { objects: _removed, ...rest } = base;
    return rest;
  }
  return {
    ...base,
    objects: toMetadataObjects(objects),
  };
}

/** Adds a linked object and redistributes percents equally across all. */
export function appendLinkedObjectIfAbsent(
  objects: readonly PostEditorLinkedObject[],
  result: SearchObjectResult,
): { objects: PostEditorLinkedObject[]; added: boolean } {
  const objectId = result.object_id.trim();
  if (!objectId) {
    return { objects: [...objects], added: false };
  }
  if (objects.some((o) => o.objectId === objectId)) {
    return { objects: [...objects], added: false };
  }
  if (objects.length >= MAX_POST_EDITOR_ATTACHED_OBJECTS) {
    return { objects: [...objects], added: false };
  }
  return {
    objects: withEqualPercents([...objects, { objectId, percent: 0 }]),
    added: true,
  };
}

/** Stable snapshot for autosave dirty checks. */
export function serializeLinkedObjectsForPersist(
  objects: readonly PostEditorLinkedObject[],
): string {
  return JSON.stringify(
    objects.map((o) => ({ object_id: o.objectId, percent: o.percent })),
  );
}
