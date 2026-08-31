'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { PlusIcon } from '@/icons';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { useInstantNavigation } from '@/shared/presentation';
import {
  SortDropdown,
  type SortOption,
} from '@/modules/user-social/presentation/components/sort-dropdown';

import type { ObjectUpdatesUrlFilters } from '../../application/parse-object-updates-search-params';

import { LocaleFilterSelect } from './locale-filter-select';
import { UpdateTypeFilterSelect } from './update-type-filter-select';

export type UpdateTypeOption = { value: string; label: string; count?: number };

export type ObjectUpdatesFilterBarProps = {
  typeOptions: UpdateTypeOption[];
  showLocaleFilter: boolean;
  /** Distinct locale codes present on this object's updates. */
  localeOptions: string[];
  onAddUpdate?: () => void;
} & (
  | { mode?: 'url' }
  | {
      mode: 'controlled';
      filters: ObjectUpdatesUrlFilters;
      onFiltersChange: (next: ObjectUpdatesUrlFilters) => void;
    }
);

function mergeLocaleOptions(
  localeOptions: readonly string[],
  activeLocale: string | undefined,
): string[] {
  const merged = [...localeOptions];
  if (
    activeLocale != null &&
    activeLocale.length > 0 &&
    !merged.includes(activeLocale)
  ) {
    merged.push(activeLocale);
    merged.sort((a, b) => a.localeCompare(b));
  }
  return merged;
}

export function ObjectUpdatesFilterBar(props: ObjectUpdatesFilterBarProps) {
  const {
    typeOptions,
    showLocaleFilter,
    localeOptions,
    onAddUpdate,
  } = props;
  const { t } = useI18n();
  const { navigateInstant } = useInstantNavigation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = props.mode ?? 'url';

  const urlFilters = useMemo((): ObjectUpdatesUrlFilters => {
    const sortRaw = searchParams.get('sort') ?? '';
    const sort: ObjectUpdatesUrlFilters['sort'] =
      sortRaw === 'approval' ? 'approval' : 'recency';
    const ut = searchParams.get('update_type')?.trim();
    const loc = searchParams.get('locale')?.trim();
    return {
      sort,
      update_type: ut && ut.length > 0 ? ut : undefined,
      locale: loc && loc.length > 0 ? loc : undefined,
    };
  }, [searchParams]);

  const filters = props.mode === 'controlled' ? props.filters : urlFilters;

  const resolvedLocaleOptions = useMemo(
    () => mergeLocaleOptions(localeOptions, filters.locale),
    [localeOptions, filters.locale],
  );

  const replaceParams = useCallback(
    (mutate: (u: URLSearchParams) => void) => {
      if (mode === 'controlled') {
        return;
      }
      const u = new URLSearchParams(searchParams.toString());
      mutate(u);
      const next = u.toString();
      const href = next.length > 0 ? `${pathname}?${next}` : pathname;
      navigateInstant({ href, method: 'replace', scroll: false });
    },
    [mode, navigateInstant, pathname, searchParams],
  );

  const sortOptions: SortOption<ObjectUpdatesUrlFilters['sort']>[] = useMemo(
    () => [
      { value: 'recency', label: t('object_updates_sort_recency') },
      { value: 'approval', label: t('object_updates_sort_approval') },
    ],
    [t],
  );

  const onSortChange = useCallback(
    (nextSort: ObjectUpdatesUrlFilters['sort']) => {
      if (props.mode === 'controlled') {
        props.onFiltersChange({ ...props.filters, sort: nextSort });
        return;
      }
      replaceParams((u) => {
        u.set('sort', nextSort);
      });
    },
    [props, replaceParams],
  );

  const onTypeChange = useCallback(
    (updateType: string | undefined) => {
      if (props.mode === 'controlled') {
        props.onFiltersChange({
          ...props.filters,
          update_type: updateType,
        });
        return;
      }
      replaceParams((u) => {
        if (!updateType) {
          u.delete('update_type');
        } else {
          u.set('update_type', updateType);
        }
      });
    },
    [props, replaceParams],
  );

  const onLocaleChange = useCallback(
    (locale: string | undefined) => {
      if (props.mode === 'controlled') {
        props.onFiltersChange({
          ...props.filters,
          locale,
        });
        return;
      }
      replaceParams((u) => {
        if (!locale) {
          u.delete('locale');
        } else {
          u.set('locale', locale);
        }
      });
    },
    [props, replaceParams],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 rounded-btn border border-border p-2 sm:flex-nowrap">
        <UpdateTypeFilterSelect
          value={filters.update_type}
          options={typeOptions}
          onChange={onTypeChange}
        />
        {showLocaleFilter ? (
          <LocaleFilterSelect
            value={filters.locale}
            options={resolvedLocaleOptions}
            onChange={onLocaleChange}
          />
        ) : null}
        {onAddUpdate ? (
          <button
            type="button"
            onClick={onAddUpdate}
            className="inline-flex shrink-0 items-center gap-2 px-1 text-body-sm text-link hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:ms-auto"
          >
            <span className="inline-flex size-7 items-center justify-center rounded-pill bg-accent text-accent-fg">
              <PlusIcon size="xs" strokeWidth={1.75} />
            </span>
            <span className="font-weight-label">{t('object_updates_add')}</span>
          </button>
        ) : null}
      </div>
      <div className="flex justify-end">
        <SortDropdown
          value={filters.sort}
          options={sortOptions}
          onChange={onSortChange}
        />
      </div>
    </div>
  );
}
