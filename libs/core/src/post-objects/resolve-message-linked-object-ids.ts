import { extractObjectIdsFromCommentBody } from './comment-post-object-candidates';

/** Max linked objects stored on a single object-channel message. */
export const MAX_MESSAGE_LINKED_OBJECT_IDS = 20;

export function resolveMessageLinkedObjectIds(input: {
  body: string | null | undefined;
  nativeObjectId: string | null | undefined;
  existingObjectIds: ReadonlySet<string> | readonly string[];
}): string[] {
  const body = input.body?.trim() ?? '';
  if (body.length === 0) {
    return [];
  }

  const existing =
    input.existingObjectIds instanceof Set
      ? input.existingObjectIds
      : new Set(input.existingObjectIds);

  const native = input.nativeObjectId?.trim() ?? '';
  const candidates = extractObjectIdsFromCommentBody(body);
  const out: string[] = [];

  for (const id of candidates) {
    if (id === native) {
      continue;
    }
    if (!existing.has(id)) {
      continue;
    }
    if (out.includes(id)) {
      continue;
    }
    out.push(id);
    if (out.length >= MAX_MESSAGE_LINKED_OBJECT_IDS) {
      break;
    }
  }

  return out;
}
