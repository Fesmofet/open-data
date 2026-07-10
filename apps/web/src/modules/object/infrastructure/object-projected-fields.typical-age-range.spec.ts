import { projectedTypicalAgeRange } from './object-projected-fields';
import type { ProjectedObjectView } from '@/modules/feed/application/dto/object-fields';

function view(fields: Record<string, unknown>): ProjectedObjectView {
  return {
    object_id: 'book-1',
    object_type: 'book',
    fields,
  } as ProjectedObjectView;
}

describe('projectedTypicalAgeRange', () => {
  it('reads trimmed typicalAgeRange text', () => {
    expect(projectedTypicalAgeRange(view({ typicalAgeRange: ' 18 ' }))).toBe('18');
  });

  it('returns null for empty or non-string values', () => {
    expect(projectedTypicalAgeRange(view({ typicalAgeRange: '   ' }))).toBeNull();
    expect(projectedTypicalAgeRange(view({ typicalAgeRange: 18 }))).toBeNull();
    expect(projectedTypicalAgeRange(view({}))).toBeNull();
  });
});
