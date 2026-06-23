import { ObjectPageCenterSkeleton } from '@/modules/object/presentation/components/object-page-loading-skeleton';

/** Content-column loading during tab navigation — shell persists in layout. */
export default function ObjectDetailLoading() {
  return (
    <div aria-busy="true" aria-label="Loading object content">
      <ObjectPageCenterSkeleton />
    </div>
  );
}
