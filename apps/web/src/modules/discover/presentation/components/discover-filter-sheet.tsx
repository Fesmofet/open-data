'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { SearchIcon } from '@/icons';
import { ModalShell, useInstantNavigation } from '@/shared/presentation';

import { buildDiscoverHref } from '../../domain/discover-url';
import { useDiscoverTagCategories } from '../hooks/use-discover-tag-categories';
import { DiscoverFilterSections } from './discover-filter-sections';

const FILTER_DEBOUNCE_MS = 300;

export type DiscoverFilterSheetProps = {
  open: boolean;
  onClose: () => void;
  objectType: string;
  q: string;
  tags: string[];
  sort: 'newest' | 'oldest' | 'rank';
};

export function DiscoverFilterSheet({
  open,
  onClose,
  objectType,
  q,
  tags,
  sort,
}: DiscoverFilterSheetProps) {
  const { t } = useI18n();
  const { navigateInstant } = useInstantNavigation();
  const [filterSearch, setFilterSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { loading, orderedSections, collapsedCategories, toggleCollapse } =
    useDiscoverTagCategories({ objectType, q, tags });

  useEffect(() => {
    if (!open) {
      setFilterSearch('');
    }
  }, [open]);

  const pushTags = useCallback(
    (nextTags: string[], nextQ = q) => {
      const href = buildDiscoverHref({ type: objectType, q: nextQ, tags: nextTags, sort });
      navigateInstant({ href, method: 'replace', scroll: false });
    },
    [navigateInstant, objectType, q, sort],
  );

  const onToggleTag = useCallback(
    (value: string, checked: boolean) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      const next = checked ? [...tags, value] : tags.filter((tag) => tag !== value);
      debounceRef.current = setTimeout(() => {
        pushTags(next);
        debounceRef.current = null;
      }, FILTER_DEBOUNCE_MS);
    },
    [tags, pushTags],
  );

  const onClear = () => {
    pushTags([], '');
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      variant="sheet"
      ariaLabel={t('discover_filters_title')}
      scrollBody
      header={
        <div className="border-b border-border px-gutter pb-3 pt-2">
          <div className="mx-auto mb-3 h-1 w-10 rounded-pill bg-border" aria-hidden />
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-heading font-weight-label text-fg">{t('discover_filters_title')}</h2>
            <button
              type="button"
              className="text-body-sm font-weight-label text-accent"
              onClick={onClear}
            >
              {t('discover_clear')}
            </button>
          </div>
          <div className="relative mt-3 flex items-center gap-2 rounded-btn border border-border bg-surface-control px-3 py-2">
            <SearchIcon size={18} className="shrink-0 text-fg-secondary" />
            <input
              type="search"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder={t('discover_search_filters')}
              className="min-w-0 flex-1 border-0 bg-transparent text-body text-fg outline-none placeholder:text-fg-tertiary"
            />
          </div>
        </div>
      }
      footer={
        <div className="border-t border-border px-gutter py-3">
          <button
            type="button"
            className="w-full rounded-btn bg-accent px-4 py-3 text-body font-weight-label text-on-accent"
            onClick={onClose}
          >
            {t('discover_show_results')}
          </button>
        </div>
      }
    >
      <div className="px-gutter pb-gutter">
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
            itemSearchQuery={filterSearch}
          />
        )}
      </div>
    </ModalShell>
  );
}
