import type {
  CatalogListSortType,
  ProjectedListItem,
  ProjectedSortCustom,
} from '@/modules/object/domain/projected-list-item.types';
import { sortListItemsByCatalogType } from '@/modules/object/infrastructure/object-projected-fields';

export const LIST_SORT_CUSTOM_AUTO_TYPES = [
  'recency',
  'reverse_recency',
  'by-name-asc',
  'by-name-desc',
] as const;

export type ListSortCustomAutoSortType = (typeof LIST_SORT_CUSTOM_AUTO_TYPES)[number];

export type ListSortCustomFormSortType = 'custom' | ListSortCustomAutoSortType;

export type ListSortCustomFormValue = {
  include: string[];
  exclude: string[];
  sortType?: ListSortCustomFormSortType;
};

export type ListSortCustomFormMode = 'auto' | 'custom';

export function isListSortCustomAutoSortType(
  value: string | undefined,
): value is ListSortCustomAutoSortType {
  return (
    value !== undefined &&
    (LIST_SORT_CUSTOM_AUTO_TYPES as readonly string[]).includes(value)
  );
}

export function defaultListSortCustomAutoSortType(): ListSortCustomAutoSortType {
  return 'recency';
}

function isListObjectType(objectType: string): boolean {
  return objectType.trim() === 'list';
}

