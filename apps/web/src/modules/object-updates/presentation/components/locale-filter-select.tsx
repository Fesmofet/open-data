'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import { FilterSelectChevron } from './update-type-filter-select';

const LIST_MAX_HEIGHT_CLASS = 'max-h-48';

export type LocaleFilterSelectProps = {
  value: string | undefined;
  options: readonly string[];
  onChange: (locale: string | undefined) => void;
};

export function LocaleFilterSelect({
  value,
  options,
  onChange,
}: LocaleFilterSelectProps) {
  const { t } = useI18n();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selectedValue = value ?? '';

  const displayLabel = useMemo(() => {
    if (selectedValue.length === 0) {
      return t('object_updates_all_locales');
    }
    return selectedValue;
  }, [selectedValue, t]);

  const sortedOptions = useMemo(
    () => [...options].sort((a, b) => a.localeCompare(b)),
    [options],
  );

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
    <div ref={containerRef} className="relative min-w-0 flex-1 sm:max-w-[14rem]">
      {open ? (
        <div className="flex items-center justify-between gap-2 rounded-btn border border-accent bg-surface-control px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-body-sm text-fg">
            {displayLabel}
          </span>
          <button
            type="button"
            className="shrink-0 p-0.5 text-fg-secondary hover:text-fg"
            aria-label={t('object_updates_filter_locale')}
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
          aria-label={t('object_updates_filter_locale')}
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
          aria-label={t('object_updates_filter_locale')}
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
            {t('object_updates_all_locales')}
          </li>
          {sortedOptions.map((loc) => (
            <li
              key={loc}
              role="option"
              aria-selected={loc === selectedValue}
              onClick={() => selectValue(loc)}
              className={`cursor-pointer px-3 py-2 text-body-sm transition-colors hover:bg-surface-alt ${
                loc === selectedValue
                  ? 'bg-surface-alt font-weight-label text-fg'
                  : 'text-fg-secondary'
              }`}
            >
              {loc}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
