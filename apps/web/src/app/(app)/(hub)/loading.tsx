import { FeedPostsLoadingSkeleton } from '@/modules/feed/presentation';

export default function HubLoading() {
  return (
    <main className="min-w-0 py-section-y">
      <FeedPostsLoadingSkeleton />
    </main>
  );
}
