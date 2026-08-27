import { buildAutocompleteTsQuery, escapeTsqueryLexeme } from './search-fts.utils';

describe('escapeTsqueryLexeme', () => {
  it('lowercases alphanumeric tokens', () => {
    expect(escapeTsqueryLexeme('Oeb')).toBe('oeb');
  });

  it('quotes tokens with special characters', () => {
    expect(escapeTsqueryLexeme("Joe's")).toBe("'joe''s'");
  });
});

describe('buildAutocompleteTsQuery', () => {
  it('prefixes a single token', () => {
    expect(buildAutocompleteTsQuery('Oeb')).toBe('oeb:*');
  });

  it('prefixes every token for multi-word queries', () => {
    expect(buildAutocompleteTsQuery('Oeb Brea')).toBe('oeb:* & brea:*');
  });

  it('prefixes every token when the query is complete', () => {
    expect(buildAutocompleteTsQuery('Oeb Breakfast')).toBe('oeb:* & breakfast:*');
  });

  it('prefixes every token for partial multi-word queries', () => {
    expect(buildAutocompleteTsQuery('about waiv')).toBe('about:* & waiv:*');
  });

  it('returns null for empty input', () => {
    expect(buildAutocompleteTsQuery('')).toBeNull();
    expect(buildAutocompleteTsQuery('   ')).toBeNull();
  });

  it('splits hyphens so a trailing kebab dash is a valid tsquery', () => {
    expect(buildAutocompleteTsQuery('kvu-')).toBe('kvu:*');
  });

  it('treats hyphenated id fragments as separate FTS tokens', () => {
    expect(buildAutocompleteTsQuery('kvu-k')).toBe('kvu:* & k:*');
  });
});
