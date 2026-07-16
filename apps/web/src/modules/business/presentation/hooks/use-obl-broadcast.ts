'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import type { HiveOperation } from '@opden-data-layer/hive-broadcast';

import { getWalletFacade } from '@/modules/auth';
import { useHydrateWalletProvider } from '@/modules/auth/presentation/hooks/use-hydrate-wallet-provider';
import { awaitTrxConfirmation } from '@/modules/notifications';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateOblAfterBroadcast } from '@/shared/infrastructure/query/revalidate-obl-after-broadcast.server';

import type { BlockchainActionPhase } from '../../domain/blockchain-action';
import { isOblBroadcastBusy } from '../../domain/blockchain-action';

function isHiveSignerRedirectError(e: unknown): boolean {
  return (
    e instanceof Error &&
    (e.message.includes('HIVESIGNER_REDIRECT') ||
      e.name === 'HiveSignerRedirectError')
  );
}

export function useOblBroadcast(
  account: string,
  counterparty?: string,
  revalidateOptions?: Parameters<typeof revalidateOblAfterBroadcast>[2],
) {
  useHydrateWalletProvider();
  const router = useRouter();
  const [phase, setPhase] = useState<BlockchainActionPhase>('drafting');
  const [error, setError] = useState<string | null>(null);

  const broadcast = useCallback(
    async (
      operations: readonly HiveOperation[],
      revalidateOverride?: Parameters<typeof revalidateOblAfterBroadcast>[2],
    ): Promise<string | null> => {
      setError(null);
      setPhase('wallet');
      try {
        setPhase('broadcast');
        const { transactionId } = await getWalletFacade().broadcast({
          operations,
        });
        setPhase('indexing');
        await awaitTrxConfirmation(transactionId);
        await refreshAfterBroadcast(router, () =>
          revalidateOblAfterBroadcast(
            account,
            counterparty,
            revalidateOverride ?? revalidateOptions,
          ),
        );
        setPhase('confirmed');
        return transactionId;
      } catch (e) {
        if (isHiveSignerRedirectError(e)) {
          setPhase('wallet');
          return null;
        }
        setPhase('failed');
        setError(e instanceof Error ? e.message : 'Broadcast failed');
        return null;
      }
    },
    [account, counterparty, revalidateOptions, router],
  );

  return { broadcast, phase, isBusy: isOblBroadcastBusy(phase), setPhase, error, setError };
}
