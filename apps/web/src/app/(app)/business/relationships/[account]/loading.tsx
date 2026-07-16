import { BusinessRelationshipDetailSkeleton } from '@/modules/business/presentation/components/skeletons/business-relationship-detail-skeleton';

export default function BusinessRelationshipDetailLoading() {
  return (
    <div className="p-page-padding" aria-busy="true" aria-label="Loading relationship">
      <div className="mb-6 h-8 w-40 animate-pulse rounded bg-surface-alt" />
      <BusinessRelationshipDetailSkeleton />
    </div>
  );
}
