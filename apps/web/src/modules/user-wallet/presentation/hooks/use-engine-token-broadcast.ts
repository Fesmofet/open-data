'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import {
  buildHiveEngineCustomJsonOp,
  buildHiveEngineTokensOp,
  type HiveEngineCustomJsonPayload,
} from '@opden-data-layer/hive-broadcast';
import type { HiveEngineTokensContractAction } from '@opden-data-layer/hive-broadcast';

import { getWalletFacade } from '@/modules/auth';

import { awaitTrxConfirmation } from '@/modules/notifications';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateUserWaivWalletAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

import {
  type EngineTokenBroadcastErrorCode,
  isHiveSignerRedirectError,
  mapEngineTokenBroadcastError,
} from '../../domain/engine-token-broadcast-errors';

export function useEngineTokenBroadcast(account: string) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<EngineTokenBroadcastErrorCode | null>(null);

  const afterBroadcast = useCallback(async () => {
    await refreshAfterBroadcast(router, () =>
      revalidateUserWaivWalletAfterBroadcast(account),
    );
  }, [account, router]);

  const broadcast = useCallback(
    async (
      contractAction: HiveEngineTokensContractAction,
      payload: Record<string, string>,
    ): Promise<boolean> => {
      setError(null);
      setPending(true);
      try {
        const op = buildHiveEngineTokensOp({
          account,
          contractAction,
          payload: payload as never,
        });
        const { transactionId } = await getWalletFacade().broadcast({
          operations: [op],
        });
        await awaitTrxConfirmation(transactionId);
        await afterBroadcast();
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
    [account, afterBroadcast],
  );

  const broadcastCustomJson = useCallback(
    async (
      payloads: readonly HiveEngineCustomJsonPayload[],
    ): Promise<boolean> => {
      setError(null);
      setPending(true);
      try {
        const op = buildHiveEngineCustomJsonOp(account, payloads);
        const { transactionId } = await getWalletFacade().broadcast({
          operations: [op],
        });
        await awaitTrxConfirmation(transactionId);
        await afterBroadcast();
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
    [account, afterBroadcast],
  );

  return { broadcast, broadcastCustomJson, pending, error, setError };
}
