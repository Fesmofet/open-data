import { BusinessListSkeleton } from '@/modules/business/presentation/components/skeletons/business-list-skeleton';

export default function BusinessRelationshipsLoading() {
  return (
    <div className="p-page-padding" aria-busy="true" aria-label="Loading relationships">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-surface-alt" />
      <BusinessListSkeleton />
    </div>
  );
}
