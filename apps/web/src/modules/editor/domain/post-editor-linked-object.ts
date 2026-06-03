/** Composite percent budget for explicit `json_metadata.objects` in the post editor. */
export const POST_EDITOR_OBJECTS_PERCENT_TOTAL = 100;

/** Same cap as `MAX_POST_OBJECTS_PER_POST` in `@opden-data-layer/core` (avoid core import in client UI). */
export const MAX_POST_EDITOR_ATTACHED_OBJECTS = 100;

/** Serialized entry in draft `jsonMetadata.objects`. */
export type PostEditorMetadataObject = {
  object_id: string;
  percent: number;
};

/** In-memory row for the attached-objects panel. */
export type PostEditorLinkedObject = {
  objectId: string;
  percent: number;
};

export type PostEditorObjectsValidation =
  | { ok: true }
  | { ok: false; reason: 'sum_over_total' | 'empty' };
