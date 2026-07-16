import { BusinessArbitrationSkeleton } from '@/modules/business/presentation/components/skeletons/business-arbitration-skeleton';
import { BusinessPageShell } from '@/modules/business';

export default function BusinessArbitrationLoading() {
  return (
    <BusinessPageShell activeNav="arbitration" title="…">
      <BusinessArbitrationSkeleton />
    </BusinessPageShell>
  );
}
