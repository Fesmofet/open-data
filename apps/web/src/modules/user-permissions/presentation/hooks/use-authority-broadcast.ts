'use client';

import { useCallback, useState } from 'react';

import type { HiveOperation } from '@opden-data-layer/hive-broadcast';

import { getWalletFacade } from '@/modules/auth';
import { useHydrateWalletProvider } from '@/modules/auth/presentation/hooks/use-hydrate-wallet-provider';
import { awaitTrxConfirmation } from '@/modules/notifications';

function isHiveSignerRedirectError(e: unknown): boolean {
  return (
    e instanceof Error &&
    (e.message.includes('HIVESIGNER_REDIRECT') ||
      e.name === 'HiveSignerRedirectError')
  );
}

/** Broadcast authority grant/revoke ops without wallet balances context. */
export function useAuthorityBroadcast() {
  useHydrateWalletProvider();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const broadcast = useCallback(
    async (operations: readonly HiveOperation[]): Promise<boolean> => {
      setError(null);
      setPending(true);
      try {
        const { transactionId } = await getWalletFacade().broadcast({
          operations,
        });
        await awaitTrxConfirmation(transactionId);
        return true;
      } catch (e) {
        if (isHiveSignerRedirectError(e)) {
          return false;
        }
        setError(e instanceof Error ? e.message : 'Broadcast failed');
        return false;
      } finally {
        setPending(false);
      }
    },
    [],
  );

  return { broadcast, pending, error, setError };
}
