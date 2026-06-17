/**
 * Build legacy `postAuthorPermlink` keys (`author_permlink`) from object `remove` update values (`author/permlink`).
 */
export function buildExcludedPostKeysFromRemoveUpdates(
  removeValues: readonly string[],
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of removeValues) {
    if (typeof raw !== 'string') {
      continue;
    }
    const trimmed = raw.trim();
    if (!trimmed) {
      continue;
    }
    const slash = trimmed.indexOf('/');
    if (slash <= 0 || slash >= trimmed.length - 1) {
      continue;
    }
    const author = trimmed.slice(0, slash).trim();
    const permlink = trimmed.slice(slash + 1).trim();
    if (!author || !permlink) {
      continue;
    }
    const key = `${author}_${permlink}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(key);
  }
  return out;
}

export function postKeyFromAuthorPermlink(
  author: string,
  permlink: string,
): string {
  return `${author}_${permlink}`;
}
