import {
  OBJECT_PAGE_CATEGORY_NAME_PARAM,
  OBJECT_PAGE_CATEGORY_PATH_SEGMENT,
} from '@/modules/object/domain/object-page-url.constants';
import {
  OBJECT_PAGE_DESCRIPTION_SEGMENT,
  OBJECT_PAGE_PRIMARY_TAB_PARAM,
  OBJECT_PAGE_VIEW_PATH_PARAM,
  resolveCategoryNameForObjectPage,
  resolveCategoryNameFromObjectUrl,
  resolveGalleryAlbumForObjectPage,
  resolveGalleryAlbumFromObjectUrl,
  resolveDefaultPrimarySegmentFromLanding,
  resolvePrimarySegmentForObjectPage,
  resolvePrimarySegmentFromObjectUrl,
  sanitizeNestedStack,
} from './object-page-search';

describe('resolvePrimarySegmentForObjectPage', () => {
  const objectId = 'test-obj';
  const base = `/object/${encodeURIComponent(objectId)}`;

  it('returns explicit path segment reviews', () => {
    expect(
      resolvePrimarySegmentForObjectPage(
        objectId,
        `${base}/reviews`,
        new URLSearchParams(),
        '',
      ),
    ).toBe('reviews');
  });

  it('returns explicit path segment description', () => {
    expect(
      resolvePrimarySegmentForObjectPage(
        objectId,
        `${base}/description`,
        new URLSearchParams(),
        '',
      ),
    ).toBe(OBJECT_PAGE_DESCRIPTION_SEGMENT);
  });

  it('returns explicit path segment gallery', () => {
    expect(
      resolvePrimarySegmentForObjectPage(
        objectId,
        `${base}/gallery`,
        new URLSearchParams(),
        '',
      ),
    ).toBe('gallery');
  });

  it('returns explicit path segment experts', () => {
    expect(
      resolvePrimarySegmentForObjectPage(
        objectId,
        `${base}/experts`,
        new URLSearchParams(),
        '',
      ),
    ).toBe('experts');
  });

  it('returns explicit ?tab= over default landing', () => {
    const sp = new URLSearchParams();
    sp.set(OBJECT_PAGE_PRIMARY_TAB_PARAM, 'updates');
    expect(resolvePrimarySegmentForObjectPage(objectId, base, sp, 'reviews')).toBe('updates');
  });

  it('returns empty segment when ?path= is present on clean pathname', () => {
    const sp = new URLSearchParams();
    sp.set(OBJECT_PAGE_VIEW_PATH_PARAM, 'nested-list');
    expect(resolvePrimarySegmentForObjectPage(objectId, base, sp, 'reviews')).toBe('');
  });

  it('falls back to default landing segment on clean URL', () => {
    expect(
      resolvePrimarySegmentForObjectPage(objectId, base, new URLSearchParams(), 'reviews'),
    ).toBe('reviews');
  });

  it('falls back to empty segment on clean URL for nested default landing', () => {
    expect(
      resolvePrimarySegmentForObjectPage(objectId, base, new URLSearchParams(), ''),
    ).toBe('');
  });
});

describe('resolveDefaultPrimarySegmentFromLanding', () => {
  const tabs = ['reviews', 'updates', 'gallery'] as const;

  it('maps primaryTab reviews', () => {
    expect(
      resolveDefaultPrimarySegmentFromLanding({ kind: 'primaryTab', segment: 'reviews' }, tabs),
    ).toBe('reviews');
  });

  it('maps primaryTab description', () => {
    expect(
      resolveDefaultPrimarySegmentFromLanding(
        { kind: 'primaryTab', segment: 'description' },
        tabs,
      ),
    ).toBe(OBJECT_PAGE_DESCRIPTION_SEGMENT);
  });

  it('maps routeStub to reviews when tab exists', () => {
    expect(
      resolveDefaultPrimarySegmentFromLanding(
        { kind: 'routeStub', segment: 'blog', ref: 'alice' },
        tabs,
      ),
    ).toBe('reviews');
  });

  it('returns empty for hostContent', () => {
    expect(
      resolveDefaultPrimarySegmentFromLanding({ kind: 'hostContent' }, tabs),
    ).toBe('');
  });
});

describe('resolvePrimarySegmentFromObjectUrl', () => {
  it('returns empty for bare object path', () => {
    expect(
      resolvePrimarySegmentFromObjectUrl('abc', '/object/abc', new URLSearchParams()),
    ).toBe('');
  });

  it('returns gallery for album drill-down path', () => {
    expect(
      resolvePrimarySegmentFromObjectUrl(
        'abc',
        '/object/abc/gallery/album/Photos',
        new URLSearchParams(),
      ),
    ).toBe('gallery');
  });

  it('returns category for category feed path', () => {
    expect(
      resolvePrimarySegmentFromObjectUrl(
        'abc',
        `/object/abc/${OBJECT_PAGE_CATEGORY_PATH_SEGMENT}/Active%20Skirts`,
        new URLSearchParams(),
      ),
    ).toBe(OBJECT_PAGE_CATEGORY_PATH_SEGMENT);
  });
});

