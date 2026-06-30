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

  it('matches build tenant site intent', () => {
    const hits = matchCuratedRoutes('build tenant site');
    expect(hits[0]?.path).toBe('docs/skills/build-tenant-site.md');
    expect(hits[0]?.confidence).toBeGreaterThan(0);
  });

  it('matches create project intent', () => {
    const hits = matchCuratedRoutes('давай создадим проект');
    expect(hits[0]?.path).toBe('docs/skills/build-tenant-site.md');
    expect(hits[0]?.confidence).toBeGreaterThan(0);
  });
});
