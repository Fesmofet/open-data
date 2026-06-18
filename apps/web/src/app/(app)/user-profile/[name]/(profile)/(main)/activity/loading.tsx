import { FeedListSkeleton } from '@/modules/feed';
import { FeedColumn } from '@/shared/presentation/layout';

export default function ProfileActivityFeedLoading() {
  return (
    <div aria-busy="true" aria-label="Loading activity">
      <FeedColumn>
        <FeedListSkeleton />
      </FeedColumn>
    </div>
  );
}
