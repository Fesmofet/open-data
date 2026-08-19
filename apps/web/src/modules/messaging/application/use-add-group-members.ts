'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { buildOslChannelMemberAddOp } from '@opden-data-layer/hive-broadcast';

import { useOslCustomJsonId } from '@/config/odl-network-provider';
import { getWalletFacade, useHydrateWalletProvider } from '@/modules/auth';
import { awaitTrxConfirmation } from '@/modules/notifications';
import { refreshAfterBroadcast } from '@/shared/infrastructure/query/refresh-after-broadcast';
import { revalidateMessagingAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

import { buildChannelMemberAddPayload } from '../domain/messaging.helpers';
import {
  validateChannelMembers,
  type ValidateMemberResult,
} from '../infrastructure/messaging-validate.client';

export function useAddGroupMembers(options: {
  viewerUsername: string | null;
  onRequireLogin?: () => void;
  revalidateAccountName?: string | null;
  onAdded?: (input: { channelId: string; accounts: string[] }) => void;
}) {
  useHydrateWalletProvider();
  const oslCustomJsonId = useOslCustomJsonId();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const addGroupMembers = useCallback(
    async (input: { channelId: string; accounts: string[] }) => {
      const account = options.viewerUsername?.trim();
      if (!account) {
        options.onRequireLogin?.();
        return false;
      }
      if (pending) {
        return false;
      }

      const uniqueAccounts = [
        ...new Set(
          input.accounts.map((name) => name.trim()).filter((name) => name.length > 0),
        ),
      ];
      if (uniqueAccounts.length === 0) {
        return false;
      }

      setPending(true);
      try {
        const validation = await validateChannelMembers(
          input.channelId,
          account,
          uniqueAccounts,
        );
        const addable = (validation?.results ?? []).filter(
          (row: ValidateMemberResult) => row.addable,
        );
        if (addable.length === 0) {
          return false;
        }

        const operations = addable.map((row) =>
          buildOslChannelMemberAddOp({
            id: oslCustomJsonId,
            admin: account,
            payload: buildChannelMemberAddPayload({
              channelId: input.channelId,
              account: row.account,
            }),
          }),
        );

        const { transactionId } = await getWalletFacade().broadcast({ operations });
        await awaitTrxConfirmation(transactionId);
        const revalidateName = options.revalidateAccountName?.trim();
        await refreshAfterBroadcast(router, () =>
          revalidateName
            ? revalidateMessagingAfterBroadcast(revalidateName, input.channelId)
            : Promise.resolve(),
        );
        options.onAdded?.({
          channelId: input.channelId,
          accounts: addable.map((row) => row.account),
        });
        return true;
      } catch {
        return false;
      } finally {
        setPending(false);
      }
    },
    [oslCustomJsonId, options, pending, router],
  );

  return { addGroupMembers, pending };
}
