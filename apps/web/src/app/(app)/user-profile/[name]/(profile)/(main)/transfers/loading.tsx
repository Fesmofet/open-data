import { Suspense } from 'react';

import {
  TransfersWalletLoadingFallback,
  TransfersWalletLoadingSkeleton,
} from '@/modules/user-wallet';

export default function UserProfileTransfersLoading() {
  return (
    <Suspense fallback={<TransfersWalletLoadingFallback />}>
      <TransfersWalletLoadingSkeleton />
    </Suspense>
  );
}
