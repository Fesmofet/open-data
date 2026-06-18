import { parseActivityFilters } from '@/modules/user-activity/domain/activity-filters-url';

import { FeedProfileContent } from '../../../feed-profile-content';

export default async function UserProfileActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { name } = await params;
  const accountName = decodeURIComponent(name);
  const activityFilters = parseActivityFilters(await searchParams);
  return (
    <FeedProfileContent
      accountName={accountName}
      feedTab="activity"
      activityFilters={activityFilters}
    />
  );
}
