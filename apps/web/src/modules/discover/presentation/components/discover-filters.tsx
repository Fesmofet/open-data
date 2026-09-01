'use client';

import { useCallback, useRef } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { useInstantNavigation } from '@/shared/presentation';

import { buildDiscoverHref } from '../../domain/discover-url';
import { useDiscoverTagCategories } from '../hooks/use-discover-tag-categories';
import { DiscoverFilterSections } from './discover-filter-sections';

const FILTER_DEBOUNCE_MS = 300;

export type DiscoverFiltersProps = {
  objectType: string;
  q: string;
  tags: string[];
  sort: 'newest' | 'oldest' | 'rank';
};

export function DiscoverFilters({ objectType, q, tags, sort }: DiscoverFiltersProps) {
  const { t } = useI18n();
  const { navigateInstant } = useInstantNavigation();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { loading, orderedSections, collapsedCategories, toggleCollapse } =
    useDiscoverTagCategories({ objectType, q, tags });

  const pushTags = useCallback(
    (nextTags: string[]) => {
      const href = buildDiscoverHref({ type: objectType, q, tags: nextTags, sort });
      navigateInstant({ href, method: 'replace', scroll: false });
    },
    [navigateInstant, objectType, q, sort],
  );

  const onToggleTag = useCallback(
    (value: string, checked: boolean) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      const next = checked ? [...tags, value] : tags.filter((t) => t !== value);
      debounceRef.current = setTimeout(() => {
        pushTags(next);
        debounceRef.current = null;
      }, FILTER_DEBOUNCE_MS);
    },
    [tags, pushTags],
  );

  return (
    <aside
      className="relative z-0 hidden min-w-0 w-full self-start overflow-hidden lg:sticky lg:top-[calc(var(--app-header-height,4rem)+1rem)] lg:block lg:max-h-[calc(100dvh-var(--app-header-height,4rem)-2rem)] lg:overflow-y-auto"
      aria-busy={loading}
    >
      <h2 className="mb-3 text-caption font-weight-label uppercase tracking-loose text-fg-tertiary">
        {t('discover_filters_title')}
      </h2>
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-btn bg-surface-control" aria-hidden />
          ))}
        </div>
      ) : (
        <DiscoverFilterSections
          sections={orderedSections}
          tags={tags}
          collapsedCategories={collapsedCategories}
          onToggleCollapse={toggleCollapse}
          onToggleTag={onToggleTag}
        />
      )}
    </aside>
  );
}
