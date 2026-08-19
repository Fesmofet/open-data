'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  buildOslChannelLeaveOp,
} from '@opden-data-layer/hive-broadcast';

import { useOslCustomJsonId } from '@/config/odl-network-provider';
import { getWalletFacade, useHydrateWalletProvider } from '@/modules/auth';
import { awaitTrxConfirmation } from '@/modules/notifications';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateMessagingAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

import { buildChannelLeavePayload } from '../domain/messaging.helpers';

export function useLeaveGroupChannel(options: {
  viewerUsername: string | null;
  onRequireLogin?: () => void;
  revalidateAccountName?: string | null;
  onLeft?: (channelId: string) => void;
}) {
  useHydrateWalletProvider();
  const oslCustomJsonId = useOslCustomJsonId();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const leaveGroupChannel = useCallback(
    async (input: {
      channelId: string;
      successorAdmin?: string;
      deleteMyMessages?: boolean;
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
        const payload = buildChannelLeavePayload({
          channelId: input.channelId,
          successorAdmin: input.successorAdmin,
          deleteMyMessages: input.deleteMyMessages,
        });
        const op = buildOslChannelLeaveOp({
          id: oslCustomJsonId,
          leaver: account,
          payload,
        });
        const { transactionId } = await getWalletFacade().broadcast({
          operations: [op],
        });
        await awaitTrxConfirmation(transactionId);
        options.onLeft?.(input.channelId);
        const revalidateName = options.revalidateAccountName?.trim();
        await refreshAfterBroadcast(router, () =>
          revalidateName
            ? revalidateMessagingAfterBroadcast(revalidateName, input.channelId)
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

  return { leaveGroupChannel, pending };
}
