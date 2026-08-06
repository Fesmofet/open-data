'use client';

import { useCallback, useTransition } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import type { UserBlogFeedPage } from '@/modules/feed/application/dto/user-blog-feed-page.dto';
import { FeedList, FeedPostGrid } from '@/modules/feed/presentation';
import { useInfiniteScroll, useSyncedPaginatedList } from '@/shared/presentation';
import { FeedColumn } from '@/shared/presentation/layout';
import { shouldUsePostGrid, useShellMode } from '@/shell-mode';

import { loadMoreHomeFeedAction } from '@/app/(app)/(hub)/home-feed.actions';

type HomeFeedPostsListProps = {
  initialPage: UserBlogFeedPage;
  currentUsername: string | null;
};

export function HomeFeedPostsList({
  initialPage,
  currentUsername,
}: HomeFeedPostsListProps) {
  const { t } = useI18n();
  const { resolvedMode } = useShellMode();
  const { items, setItems, cursor, setCursor, hasMore, setHasMore } =
    useSyncedPaginatedList(initialPage);
  const [pending, startTransition] = useTransition();
  const useInstagramGrid = shouldUsePostGrid(resolvedMode);

  const handleLoadMore = useCallback(() => {
    if (!cursor || pending) {
      return;
    }
    startTransition(async () => {
      const next = await loadMoreHomeFeedAction(cursor);
      setItems((prev) => [...prev, ...next.items]);
      setCursor(next.cursor);
      setHasMore(next.hasMore);
    });
  }, [cursor, pending, setCursor, setHasMore, setItems]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: pending,
    onLoadMore: handleLoadMore,
  });

  if (items.length === 0) {
    return (
      <section
        className="rounded-card border border-border bg-surface/80 p-card-padding"
        aria-labelledby="home-feed-empty-title"
      >
        <h2
          id="home-feed-empty-title"
          className="font-display text-body-lg font-weight-strong text-fg"
        >
          {t('app_section_nav_home')}
        </h2>
        <p className="mt-2 text-body-sm text-muted">
          {currentUsername
            ? t('home_feed_empty_personalized')
            : t('home_feed_empty_global')}
        </p>
      </section>
    );
  }

  return (
    <FeedColumn>
      {useInstagramGrid ? (
        <FeedPostGrid items={items} />
      ) : (
        <FeedList items={items} feedTab="posts" currentUsername={currentUsername} />
      )}
      {hasMore ? (
        <div className="flex flex-col items-center gap-2 py-2">
          <div ref={sentinelRef} aria-hidden className="h-px w-full" />
          <button
            type="button"
            className="sr-only"
            disabled={pending || !cursor}
            onClick={handleLoadMore}
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
    </FeedColumn>
  );
}
