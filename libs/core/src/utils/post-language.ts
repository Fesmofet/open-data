/**
 * Request locales are often full BCP 47 tags (e.g. `en-US`). `post_languages.language`
 * stores the primary subtag only (`en`), aligned with chain-indexer and mongo migration.
 */
export function normalizePostLanguageTag(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const bcp47 = trimmed.replace(/_/g, '-');

  try {
    const loc = new Intl.Locale(bcp47);
    const lang = loc.language;
    if (!lang || lang === 'und') {
      return null;
    }
    try {
      return Intl.getCanonicalLocales(lang)[0] ?? lang;
    } catch {
      return lang;
    }
  } catch {
    const first = bcp47.split('-')[0];
    if (!first) {
      return null;
    }
    try {
      return Intl.getCanonicalLocales(first)[0] ?? null;
    } catch {
      return null;
    }
  }
}

/** Expands locale tags for `post_languages` lookup (keeps original + primary subtag). */
export function expandPostLanguageTags(tags: readonly string[]): string[] {
  const out = new Set<string>();
  for (const raw of tags) {
    const trimmed = raw.trim();
    if (!trimmed) {
      continue;
    }
    out.add(trimmed);
    const primary = normalizePostLanguageTag(trimmed);
    if (primary) {
      out.add(primary);
    }
  }
  return [...out];
}
