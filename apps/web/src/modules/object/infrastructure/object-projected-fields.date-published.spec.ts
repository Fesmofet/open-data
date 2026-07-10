import {
  formatDatePublishedDisplay,
  projectedDatePublished,
} from './object-projected-fields';
import type { ProjectedObjectView } from '@/modules/feed/application/dto/object-fields';

function view(fields: Record<string, unknown>): ProjectedObjectView {
  return {
    object_id: 'book-1',
    object_type: 'book',
    fields,
  } as ProjectedObjectView;
}

describe('projectedDatePublished', () => {
  it('reads trimmed datePublished text', () => {
    expect(projectedDatePublished(view({ datePublished: ' 2020-01-15 ' }))).toBe(
      '2020-01-15',
    );
  });

  it('returns null for empty or non-string values', () => {
    expect(projectedDatePublished(view({ datePublished: '   ' }))).toBeNull();
    expect(projectedDatePublished(view({ datePublished: 2020 }))).toBeNull();
    expect(projectedDatePublished(view({}))).toBeNull();
  });
});

describe('formatDatePublishedDisplay', () => {
  it('formats ISO dates like legacy Waivio MMMM DD, YYYY', () => {
    expect(formatDatePublishedDisplay('2020-01-15T00:00:00.000Z', 'en-US')).toBe(
      'January 15, 2020',
    );
  });

  it('returns raw text when not parseable', () => {
    expect(formatDatePublishedDisplay('TBD', 'en-US')).toBe('TBD');
  });
});
