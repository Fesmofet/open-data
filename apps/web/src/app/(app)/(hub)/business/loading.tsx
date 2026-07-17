import { ObjectPageCenterSkeleton } from '@/modules/object/presentation/components/object-page-loading-skeleton';

export default function BusinessLoading() {
  return (
    <div className="min-h-[12rem]" aria-busy="true" aria-label="Loading business">
      <ObjectPageCenterSkeleton />
    </div>
  );
}
