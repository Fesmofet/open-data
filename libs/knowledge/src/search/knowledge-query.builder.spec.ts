import { buildAutocompleteTsQuery, escapeTsqueryLexeme } from './knowledge-query.builder';

describe('knowledge-query.builder', () => {
  it('builds single-token prefix query', () => {
    expect(buildAutocompleteTsQuery('routing')).toBe('routing:*');
  });

  it('builds multi-token AND prefix query', () => {
    expect(buildAutocompleteTsQuery('knowledge api rout')).toBe('knowledge & api & rout:*');
  });

  it('returns null for empty query', () => {
    expect(buildAutocompleteTsQuery('   ')).toBeNull();
  });

  it('quotes tokens with special characters', () => {
    expect(escapeTsqueryLexeme('café')).toBe("'café'");
  });
});
