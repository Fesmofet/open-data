'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, type ChangeEvent } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import {
  SortDropdown,
  type SortOption,
} from '@/modules/user-social/presentation/components/sort-dropdown';

import type { ObjectUpdatesUrlFilters } from '../../application/parse-object-updates-search-params';

import { UpdateTypeFilterSelect } from './update-type-filter-select';

export type UpdateTypeOption = { value: string; label: string; count?: number };

export type ObjectUpdatesFilterBarProps = {
  typeOptions: UpdateTypeOption[];
  showLocaleFilter: boolean;
  /** BCP 47-ish locale codes for interface-language filter. */
  localeOptions?: string[];
  onAddUpdate?: () => void;
} & (
  | { mode?: 'url' }
  | {
      mode: 'controlled';
      filters: ObjectUpdatesUrlFilters;
      onFiltersChange: (next: ObjectUpdatesUrlFilters) => void;
    }
);

const DEFAULT_LOCALE_OPTIONS = [
  'en-US',
  'es-ES',
  'ru-RU',
  'fr-FR',
  'de-DE',
  'it-IT',
  'uk-UA',
  'zh-CN',
  'ja-JP',
];

function IconAddUpdate() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M7 2.5v9M2.5 7h9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ObjectUpdatesFilterBar(props: ObjectUpdatesFilterBarProps) {
  const {
    typeOptions,
    showLocaleFilter,
    localeOptions = DEFAULT_LOCALE_OPTIONS,
    onAddUpdate,
  } = props;
  const { t } = useI18n();
  const router = useRouter();
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

  const replaceParams = useCallback(
    (mutate: (u: URLSearchParams) => void) => {
      if (mode === 'controlled') {
        return;
      }
      const u = new URLSearchParams(searchParams.toString());
      mutate(u);
      const next = u.toString();
      router.replace(next.length > 0 ? `${pathname}?${next}` : pathname);
    },
    [mode, pathname, router, searchParams],
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
    (ev: ChangeEvent<HTMLSelectElement>) => {
      const v = ev.target.value;
      if (props.mode === 'controlled') {
        props.onFiltersChange({
          ...props.filters,
          locale: v === '' ? undefined : v,
        });
        return;
      }
      replaceParams((u) => {
        if (v === '') {
          u.delete('locale');
        } else {
          u.set('locale', v);
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
          <label className="relative min-w-0 flex-1 sm:max-w-[14rem]">
            <span className="sr-only">{t('object_updates_filter_locale')}</span>
            <select
              className="w-full appearance-none rounded-btn border border-accent bg-surface-control px-3 py-2 pe-8 text-body-sm text-fg"
              value={filters.locale ?? ''}
              onChange={onLocaleChange}
            >
              <option value="">{t('object_updates_filter_locale')}</option>
              {localeOptions.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <span
              className="pointer-events-none absolute inset-y-0 end-2 flex items-center text-fg-secondary"
              aria-hidden
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 4l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </label>
        ) : null}
        {onAddUpdate ? (
          <button
            type="button"
            onClick={onAddUpdate}
            className="inline-flex shrink-0 items-center gap-2 px-1 text-body-sm text-link hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:ms-auto"
          >
            <span className="inline-flex size-7 items-center justify-center rounded-pill bg-accent text-accent-fg">
              <IconAddUpdate />
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
