import { objectPagePath } from '@/shared/routes/object-page-path';

/**
 * Appends the page object path so chain-indexer {@link extractHashtags} picks up the object id.
 * Skips when the body already references the object path or id token.
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

  const objectPath = objectPagePath(id);
  const lowerBody = trimmed.toLowerCase();
  const lowerPath = objectPath.toLowerCase();
  const lowerId = id.toLowerCase();

  if (lowerBody.includes(lowerPath) || lowerBody.includes(`/object/${lowerId}`)) {
    return trimmed;
  }

  if (trimmed === '') {
    return objectPath;
  }

  return `${trimmed}\n\n${objectPath}`;
}
