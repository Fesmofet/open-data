'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { ObjectCard } from '@/modules/feed/presentation/components/object-card';
import type { ProjectedObjectView } from '@/modules/feed/application/dto/object-fields';
import type { SocialProjectedObjectView } from '@/modules/user-social/application/dto/user-social.dto';
import { FeedColumn } from '@/shared/presentation/layout';
import { useInfiniteScroll } from '@/shared/presentation';

import type { DiscoverBox } from '../../domain/discover-url';
import { fetchDiscoverObjects } from '../../infrastructure/discover.client';

const PAGE_LIMIT = 20;

export type DiscoverObjectFeedProps = {
  objectType: string;
  q: string;
  tags: string[];
  sort: 'newest' | 'oldest' | 'rank';
  box: DiscoverBox | null;
  viewerUsername?: string | null;
  onRequireLogin?: () => void;
  hideType?: boolean;
};

export function DiscoverObjectFeed({
  objectType,
  q,
  tags,
  sort,
  box,
  viewerUsername,
  onRequireLogin,
  hideType = false,
}: DiscoverObjectFeedProps) {
  const { t } = useI18n();
  const [items, setItems] = useState<SocialProjectedObjectView[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const abortRef = useRef<AbortController | null>(null);

  const loadPage = useCallback(
    async (nextCursor: string | null, replace: boolean, signal: AbortSignal) => {
      const page = await fetchDiscoverObjects({
        objectType,
        q: q || undefined,
        tags,
        sort,
        box: box ?? undefined,
        cursor: nextCursor,
        limit: PAGE_LIMIT,
        signal,
      });
      if (signal.aborted || !page) {
        return;
      }
      setItems((prev) => (replace ? page.items : [...prev, ...page.items]));
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    },
    [objectType, q, tags, sort, box],
  );

  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setItems([]);
    setCursor(null);
    setHasMore(false);

    void (async () => {
      await loadPage(null, true, ac.signal);
      if (!ac.signal.aborted) {
        setLoading(false);
      }
    })();

    return () => {
      ac.abort();
    };
  }, [loadPage, objectType, q, tags, sort, box]);

  const onLoadMore = useCallback(() => {
    if (!hasMore || pending || loading) {
      return;
    }
    startTransition(async () => {
      const ac = new AbortController();
      await loadPage(cursor, false, ac.signal);
    });
  }, [cursor, hasMore, loadPage, loading, pending]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore: hasMore && !loading,
    isLoading: pending,
    onLoadMore,
  });

  if (loading) {
    return (
      <FeedColumn>
        <ul className="flex flex-col gap-card-padding">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="h-24 animate-pulse rounded-card border border-border bg-surface-control"
              aria-hidden
            />
          ))}
        </ul>
      </FeedColumn>
    );
  }

  if (items.length === 0) {
    return <p className="text-body-sm text-fg-secondary">{t('discover_no_results')}</p>;
  }

  return (
    <FeedColumn>
      <ul className="flex flex-col gap-card-padding">
        {items.map((o) => (
          <ObjectCard
            key={o.object_id}
            object={o as unknown as ProjectedObjectView}
            viewerUsername={viewerUsername}
            onRequireLogin={onRequireLogin}
            hideType={hideType}
          />
        ))}
      </ul>
      {hasMore ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          <div ref={sentinelRef} aria-hidden className="h-px w-full" />
          <button
            type="button"
            className="sr-only"
            disabled={pending}
            onClick={onLoadMore}
          >
            {t('discover_show_more')}
          </button>
          {pending ? (
            <p className="text-body-sm text-muted" aria-live="polite">
              {t('discover_loading')}
            </p>
          ) : null}
        </div>
      ) : null}
    </FeedColumn>
  );
}
