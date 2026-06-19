import { FeedColumn } from '@/shared/presentation/layout';

function ProfileMapSidebarCardSkeleton() {
  return (
    <div className="flex gap-2.5 rounded-card border border-border bg-surface/80 p-3 shadow-whisper">
      <div className="size-14 shrink-0 animate-pulse rounded-btn bg-surface-control" />
      <div className="min-w-0 flex-1 space-y-2 pt-0.5">
        <div className="h-3.5 max-w-[75%] animate-pulse rounded-btn bg-surface-control" />
        <div className="h-3 max-w-[50%] animate-pulse rounded-btn bg-surface-control" />
        <div className="h-3 w-full animate-pulse rounded-btn bg-surface-control" />
      </div>
    </div>
  );
}

export function ProfileMapSidebarListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="min-h-0 flex-1 overflow-hidden p-card-padding"
      aria-busy="true"
      aria-label="Loading map objects"
    >
      <FeedColumn>
        <ul className="flex list-none flex-col gap-card-padding p-0">
          {Array.from({ length: count }, (_, i) => (
            <li key={i}>
              <ProfileMapSidebarCardSkeleton />
            </li>
          ))}
        </ul>
      </FeedColumn>
    </div>
  );
}
