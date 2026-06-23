import { ObjectPageCenterSkeleton } from '@/modules/object/presentation/components/object-page-loading-skeleton';

/** Discover feed column loading during type/filter navigation. */
export default function DiscoverLoading() {
  return (
    <div className="min-h-[12rem]" aria-busy="true" aria-label="Loading discover">
      <ObjectPageCenterSkeleton />
    </div>
  );
}
