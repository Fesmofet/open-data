import { FeedPostsLoadingSkeleton } from '@/modules/feed/presentation';

export default function HubLoading() {
  return (
    <main className="px-gutter py-section-y sm:px-gutter-sm">
      <FeedPostsLoadingSkeleton />
    </main>
  );
}
