import { BusinessListSkeleton } from '@/modules/business/presentation/components/skeletons/business-list-skeleton';

export default function BusinessManageRequestsLoading() {
  return (
    <div className="p-page-padding" aria-busy="true" aria-label="Loading requests">
      <div className="mb-6 h-8 w-40 animate-pulse rounded bg-surface-alt" />
      <div className="mb-4 flex gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-8 w-24 animate-pulse rounded-pill bg-surface-alt" />
        ))}
      </div>
      <BusinessListSkeleton />
    </div>
  );
}
