'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { buildOslChannelCreateOp } from '@opden-data-layer/hive-broadcast';

import { useOslCustomJsonId } from '@/config/odl-network-provider';
import { getWalletFacade, useHydrateWalletProvider } from '@/modules/auth';
import { awaitTrxConfirmation } from '@/modules/notifications';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateMessagingAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

import {
  buildGroupChannelCreatePayload,
  generateGroupChannelId,
} from '../domain/messaging.helpers';

export function useCreateGroupChannel(options: {
  viewerUsername: string | null;
  onRequireLogin?: () => void;
  revalidateAccountName?: string | null;
}) {
  useHydrateWalletProvider();
  const oslCustomJsonId = useOslCustomJsonId();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const createGroupChannel = useCallback(
    async (input: { members: string[]; title?: string }) => {
      const account = options.viewerUsername?.trim();
      if (!account) {
        options.onRequireLogin?.();
        return null;
      }
      if (input.members.length === 0 || pending) {
        return null;
      }
      setPending(true);
      try {
        const channelId = generateGroupChannelId();
        const payload = buildGroupChannelCreatePayload({
          channelId,
          members: input.members,
          title: input.title,
          viewerUsername: account,
        });
        const op = buildOslChannelCreateOp({
          id: oslCustomJsonId,
          creator: account,
          payload,
        });
        const { transactionId } = await getWalletFacade().broadcast({
          operations: [op],
        });
        await awaitTrxConfirmation(transactionId);
        const revalidateName = options.revalidateAccountName?.trim();
        await refreshAfterBroadcast(router, () =>
          revalidateName
            ? revalidateMessagingAfterBroadcast(revalidateName, channelId)
            : Promise.resolve(),
        );
        return channelId;
      } catch {
        return null;
      } finally {
        setPending(false);
      }
    },
    [oslCustomJsonId, options, pending, router],
  );

  return { createGroupChannel, pending };
}
