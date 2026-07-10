import {
  formatProductWeightDisplay,
  projectedProductWeight,
} from './object-projected-fields';
import type { ProjectedObjectView } from '@/modules/feed/application/dto/object-fields';

function view(fields: Record<string, unknown>): ProjectedObjectView {
  return {
    object_id: 'obj-1',
    object_type: 'product',
    fields,
  } as ProjectedObjectView;
}

describe('projectedProductWeight', () => {
  it('reads single productWeight object', () => {
    expect(
      projectedProductWeight(
        view({
          productWeight: { value: 12, unit: 'st' },
        }),
      ),
    ).toEqual({ value: 12, unit: 'st' });
  });

  it('returns null for invalid unit', () => {
    expect(
      projectedProductWeight(
        view({
          productWeight: { value: 12, unit: 'invalid' },
        }),
      ),
    ).toBeNull();
  });
});

describe('formatProductWeightDisplay', () => {
  it('formats value and unit', () => {
    expect(formatProductWeightDisplay({ value: 12, unit: 'st' })).toBe('12 st');
  });
});
