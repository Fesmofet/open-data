'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { useLoginModal } from '@/modules/auth';

import { useSendMessage } from '../application/use-send-message';
import { useCreateGroupChannel } from '../application/use-create-group-channel';
import {
  buildOptimisticGroupChannelDetail,
  buildOptimisticGroupChannelListItem,
  mergeChannelListItems,
} from '../domain/messaging.helpers';
import type {
  ChannelDetail,
  ChannelListPage,
  MessageHistoryPage,
  MessageItem,
} from '../domain/messaging.types';
import {
  loadOlderChannelMessagesAction,
  markChannelReadAction,
} from '../infrastructure/messaging.actions';
import { MessagingChannelAbout } from './messaging-channel-about';
import { MessagingChannelList } from './messaging-channel-list';
import { MessagingComposeBar } from './messaging-compose-bar';
import { MessagingLayout } from './messaging-layout';
import { MessagingMessageList } from './messaging-message-list';
import { NewMessageModal } from './new-message-modal';

export type MessagingInboxClientProps = {
  viewerUsername: string;
  accountName: string;
  initialChannels: ChannelListPage;
  initialChannelId: string | null;
  initialPeer: string | null;
  initialMessages: MessageHistoryPage;
  initialChannelDetail: ChannelDetail | null;
  /** Desktop: channel list renders in profile left column (@leftSidebar). */
  listInLeftRail?: boolean;
};

