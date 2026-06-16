import { UPDATE_TYPES } from '@opden-data-layer/core/update-types';

import {
  getUpdateTypesForBlockKind,
  resolveUpdateTypeFilterForBlockKind,
} from './block-update-type-map';

describe('getUpdateTypesForBlockKind', () => {
  const supported = [
    UPDATE_TYPES.DESCRIPTION,
    UPDATE_TYPES.TELEPHONE,
    UPDATE_TYPES.TAG_CATEGORY,
    UPDATE_TYPES.TAG_CATEGORY_ITEM,
  ];

  it('returns camelCase update types filtered by supported list', () => {
    expect(getUpdateTypesForBlockKind('phones', supported)).toEqual([
      UPDATE_TYPES.TELEPHONE,
    ]);
    expect(getUpdateTypesForBlockKind('tags', supported)).toEqual([
      UPDATE_TYPES.TAG_CATEGORY_ITEM,
      UPDATE_TYPES.TAG_CATEGORY,
    ]);
  });

  it('returns aggregateRating when supported', () => {
    expect(
      getUpdateTypesForBlockKind('rating', [...supported, UPDATE_TYPES.AGGREGATE_RATING]),
    ).toEqual([UPDATE_TYPES.AGGREGATE_RATING]);
    expect(getUpdateTypesForBlockKind('rating', supported)).toEqual([]);
  });

  it('returns empty when type not supported for object', () => {
    expect(getUpdateTypesForBlockKind('geo', supported)).toEqual([]);
  });
});

describe('resolveUpdateTypeFilterForBlockKind', () => {
  const supported = [
    UPDATE_TYPES.TITLE,
    UPDATE_TYPES.TAG_CATEGORY,
    UPDATE_TYPES.TAG_CATEGORY_ITEM,
  ];

  it('returns the single supported type for one-to-one blocks', () => {
    expect(
      resolveUpdateTypeFilterForBlockKind('title', supported, { title: 2 }),
    ).toBe(UPDATE_TYPES.TITLE);
  });

  it('returns undefined when no supported types match the block', () => {
    expect(resolveUpdateTypeFilterForBlockKind('geo', supported, {})).toBeUndefined();
  });

  it('picks the tag type with the highest count', () => {
    expect(
      resolveUpdateTypeFilterForBlockKind('tags', supported, {
        [UPDATE_TYPES.TAG_CATEGORY]: 1,
        [UPDATE_TYPES.TAG_CATEGORY_ITEM]: 5,
      }),
    ).toBe(UPDATE_TYPES.TAG_CATEGORY_ITEM);
  });

  it('falls back to the first supported candidate when counts are tied at zero', () => {
    expect(
      resolveUpdateTypeFilterForBlockKind('tags', supported, {
        [UPDATE_TYPES.TAG_CATEGORY]: 0,
        [UPDATE_TYPES.TAG_CATEGORY_ITEM]: 0,
      }),
    ).toBe(UPDATE_TYPES.TAG_CATEGORY_ITEM);
  });
});
