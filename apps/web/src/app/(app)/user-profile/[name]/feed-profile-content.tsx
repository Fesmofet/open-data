import {
  FeedList,
  getUserBlogFeedPageQuery,
  getUserCommentsFeedPageQuery,
  getUserMentionsFeedPageQuery,
  getUserThreadsFeedPageQuery,
  type FeedTab,
} from '@/modules/feed';
import { ProfilePostFilterChips } from '@/modules/user-profile/presentation/components/profile-post-filter-chips';
import { FeedColumn } from '@/shared/presentation/layout';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

import { BlogFeedPostsList } from './blog-feed-posts-list';
import { getMockFeedItems } from './mock-feed';

type FeedProfileContentProps = {
  accountName: string;
  feedTab: FeedTab;
  postFilterObjectIds?: string[];
};

export async function FeedProfileContent({
  accountName,
  feedTab,
  postFilterObjectIds = [],
}: FeedProfileContentProps) {
  const auth = createCookieAuthContextProvider();
  const currentUser = await auth.getUser();
  const currentUsername = currentUser?.username ?? null;

  if (feedTab === 'posts') {
    const page = await getUserBlogFeedPageQuery(
      accountName,
      { objectIds: postFilterObjectIds },
      currentUsername,
    );
    return (
      <>
        <ProfilePostFilterChips
          accountName={accountName}
          objectIds={postFilterObjectIds}
        />
        <BlogFeedPostsList
          accountName={accountName}
          initialPage={page}
          feedTab={feedTab}
          currentUsername={currentUsername}
          objectIds={postFilterObjectIds}
        />
      </>
    );
  }

  if (feedTab === 'threads') {
    const page = await getUserThreadsFeedPageQuery(
      accountName,
      { sort: 'latest' },
      currentUsername,
    );
    return (
      <BlogFeedPostsList
        accountName={accountName}
        initialPage={page}
        feedTab={feedTab}
        currentUsername={currentUsername}
      />
    );
  }

  if (feedTab === 'comments') {
    const page = await getUserCommentsFeedPageQuery(
      accountName,
      { sort: 'latest' },
      currentUsername,
    );
    return (
      <BlogFeedPostsList
        accountName={accountName}
        initialPage={page}
        feedTab={feedTab}
        currentUsername={currentUsername}
      />
    );
  }

  if (feedTab === 'mentions') {
    const page = await getUserMentionsFeedPageQuery(accountName, {}, currentUsername);
    return (
      <BlogFeedPostsList
        accountName={accountName}
        initialPage={page}
        feedTab={feedTab}
        currentUsername={currentUsername}
      />
    );
  }

  const items = getMockFeedItems(accountName, feedTab);

  if (items.length === 0) {
    return (
      <FeedColumn>
        <section
          className="rounded-card border border-border bg-surface/80 p-card-padding"
          aria-labelledby="feed-empty-title"
        >
          <h2 id="feed-empty-title" className="text-body-lg font-weight-strong font-display text-fg">
            Feed
          </h2>
          <p className="mt-2 text-body-sm text-muted">No items to show yet.</p>
        </section>
      </FeedColumn>
    );
  }

  return (
    <FeedColumn>
      <FeedList items={items} feedTab={feedTab} currentUsername={currentUsername} />
    </FeedColumn>
  );
}
