'use client';

import { useCallback, useTransition } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import type { UserBlogFeedPage } from '@/modules/feed/application/dto/user-blog-feed-page.dto';
import type { FeedTab } from '@/modules/feed/domain/feed-tab';
import { FeedList, FeedPostGrid } from '@/modules/feed/presentation';
import { useInfiniteScroll, useSyncedPaginatedList } from '@/shared/presentation';
import { FeedColumn } from '@/shared/presentation/layout';
import { shouldUsePostGrid, useShellMode } from '@/shell-mode';

import { loadMoreUserBlogFeedAction } from './blog-feed.actions';
import { loadMoreUserCommentsFeedAction } from './comments-feed.actions';
import { loadMoreUserMentionsFeedAction } from './mentions-feed.actions';
import { loadMoreUserThreadsFeedAction } from './threads-feed.actions';

type BlogFeedPostsListProps = {
  accountName: string;
  initialPage: UserBlogFeedPage;
  feedTab: FeedTab;
  currentUsername: string | null;
  objectIds?: string[];
};

export function BlogFeedPostsList({
  accountName,
  initialPage,
  feedTab,
  currentUsername,
  objectIds = [],
}: BlogFeedPostsListProps) {
  const { t } = useI18n();
  const { resolvedMode } = useShellMode();
  const { items, setItems, cursor, setCursor, hasMore, setHasMore } =
    useSyncedPaginatedList(initialPage);
  const [pending, startTransition] = useTransition();
  const useInstagramGrid =
    shouldUsePostGrid(resolvedMode) && feedTab === 'posts';

  const onLoadMore = useCallback(() => {
    if (!cursor || pending) {
      return;
    }
    startTransition(async () => {
      const next =
        feedTab === 'threads'
          ? await loadMoreUserThreadsFeedAction(accountName, cursor)
          : feedTab === 'comments'
            ? await loadMoreUserCommentsFeedAction(accountName, cursor)
            : feedTab === 'mentions'
              ? await loadMoreUserMentionsFeedAction(accountName, cursor)
              : await loadMoreUserBlogFeedAction(accountName, cursor, objectIds);
      setItems((prev) => [...prev, ...next.items]);
      setCursor(next.cursor);
      setHasMore(next.hasMore);
    });
  }, [
    accountName,
    cursor,
    feedTab,
    objectIds,
    pending,
    setCursor,
    setHasMore,
    setItems,
  ]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: pending,
    onLoadMore,
  });

  if (items.length === 0) {
    return (
      <section
        className="rounded-card border border-border bg-surface/80 p-card-padding"
        aria-labelledby="feed-empty-title"
      >
        <h2 id="feed-empty-title" className="text-body-lg font-weight-strong font-display text-fg">
          Feed
        </h2>
        <p className="mt-2 text-body-sm text-muted">
          {objectIds.length > 0
            ? t('profile_no_posts_for_filters')
            : 'No items to show yet.'}
        </p>
      </section>
    );
  }

  return (
    <FeedColumn>
      {useInstagramGrid ? (
        <FeedPostGrid items={items} />
      ) : (
        <FeedList items={items} feedTab={feedTab} currentUsername={currentUsername} />
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
    </FeedColumn>
  );
}