export function MessagingInboxClient({
  viewerUsername,
  accountName,
  initialChannels,
  initialChannelId,
  initialPeer,
  initialMessages,
  initialChannelDetail,
  listInLeftRail = true,
}: MessagingInboxClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { openLogin } = useLoginModal();
  const [channels, setChannels] = useState(initialChannels.items);
  const [activeChannelId, setActiveChannelId] = useState(initialChannelId);
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages.items);
  const [messagesCursor, setMessagesCursor] = useState(initialMessages.cursor);
  const [hasMoreMessages, setHasMoreMessages] = useState(initialMessages.hasMore);
  const [channelDetail, setChannelDetail] = useState<ChannelDetail | null>(
    initialChannelDetail,
  );
  const [mobileView, setMobileView] = useState<'list' | 'chat'>(() =>
    initialChannelId || initialPeer ? 'chat' : 'list',
  );
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [pendingPeer, setPendingPeer] = useState<string | null>(initialPeer);
  const [loadingOlder, startOlderTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);

  const refreshAfterSend = useCallback(() => {
    router.refresh();
  }, [router]);

  const { sendMessage, pending } = useSendMessage({
    viewerUsername,
    onRequireLogin: openLogin,
    revalidateAccountName: viewerUsername,
    onSent: refreshAfterSend,
  });

  const { createGroupChannel, pending: groupCreatePending } = useCreateGroupChannel({
    viewerUsername,
    onRequireLogin: openLogin,
    revalidateAccountName: viewerUsername,
  });

  const handleStartChat = useCallback(
    async (input: { peers: string[]; title?: string }) => {
      if (input.peers.length === 0) {
        return;
      }
      if (input.peers.length === 1) {
        const params = new URLSearchParams();
        params.set('peer', input.peers[0]!);
        router.push(`/@${accountName}/messages?${params.toString()}`);
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
      const optimisticListItem = buildOptimisticGroupChannelListItem({
        channelId,
        members: input.peers,
        viewerUsername,
        title: input.title,
      });
      const optimisticDetail = buildOptimisticGroupChannelDetail({
        channelId,
        members: input.peers,
        viewerUsername,
        title: input.title,
      });
      setChannels((prev) => mergeChannelListItems([optimisticListItem], prev));
      setActiveChannelId(channelId);
      setChannelDetail(optimisticDetail);
      setPendingPeer(null);
      setMessages([]);
      setMessagesCursor(null);
      setHasMoreMessages(false);
      setMobileView('chat');
      const params = new URLSearchParams();
      params.set('channel', channelId);
      router.push(`/@${accountName}/messages?${params.toString()}`);
      router.refresh();
      setNewMessageOpen(false);
    },
    [accountName, createGroupChannel, router, viewerUsername],
  );

  useEffect(() => {
    setChannels((prev) => mergeChannelListItems(initialChannels.items, prev));
  }, [initialChannels.items]);

  useEffect(() => {
    setPendingPeer(initialPeer);
    if (initialPeer) {
      setMobileView('chat');
      setChannelDetail({
        channel_id: '',
        kind: 'direct',
        creator: viewerUsername,
        title: null,
        image: null,
        object_id: null,
        access: 'members_only',
        display_title: initialPeer,
        list_title: null,
        peer: initialPeer,
        members: [viewerUsername, initialPeer],
      });
    }
  }, [initialPeer, viewerUsername]);

  useEffect(() => {
    setMessages(initialMessages.items);
    setMessagesCursor(initialMessages.cursor);
    setHasMoreMessages(initialMessages.hasMore);
    if (initialChannelId) {
      setActiveChannelId(initialChannelId);
      setChannelDetail(initialChannelDetail);
      setPendingPeer(null);
      setMobileView('chat');
    }
  }, [
    initialChannelDetail,
    initialChannelId,
    initialMessages.cursor,
    initialMessages.hasMore,
    initialMessages.items,
  ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeChannelId]);

  const markReadForMessages = useCallback(
    async (items: MessageItem[]) => {
      if (!activeChannelId || items.length === 0) {
        return;
      }
      const latest = items.reduce(
        (max, item) => (item.created_at_unix > max ? item.created_at_unix : max),
        items[0]?.created_at_unix ?? 0,
      );
      if (latest > 0) {
        await markChannelReadAction(activeChannelId, latest);
      }
    },
    [activeChannelId],
  );

  useEffect(() => {
    if (initialMessages.items.length > 0 && activeChannelId) {
      void markReadForMessages(initialMessages.items);
    }
  }, [activeChannelId, initialMessages.items, markReadForMessages]);

  const selectChannel = useCallback(
    (channelId: string) => {
      setActiveChannelId(channelId);
      setPendingPeer(null);
      setMobileView('chat');
      const params = new URLSearchParams();
      params.set('channel', channelId);
      router.push(`/@${accountName}/messages?${params.toString()}`);
    },
    [accountName, router],
  );

  const mobileList = (
    <MessagingChannelList
      channels={channels}
      activeChannelId={activeChannelId}
      onSelectChannel={selectChannel}
      onNewMessage={() => setNewMessageOpen(true)}
    />
  );

  const loadOlder = useCallback(() => {
    if (!activeChannelId || !messagesCursor || loadingOlder) {
      return;
    }
    startOlderTransition(async () => {
      const page = await loadOlderChannelMessagesAction(activeChannelId, messagesCursor);
      setMessages((prev) => [...page.items, ...prev]);
      setMessagesCursor(page.cursor);
      setHasMoreMessages(page.hasMore);
    });
  }, [activeChannelId, loadingOlder, messagesCursor]);

  useEffect(() => {
    const node = topSentinelRef.current;
    if (!node || !hasMoreMessages) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadOlder();
        }
      },
      { rootMargin: '100px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMoreMessages, loadOlder]);

  const activeChannel = channels.find((c) => c.channel_id === activeChannelId) ?? null;
  const chatTitle =
    channelDetail?.display_title ??
    activeChannel?.display_title ??
    t('messaging_select_chat');

  const onSend = useCallback(
    async (body: string) => {
      if (pendingPeer) {
        const ok = await sendMessage({ peer: pendingPeer }, body);
        if (ok) {
          setPendingPeer(null);
        }
        return;
      }
      if (!activeChannelId) {
        return;
      }
      await sendMessage({ channelId: activeChannelId }, body);
    },
    [activeChannelId, pendingPeer, sendMessage],
  );

  const showAuthorNames = channelDetail?.kind === 'group';

  return (
    <>
      <MessagingLayout
        mobileView={mobileView}
        onMobileBack={() => setMobileView('list')}
        list={mobileList}
        listDesktopHidden={listInLeftRail}
        chat={
          activeChannelId || pendingPeer ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="border-b border-border px-4 py-3">
                <h3 className="truncate font-weight-strong text-fg">{chatTitle}</h3>
                {channelDetail?.members.length ? (
                  <p className="text-caption text-muted">
                    {t('messaging_members_count').replace(
                      '{count}',
                      String(channelDetail.members.length),
                    )}
                  </p>
                ) : null}
              </div>
              <MessagingMessageList
                messages={messages}
                viewerUsername={viewerUsername}
                showAuthorNames={showAuthorNames}
                topSentinelRef={topSentinelRef}
                loadingOlder={loadingOlder}
              />
              <div ref={bottomRef} aria-hidden className="h-px" />
              <MessagingComposeBar
                pending={pending}
                onSend={onSend}
                onRequireLogin={openLogin}
              />
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-body-sm text-muted">
              {t('messaging_select_chat')}
            </div>
          )
        }
        about={
          listInLeftRail
            ? undefined
            : channelDetail
              ? (
                  <MessagingChannelAbout channel={channelDetail} />
                )
              : undefined
        }
      />
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
