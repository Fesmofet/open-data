import { matchCuratedRoutes } from './curated-routes';

describe('curated-routes', () => {
  it('matches knowledge api routing intent', () => {
    const hits = matchCuratedRoutes('how to use knowledge mcp');
    expect(hits[0]?.path).toBe('docs/skills/knowledge-api-routing.md');
    expect(hits[0]?.confidence).toBeGreaterThan(0);
  });

  it('matches hive signup intent', () => {
    const hits = matchCuratedRoutes('create hive account');
    expect(hits.some((h) => h.path === 'docs/skills/hive-account-signup.md')).toBe(true);
  });
});
