import { KNOWLEDGE_IGNORE_SEGMENTS } from './knowledge.sources';
import { scanKnowledgeSourcePaths } from './scan-sources';

describe('scanKnowledgeSourcePaths', () => {
  it('excludes docs/standards/templates from the index', async () => {
    expect(KNOWLEDGE_IGNORE_SEGMENTS).toContain('templates');

    const paths = await scanKnowledgeSourcePaths(process.cwd());

    expect(paths.some((p) => p.split('/').includes('templates'))).toBe(false);
    expect(paths).not.toContain(
      'docs/standards/templates/object-create-playbook.md',
    );
  });
});
