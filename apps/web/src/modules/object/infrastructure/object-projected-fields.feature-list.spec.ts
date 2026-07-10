import { projectedFeatureListItems } from './object-projected-fields';
import type { ProjectedObjectView } from '@/modules/feed/application/dto/object-fields';

function view(fields: Record<string, unknown>): ProjectedObjectView {
  return {
    object_id: 'obj-1',
    object_type: 'product',
    fields,
  } as ProjectedObjectView;
}

describe('projectedFeatureListItems', () => {
  it('reads canonical key/value rows', () => {
    expect(
      projectedFeatureListItems(
        view({
          featureList: [
            { key: 'key1', value: 'value1' },
            { key: 'key2', value: 'value2' },
          ],
        }),
      ),
    ).toEqual([
      { key: 'key1', value: 'value1' },
      { key: 'key2', value: 'value2' },
    ]);
  });

  it('accepts legacy name/value rows', () => {
    expect(
      projectedFeatureListItems(
        view({
          featureList: [{ name: 'Color', value: 'Red' }],
        }),
      ),
    ).toEqual([{ key: 'Color', value: 'Red' }]);
  });

  it('skips rows missing key or value', () => {
    expect(
      projectedFeatureListItems(
        view({
          featureList: [{ key: 'Only key' }, { value: 'only value' }],
        }),
      ),
    ).toEqual([]);
  });
});
