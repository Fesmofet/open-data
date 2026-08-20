'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { buildOslMessageCreateOp } from '@opden-data-layer/hive-broadcast';

import { useOslCustomJsonId } from '@/config/odl-network-provider';
import { getWalletFacade, useHydrateWalletProvider } from '@/modules/auth';
import { awaitTrxConfirmation } from '@/modules/notifications';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateUserFeedAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

import {
  buildEncryptedMessageCreatePayload,
} from '../domain/messaging.helpers';
import type { SendEncryptedMessageInput, SendMessageTarget } from '../domain/messaging.types';
import { markChannelReadAction } from '../infrastructure/messaging.actions';

export function useSendEncryptedMessage(options: {
  viewerUsername: string | null;
  onRequireLogin?: () => void;
  onSent?: () => void;
  markReadChannelId?: string | null;
  revalidateAccountName?: string | null;
}) {
  useHydrateWalletProvider();
  const oslCustomJsonId = useOslCustomJsonId();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const sendEncryptedMessage = useCallback(
    async (target: SendMessageTarget, encrypted: SendEncryptedMessageInput) => {
      const account = options.viewerUsername?.trim();
      if (!account) {
        options.onRequireLogin?.();
        return false;
      }
      if (pending) {
        return false;
      }
      setPending(true);
      try {
        const payload = buildEncryptedMessageCreatePayload({
          channelId: 'channelId' in target ? target.channelId : undefined,
          peer: 'peer' in target ? target.peer : undefined,
          ciphertext: encrypted.ciphertext,
          mode: encrypted.mode,
          to: encrypted.to,
        });
        const op = buildOslMessageCreateOp({
          id: oslCustomJsonId,
          creator: account,
          payload,
        });
        const { transactionId } = await getWalletFacade().broadcast({
          operations: [op],
        });
        await awaitTrxConfirmation(transactionId);
        const channelId = 'channelId' in target ? target.channelId : options.markReadChannelId;
        if (channelId) {
          const nowUnix = Math.floor(Date.now() / 1000);
          await markChannelReadAction(channelId, nowUnix);
        }
        const revalidateName = options.revalidateAccountName?.trim();
        await refreshAfterBroadcast(router, () =>
          revalidateName
            ? revalidateUserFeedAfterBroadcast(revalidateName)
            : Promise.resolve(),
        );
        options.onSent?.();
        return true;
      } catch {
        return false;
      } finally {
        setPending(false);
      }
    },
    [oslCustomJsonId, options, pending, router],
  );

  return { sendEncryptedMessage, pendingEncrypted: pending };
}
