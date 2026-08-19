'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useLoginModal } from '@/modules/auth';

import { useCreateGroupChannel } from '../application/use-create-group-channel';
import {
  buildOptimisticGroupChannelListItem,
  mergeChannelListItems,
} from '../domain/messaging.helpers';
import type { ChannelListItem } from '../domain/messaging.types';
import { MESSAGING_CARD_SHELL_CLASS } from './messaging-layout.constants';
import { MessagingChannelList } from './messaging-channel-list';
import { MessagingViewportShell } from './messaging-viewport-shell';
import { NewMessageModal } from './new-message-modal';

export type MessagingChannelListRailProps = {
  accountName: string;
  viewerUsername: string;
  channels: ChannelListItem[];
  activeChannelId: string | null;
};

export function MessagingChannelListRail({
  accountName,
  viewerUsername,
  channels: channelsProp,
  activeChannelId,
}: MessagingChannelListRailProps) {
  const router = useRouter();
  const { openLogin } = useLoginModal();
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [channels, setChannels] = useState(channelsProp);
  const basePath = `/@${accountName}/messages`;

  useEffect(() => {
    setChannels((prev) => mergeChannelListItems(channelsProp, prev));
  }, [channelsProp]);

  const prependGroupChannel = useCallback((item: ChannelListItem) => {
    setChannels((prev) => mergeChannelListItems([item], prev));
  }, []);

  const { createGroupChannel, pending: groupCreatePending } = useCreateGroupChannel({
    viewerUsername,
    onRequireLogin: openLogin,
    revalidateAccountName: viewerUsername,
  });

  const onSelectChannel = useCallback(
    (channelId: string) => {
      const params = new URLSearchParams();
      params.set('channel', channelId);
      router.push(`${basePath}?${params.toString()}`);
    },
    [basePath, router],
  );

  const handleStartChat = useCallback(
    async (input: { peers: string[]; title?: string }) => {
      if (input.peers.length === 0) {
        return;
      }
      if (input.peers.length === 1) {
        const params = new URLSearchParams();
        params.set('peer', input.peers[0]!);
        router.push(`${basePath}?${params.toString()}`);
        setNewMessageOpen(false);
        return;
      }
      const channelId = await createGroupChannel({
        members: input.peers,
        title: input.title,
      });
      if (!channelId) {
        return;
      }
      prependGroupChannel(
        buildOptimisticGroupChannelListItem({
          channelId,
          members: input.peers,
          viewerUsername,
          title: input.title,
        }),
      );
      const params = new URLSearchParams();
      params.set('channel', channelId);
      router.push(`${basePath}?${params.toString()}`);
      router.refresh();
      setNewMessageOpen(false);
    },
    [basePath, createGroupChannel, prependGroupChannel, router, viewerUsername],
  );

  return (
    <>
      <MessagingViewportShell>
        <div className={MESSAGING_CARD_SHELL_CLASS}>
          <MessagingChannelList
            variant="rail"
            channels={channels}
            activeChannelId={activeChannelId}
            onSelectChannel={onSelectChannel}
            onNewMessage={() => setNewMessageOpen(true)}
          />
        </div>
      </MessagingViewportShell>
      <NewMessageModal
        open={newMessageOpen}
        onClose={() => setNewMessageOpen(false)}
        viewerUsername={viewerUsername}
        pending={groupCreatePending}
        onStartChat={handleStartChat}
      />
    </>
  );
}
