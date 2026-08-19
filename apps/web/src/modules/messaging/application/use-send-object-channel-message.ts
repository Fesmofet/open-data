'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  buildOslChannelCreateOp,
  buildOslMessageCreateOp,
} from '@opden-data-layer/hive-broadcast';

import { useOslCustomJsonId } from '@/config/odl-network-provider';
import { getWalletFacade, useHydrateWalletProvider } from '@/modules/auth';
import { awaitTrxConfirmation } from '@/modules/notifications';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateObjectAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

import {
  buildMessageCreatePayload,
  buildObjectChannelCreatePayload,
} from '../domain/messaging.helpers';

export function useSendObjectChannelMessage(options: {
  viewerUsername: string | null;
  objectId: string;
  objectName: string;
  channelId: string;
  channelExists: boolean;
  onRequireLogin?: () => void;
  onBootstrapComplete?: () => void;
}) {
  useHydrateWalletProvider();
  const oslCustomJsonId = useOslCustomJsonId();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [channelExists, setChannelExists] = useState(options.channelExists);

  const sendMessage = useCallback(
    async (body: string) => {
      const account = options.viewerUsername?.trim();
      if (!account) {
        options.onRequireLogin?.();
        return false;
      }
      const trimmed = body.trim();
      if (trimmed.length === 0 || pending) {
        return false;
      }
      setPending(true);
      try {
        const messagePayload = buildMessageCreatePayload({
          channelId: options.channelId,
          body: trimmed,
        });
        const messageOp = buildOslMessageCreateOp({
          id: oslCustomJsonId,
          creator: account,
          payload: messagePayload,
        });
        const operations = channelExists
          ? [messageOp]
          : [
              buildOslChannelCreateOp({
                id: oslCustomJsonId,
                creator: account,
                payload: buildObjectChannelCreatePayload({
                  objectId: options.objectId,
                  objectName: options.objectName,
                }),
              }),
              messageOp,
            ];
        const { transactionId } = await getWalletFacade().broadcast({
          operations,
        });
        await awaitTrxConfirmation(transactionId);
        if (!channelExists) {
          setChannelExists(true);
          options.onBootstrapComplete?.();
        }
        await refreshAfterBroadcast(router, () =>
          revalidateObjectAfterBroadcast(options.objectId),
        );
        return true;
      } catch {
        return false;
      } finally {
        setPending(false);
      }
    },
    [channelExists, oslCustomJsonId, options, pending, router],
  );

  return { sendMessage, pending, channelExists };
}
