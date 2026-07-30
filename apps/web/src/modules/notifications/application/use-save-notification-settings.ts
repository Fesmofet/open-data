'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { buildOslUpdateUserNotificationSettingsOp } from '@opden-data-layer/hive-broadcast';

import { useOslCustomJsonId } from '@/config/odl-network-provider';

import { getWalletFacade } from '@/modules/auth';
import { hydrateWalletProviderFromStorage } from '@/modules/auth/presentation/hooks/hydrate-wallet-provider';
import {
  isHiveSignerRedirectError,
  mapEngineTokenBroadcastError,
  type EngineTokenBroadcastErrorCode,
} from '@/modules/user-wallet/domain/engine-token-broadcast-errors';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateNotificationSettingsAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

import { awaitTrxConfirmation } from './await-trx-confirmation';
import { mapFormToBroadcastPayload } from './map-notification-settings';
import type { NotificationSettingsFormState } from './notification-settings.types';

export function useSaveNotificationSettings(username: string) {
  const router = useRouter();
  const oslCustomJsonId = useOslCustomJsonId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<EngineTokenBroadcastErrorCode | null>(null);

  const save = useCallback(
    async (form: NotificationSettingsFormState): Promise<boolean> => {
      setError(null);
      setPending(true);
      try {
        hydrateWalletProviderFromStorage();
        const op = buildOslUpdateUserNotificationSettingsOp({
          id: oslCustomJsonId,
          creator: username,
          required_posting_auths: [username],
          settings: mapFormToBroadcastPayload(form),
        });
        const { transactionId } = await getWalletFacade().broadcast({
          operations: [op],
        });
        await awaitTrxConfirmation(transactionId);
        try {
          await refreshAfterBroadcast(router, () =>
            revalidateNotificationSettingsAfterBroadcast(username),
          );
        } catch {
          // Broadcast succeeded; cache refresh is best-effort.
        }
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
    [oslCustomJsonId, router, username],
  );

  return { save, pending, error, setError, clearError: () => setError(null) };
}
