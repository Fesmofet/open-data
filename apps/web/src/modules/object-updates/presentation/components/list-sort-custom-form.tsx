'use client';

import { useMemo, useRef, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import type { ProjectedListItem } from '@/modules/object/domain/projected-list-item.types';

import {
  buildListSortCustomDisplayItems,
  defaultListSortCustomAutoSortType,
  isListSortCustomAutoSortType,
  LIST_SORT_CUSTOM_AUTO_TYPES,
  listSortCustomCommitIndex,
  listSortCustomPlaceholderIndexFromPointer,
  parseListSortCustomFormValue,
  reorderListSortCustomDisplayItems,
  resolveListSortCustomFormMode,
  switchListSortCustomFormMode,
  toggleListSortCustomItemIncluded,
  type ListSortCustomAutoSortType,
  type ListSortCustomFormMode,
  type ListSortCustomFormValue,
} from '../../application/list-sort-custom-form-value';

export type ListSortCustomFormProps = {
  value: unknown;
  onChange: (value: ListSortCustomFormValue) => void;
  listItems: readonly ProjectedListItem[];
  hideLegend?: boolean;
  label?: string;
};

const AUTO_SORT_I18N: Record<ListSortCustomAutoSortType, string> = {
  reverse_recency: 'catalog_sort_newest',
  recency: 'catalog_sort_oldest',
  'by-name-asc': 'catalog_sort_az',
  'by-name-desc': 'catalog_sort_za',
};

const ROW_CLASS =
  'flex min-h-[2.75rem] items-center gap-3 rounded-btn border border-border bg-bg px-3 py-2';

export function ListSortCustomForm({
  value,
  onChange,
  listItems,
  hideLegend = false,
  label,
}: ListSortCustomFormProps) {
  const { t } = useI18n();
  const parsed = parseListSortCustomFormValue(value);
  const mode = resolveListSortCustomFormMode(parsed);
  const lastAutoSortRef = useRef<ListSortCustomAutoSortType>(
    isListSortCustomAutoSortType(parsed.sortType)
      ? parsed.sortType
      : defaultListSortCustomAutoSortType(),
  );
  if (isListSortCustomAutoSortType(parsed.sortType)) {
    lastAutoSortRef.current = parsed.sortType;
  }

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [sourceIndex, setSourceIndex] = useState(-1);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const displayItems = useMemo(
    () => buildListSortCustomDisplayItems(listItems, parsed, mode),
    [listItems, parsed, mode],
  );

  const visibleItems = useMemo(() => {
    if (!draggingId || mode !== 'custom') {
      return displayItems;
    }
    return displayItems.filter((item) => item.objectId !== draggingId);
  }, [displayItems, draggingId, mode]);

  const heading = hideLegend ? null : (
    <span className="font-weight-label text-fg">{label ?? t('object_field_sortCustom')}</span>
  );

  function emit(next: ListSortCustomFormValue) {
    onChange(next);
  }

  function onModeChange(nextMode: ListSortCustomFormMode) {
    emit(
      switchListSortCustomFormMode(listItems, parsed, nextMode, lastAutoSortRef.current),
    );
  }

  function onAutoSortChange(nextSort: ListSortCustomAutoSortType) {
    lastAutoSortRef.current = nextSort;
    emit({ include: [], exclude: [...parsed.exclude], sortType: nextSort });
  }

  function onToggleIncluded(objectId: string, checked: boolean) {
    emit(toggleListSortCustomItemIncluded(listItems, parsed, objectId, checked));
  }

  function resetDragState() {
    setDraggingId(null);
    setSourceIndex(-1);
    setPlaceholderIndex(0);
  }

  function onDragStart(
    event: React.DragEvent<HTMLLIElement>,
    objectId: string,
    fromIndex: number,
  ) {
    if (mode !== 'custom') {
      return;
    }
    const row = event.currentTarget;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', objectId);
    const rect = row.getBoundingClientRect();
    event.dataTransfer.setDragImage(
      row,
      event.clientX - rect.left,
      event.clientY - rect.top,
    );
    setSourceIndex(fromIndex);
    setPlaceholderIndex(fromIndex);
    requestAnimationFrame(() => {
      setDraggingId(objectId);
    });
  }

  function onDragOverRow(event: React.DragEvent<HTMLLIElement>, visibleRowIndex: number) {
    if (mode !== 'custom' || !draggingId) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const rect = event.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setPlaceholderIndex(
      listSortCustomPlaceholderIndexFromPointer(
        midY,
        event.clientY,
        visibleRowIndex,
        visibleItems.length,
      ),
    );
  }

  function onListDragOver(event: React.DragEvent<HTMLUListElement>) {
    if (mode !== 'custom' || !draggingId) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    if (!draggingId || sourceIndex < 0 || mode !== 'custom') {
      resetDragState();
      return;
    }
    const toIndex = listSortCustomCommitIndex(sourceIndex, placeholderIndex);
    emit(reorderListSortCustomDisplayItems(listItems, parsed, sourceIndex, toIndex));
    resetDragState();
  }

  if (listItems.length === 0) {
    return (
      <div className="space-y-2 text-body-sm">
        {heading}
        <p className="text-muted">{t('object_list_sort_custom_empty')}</p>
      </div>
    );
  }

  const autoSort = isListSortCustomAutoSortType(parsed.sortType)
    ? parsed.sortType
    : lastAutoSortRef.current;

  const showPlaceholder = mode === 'custom' && draggingId !== null;

  type ListRow =
    | { kind: 'placeholder' }
    | { kind: 'item'; item: ProjectedListItem; visibleIndex: number };

  const listRows: ListRow[] = [];
  visibleItems.forEach((item, visibleIndex) => {
    if (showPlaceholder && placeholderIndex === visibleIndex) {
      listRows.push({ kind: 'placeholder' });
    }
    listRows.push({ kind: 'item', item, visibleIndex });
  });
  if (showPlaceholder && placeholderIndex === visibleItems.length) {
    listRows.push({ kind: 'placeholder' });
  }

  return (
    <div className="space-y-3 text-body-sm">
      {heading}

      <label className="block">
        <span className="font-weight-label text-fg">{t('object_list_sort_mode')}</span>
        <select
          className="mt-2 w-full rounded-btn border border-border bg-bg px-3 py-2 text-fg"
          value={mode}
          onChange={(e) => onModeChange(e.target.value as ListSortCustomFormMode)}
        >
          <option value="auto">{t('object_list_sort_mode_auto')}</option>
          <option value="custom">{t('object_list_sort_mode_custom')}</option>
        </select>
      </label>

      {mode === 'auto' ? (
        <label className="block">
          <span className="font-weight-label text-fg">{t('object_list_sort_by')}</span>
          <select
            className="mt-2 w-full rounded-btn border border-border bg-bg px-3 py-2 text-fg"
            value={autoSort}
            onChange={(e) => onAutoSortChange(e.target.value as ListSortCustomAutoSortType)}
          >
            {LIST_SORT_CUSTOM_AUTO_TYPES.map((sortType) => (
              <option key={sortType} value={sortType}>
                {t(AUTO_SORT_I18N[sortType])}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <ul
        className="list-none space-y-2 p-0"
        onDragOver={onListDragOver}
        onDrop={onDrop}
      >
        {listRows.map((row) => {
          if (row.kind === 'placeholder') {
            return (
              <li
                key="placeholder"
                aria-hidden
                className="min-h-[2.75rem] rounded-btn border border-dashed border-accent"
              />
            );
          }

          const { item, visibleIndex } = row;
          const included = !parsed.exclude.includes(item.objectId);
          const fullIndex = displayItems.findIndex(
            (displayItem) => displayItem.objectId === item.objectId,
          );

          return (
            <li
              key={item.objectId}
              draggable={mode === 'custom'}
              onDragStart={(event) => onDragStart(event, item.objectId, fullIndex)}
              onDragEnd={resetDragState}
              onDragOver={(event) => onDragOverRow(event, visibleIndex)}
              className={[
                ROW_CLASS,
                mode === 'custom' ? 'cursor-grab active:cursor-grabbing' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <input
                type="checkbox"
                className="shrink-0 accent-accent"
                checked={included}
                onChange={(e) => onToggleIncluded(item.objectId, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="min-w-0 flex-1 truncate text-fg">{item.name}</span>
              <span className="shrink-0 text-caption text-muted">{item.objectType}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
