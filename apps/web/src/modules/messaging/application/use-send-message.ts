'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { buildOslMessageCreateOp } from '@opden-data-layer/hive-broadcast';

import { useOslCustomJsonId } from '@/config/odl-network-provider';
import { getWalletFacade, useHydrateWalletProvider } from '@/modules/auth';
import { awaitTrxConfirmation } from '@/modules/notifications';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateUserFeedAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

import { buildMessageCreatePayload } from '../domain/messaging.helpers';
import type { SendMessageTarget } from '../domain/messaging.types';
import { markChannelReadAction } from '../infrastructure/messaging.actions';

export function useSendMessage(options: {
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

  const sendMessage = useCallback(
    async (target: SendMessageTarget, body: string) => {
      const account = options.viewerUsername?.trim();
      if (!account) {
        options.onRequireLogin?.();
        return false;
      }
      const trimmed = body.trim();
      if (trimmed.length === 0) {
        return false;
      }
      if (pending) {
        return false;
      }
      setPending(true);
      try {
        const payload = buildMessageCreatePayload({
          channelId: 'channelId' in target ? target.channelId : undefined,
          peer: 'peer' in target ? target.peer : undefined,
          body: trimmed,
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
    [
      oslCustomJsonId,
      options,
      pending,
      router,
    ],
  );

  return { sendMessage, pending };
}
