import type { ProjectedObjectView } from '@/modules/feed/application/dto/object-fields';

import { projectedCategoryNames } from './object-projected-fields';

describe('projectedCategoryNames', () => {
  const view = (fields: Record<string, unknown>): ProjectedObjectView => ({
    object_id: 'obj-1',
    object_type: 'product',
    semantic_type: null,
    weight: null,
    fields,
    isFavorited: false,
    hasSupervisedOwnership: false,
    hasExclusiveOwnership: false,
  });

  it('returns trimmed non-empty strings in order', () => {
    expect(
      projectedCategoryNames(
        view({
          category: [' Electronics ', 'Laptops', ''],
        }),
      ),
    ).toEqual(['Electronics', 'Laptops']);
  });

  it('returns empty array when missing or invalid', () => {
    expect(projectedCategoryNames(view({}))).toEqual([]);
    expect(projectedCategoryNames(view({ category: 'not-array' }))).toEqual([]);
  });
});
