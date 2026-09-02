'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  buildMessageDeletePayload,
  buildOslMessageDeleteOp,
} from '@opden-data-layer/hive-broadcast';

import { useOslCustomJsonId } from '@/config/odl-network-provider';
import { getWalletFacade, useHydrateWalletProvider } from '@/modules/auth';
import { awaitTrxConfirmation } from '@/modules/notifications';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateUserFeedAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

export function useDeleteMessage(options: {
  viewerUsername: string | null;
  onRequireLogin?: () => void;
  revalidateAccountName?: string | null;
  revalidateAfterBroadcast?: () => Promise<void>;
  onDeleted?: (messageId: string) => void;
}) {
  useHydrateWalletProvider();
  const oslCustomJsonId = useOslCustomJsonId();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const deleteMessage = useCallback(
    async (input: { channelId: string; messageId: string }) => {
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
        const payload = buildMessageDeletePayload({
          channelId: input.channelId,
          messageId: input.messageId,
        });
        const op = buildOslMessageDeleteOp({
          id: oslCustomJsonId,
          creator: account,
          payload,
        });
        const { transactionId } = await getWalletFacade().broadcast({
          operations: [op],
        });
        await awaitTrxConfirmation(transactionId);
        options.onDeleted?.(input.messageId);
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

  return { deleteMessage, pending };
}
