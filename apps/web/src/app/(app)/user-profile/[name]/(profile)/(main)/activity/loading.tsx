import { ActivityListSkeleton } from '@/modules/user-activity';

export default function ProfileActivityFeedLoading() {
  return (
    <div aria-busy="true" aria-label="Loading activity">
      <ActivityListSkeleton />
    </div>
  );
}
