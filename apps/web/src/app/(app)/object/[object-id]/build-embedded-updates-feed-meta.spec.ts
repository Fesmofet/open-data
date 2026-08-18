import { buildEmbeddedUpdatesFeedMeta } from './build-embedded-updates-feed-meta';
import type { ObjectPageViewModel } from '@/modules/object';

function minimalModel(overrides: Partial<ObjectPageViewModel> = {}): ObjectPageViewModel {
  return {
    objectId: 'obj-1',
    objectTypeKey: 'recipe',
    updateTypeCounts: {},
    updateLocales: ['ko-KR', 'en-US'],
    ...overrides,
  } as ObjectPageViewModel;
}

describe('buildEmbeddedUpdatesFeedMeta', () => {
  it('sets localeOptions from model.updateLocales sorted', () => {
    const meta = buildEmbeddedUpdatesFeedMeta(minimalModel(), {});
    expect(meta.localeOptions).toEqual(['en-US', 'ko-KR']);
  });

  it('returns empty localeOptions when model has no update locales', () => {
    const meta = buildEmbeddedUpdatesFeedMeta(
      minimalModel({ updateLocales: [] }),
      {},
    );
    expect(meta.localeOptions).toEqual([]);
  });
});
