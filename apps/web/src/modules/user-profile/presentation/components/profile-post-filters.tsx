'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';

import {
  buildProfilePostsHref,
  parseProfilePostFilters,
  toggleProfilePostObjectFilter,
} from '../../domain/profile-post-filters-url';
import type { ProfilePostObjectFilterItem } from '../../domain/profile-post-filters-response.schema';
import { fetchProfilePostObjectFilters } from '../../infrastructure/profile-post-filters.client';
import { PROFILE_FILTER_RAIL_STICKY_CLASS } from '@/shared/presentation/layout';

const FILTER_DEBOUNCE_MS = 300;
const INITIAL_VISIBLE_COUNT = 10;

function FilterPostsIcon({ className }: { className?: string }) {
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

export type ProfilePostFiltersProps = {
  accountName: string;
  objectIds: string[];
};

export function ProfilePostFilters({ accountName, objectIds }: ProfilePostFiltersProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [items, setItems] = useState<ProfilePostObjectFilterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setShowAll(false);
  }, [accountName, objectIds]);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    void (async () => {
      const res = await fetchProfilePostObjectFilters(accountName, {
        objectIds,
        signal: ac.signal,
      });
      if (!ac.signal.aborted) {
        setItems(res?.items ?? []);
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [accountName, objectIds]);

  const visibleItems = useMemo(() => {
    if (showAll) {
      return items;
    }
    return items.slice(0, INITIAL_VISIBLE_COUNT);
  }, [items, showAll]);

  const hasMore = items.length > INITIAL_VISIBLE_COUNT;

  const pushObjectIds = useCallback(
    (nextObjectIds: string[]) => {
      router.push(buildProfilePostsHref(accountName, nextObjectIds));
    },
    [router, accountName],
  );

  const onToggle = useCallback(
    (objectId: string, checked: boolean) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      const next = toggleProfilePostObjectFilter(objectIds, objectId, checked);
      debounceRef.current = setTimeout(() => {
        pushObjectIds(next);
        debounceRef.current = null;
      }, FILTER_DEBOUNCE_MS);
    },
    [objectIds, pushObjectIds],
  );

  return (
    <aside
      className={[
        PROFILE_FILTER_RAIL_STICKY_CLASS,
        'rounded-card border border-border bg-surface/60 p-card-padding text-body-sm',
      ].join(' ')}
      aria-label={t('profile_filter_posts')}
      aria-busy={loading}
    >
      <h2 className="flex items-center gap-2 font-weight-label text-fg">
        <FilterPostsIcon className="shrink-0 text-fg-secondary" />
        <span>{t('profile_filter_posts')}</span>
      </h2>

      {loading ? (
        <div className="mt-3 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 animate-pulse rounded-btn bg-surface-control" aria-hidden />
          ))}
        </div>
      ) : items.length === 0 && objectIds.length > 0 ? (
        <p className="mt-3 text-muted">{t('profile_no_posts_for_filters')}</p>
      ) : items.length === 0 ? null : (
        <div className="mt-3">
          <ul className="flex max-h-96 flex-col gap-1 overflow-y-auto scrollbar-minimal">
            {visibleItems.map((item) => {
              const checked = objectIds.includes(item.object_id);
              return (
                <li key={item.object_id}>
                  <label className="flex cursor-pointer items-center gap-2 text-fg-secondary hover:text-fg">
                    <input
                      type="checkbox"
                      className="size-4 shrink-0 rounded border-border accent-accent"
                      checked={checked}
                      onChange={(e) => onToggle(item.object_id, e.target.checked)}
                    />
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    <span className="tabular-nums text-caption text-muted">({item.count})</span>
                  </label>
                </li>
              );
            })}
          </ul>
          {hasMore && !showAll ? (
            <button
              type="button"
              className="mt-2 text-caption text-link underline"
              onClick={() => setShowAll(true)}
            >
              {t('profile_show_more_filters')}
            </button>
          ) : null}
        </div>
      )}
    </aside>
  );
}

export function ProfilePostFiltersFromUrl({ accountName }: { accountName: string }) {
  const searchParams = useSearchParams();
  const { objectIds } = useMemo(
    () => parseProfilePostFilters(searchParams),
    [searchParams],
  );
  return <ProfilePostFilters accountName={accountName} objectIds={objectIds} />;
}
