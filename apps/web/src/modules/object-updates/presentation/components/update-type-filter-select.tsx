'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { ChevronDownIcon } from '@/icons';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { labelForUpdateType } from '@/modules/object/domain/object-update-labels';

import type { UpdateTypeOption } from './update-filter-bar';

const LIST_MAX_HEIGHT_CLASS = 'max-h-48';

export function optionLabelForUpdateType(option: UpdateTypeOption): string {
  return option.label || labelForUpdateType(option.value);
}

export function sortUpdateTypeOptionsByLabel(
  options: readonly UpdateTypeOption[],
): UpdateTypeOption[] {
  return [...options].sort((a, b) =>
    optionLabelForUpdateType(a).localeCompare(optionLabelForUpdateType(b), undefined, {
      sensitivity: 'base',
    }),
  );
}

export function filterUpdateTypeOptionsByQuery(
  options: readonly UpdateTypeOption[],
  query: string,
): UpdateTypeOption[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    return [...options];
  }
  return options.filter((o) =>
    optionLabelForUpdateType(o).toLowerCase().includes(q),
  );
}

export function FilterSelectChevron({ open }: { open: boolean }) {
  return (
    <ChevronDownIcon
      size={12}
      strokeWidth={1.5}
      className={`shrink-0 text-fg-secondary transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
    />
  );
}

export type UpdateTypeFilterSelectProps = {
  value: string | undefined;
  options: readonly UpdateTypeOption[];
  onChange: (updateType: string | undefined) => void;
};

export function UpdateTypeFilterSelect({
  value,
  options,
  onChange,
}: UpdateTypeFilterSelectProps) {
  const { t } = useI18n();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedValue = value ?? '';

  const displayLabel = useMemo(() => {
    if (selectedValue.length === 0) {
      return t('object_updates_all_types');
    }
    const opt = options.find((o) => o.value === selectedValue);
    return opt
      ? optionLabelForUpdateType(opt)
      : labelForUpdateType(selectedValue);
  }, [selectedValue, options, t]);

  const sortedOptions = useMemo(
    () => sortUpdateTypeOptionsByLabel(options),
    [options],
  );

  const filteredOptions = useMemo(
    () => filterUpdateTypeOptionsByQuery(sortedOptions, searchQuery),
    [sortedOptions, searchQuery],
  );

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      return;
    }
    searchInputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function handleOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const selectValue = (next: string) => {
    onChange(next.length > 0 ? next : undefined);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1">
      {open ? (
        <div className="flex items-center gap-2 rounded-btn border border-accent bg-surface-control px-3 py-2">
          <input
            ref={searchInputRef}
            type="search"
            className="min-w-0 flex-1 bg-transparent text-body-sm text-fg outline-none placeholder:text-muted"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={displayLabel}
            aria-controls={listId}
            aria-expanded
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false);
              }
            }}
          />
          <button
            type="button"
            className="shrink-0 p-0.5 text-fg-secondary hover:text-fg"
            aria-label={t('object_updates_filter_type')}
            onClick={() => setOpen(false)}
          >
            <FilterSelectChevron open />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded-btn border border-border bg-surface-control px-3 py-2 text-start text-body-sm text-fg hover:border-accent/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          aria-haspopup="listbox"
          aria-expanded={false}
          onClick={() => setOpen(true)}
        >
          <span className="truncate">{displayLabel}</span>
          <FilterSelectChevron open={false} />
        </button>
      )}

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('object_updates_filter_type')}
          className={`absolute left-0 right-0 top-full z-20 mt-1 overflow-y-auto rounded-card border border-border bg-surface-raised shadow-card-float scrollbar-minimal ${LIST_MAX_HEIGHT_CLASS}`}
        >
          <li
            role="option"
            aria-selected={selectedValue.length === 0}
            onClick={() => selectValue('')}
            className={`cursor-pointer px-3 py-2 text-body-sm transition-colors hover:bg-surface-alt ${
              selectedValue.length === 0
                ? 'bg-surface-alt font-weight-label text-fg'
                : 'text-fg-secondary'
            }`}
          >
            {t('object_updates_all_types')}
          </li>
          {filteredOptions.map((o) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === selectedValue}
              onClick={() => selectValue(o.value)}
              className={`cursor-pointer px-3 py-2 text-body-sm transition-colors hover:bg-surface-alt ${
                o.value === selectedValue
                  ? 'bg-surface-alt font-weight-label text-fg'
                  : 'text-fg-secondary'
              }`}
            >
              {optionLabelForUpdateType(o)}
            </li>
          ))}
          {filteredOptions.length === 0 && searchQuery.trim().length > 0 ? (
            <li className="px-3 py-2 text-body-sm text-muted" role="presentation">
              {t('object_edit_menu_item_no_results')}
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
