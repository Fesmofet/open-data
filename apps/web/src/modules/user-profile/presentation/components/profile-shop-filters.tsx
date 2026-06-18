'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { encodeTagFilter } from '@/modules/discover/domain/discover-url';
import { StarRating } from '@/modules/object/presentation/components/star-rating';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { PROFILE_FILTER_RAIL_STICKY_CLASS } from '@/shared/presentation/layout';

import type { ProfileShopFiltersResponse } from '../../domain/profile-shop-filters-response.schema';
import {
  buildProfileShopHref,
  isUserProfileRecipeTab,
  parseProfileShopFilters,
  setProfileShopRatingFilter,
  toggleProfileShopTagFilter,
  type ProfileShopFiltersState,
} from '../../domain/profile-shop-filters-url';
import {
  getTagCategoryNamesForShopTypes,
  shopRatingThresholdToStars,
  shopTypesHaveRatingFilters,
  shopTypesHaveTagFilters,
} from '../../domain/profile-shop-registry';
import { fetchProfileShopFilters } from '../../infrastructure/profile-shop-filters.client';
import {
  getCategoryLineageFromPathname,
  UNCATEGORIZED_SHOP_PATH_SEGMENT,
} from './category-nav-path';

const FILTER_DEBOUNCE_MS = 300;
const DEFAULT_OPEN_CATEGORIES = 2;
const INITIAL_VISIBLE_COUNT = 10;
const CATEGORY_LIST_MAX_HEIGHT = 'max-h-72';

type TagCategorySection = ProfileShopFiltersResponse['categories'][number];

function orderTagSections(
  categories: ProfileShopFiltersResponse['categories'] | undefined,
  registryOrder: string[],
): TagCategorySection[] {
  const sections: TagCategorySection[] =
    categories ??
    registryOrder.map((category) => ({
      category,
      items: [] as { value: string; count: number }[],
    }));

  if (registryOrder.length === 0) {
    return sections;
  }
  return [
    ...registryOrder
      .map((name) => sections.find((s) => s.category === name))
      .filter((s): s is TagCategorySection => s != null),
    ...sections.filter((s) => !registryOrder.includes(s.category)),
  ];
}

function buildDefaultCollapsed(
  sections: TagCategorySection[],
  selectedTags: string[],
): Set<string> {
  const collapsed = new Set<string>();
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const hasSelected = section.items.some((item) =>
      selectedTags.includes(encodeTagFilter(section.category, item.value)),
    );
    if (i >= DEFAULT_OPEN_CATEGORIES && !hasSelected) {
      collapsed.add(section.category);
    }
  }
  return collapsed;
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 4l4 4 4-4" />
    </svg>
  );
}

function FilterShopIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
      <path d="M8 11h6" />
      <path d="M8 8h3" />
      <path d="M8 14h4" />
    </svg>
  );
}

export type ProfileShopFiltersProps = {
  accountName: string;
  types: readonly string[];
  categoryPath: string[];
  uncategorizedOnly: boolean;
  filters: ProfileShopFiltersState;
  pathname: string;
};

