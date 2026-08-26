import { UPDATE_REGISTRY } from '@opden-data-layer/core/update-registry';
import { UPDATE_TYPES } from '@opden-data-layer/core/update-types';

import type { ProjectedListItem } from '@/modules/object/domain/projected-list-item.types';

import {
  buildListSortCustomDisplayItems,
  initialListSortCustomFormValue,
  listSortCustomCommitIndex,
  listSortCustomPlaceholderIndexFromPointer,
  parseListSortCustomFormValue,
  reorderListSortCustomDisplayItems,
  resolveListSortCustomFormMode,
  snapshotAutoIncludeFromItems,
  switchListSortCustomFormMode,
  toggleListSortCustomItemIncluded,
} from './list-sort-custom-form-value';

const items: ProjectedListItem[] = [
  {
    objectId: 'page-a',
    objectType: 'page',
    name: 'Page A',
    imageUrl: null,
    weight: 10,
    addedAtUnix: 100,
  },
  {
    objectId: 'list-b',
    objectType: 'list',
    name: 'List B',
    imageUrl: null,
    weight: 1,
    addedAtUnix: 300,
  },
  {
    objectId: 'page-c',
    objectType: 'page',
    name: 'Page C',
    imageUrl: null,
    weight: 20,
    addedAtUnix: 200,
  },
];

describe('UPDATE_SORT_CUSTOM schema', () => {
  it('accepts sortType for auto and custom modes', () => {
    const definition = UPDATE_REGISTRY[UPDATE_TYPES.SORT_CUSTOM];
    const parsed = definition.schema.parse({
      include: [],
      exclude: ['page-a'],
      sortType: 'reverse_recency',
    });
    expect(parsed.sortType).toBe('reverse_recency');
  });
});

describe('list-sort-custom-form-value', () => {
  it('resolves custom mode when include is non-empty', () => {
    expect(
      resolveListSortCustomFormMode({
        include: ['page-a'],
        exclude: [],
        sortType: 'custom',
      }),
    ).toBe('custom');
  });

  it('resolves auto mode when include is empty', () => {
    expect(
      resolveListSortCustomFormMode({
        include: [],
        exclude: [],
        sortType: 'recency',
      }),
    ).toBe('auto');
  });

  it('seeds auto mode from existing sortCustom sortType', () => {
    expect(
      initialListSortCustomFormValue(items, {
        include: [],
        exclude: ['page-c'],
        sortType: 'reverse_recency',
      }),
    ).toEqual({
      include: [],
      exclude: ['page-c'],
      sortType: 'reverse_recency',
    });
  });

  it('seeds custom mode from non-empty include', () => {
    expect(
      initialListSortCustomFormValue(items, {
        include: ['page-a', 'list-b'],
        exclude: ['page-c'],
      }),
    ).toEqual({
      include: ['page-a', 'list-b'],
      exclude: ['page-c'],
      sortType: 'custom',
    });
  });

  it('defaults to custom mode with catalog include order when sortCustom is absent', () => {
    expect(initialListSortCustomFormValue(items, null)).toEqual({
      include: ['list-b', 'page-c', 'page-a'],
      exclude: [],
      sortType: 'custom',
    });
  });

  it('parses sortType from raw form value', () => {
    expect(
      parseListSortCustomFormValue({
        include: [],
        exclude: ['a'],
        sortType: 'by-name-asc',
      }),
    ).toEqual({
      include: [],
      exclude: ['a'],
      sortType: 'by-name-asc',
    });
  });

  it('builds auto display order by selected sortType', () => {
    const ordered = buildListSortCustomDisplayItems(
      items,
      { include: [], exclude: [], sortType: 'reverse_recency' },
      'auto',
    );
    expect(ordered.map((item) => item.objectId)).toEqual(['list-b', 'page-c', 'page-a']);
  });

  it('snapshots auto include when switching to custom', () => {
    expect(
      switchListSortCustomFormMode(
        items,
        { include: [], exclude: ['page-c'], sortType: 'reverse_recency' },
        'custom',
        'recency',
      ),
    ).toEqual({
      include: ['list-b', 'page-a'],
      exclude: ['page-c'],
      sortType: 'custom',
    });
  });

  it('clears include when switching to auto', () => {
    expect(
      switchListSortCustomFormMode(
        items,
        { include: ['page-a', 'list-b'], exclude: ['page-c'], sortType: 'custom' },
        'auto',
        'by-name-asc',
      ),
    ).toEqual({
      include: [],
      exclude: ['page-c'],
      sortType: 'by-name-asc',
    });
  });

  it('toggles exclude in auto mode without include', () => {
    expect(
      toggleListSortCustomItemIncluded(
        items,
        { include: [], exclude: [], sortType: 'recency' },
        'page-a',
        false,
      ),
    ).toEqual({
      include: [],
      exclude: ['page-a'],
      sortType: 'recency',
    });
  });

  it('updates include order in custom mode when unchecking', () => {
    expect(
      toggleListSortCustomItemIncluded(
        items,
        { include: ['page-a', 'list-b', 'page-c'], exclude: [], sortType: 'custom' },
        'list-b',
        false,
      ),
    ).toEqual({
      include: ['page-a', 'page-c'],
      exclude: ['list-b'],
      sortType: 'custom',
    });
  });

  it('snapshotAutoIncludeFromItems respects exclude', () => {
    expect(snapshotAutoIncludeFromItems(items, ['page-c'], 'by-name-asc')).toEqual([
      'list-b',
      'page-a',
    ]);
  });

  it('placeholderIndexFromPointer inserts before or after row midpoint', () => {
    expect(listSortCustomPlaceholderIndexFromPointer(100, 90, 2, 4)).toBe(2);
    expect(listSortCustomPlaceholderIndexFromPointer(100, 110, 2, 4)).toBe(3);
    expect(listSortCustomPlaceholderIndexFromPointer(100, 110, 3, 4)).toBe(4);
  });

  it('reorders last item to first via placeholder commit index', () => {
    const value = { include: items.map((i) => i.objectId), exclude: [], sortType: 'custom' as const };
    const fromIndex = 2;
    const placeholderIndex = 0;
    const next = reorderListSortCustomDisplayItems(
      items,
      value,
      fromIndex,
      listSortCustomCommitIndex(fromIndex, placeholderIndex),
    );
    expect(next.include).toEqual(['page-c', 'page-a', 'list-b']);
  });

  it('reorders first item to last via placeholder commit index', () => {
    const value = { include: items.map((i) => i.objectId), exclude: [], sortType: 'custom' as const };
    const fromIndex = 0;
    const placeholderIndex = items.length - 1;
    const next = reorderListSortCustomDisplayItems(
      items,
      value,
      fromIndex,
      listSortCustomCommitIndex(fromIndex, placeholderIndex),
    );
    expect(next.include).toEqual(['list-b', 'page-c', 'page-a']);
  });

  it('no-ops when placeholder maps to same slot', () => {
    const value = { include: items.map((i) => i.objectId), exclude: [], sortType: 'custom' as const };
    const fromIndex = 1;
    const next = reorderListSortCustomDisplayItems(
      items,
      value,
      fromIndex,
      listSortCustomCommitIndex(fromIndex, fromIndex),
    );
    expect(next.include).toEqual(value.include);
  });
});
