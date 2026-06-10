import { inferMetadataFromPath, slugFromPath } from './infer-metadata-from-path';

describe('inferMetadataFromPath', () => {
  it('maps lessons and agents paths', () => {
    expect(inferMetadataFromPath('tasks/lessons.md')).toMatchObject({
      type: 'lesson',
      scope: 'platform',
    });
    expect(inferMetadataFromPath('apps/web/AGENTS.md')).toMatchObject({
      type: 'agents',
      scope: 'web',
    });
  });

  it('maps skills paths', () => {
    expect(inferMetadataFromPath('docs/skills/hive-create-account.md')).toMatchObject({
      type: 'skill',
      scope: 'platform',
    });
  });

  it('maps registry virtual paths', () => {
    expect(inferMetadataFromPath('registry/object-type/product.md')).toMatchObject({
      type: 'registry',
      scope: 'core',
      tags: ['object-type', 'product'],
    });
  });
});

describe('slugFromPath', () => {
  it('normalizes path to slug', () => {
    expect(slugFromPath('docs/apps/web/spec/i18n.md')).toBe(
      'docs-apps-web-spec-i18n',
    );
  });
});
