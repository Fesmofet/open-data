'use client';

import { useCallback, useTransition } from 'react';

import type { UserBlogFeedPage } from '@/modules/feed/application/dto/user-blog-feed-page.dto';
import { FeedList, FeedPostGrid } from '@/modules/feed/presentation';
import { useInfiniteScroll, useSyncedPaginatedList } from '@/shared/presentation';
import { shouldUsePostGrid, useShellMode } from '@/shell-mode';

import { revalidateObjectAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

import { loadMoreObjectPostsFeedAction } from './object-posts-feed.actions';

type ObjectPostsFeedListProps = {
  objectId: string;
  initialPage: UserBlogFeedPage;
  currentUsername: string | null;
};

export function ObjectPostsFeedList({
  objectId,
  initialPage,
  currentUsername,
}: ObjectPostsFeedListProps) {
  const onBroadcastRevalidate = useCallback(
    () => revalidateObjectAfterBroadcast(objectId),
    [objectId],
  );
  const { resolvedMode } = useShellMode();
  const { items, setItems, cursor, setCursor, hasMore, setHasMore } =
    useSyncedPaginatedList(initialPage);
  const [pending, startTransition] = useTransition();
  const useInstagramGrid = shouldUsePostGrid(resolvedMode);

  const onLoadMore = useCallback(() => {
    if (!cursor || pending) {
      return;
    }
    startTransition(async () => {
      const next = await loadMoreObjectPostsFeedAction(objectId, cursor);
      setItems((prev) => [...prev, ...next.items]);
      setCursor(next.cursor);
      setHasMore(next.hasMore);
    });
  }, [cursor, objectId, pending, setCursor, setHasMore, setItems]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: pending,
    onLoadMore,
  });

  if (items.length === 0) {
    return (
      <section
        className="rounded-card border border-border bg-surface/80 p-card-padding"
        aria-labelledby="object-feed-empty-title"
      >
        <h2
          id="object-feed-empty-title"
          className="text-body-lg font-weight-strong font-display text-fg"
        >
          Reviews
        </h2>
        <p className="mt-2 text-body-sm text-muted">No posts to show yet.</p>
      </section>
    );
  }

  return (
    <>
      {useInstagramGrid ? (
        <FeedPostGrid items={items} />
      ) : (
        <FeedList
          items={items}
          feedTab="posts"
          currentUsername={currentUsername}
          onBroadcastRevalidate={onBroadcastRevalidate}
        />
      )}
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
