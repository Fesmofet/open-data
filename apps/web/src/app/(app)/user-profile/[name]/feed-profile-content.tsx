import {
  getUserBlogFeedPageQuery,
  getUserCommentsFeedPageQuery,
  getUserMentionsFeedPageQuery,
  getUserThreadsFeedPageQuery,
  type FeedTab,
} from '@/modules/feed';
import { ProfilePostFilterChips } from '@/modules/user-profile/presentation/components/profile-post-filter-chips';
import { getUserActivityPageQuery } from '@/modules/user-activity/application/queries/get-user-activity-page.query';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

import { BlogFeedPostsList } from './blog-feed-posts-list';
import { ActivityFeedClient } from './activity-feed-client';

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

  const { page: activityPage, error: activityError } =
    await getUserActivityPageQuery(accountName);
  return (
    <ActivityFeedClient
      accountName={accountName}
      initialPage={activityPage}
      initialError={activityError}
    />
  );
}
