import {
  formatProductSizeDisplay,
  projectedProductSize,
} from './object-projected-fields';
import type { ProjectedObjectView } from '@/modules/feed/application/dto/object-fields';

function view(fields: Record<string, unknown>): ProjectedObjectView {
  return {
    object_id: 'obj-1',
    object_type: 'product',
    fields,
  } as ProjectedObjectView;
}

describe('projectedProductSize', () => {
  it('reads single size object', () => {
    expect(
      projectedProductSize(
        view({
          size: { length: 11, width: 20, depth: 3, unit: 'μm' },
        }),
      ),
    ).toEqual({ length: 11, width: 20, depth: 3, unit: 'μm' });
  });

  it('returns null for invalid unit', () => {
    expect(
      projectedProductSize(
        view({
          size: { length: 1, width: 2, depth: 3, unit: 'invalid' },
        }),
      ),
    ).toBeNull();
  });
});

describe('formatProductSizeDisplay', () => {
  it('formats dimensions with unit', () => {
    expect(
      formatProductSizeDisplay({ length: 11, width: 20, depth: 3, unit: 'μm' }),
    ).toBe('11 x 20 x 3 μm');
  });
});
