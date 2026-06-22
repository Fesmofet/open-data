import { HiveWalletSummarySkeleton } from '@/modules/user-wallet';

export default function UserProfileTransfersLoading() {
  return (
    <div aria-busy="true" aria-label="Loading wallet">
      <HiveWalletSummarySkeleton />
    </div>
  );
}
