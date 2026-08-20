'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { useLoginModal } from '@/modules/auth';

import { useSendObjectChannelMessage } from '../application/use-send-object-channel-message';
import type { ChannelDetail, MessageHistoryPage, MessageItem } from '../domain/messaging.types';
import { loadOlderObjectChannelMessagesAction } from '../infrastructure/messaging.actions';
import { MessagingComposeBar } from './messaging-compose-bar';
import { MessagingLayout } from './messaging-layout';
import { MessagingMessageList } from './messaging-message-list';

export type ObjectChannelMessagesClientProps = {
  objectId: string;
  objectName: string;
  viewerUsername: string | null;
  channel: ChannelDetail;
  channelExists: boolean;
  initialMessages: MessageHistoryPage;
};

export function ObjectChannelMessagesClient({
  objectId,
  objectName,
  viewerUsername,
  channel,
  channelExists: initialChannelExists,
  initialMessages,
}: ObjectChannelMessagesClientProps) {
  const { t } = useI18n();
  const { openLogin } = useLoginModal();
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages.items);
  const [messagesCursor, setMessagesCursor] = useState(initialMessages.cursor);
  const [hasMoreMessages, setHasMoreMessages] = useState(initialMessages.hasMore);
  const [loadingOlder, startOlderTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);

  const { sendMessage, sendEncryptedMessage, pending } = useSendObjectChannelMessage({
    viewerUsername,
    objectId,
    objectName,
    channelId: channel.channel_id,
    channelExists: initialChannelExists,
    onRequireLogin: openLogin,
  });

  useEffect(() => {
    setMessages(initialMessages.items);
    setMessagesCursor(initialMessages.cursor);
    setHasMoreMessages(initialMessages.hasMore);
  }, [initialMessages.cursor, initialMessages.hasMore, initialMessages.items]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const loadOlder = useCallback(() => {
    if (!messagesCursor || loadingOlder) {
      return;
    }
    startOlderTransition(async () => {
      const page = await loadOlderObjectChannelMessagesAction(objectId, messagesCursor);
      setMessages((prev) => [...page.items, ...prev]);
      setMessagesCursor(page.cursor);
      setHasMoreMessages(page.hasMore);
    });
  }, [loadingOlder, messagesCursor, objectId]);

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

  const title = channel.display_title ?? objectName;

  return (
    <MessagingLayout
      chat={
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-border px-4 py-3">
            <h3 className="truncate font-weight-strong text-fg">{title}</h3>
            <p className="text-caption text-muted">
              {t('messaging_object_channel_subtitle')}
            </p>
          </div>
          <MessagingMessageList
            messages={messages}
            viewerUsername={viewerUsername}
            showAuthorNames
            topSentinelRef={topSentinelRef}
            loadingOlder={loadingOlder}
          />
          <div ref={bottomRef} aria-hidden className="h-px" />
          <MessagingComposeBar
            channelKind="object"
            members={channel.members.map((member) => member.account)}
            viewerUsername={viewerUsername}
            disabled={!viewerUsername}
            pending={pending}
            pendingEncrypted={pending}
            onSendPlain={async (body) => {
              await sendMessage(body);
            }}
            onSendEncrypted={sendEncryptedMessage}
            onRequireLogin={openLogin}
          />
        </div>
      }
    />
  );
}
