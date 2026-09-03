'use client';

import { useCallback } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { formatObjectTypeLabel } from '@/modules/app-header/domain/search-nav-list';
import { ChevronDownIcon, CloseIcon, PlusIcon } from '@/icons';
import { profileSectionTabClass } from '@/shared/presentation';
import { useInstantNavigation } from '@/shared/presentation';

import { buildDiscoverHref, decodeTagFilter, type DiscoverBox, type DiscoverMapView } from '../../domain/discover-url';
import { DISCOVER_ACTIVE_CHIP_CLASS } from './discover-active-chips';
import { DiscoverSortSelect } from './discover-sort-select';

export type DiscoverMobileTab = 'list' | 'map';

export type DiscoverMobileHeaderProps = {
  usersMode: boolean;
  objectType: string | null;
  q: string;
  tags: string[];
  sort: 'newest' | 'oldest' | 'rank';
  box: DiscoverBox | null;
  map: DiscoverMapView | null;
  showFilters: boolean;
  showMap: boolean;
  mobileTab: DiscoverMobileTab;
  onMobileTabChange: (tab: DiscoverMobileTab) => void;
  onOpenTypeSheet: () => void;
  onOpenFilterSheet: () => void;
};

export function DiscoverMobileHeader({
  usersMode,
  objectType,
  q,
  tags,
  sort,
  box,
  map,
  showFilters,
  showMap,
  mobileTab,
  onMobileTabChange,
  onOpenTypeSheet,
  onOpenFilterSheet,
}: DiscoverMobileHeaderProps) {
  const { t } = useI18n();
  const { navigateInstant } = useInstantNavigation();
  const trimmedQ = q.trim();

  const typeLabel = usersMode
    ? t('discover_all_users')
    : objectType === 'all'
      ? t('discover_type_all')
      : objectType
        ? formatObjectTypeLabel(objectType)
        : t('discover_select_type');

  const pushHref = useCallback(
    (nextTags: string[], nextQ = q, nextBox: DiscoverBox | null = box) => {
      const href = buildDiscoverHref({
        users: usersMode,
        type: objectType ?? undefined,
        q: nextQ,
        tags: nextTags,
        sort,
        box: nextBox,
        map: map ?? undefined,
      });
      navigateInstant({ href, method: 'replace', scroll: false });
    },
    [navigateInstant, usersMode, objectType, q, sort, box, map],
  );

  const removeQuery = () => {
    pushHref(tags, '');
  };

  const removeTag = (tag: string) => {
    pushHref(tags.filter((item) => item !== tag));
  };

  const removeMapArea = () => {
    pushHref(tags, q, null);
  };

  const showFilterRow =
    showFilters || trimmedQ.length > 0 || tags.length > 0 || box != null;

  const showSort = !usersMode && objectType && (!showMap || mobileTab === 'list');

  return (
    <div className="mb-4 space-y-3 lg:hidden">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-section font-weight-label text-accent"
        onClick={onOpenTypeSheet}
      >
        {typeLabel}
        <ChevronDownIcon size={16} className="shrink-0" />
      </button>

      {showFilterRow ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {trimmedQ.length > 0 ? (
            <span className={DISCOVER_ACTIVE_CHIP_CLASS}>
              <span className="truncate font-weight-label">{trimmedQ}</span>
              <button
                type="button"
                aria-label={t('discover_remove_search').replace('{query}', trimmedQ)}
                className="shrink-0 rounded-circle p-0.5 text-fg-secondary hover:bg-ghost-surface hover:text-fg"
                onClick={removeQuery}
              >
                <CloseIcon size={16} />
              </button>
            </span>
          ) : null}
          {tags.map((tag) => {
            const label = decodeTagFilter(tag)?.value ?? tag;
            return (
              <span key={tag} className={DISCOVER_ACTIVE_CHIP_CLASS}>
                <span className="truncate font-weight-label">{label}</span>
                <button
                  type="button"
                  aria-label={t('discover_remove_filter').replace('{tag}', label)}
                  className="shrink-0 rounded-circle p-0.5 text-fg-secondary hover:bg-ghost-surface hover:text-fg"
                  onClick={() => removeTag(tag)}
                >
                  <CloseIcon size={16} />
                </button>
              </span>
            );
          })}
          {box ? (
            <span className={DISCOVER_ACTIVE_CHIP_CLASS}>
              <span className="truncate font-weight-label">{t('discover_map_area_filter')}</span>
              <button
                type="button"
                aria-label={t('discover_remove_map_area')}
                className="shrink-0 rounded-circle p-0.5 text-fg-secondary hover:bg-ghost-surface hover:text-fg"
                onClick={removeMapArea}
              >
                <CloseIcon size={16} />
              </button>
            </span>
          ) : null}
          {showFilters ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-pill border border-accent px-2 py-0.5 text-caption font-weight-label text-accent"
              onClick={onOpenFilterSheet}
            >
              <PlusIcon size={14} />
              {t('discover_add_filter')}
            </button>
          ) : null}
        </div>
      ) : null}

      {showMap ? (
        <nav
          aria-label={t('discover_map_view_nav_aria')}
          className="flex flex-nowrap items-end gap-x-2 border-b border-border"
        >
          <button
            type="button"
            className={profileSectionTabClass(mobileTab === 'list', 'sub')}
            onClick={() => onMobileTabChange('list')}
          >
            {t('object_list_tab')}
          </button>
          <button
            type="button"
            className={profileSectionTabClass(mobileTab === 'map', 'sub')}
            onClick={() => onMobileTabChange('map')}
          >
            {t('discover_map')}
          </button>
        </nav>
      ) : null}

      {showSort ? (
        <div className="flex justify-end">
          <DiscoverSortSelect
            usersMode={usersMode}
            objectType={objectType}
            q={q}
            tags={tags}
            sort={sort}
            box={box}
            map={map}
          />
        </div>
      ) : null}
    </div>
  );
}
