/**
 * Builds a `to_tsquery` string: all tokens AND-ed, last token is a prefix (`:*`).
 * Example: "knowledge api rout" → `knowledge & api & rout:*`
 */
export function buildAutocompleteTsQuery(queryText: string): string | null {
  const words = queryText
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  if (words.length === 0) {
    return null;
  }

  const lexemes = words.map(escapeTsqueryLexeme);
  if (lexemes.length === 1) {
    return `${lexemes[0]}:*`;
  }

  const last = lexemes[lexemes.length - 1]!;
  const rest = lexemes.slice(0, -1);
  return `${rest.join(' & ')} & ${last}:*`;
}

/** Quote or sanitize a single token for `to_tsquery`. */
export function escapeTsqueryLexeme(word: string): string {
  const normalized = word.toLowerCase();
  if (/^[a-z0-9_-]+$/.test(normalized)) {
    return normalized;
  }
  const escaped = normalized.replace(/'/g, "''");
  return `'${escaped}'`;
}
