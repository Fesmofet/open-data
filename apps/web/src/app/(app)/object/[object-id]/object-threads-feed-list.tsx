'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import type { UserBlogFeedPage } from '@/modules/feed/application/dto/user-blog-feed-page.dto';
import { FeedList, FeedPostsLoadingSkeleton } from '@/modules/feed/presentation';
import { useInfiniteScroll } from '@/shared/presentation';
import { revalidateObjectAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

import { loadObjectThreadsFeedAction } from './object-threads-feed.actions';

const EMPTY_PAGE: UserBlogFeedPage = { items: [], cursor: null, hasMore: false };

type ObjectThreadsFeedListProps = {
  objectId: string;
  currentUsername: string | null;
};

export function ObjectThreadsFeedList({
  objectId,
  currentUsername,
}: ObjectThreadsFeedListProps) {
  const { t } = useI18n();
  const onBroadcastRevalidate = useCallback(
    () => revalidateObjectAfterBroadcast(objectId),
    [objectId],
  );
  const [page, setPage] = useState<UserBlogFeedPage>(EMPTY_PAGE);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  const { items, cursor, hasMore } = page;

  useEffect(() => {
    let cancelled = false;
    setInitialLoading(true);
    void loadObjectThreadsFeedAction(objectId, null).then((next) => {
      if (!cancelled) {
        setPage(next);
        setInitialLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [objectId]);

  const onLoadMore = useCallback(() => {
    if (!cursor || pending) {
      return;
    }
    startTransition(async () => {
      const next = await loadObjectThreadsFeedAction(objectId, cursor);
      setPage((prev) => ({
        items: [...prev.items, ...next.items],
        cursor: next.cursor,
        hasMore: next.hasMore,
      }));
    });
  }, [cursor, objectId, pending]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: pending,
    onLoadMore,
  });

  if (initialLoading) {
    return <FeedPostsLoadingSkeleton />;
  }

  if (items.length === 0) {
    return (
      <section className="rounded-card border border-border bg-surface/80 p-card-padding">
        <p className="text-body-sm text-muted">{t('empty_threads')}</p>
      </section>
    );
  }

  return (
    <>
      <FeedList
        items={items}
        feedTab="threads"
        currentUsername={currentUsername}
        onBroadcastRevalidate={onBroadcastRevalidate}
      />
      {hasMore ? (
        <div className="flex flex-col items-center gap-2 py-2">
          <div ref={sentinelRef} aria-hidden className="h-px w-full" />
          <button
            type="button"
            className="sr-only"
            disabled={pending || !cursor}
            onClick={onLoadMore}
          >
            Load more
          </button>
          {pending ? (
            <p className="text-body-sm text-muted" aria-live="polite">
              Loading…
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
