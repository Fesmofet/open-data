import { buildRoutingText } from './build-routing-text';

describe('buildRoutingText', () => {
  it('combines title, description, path slugs, and tags', () => {
    const text = buildRoutingText({
      title: 'Vote ingestion',
      description: 'Ingest Hive votes into Postgres.',
      path: 'docs/apps/chain-indexer/spec/vote-ingestion.md',
      tags: ['chain-indexer', 'votes'],
    });
    expect(text).toContain('Vote ingestion');
    expect(text).toContain('vote-ingestion');
    expect(text).toContain('chain-indexer');
  });
});
