import { objectPagePath } from '@/shared/routes/object-page-path';

/** Leo `extractHashtags` only captures `#([\w-]+)` — ids with `.` need `/object/` fallback. */
const HASHTAG_SAFE_OBJECT_ID = /^[\w-]+$/;

function buildObjectAnchorSuffix(objectId: string): string {
  if (HASHTAG_SAFE_OBJECT_ID.test(objectId)) {
    return `#${objectId}`;
  }
  return objectPagePath(objectId);
}

function bodyAlreadyAnchorsObject(body: string, objectId: string): boolean {
  const lowerBody = body.toLowerCase();
  const lowerId = objectId.toLowerCase();

  return (
    lowerBody.includes(`#${lowerId}`) ||
    lowerBody.includes(objectPagePath(objectId).toLowerCase()) ||
    lowerBody.includes(`/object/${lowerId}`)
  );
}

/**
 * Appends an object anchor so chain-indexer {@link extractHashtags} indexes the object id.
 * Prefers `#object_id` for word-safe ids; falls back to `/object/{id}` when the id contains `.`.
 * Skips when the body already references the object.
 */
export function appendObjectAnchorToThreadBody(
  body: string,
  objectId: string,
): string {
  const trimmed = body.trim();
  const id = objectId.trim();
  if (!id) {
    return trimmed;
  }

  if (bodyAlreadyAnchorsObject(trimmed, id)) {
    return trimmed;
  }

  const anchor = buildObjectAnchorSuffix(id);
  if (trimmed === '') {
    return anchor;
  }

  return `${trimmed}\n\n${anchor}`;
}
