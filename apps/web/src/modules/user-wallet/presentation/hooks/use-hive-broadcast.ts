'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import type { HiveOperation } from '@opden-data-layer/hive-broadcast';

import { getWalletFacade } from '@/modules/auth';

import { awaitTrxConfirmation } from '@/modules/notifications';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateUserHiveWalletAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

import {
  type EngineTokenBroadcastErrorCode,
  isHiveSignerRedirectError,
  mapEngineTokenBroadcastError,
} from '../../domain/engine-token-broadcast-errors';

export function useHiveBroadcast(account: string) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<EngineTokenBroadcastErrorCode | null>(null);

  const broadcast = useCallback(
    async (operations: readonly HiveOperation[]): Promise<boolean> => {
      setError(null);
      setPending(true);
      try {
        const { transactionId } = await getWalletFacade().broadcast({
          operations,
        });
        await awaitTrxConfirmation(transactionId);
        await refreshAfterBroadcast(router, () =>
          revalidateUserHiveWalletAfterBroadcast(account),
        );
        return true;
      } catch (e) {
        if (isHiveSignerRedirectError(e)) {
          return false;
        }
        setError(mapEngineTokenBroadcastError(e));
        return false;
      } finally {
        setPending(false);
      }
    },
    [account, router],
  );

  return { broadcast, pending, error, setError };
}
