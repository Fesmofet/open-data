'use client';

import { ActivityFeed } from '@/modules/user-activity';

import { loadMoreUserActivityAction } from './activity-feed.actions';
import type { ActivityLoadError, ActivityPageView } from '@/modules/user-activity';

type ActivityFeedClientProps = {
  accountName: string;
  initialPage: ActivityPageView;
  initialError?: ActivityLoadError | null;
};

export function ActivityFeedClient({
  accountName,
  initialPage,
  initialError = null,
}: ActivityFeedClientProps) {
  return (
    <ActivityFeed
      accountName={accountName}
      initialPage={initialPage}
      initialError={initialError}
      loadMoreAction={loadMoreUserActivityAction}
    />
  );
}
