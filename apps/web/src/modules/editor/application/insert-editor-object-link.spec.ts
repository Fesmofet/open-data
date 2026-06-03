import { objectPagePath } from '@/shared/routes/object-page-path';

import {
  buildObjectLinkHref,
  objectLinkDisplayLabel,
} from './insert-editor-object-link';

describe('buildObjectLinkHref', () => {
  it('uses object page path when window is undefined', () => {
    expect(buildObjectLinkHref('author/slug')).toBe(
      objectPagePath('author/slug'),
    );
  });
});

describe('objectLinkDisplayLabel', () => {
  it('prefers name', () => {
    expect(
      objectLinkDisplayLabel({
        object_id: 'id',
        object_type: 'list',
        name: 'My List',
        image_url: null,
        parent_name: null,
      }),
    ).toBe('My List');
  });

  it('falls back to object_id', () => {
    expect(
      objectLinkDisplayLabel({
        object_id: 'id',
        object_type: 'list',
        name: null,
        image_url: null,
        parent_name: null,
      }),
    ).toBe('id');
  });
});