export function ProfileShopFilters({
  accountName,
  types,
  categoryPath,
  uncategorizedOnly,
  filters,
  pathname,
}: ProfileShopFiltersProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [data, setData] = useState<ProfileShopFiltersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(() => new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTagFilters = shopTypesHaveTagFilters(types);
  const showRatingFilters = shopTypesHaveRatingFilters(types);
  const registryOrder = useMemo(() => getTagCategoryNamesForShopTypes(types), [types]);
  const orderedSections = useMemo(
    () => orderTagSections(data?.categories, registryOrder),
    [data?.categories, registryOrder],
  );

  useEffect(() => {
    setCollapsedCategories(new Set());
    setExpandedCategories(new Set());
  }, [accountName, types, categoryPath, uncategorizedOnly]);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setFetchError(false);
    void (async () => {
      const res = await fetchProfileShopFilters(accountName, {
        types,
        categoryPath,
        uncategorizedOnly,
        tags: filters.tags,
        rating: filters.rating,
        signal: ac.signal,
      });
      if (!ac.signal.aborted) {
        if (res === null) {
          setFetchError(true);
          setData(null);
        } else {
          setData(res);
          if (filters.tags.length === 0) {
            setCollapsedCategories(
              buildDefaultCollapsed(orderTagSections(res.categories, registryOrder), filters.tags),
            );
          }
        }
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [
    accountName,
    types,
    categoryPath,
    uncategorizedOnly,
    filters.tags,
    filters.rating,
    registryOrder,
  ]);

  useEffect(() => {
    if (filters.tags.length === 0 || !data?.categories) {
      return;
    }
    setCollapsedCategories((prev) => {
      const sections = orderTagSections(data.categories, registryOrder);
      const next = new Set(prev);
      let changed = false;
      for (const section of sections) {
        const hasSelected = section.items.some((item) =>
          filters.tags.includes(encodeTagFilter(section.category, item.value)),
        );
        if (hasSelected && next.has(section.category)) {
          next.delete(section.category);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [filters.tags, data, registryOrder]);

  const pushFilters = useCallback(
    (next: ProfileShopFiltersState) => {
      router.push(buildProfileShopHref(pathname, next));
    },
    [router, pathname],
  );

  const onToggleTag = useCallback(
    (encoded: string, checked: boolean) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      const nextTags = toggleProfileShopTagFilter(filters.tags, encoded, checked);
      debounceRef.current = setTimeout(() => {
        pushFilters({ tags: nextTags, rating: filters.rating });
        debounceRef.current = null;
      }, FILTER_DEBOUNCE_MS);
    },
    [filters.tags, filters.rating, pushFilters],
  );

  const onToggleRating = useCallback(
    (rating: number, checked: boolean) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      const nextRating = setProfileShopRatingFilter(filters.rating, rating, checked);
      debounceRef.current = setTimeout(() => {
        pushFilters({ tags: filters.tags, rating: nextRating });
        debounceRef.current = null;
      }, FILTER_DEBOUNCE_MS);
    },
    [filters.tags, filters.rating, pushFilters],
  );

  const toggleCollapse = useCallback((category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const toggleShowMore = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const filterAriaLabel = isUserProfileRecipeTab(pathname)
    ? t('profile_filter_recipe')
    : t('profile_filter_shop');

  if (!showTagFilters && !showRatingFilters) {
    return null;
  }

  const ratingOptions = data?.ratings ?? [];
  const hasTagContent = orderedSections.some((s) => s.items.length > 0);

  if (!loading && !showRatingFilters && !hasTagContent) {
    return null;
  }

  return (
    <aside
      className={[
        PROFILE_FILTER_RAIL_STICKY_CLASS,
        'rounded-card border border-border bg-surface/60 p-card-padding',
      ].join(' ')}
      aria-label={filterAriaLabel}
      aria-busy={loading}
    >
      <h2 className="mb-3 flex items-center gap-2 text-caption font-weight-label uppercase tracking-loose text-fg-tertiary">
        <FilterShopIcon className="shrink-0 text-fg-secondary" />
        <span>{t('discover_filters_title')}</span>
      </h2>

      {fetchError && !loading ? (
        <div className="space-y-2">
          <p className="text-body-sm text-muted">{t('profile_filters_load_error')}</p>
          <button
            type="button"
            className="text-caption text-link underline"
            onClick={() => {
              setFetchError(false);
              setLoading(true);
              void fetchProfileShopFilters(accountName, {
                types,
                categoryPath,
                uncategorizedOnly,
                tags: filters.tags,
                rating: filters.rating,
              }).then((res) => {
                if (res === null) {
                  setFetchError(true);
                  setData(null);
                } else {
                  setData(res);
                }
                setLoading(false);
              });
            }}
          >
            {t('profile_filters_retry')}
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-btn bg-surface-control" aria-hidden />
          ))}
        </div>
      ) : (
        <>
          {showRatingFilters && ratingOptions.length > 0 ? (
            <section className="border-b border-border pb-3">
              <h3 className="mb-2 text-body-sm font-weight-label text-fg">
                {t('profile_ratings_label')}:
              </h3>
              <ul className="flex flex-col gap-1">
                {ratingOptions.map((rate) => {
                  const checked = filters.rating === rate;
                  const stars = shopRatingThresholdToStars(rate);
                  return (
                    <li key={rate}>
                      <label className="flex cursor-pointer items-center gap-2 text-body-sm text-fg-secondary hover:text-fg">
                        <input
                          type="checkbox"
                          className="size-4 shrink-0 rounded border-border accent-accent"
                          checked={checked}
                          onChange={(e) => onToggleRating(rate, e.target.checked)}
                        />
                        <StarRating
                          averageRating01To5={stars}
                          userRating01To5={null}
                          totalVoters={0}
                          dimension=""
                          updateId=""
                          objectId=""
                          readOnly
                          size="sm"
                          showNumeric={false}
                        />
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {showTagFilters ? (
            <div className="mt-2 space-y-1">
              {orderedSections.map((section) => {
                if (section.items.length === 0) {
                  return null;
                }
                const collapsed = collapsedCategories.has(section.category);
                const showAll = expandedCategories.has(section.category);
                const visibleItems = showAll
                  ? section.items
                  : section.items.slice(0, INITIAL_VISIBLE_COUNT);
                const hasMore = section.items.length > INITIAL_VISIBLE_COUNT;

                return (
                  <section
                    key={section.category}
                    className="border-b border-border pb-2 last:border-b-0"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between py-1.5 text-start text-body-sm font-weight-label text-fg"
                      onClick={() => toggleCollapse(section.category)}
                      aria-expanded={!collapsed}
                    >
                      <span>{section.category}:</span>
                      <ChevronIcon
                        className={`shrink-0 text-fg-secondary transition-transform duration-150 ${
                          collapsed ? '' : 'rotate-180'
                        }`}
                      />
                    </button>
                    {!collapsed ? (
                      <div
                        className={`${CATEGORY_LIST_MAX_HEIGHT} scrollbar-minimal overflow-y-auto pe-0.5`}
                      >
                        <ul className="flex flex-col gap-1 pb-1">
                          {visibleItems.map((item) => {
                            const encoded = encodeTagFilter(section.category, item.value);
                            const checked = filters.tags.includes(encoded);
                            return (
                              <li key={`${section.category}-${item.value}`}>
                                <label className="flex cursor-pointer items-center gap-2 text-body-sm text-fg-secondary hover:text-fg">
                                  <input
                                    type="checkbox"
                                    className="size-4 shrink-0 rounded border-border accent-accent"
                                    checked={checked}
                                    onChange={(e) => onToggleTag(encoded, e.target.checked)}
                                  />
                                  <span className="min-w-0 flex-1 truncate">{item.value}</span>
                                  <span className="tabular-nums text-caption">({item.count})</span>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                        {hasMore && !showAll ? (
                          <button
                            type="button"
                            className="text-caption text-link underline"
                            onClick={() => toggleShowMore(section.category)}
                          >
                            {t('profile_show_more_filters')}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          ) : null}
        </>
      )}
    </aside>
  );
}

export function ProfileShopFiltersFromUrl({ accountName }: { accountName: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseProfileShopFilters(searchParams), [searchParams]);
  const sectionKey = isUserProfileRecipeTab(pathname) ? 'recipe' : 'user-shop';
  const types = useMemo(
    () => (sectionKey === 'recipe' ? (['recipe'] as const) : (['book', 'product'] as const)),
    [sectionKey],
  );
  const lineage = getCategoryLineageFromPathname(pathname, sectionKey);
  const uncategorizedOnly =
    lineage.length === 1 && lineage[0] === UNCATEGORIZED_SHOP_PATH_SEGMENT;
  const categoryPath = uncategorizedOnly ? [] : lineage;

  return (
    <ProfileShopFilters
      accountName={accountName}
      types={types}
      categoryPath={categoryPath}
      uncategorizedOnly={uncategorizedOnly}
      filters={filters}
      pathname={pathname}
    />
  );
}
