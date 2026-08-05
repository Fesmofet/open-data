/**
 * Loading placeholders for feed routes — mirrors {@link FeedList}, {@link FeedPostGrid}, {@link Story} layout tokens.
 */
export function FeedStoryCardSkeleton() {
  return (
    <article
      className="rounded-card border border-border bg-surface/80 p-3 shadow-whisper sm:p-card-padding"
      aria-hidden
    >
      <header className="flex items-start gap-2 sm:gap-3">
        <div className="size-9 shrink-0 animate-pulse rounded-circle bg-surface-control sm:size-10" />
        <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
          <div className="h-4 max-w-[9rem] animate-pulse rounded-btn bg-surface-control" />
          <div className="h-3 max-w-[6rem] animate-pulse rounded-btn bg-surface-control" />
        </div>
      </header>
      <div className="mt-3 space-y-2">
        <div className="h-4 w-full animate-pulse rounded-btn bg-surface-control" />
        <div className="h-4 max-w-[95%] animate-pulse rounded-btn bg-surface-control" />
      </div>
      <div className="mt-3 aspect-video animate-pulse rounded-btn bg-surface-control" />
      <footer className="mt-4 flex flex-wrap gap-3 border-t border-border pt-3">
        <div className="h-8 w-14 animate-pulse rounded-btn bg-surface-control" />
        <div className="h-8 w-14 animate-pulse rounded-btn bg-surface-control" />
        <div className="h-8 w-14 animate-pulse rounded-btn bg-surface-control" />
      </footer>
    </article>
  );
}

export type FeedListSkeletonProps = {
  /** Number of story placeholders — default sized for one viewport. */
  count?: number;
};

export function FeedListSkeleton({ count = 4 }: FeedListSkeletonProps) {
  return (
    <ul className="flex list-none flex-col gap-card-padding p-0">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <FeedStoryCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

export type FeedPostGridSkeletonProps = {
  count?: number;
};

export function FeedPostGridSkeleton({ count = 9 }: FeedPostGridSkeletonProps) {
  return (
    <div className="instagram-post-grid" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="aspect-square w-full animate-pulse rounded-btn bg-surface-control"
        />
      ))}
    </div>
  );
}
