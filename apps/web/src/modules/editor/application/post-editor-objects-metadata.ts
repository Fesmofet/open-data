import {
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

/** Assigns equal percents to every linked object. */
export function withEqualPercents(
  objects: readonly PostEditorLinkedObject[],
): PostEditorLinkedObject[] {
  const percents = equalSplitPercents(objects.length);
  return objects.map((o, i) => ({ ...o, percent: percents[i] ?? 0 }));
}

/**
 * Sets one object's percent; reduces others proportionally so the sum stays 100.
 */
export function applySliderPercent(
  objects: readonly PostEditorLinkedObject[],
  objectId: string,
  newPercent: number,
): PostEditorLinkedObject[] {
  const targetIndex = objects.findIndex((o) => o.objectId === objectId);
  if (targetIndex < 0) {
    return [...objects];
  }

  let clamped = Math.round(
    Math.max(0, Math.min(POST_EDITOR_OBJECTS_PERCENT_TOTAL, newPercent)),
  );
  const others = objects.filter((o) => o.objectId !== objectId);
  if (others.length === 0) {
    return [{ ...objects[targetIndex], percent: clamped }];
  }

  let budgetForOthers = POST_EDITOR_OBJECTS_PERCENT_TOTAL - clamped;
  if (budgetForOthers < 0) {
    clamped = POST_EDITOR_OBJECTS_PERCENT_TOTAL;
    budgetForOthers = 0;
  }

  const otherPercents = distributeProportional(
    others.map((o) => o.percent),
    budgetForOthers,
  );

  let otherIdx = 0;
  return objects.map((o) => {
    if (o.objectId === objectId) {
      return { ...o, percent: clamped };
    }
    const percent = otherPercents[otherIdx] ?? 0;
    otherIdx += 1;
    return { ...o, percent };
  });
}

function distributeProportional(weights: readonly number[], targetSum: number): number[] {
  if (weights.length === 0) {
    return [];
  }
  if (targetSum <= 0) {
    return weights.map(() => 0);
  }

  const sumWeights = weights.reduce((s, w) => s + w, 0);
  if (sumWeights <= 0) {
    return equalSplitPercents(weights.length).map((p) =>
      Math.min(p, targetSum),
    );
  }

  const raw = weights.map((w) => (w / sumWeights) * targetSum);
  const floored = raw.map((v) => Math.floor(v));
  let remainder = targetSum - floored.reduce((s, v) => s + v, 0);

  const order = raw
    .map((v, i) => ({ i, frac: v - floored[i] }))
    .sort((a, b) => b.frac - a.frac);

  const out = [...floored];
  for (const { i } of order) {
    if (remainder <= 0) {
      break;
    }
    out[i] += 1;
    remainder -= 1;
  }
  return out;
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

/** Stable snapshot for autosave dirty checks. */
export function serializeLinkedObjectsForPersist(
  objects: readonly PostEditorLinkedObject[],
): string {
  return JSON.stringify(
    objects.map((o) => ({ object_id: o.objectId, percent: o.percent })),
  );
}
