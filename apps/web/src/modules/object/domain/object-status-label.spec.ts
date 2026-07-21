import {
  objectStatusLabelKey,
  shouldShowObjectStatusBadge,
} from './object-status-label';

describe('objectStatusLabelKey', () => {
  it('maps closed to permanently closed for business types', () => {
    expect(objectStatusLabelKey('closed', 'business')).toBe(
      'object_status_permanently_closed',
    );
    expect(objectStatusLabelKey('closed', 'restaurant')).toBe(
      'object_status_permanently_closed',
    );
  });

  it('maps closed to discontinued for product types', () => {
    expect(objectStatusLabelKey('closed', 'product')).toBe(
      'object_status_discontinued',
    );
    expect(objectStatusLabelKey('closed', 'service')).toBe(
      'object_status_discontinued',
    );
  });

  it('maps privacy_erasure and legacy statuses', () => {
    expect(objectStatusLabelKey('privacy_erasure')).toBe(
      'object_status_privacy_erasure',
    );
    expect(objectStatusLabelKey('unavailable')).toBe('unavailable');
  });
});

describe('shouldShowObjectStatusBadge', () => {
  it('hides active and shows non-active', () => {
    expect(shouldShowObjectStatusBadge('active')).toBe(false);
    expect(shouldShowObjectStatusBadge('closed')).toBe(true);
    expect(shouldShowObjectStatusBadge(null)).toBe(false);
  });
});
