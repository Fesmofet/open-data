'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { buildOslHiveEngineDepositOp } from '@opden-data-layer/hive-broadcast';

import { getWalletFacade } from '@/modules/auth';
import { useOslCustomJsonId } from '@/config/odl-network-provider';

import { awaitTrxConfirmation } from '@/modules/notifications';

import {
  isHiveSignerRedirectError,
  mapEngineTokenBroadcastError,
  type EngineTokenBroadcastErrorCode,
} from '../../domain/engine-token-broadcast-errors';
import { buildDepositInstructionOslPayload } from '../../domain/build-deposit-instruction-osl-payload';
import type { BuildDepositInstructionBroadcastInput } from '../../domain/build-deposit-instruction-osl-payload';
import { useWalletBalances } from '../components/wallet/wallet-balances-context';
import { refreshWalletAfterBroadcast } from './wallet-broadcast-refresh';

export function useDepositInstructionBroadcast(account: string) {
  const router = useRouter();
  const oslCustomJsonId = useOslCustomJsonId();
  const { bumpWalletEpoch } = useWalletBalances();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<EngineTokenBroadcastErrorCode | null>(null);

  const broadcast = useCallback(
    async (input: BuildDepositInstructionBroadcastInput): Promise<boolean> => {
      setError(null);
      setPending(true);
      try {
        const payload = buildDepositInstructionOslPayload({
          ...input,
          account,
          destination: input.destination || account,
        });
        const op = buildOslHiveEngineDepositOp({
          id: oslCustomJsonId,
          account,
          payload,
        });
        const { transactionId } = await getWalletFacade().broadcast({
          operations: [op],
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
    [account, bumpWalletEpoch, oslCustomJsonId, router],
  );

  return { broadcast, pending, error, clearError: () => setError(null) };
}
