import { FeedColumn } from '@/shared/presentation/layout';

export function ActivityRowSkeleton() {
  return (
    <div
      className="rounded-card border border-border bg-surface/80 p-card-padding"
      aria-hidden
    >
      <div className="h-3 w-28 animate-pulse rounded-btn bg-surface-control" />
      <div className="mt-2 h-4 max-w-lg animate-pulse rounded-btn bg-surface-control" />
      <div className="mt-1.5 h-4 max-w-xs animate-pulse rounded-btn bg-surface-control" />
    </div>
  );
}

export type ActivityListSkeletonProps = {
  count?: number;
};

export function ActivityListSkeleton({ count = 5 }: ActivityListSkeletonProps) {
  return (
    <FeedColumn>
      <ul className="flex list-none flex-col gap-3 p-0" aria-hidden>
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <ActivityRowSkeleton />
          </li>
        ))}
      </ul>
    </FeedColumn>
  );
}