describe('resolveCategoryNameFromObjectUrl', () => {
  const objectId = 'test-obj';
  const base = `/object/${encodeURIComponent(objectId)}`;

  it('decodes category name from path', () => {
    expect(
      resolveCategoryNameFromObjectUrl(
        objectId,
        `${base}/${OBJECT_PAGE_CATEGORY_PATH_SEGMENT}/${encodeURIComponent('Active Skirts')}`,
      ),
    ).toBe('Active Skirts');
  });

  it('returns null for unrelated paths', () => {
    expect(resolveCategoryNameFromObjectUrl(objectId, `${base}/reviews`)).toBeNull();
  });
});

describe('resolveCategoryNameForObjectPage', () => {
  const objectId = 'test-obj';
  const base = `/object/${encodeURIComponent(objectId)}`;

  it('prefers pathname over query param', () => {
    const sp = new URLSearchParams();
    sp.set(OBJECT_PAGE_CATEGORY_NAME_PARAM, encodeURIComponent('Other'));
    expect(
      resolveCategoryNameForObjectPage(
        objectId,
        `${base}/${OBJECT_PAGE_CATEGORY_PATH_SEGMENT}/${encodeURIComponent('Active Skirts')}`,
        sp,
      ),
    ).toBe('Active Skirts');
  });

  it('falls back to query param when pathname has no category', () => {
    const sp = new URLSearchParams();
    sp.set(OBJECT_PAGE_CATEGORY_NAME_PARAM, encodeURIComponent('Skirts'));
    expect(resolveCategoryNameForObjectPage(objectId, base, sp)).toBe('Skirts');
  });
});

describe('resolveGalleryAlbumFromObjectUrl', () => {
  const objectId = 'test-obj';
  const base = `/object/${encodeURIComponent(objectId)}`;

  it('returns null on albums list path', () => {
    expect(resolveGalleryAlbumFromObjectUrl(objectId, `${base}/gallery`)).toBeNull();
  });

  it('decodes album name from path', () => {
    expect(
      resolveGalleryAlbumFromObjectUrl(objectId, `${base}/gallery/album/Photos`),
    ).toBe('Photos');
  });

  it('decodes encoded album names', () => {
    expect(
      resolveGalleryAlbumFromObjectUrl(
        objectId,
        `${base}/gallery/album/${encodeURIComponent('My album')}`,
      ),
    ).toBe('My album');
  });

  it('returns null for unrelated paths', () => {
    expect(resolveGalleryAlbumFromObjectUrl(objectId, `${base}/reviews`)).toBeNull();
  });
});

describe('resolveGalleryAlbumForObjectPage', () => {
  const objectId = 'test-obj';
  const base = `/object/${encodeURIComponent(objectId)}`;

  it('prefers pathname over query param', () => {
    const sp = new URLSearchParams();
    sp.set('gallery_album', 'Other');
    expect(
      resolveGalleryAlbumForObjectPage(
        objectId,
        `${base}/gallery/album/Photos`,
        sp,
      ),
    ).toBe('Photos');
  });

  it('falls back to query param when pathname has no album', () => {
    const sp = new URLSearchParams();
    sp.set('gallery_album', encodeURIComponent('Menu shots'));
    expect(resolveGalleryAlbumForObjectPage(objectId, `${base}/gallery`, sp)).toBe(
      'Menu shots',
    );
  });
});

describe('sanitizeNestedStack', () => {
  it('returns empty stack when path ids were requested but nothing resolved', () => {
    expect(sanitizeNestedStack(['a', 'b'], [])).toEqual([]);
  });

  it('keeps stack when it matches path prefix', () => {
    const stack = [
      {
        objectId: 'a',
        name: 'A',
        objectType: 'list' as const,
        listItems: [],
        listItemsSortCustom: null,
        pageContentHtml: null,
      },
    ];
    expect(sanitizeNestedStack(['a'], stack)).toEqual(stack);
  });

  it('returns empty when stack ids do not match requested path', () => {
    const stack = [
      {
        objectId: 'wrong',
        name: 'X',
        objectType: 'list' as const,
        listItems: [],
        listItemsSortCustom: null,
        pageContentHtml: null,
      },
    ];
    expect(sanitizeNestedStack(['a'], stack)).toEqual([]);
  });
});
