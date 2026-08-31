import {
  getUserBlogFeedPageQuery,
  getUserCommentsFeedPageQuery,
  getUserMentionsFeedPageQuery,
  getUserThreadsFeedPageQuery,
  type FeedTab,
} from '@/modules/feed';
import { ProfilePostFilterChips } from '@/modules/user-profile/presentation/components/profile-post-filter-chips';
import type { ActivityFilterKey } from '@opden-data-layer/core/hive-account-history';
import { getUserActivityPageQuery } from '@/modules/user-activity/application/queries/get-user-activity-page.query';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

import { BlogFeedPostsList } from './blog-feed-posts-list';
import { ActivityFeedClient } from './activity-feed-client';
import { getMockFeedItems } from './mock-feed';

type FeedProfileContentProps = {
  accountName: string;
  feedTab: FeedTab;
  postFilterObjectIds?: string[];
  activityFilters?: ActivityFilterKey[];
};

export async function FeedProfileContent({
  accountName,
  feedTab,
  postFilterObjectIds = [],
  activityFilters = [],
}: FeedProfileContentProps) {
  const auth = createCookieAuthContextProvider();
  const currentUser = await auth.getUser();
  const currentUsername = currentUser?.username ?? null;

  if (feedTab === 'posts') {
    let page = await getUserBlogFeedPageQuery(
      accountName,
      { objectIds: postFilterObjectIds },
      currentUsername,
    );
    if (page.items.length === 0 && postFilterObjectIds.length === 0) {
      const mockItems = getMockFeedItems(accountName, feedTab);
      if (mockItems.length > 0) {
        page = { items: mockItems, cursor: null, hasMore: false };
      }
    }
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

  const { page: activityPage, error: activityError } =
    await getUserActivityPageQuery(accountName, { filters: activityFilters });
  return (
    <ActivityFeedClient
      accountName={accountName}
      initialPage={activityPage}
      initialError={activityError}
      initialFilters={activityFilters}
    />
  );
}
