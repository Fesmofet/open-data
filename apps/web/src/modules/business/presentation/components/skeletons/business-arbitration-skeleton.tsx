import { BusinessListSkeleton } from './business-list-skeleton';

export function BusinessArbitrationSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="flex animate-pulse gap-2">
        <div className="h-8 w-16 rounded-btn bg-surface-alt" />
        <div className="h-8 w-20 rounded-btn bg-surface-alt" />
      </div>
      <BusinessListSkeleton rows={5} />
    </div>
  );
}
