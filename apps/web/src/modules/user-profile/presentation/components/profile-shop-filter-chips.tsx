'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { decodeTagFilter } from '@/modules/discover/domain/discover-url';
import { DISCOVER_ACTIVE_CHIP_CLASS } from '@/modules/discover/presentation/components/discover-active-chips';
import { ChipRemoveIcon } from '@/modules/discover/presentation/components/discover-chip-icons';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { useInstantNavigation } from '@/shared/presentation';

import {
  buildProfileShopHref,
  parseProfileShopFilters,
  type ProfileShopFiltersState,
} from '../../domain/profile-shop-filters-url';
import { shopRatingThresholdToStars } from '../../domain/profile-shop-registry';

export type ProfileShopFilterChipsProps = {
  filters: ProfileShopFiltersState;
};

export function ProfileShopFilterChips({ filters }: ProfileShopFilterChipsProps) {
  const { t } = useI18n();
  const { navigateInstant } = useInstantNavigation();
  const pathname = usePathname();

  const activeCount = useMemo(
    () => filters.tags.length + (filters.rating != null ? 1 : 0),
    [filters.tags.length, filters.rating],
  );

  const pushFilters = useCallback(
    (next: ProfileShopFiltersState) => {
      const href = buildProfileShopHref(pathname, next);
      navigateInstant({ href, method: 'replace', scroll: false });
    },
    [navigateInstant, pathname],
  );

  const removeTag = useCallback(
    (tag: string) => {
      pushFilters({ tags: filters.tags.filter((t) => t !== tag), rating: filters.rating });
    },
    [pushFilters, filters.tags, filters.rating],
  );

  const removeRating = useCallback(() => {
    pushFilters({ tags: filters.tags, rating: null });
  }, [pushFilters, filters.tags]);

  const clearAll = useCallback(() => {
    pushFilters({ tags: [], rating: null });
  }, [pushFilters]);

  if (activeCount === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-caption font-weight-label text-fg-tertiary">
          {t('profile_active_filters').replace('{count}', String(activeCount))}
        </span>
        <button
          type="button"
          className="shrink-0 text-caption text-accent underline-offset-2 hover:underline"
          onClick={clearAll}
        >
          {t('profile_clear_all_filters')}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {filters.rating != null ? (
          <span className={DISCOVER_ACTIVE_CHIP_CLASS}>
            <span className="truncate font-weight-label">
              {t('profile_rating_filter_chip').replace(
                '{stars}',
                String(shopRatingThresholdToStars(filters.rating)),
              )}
            </span>
            <button
              type="button"
              aria-label={t('profile_remove_rating_filter')}
              className="shrink-0 rounded-circle p-0.5 text-fg-secondary hover:bg-ghost-surface hover:text-fg"
              onClick={removeRating}
            >
              <ChipRemoveIcon />
            </button>
          </span>
        ) : null}
        {filters.tags.map((tag) => {
          const decoded = decodeTagFilter(tag);
          const label = decoded ? `${decoded.category}: ${decoded.value}` : tag;
          return (
            <span key={tag} className={DISCOVER_ACTIVE_CHIP_CLASS}>
              <span className="truncate font-weight-label">{label}</span>
              <button
                type="button"
                aria-label={t('discover_remove_filter').replace('{tag}', label)}
                className="shrink-0 rounded-circle p-0.5 text-fg-secondary hover:bg-ghost-surface hover:text-fg"
                onClick={() => removeTag(tag)}
              >
                <ChipRemoveIcon />
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function ProfileShopFilterChipsFromUrl() {
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseProfileShopFilters(searchParams), [searchParams]);
  return <ProfileShopFilterChips filters={filters} />;
}
