/** Min trimmed query length for btree/LIKE prefix on object_id, name/title, identifier, locality. */
export const SEARCH_PREFIX_MIN_LENGTH = 3;

/** Enable prefix match (`>= prefix AND < upper` or `LIKE prefix%`) when trim(q) has enough chars. */
export function shouldSearchPrefix(q: string): boolean {
  return q.trim().length >= SEARCH_PREFIX_MIN_LENGTH;
}

/**
 * Prefix range upper bound for btree `col >= prefix AND col < upper`.
 * ASCII increment on last code unit (Hive account names; kebab `object_id` only with `COLLATE "C"` —
 * locale collations treat `-` and `.` as equal, so `kvu-` → `kvu.` is an empty range).
 */
export function prefixUpperBound(prefix: string): string {
  if (prefix.length === 0) {
    return prefix;
  }
  const last = prefix.charCodeAt(prefix.length - 1);
  if (last >= 0xffff) {
    return `${prefix}\uffff`;
  }
  return prefix.slice(0, -1) + String.fromCharCode(last + 1);
}

/** Enable expensive `object_id ILIKE '%q%'` only for id-shaped queries. */
export function shouldSearchObjectIdSubstring(q: string): boolean {
  const t = q.trim();
  return t.length >= 8 && t.includes('-');
}
