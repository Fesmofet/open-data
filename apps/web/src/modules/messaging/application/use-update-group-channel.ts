'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { buildOslChannelUpdateOp } from '@opden-data-layer/hive-broadcast';

import { useOslCustomJsonId } from '@/config/odl-network-provider';
import { getWalletFacade, useHydrateWalletProvider } from '@/modules/auth';
import { awaitTrxConfirmation } from '@/modules/notifications';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateMessagingAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

import { buildChannelUpdatePayload } from '../domain/messaging.helpers';

export function useUpdateGroupChannel(options: {
  viewerUsername: string | null;
  onRequireLogin?: () => void;
  revalidateAccountName?: string | null;
  onUpdated?: (input: { channelId: string; title?: string; imageCid?: string }) => void;
}) {
  useHydrateWalletProvider();
  const oslCustomJsonId = useOslCustomJsonId();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const updateGroupChannel = useCallback(
    async (input: {
      channelId: string;
      title?: string;
      imageCid?: string;
    }) => {
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
        const payload = buildChannelUpdatePayload({
          channelId: input.channelId,
          title: input.title,
          imageCid: input.imageCid,
        });
        const op = buildOslChannelUpdateOp({
          id: oslCustomJsonId,
          admin: account,
          payload,
        });
        const { transactionId } = await getWalletFacade().broadcast({
          operations: [op],
        });
        await awaitTrxConfirmation(transactionId);
        const revalidateName = options.revalidateAccountName?.trim();
        await refreshAfterBroadcast(router, () =>
          revalidateName
            ? revalidateMessagingAfterBroadcast(revalidateName, input.channelId)
            : Promise.resolve(),
        );
        options.onUpdated?.(input);
        return true;
      } catch {
        return false;
      } finally {
        setPending(false);
      }
    },
    [oslCustomJsonId, options, pending, router],
  );

  return { updateGroupChannel, pending };
}
