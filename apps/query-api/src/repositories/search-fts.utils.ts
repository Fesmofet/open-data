/**
 * Builds a `to_tsquery` string for predictive search: all tokens AND-ed, each as a prefix (`:*`).
 * Example: "about waiv" → `about:* & waiv:*` (matches "About Waivio" via GIN on `search_vector`).
 */
export function buildAutocompleteTsQuery(queryText: string): string | null {
  const words = queryText
    .trim()
    .split(/[\s-]+/)
    .filter((w) => w.length > 0);
  if (words.length === 0) {
    return null;
  }

  const lexemes = words.map(escapeTsqueryLexeme);
  return lexemes.map((lexeme) => `${lexeme}:*`).join(' & ');
}

/** Quote or sanitize a single token for `to_tsquery`. */
export function escapeTsqueryLexeme(word: string): string {
  const normalized = word.toLowerCase();
  if (/^[a-z0-9_]+$/.test(normalized)) {
    return normalized;
  }
  const escaped = normalized.replace(/'/g, "''");
  return `'${escaped}'`;
}
