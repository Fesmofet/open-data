'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import type { HiveOperation } from '@opden-data-layer/hive-broadcast';

import { getWalletFacade } from '@/modules/auth';

import { awaitTrxConfirmation } from '@/modules/notifications';

import {
  type EngineTokenBroadcastErrorCode,
  isHiveSignerRedirectError,
  mapEngineTokenBroadcastError,
} from '../../domain/engine-token-broadcast-errors';
import { useWalletBalances } from '../components/wallet/wallet-balances-context';
import { refreshWalletAfterBroadcast } from './wallet-broadcast-refresh';

export function useHiveBroadcast(account: string) {
  const router = useRouter();
  const { bumpWalletEpoch } = useWalletBalances();
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
        await refreshWalletAfterBroadcast(router, account, { bumpWalletEpoch });
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
    [account, bumpWalletEpoch, router],
  );

  return { broadcast, pending, error, setError };
}
