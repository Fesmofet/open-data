import { projectedPrintLength } from './object-projected-fields';
import type { ProjectedObjectView } from '@/modules/feed/application/dto/object-fields';

function view(fields: Record<string, unknown>): ProjectedObjectView {
  return {
    object_id: 'book-1',
    object_type: 'book',
    fields,
  } as ProjectedObjectView;
}

describe('projectedPrintLength', () => {
  it('reads trimmed printLength text', () => {
    expect(projectedPrintLength(view({ printLength: ' 320 ' }))).toBe('320');
  });

  it('returns null for empty or non-string values', () => {
    expect(projectedPrintLength(view({ printLength: '   ' }))).toBeNull();
    expect(projectedPrintLength(view({ printLength: 320 }))).toBeNull();
    expect(projectedPrintLength(view({}))).toBeNull();
  });
});
