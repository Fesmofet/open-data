'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  buildMessageUpdatePayload,
  buildOslMessageUpdateOp,
} from '@opden-data-layer/hive-broadcast';

import { useOslCustomJsonId } from '@/config/odl-network-provider';
import { getWalletFacade, useHydrateWalletProvider } from '@/modules/auth';
import { awaitTrxConfirmation } from '@/modules/notifications';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateUserFeedAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

export function useUpdateMessage(options: {
  viewerUsername: string | null;
  onRequireLogin?: () => void;
  revalidateAccountName?: string | null;
  revalidateAfterBroadcast?: () => Promise<void>;
  onUpdated?: (input: {
    messageId: string;
    body: string;
    updatedAtUnix: number;
  }) => void;
}) {
  useHydrateWalletProvider();
  const oslCustomJsonId = useOslCustomJsonId();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const updateMessage = useCallback(
    async (input: { channelId: string; messageId: string; body: string }) => {
      const account = options.viewerUsername?.trim();
      if (!account) {
        options.onRequireLogin?.();
        return false;
      }
      const trimmed = input.body.trim();
      if (trimmed.length === 0 || pending) {
        return false;
      }
      setPending(true);
      try {
        const payload = buildMessageUpdatePayload({
          channelId: input.channelId,
          messageId: input.messageId,
          body: trimmed,
        });
        const op = buildOslMessageUpdateOp({
          id: oslCustomJsonId,
          creator: account,
          payload,
        });
        const { transactionId } = await getWalletFacade().broadcast({
          operations: [op],
        });
        await awaitTrxConfirmation(transactionId);
        const updatedAtUnix = Math.floor(Date.now() / 1000);
        options.onUpdated?.({
          messageId: input.messageId,
          body: trimmed,
          updatedAtUnix,
        });
        const revalidateName = options.revalidateAccountName?.trim();
        await refreshAfterBroadcast(router, () =>
          options.revalidateAfterBroadcast
            ? options.revalidateAfterBroadcast()
            : revalidateName
              ? revalidateUserFeedAfterBroadcast(revalidateName)
              : Promise.resolve(),
        );
        return true;
      } catch {
        return false;
      } finally {
        setPending(false);
      }
    },
    [oslCustomJsonId, options, pending, router],
  );

  return { updateMessage, pending };
}
