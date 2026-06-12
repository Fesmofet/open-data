/**
 * Object id candidates from comment/post body (hashtags, `/object/slug`, including inside URLs).
 * Used by `parsePostObjectsForInsert` (root posts) and comment-driven object binding.
 *
 * @see docs/spec/data-model/post-json-metadata-objects.md
 */

/**
 * `#token` where token is word chars or hyphen.
 * Requires `#` at start of text or after whitespace / common markdown delimiters so URL
 * fragments (`…/page#nested-page`) are not treated as hashtags.
 */
export const RE_HASHTAGS = /(?:^|[\s([{"'])#([\w-]+)/g;

/** Relative or in-URL `/object/<object_id>` segments (same character class as post-objects index). */
export const OBJECT_PATH_BODY_RE = /\/object\/([a-z0-9._-]+)/gi;

const OBJECT_PATH_SLUG_RE = /\/object\/([a-z0-9._-]+)/i;

function uniqueNonEmpty(values: string[]): string[] {
  return [...new Set(values.filter((s) => s.length > 0))];
}

/** First `/object/<object_id>` slug in text (ignores URL hash fragments and nested paths). */
export function extractFirstObjectPathSlug(text: string): string | null {
  const m = OBJECT_PATH_SLUG_RE.exec(text.trim());
  const id = m?.[1]?.trim();
  return id || null;
}

export function extractHashtagObjectIdsFromBody(body: string): string[] {
  if (!body) {
    return [];
  }
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(RE_HASHTAGS);
  while ((m = re.exec(body)) !== null) {
    const token = m[1]?.trim();
    if (token) {
      out.push(token);
    }
  }
  return uniqueNonEmpty(out);
}

export function extractObjectPathSlugsFromBody(body: string): string[] {
  if (!body) {
    return [];
  }
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(OBJECT_PATH_BODY_RE);
  while ((m = re.exec(body)) !== null) {
    const id = m[1]?.trim();
    if (id) {
      out.push(id);
    }
  }
  return uniqueNonEmpty(out);
}

/**
 * All unique object id candidates from body text (hashtags + `/object/` matches, including in full URLs).
 */
export function extractObjectIdsFromCommentBody(body: string): string[] {
  return uniqueNonEmpty([
    ...extractHashtagObjectIdsFromBody(body),
    ...extractObjectPathSlugsFromBody(body),
  ]);
}