/** Default custom include: nested lists first, then weight desc, then name. */
export function defaultListSortCustomInclude(
  listItems: readonly ProjectedListItem[],
): string[] {
  return [...listItems]
    .sort((a, b) => {
      const listDelta =
        Number(isListObjectType(b.objectType)) - Number(isListObjectType(a.objectType));
      if (listDelta !== 0) {
        return listDelta;
      }
      const weightA = a.weight ?? 0;
      const weightB = b.weight ?? 0;
      if (weightB !== weightA) {
        return weightB - weightA;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    })
    .map((item) => item.objectId);
}

export function defaultListSortCustomFormValue(
  listItems: readonly ProjectedListItem[],
): ListSortCustomFormValue {
  return {
    include: defaultListSortCustomInclude(listItems),
    exclude: [],
    sortType: 'custom',
  };
}

export function resolveListSortCustomFormMode(
  value: ListSortCustomFormValue,
): ListSortCustomFormMode {
  if (value.sortType === 'custom' || value.include.length > 0) {
    return 'custom';
  }
  return 'auto';
}

export function parseListSortCustomFormValue(value: unknown): ListSortCustomFormValue {
  if (typeof value !== 'object' || value === null) {
    return { include: [], exclude: [] };
  }
  const record = value as Record<string, unknown>;
  const include = Array.isArray(record.include)
    ? record.include.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    : [];
  const exclude = Array.isArray(record.exclude)
    ? record.exclude.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    : [];
  const sortTypeRaw = typeof record.sortType === 'string' ? record.sortType : undefined;
  const sortType =
    sortTypeRaw === 'custom' || isListSortCustomAutoSortType(sortTypeRaw)
      ? sortTypeRaw
      : undefined;
  return {
    include,
    exclude,
    ...(sortType ? { sortType } : {}),
  };
}

/** Rows for the modal: custom uses include order + trailing items; auto uses catalog sort. */
export function buildListSortCustomDisplayItems(
  listItems: readonly ProjectedListItem[],
  value: ListSortCustomFormValue,
  mode: ListSortCustomFormMode,
): ProjectedListItem[] {
  const byId = new Map(listItems.map((item) => [item.objectId, item]));
  if (mode === 'custom') {
    const ordered: ProjectedListItem[] = [];
    const seen = new Set<string>();
    for (const id of value.include) {
      const item = byId.get(id);
      if (item) {
        ordered.push(item);
        seen.add(id);
      }
    }
    for (const item of listItems) {
      if (!seen.has(item.objectId)) {
        ordered.push(item);
      }
    }
    return ordered;
  }

  const autoSort: CatalogListSortType = isListSortCustomAutoSortType(value.sortType)
    ? value.sortType
    : defaultListSortCustomAutoSortType();
  return sortListItemsByCatalogType([...listItems], autoSort);
}

export function snapshotAutoIncludeFromItems(
  listItems: readonly ProjectedListItem[],
  exclude: readonly string[],
  autoSort: ListSortCustomAutoSortType,
): string[] {
  const excludeSet = new Set(exclude);
  return sortListItemsByCatalogType([...listItems], autoSort)
    .filter((item) => !excludeSet.has(item.objectId))
    .map((item) => item.objectId);
}

export function initialListSortCustomFormValue(
  listItems: readonly ProjectedListItem[],
  sortCustom?: ProjectedSortCustom | null,
): ListSortCustomFormValue {
  const exclude = sortCustom?.exclude?.filter(Boolean) ?? [];
  const includeRaw = sortCustom?.include?.filter(Boolean) ?? [];

  if (sortCustom?.sortType === 'custom' || includeRaw.length > 0) {
    return {
      include: [...includeRaw],
      exclude: [...exclude],
      sortType: 'custom',
    };
  }

  if (isListSortCustomAutoSortType(sortCustom?.sortType)) {
    return {
      include: [],
      exclude: [...exclude],
      sortType: sortCustom.sortType,
    };
  }

  return {
    include: defaultListSortCustomInclude(listItems),
    exclude: [...exclude],
    sortType: 'custom',
  };
}

export function switchListSortCustomFormMode(
  listItems: readonly ProjectedListItem[],
  value: ListSortCustomFormValue,
  nextMode: ListSortCustomFormMode,
  lastAutoSort: ListSortCustomAutoSortType,
): ListSortCustomFormValue {
  if (nextMode === 'custom') {
    const autoSort = isListSortCustomAutoSortType(value.sortType)
      ? value.sortType
      : lastAutoSort;
    return {
      include: snapshotAutoIncludeFromItems(listItems, value.exclude, autoSort),
      exclude: [...value.exclude],
      sortType: 'custom',
    };
  }

  const autoSort = isListSortCustomAutoSortType(value.sortType)
    ? value.sortType
    : lastAutoSort;
  return {
    include: [],
    exclude: [...value.exclude],
    sortType: autoSort,
  };
}

export function toggleListSortCustomItemIncluded(
  listItems: readonly ProjectedListItem[],
  value: ListSortCustomFormValue,
  objectId: string,
  included: boolean,
): ListSortCustomFormValue {
  const excludeSet = new Set(value.exclude);
  const mode = resolveListSortCustomFormMode(value);

  if (included) {
    excludeSet.delete(objectId);
  } else {
    excludeSet.add(objectId);
  }
  const exclude = [...excludeSet];

  if (mode === 'auto') {
    const autoSort = isListSortCustomAutoSortType(value.sortType)
      ? value.sortType
      : defaultListSortCustomAutoSortType();
    return { include: [], exclude, sortType: autoSort };
  }

  const display = buildListSortCustomDisplayItems(listItems, value, 'custom');
  const include = display
    .filter((item) => !excludeSet.has(item.objectId))
    .map((item) => item.objectId);
  return { include, exclude, sortType: 'custom' };
}

export function reorderListSortCustomDisplayItems(
  listItems: readonly ProjectedListItem[],
  value: ListSortCustomFormValue,
  fromIndex: number,
  toIndex: number,
): ListSortCustomFormValue {
  const display = [...buildListSortCustomDisplayItems(listItems, value, 'custom')];
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= display.length ||
    toIndex >= display.length ||
    fromIndex === toIndex
  ) {
    return value;
  }
  const [moved] = display.splice(fromIndex, 1);
  display.splice(toIndex, 0, moved);

  const excludeSet = new Set(value.exclude);
  const include = display
    .filter((item) => !excludeSet.has(item.objectId))
    .map((item) => item.objectId);

  return { include, exclude: [...value.exclude], sortType: 'custom' };
}

/** Insert index in the visible list (source row removed), clamped to `0..visibleLength`. */
export function listSortCustomPlaceholderIndexFromPointer(
  rowMidY: number,
  clientY: number,
  visibleRowIndex: number,
  visibleLength: number,
): number {
  const insertAfter = clientY >= rowMidY;
  const raw = visibleRowIndex + (insertAfter ? 1 : 0);
  return Math.max(0, Math.min(raw, visibleLength));
}

/** Maps visible placeholder index to `reorderListSortCustomDisplayItems` `toIndex`. */
export function listSortCustomCommitIndex(
  _sourceIndex: number,
  placeholderIndex: number,
): number {
  return placeholderIndex;
}
