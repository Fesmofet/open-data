import { BusinessListSkeleton } from './business-list-skeleton';

export function BusinessRelationshipDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-card border border-border bg-surface p-card-padding"
          >
            <div className="mb-2 h-3 w-1/3 rounded bg-surface-alt" />
            <div className="h-5 w-2/3 rounded bg-surface-alt" />
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-b border-border pb-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-8 w-20 animate-pulse rounded-btn bg-surface-alt" />
        ))}
      </div>
      <BusinessListSkeleton rows={4} />
    </div>
  );
}
