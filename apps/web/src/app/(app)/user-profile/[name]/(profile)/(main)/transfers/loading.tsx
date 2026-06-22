import { ActivityListSkeleton } from '@/modules/user-activity';
import { HiveWalletSummarySkeleton } from '@/modules/user-wallet';

export default function UserProfileTransfersLoading() {
  return (
    <div aria-busy="true" aria-label="Loading wallet" className="space-y-4">
      <HiveWalletSummarySkeleton />
      <ActivityListSkeleton />
    </div>
  );
}
