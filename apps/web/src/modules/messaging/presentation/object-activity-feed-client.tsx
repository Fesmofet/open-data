'use client';

import { useCallback, useState, useTransition } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { useLoginModal } from '@/modules/auth';
import { useInfiniteScroll, useSyncedPaginatedList } from '@/shared/presentation';
import { revalidateObjectAfterBroadcast } from '@/shared/infrastructure/query/revalidate-after-broadcast.server';

import { useDeleteMessage } from '../application/use-delete-message';
import { useSendObjectChannelMessage } from '../application/use-send-object-channel-message';
import { useUpdateMessage } from '../application/use-update-message';
import { buildReplyQuoteJson } from '../domain/messaging.helpers';
import type { ChannelDetail, MessageHistoryPage, MessageItem, MessagingComposeIntent } from '../domain/messaging.types';
import { loadOlderObjectChannelMessagesAction } from '../infrastructure/messaging.actions';
import { ObjectActivityComposeBar } from './object-activity-compose-bar';
import { ObjectActivityFeedList } from './object-activity-feed-list';

export type ObjectActivityFeedClientProps = {
  objectId: string;
  objectName: string;
  viewerUsername: string | null;
  channel: ChannelDetail;
  channelExists: boolean;
  initialMessages: MessageHistoryPage;
};

export function ObjectActivityFeedClient({
  objectId,
  objectName,
  viewerUsername,
  channel,
  channelExists: initialChannelExists,
  initialMessages,
}: ObjectActivityFeedClientProps) {
  const { t } = useI18n();
  const { openLogin } = useLoginModal();
  const { items, setItems, cursor, setCursor, hasMore, setHasMore } =
    useSyncedPaginatedList(initialMessages);
  const [loadingMore, startLoadMore] = useTransition();
  const [composeIntent, setComposeIntent] = useState<MessagingComposeIntent>(null);
  const [composeEditorKey, setComposeEditorKey] = useState(0);

  const revalidateObject = useCallback(
    () => revalidateObjectAfterBroadcast(objectId),
    [objectId],
  );

  const { sendMessage, pending } = useSendObjectChannelMessage({
    viewerUsername,
    objectId,
    objectName,
    channelId: channel.channel_id,
    channelExists: initialChannelExists,
    onRequireLogin: openLogin,
  });

  const { updateMessage, pending: updatePending } = useUpdateMessage({
    viewerUsername,
    onRequireLogin: openLogin,
    revalidateAfterBroadcast: revalidateObject,
    onUpdated: ({ messageId, body, updatedAtUnix }) => {
      setItems((prev) =>
        prev.map((message) =>
          message.message_id === messageId
            ? { ...message, body, updated_at_unix: updatedAtUnix }
            : message,
        ),
      );
    },
  });

  const { deleteMessage } = useDeleteMessage({
    viewerUsername,
    onRequireLogin: openLogin,
    revalidateAfterBroadcast: revalidateObject,
    onDeleted: (messageId) => {
      setItems((prev) => prev.filter((message) => message.message_id !== messageId));
    },
  });

  const onLoadMore = useCallback(() => {
    if (!cursor || loadingMore) {
      return;
    }
    startLoadMore(async () => {
      const page = await loadOlderObjectChannelMessagesAction(objectId, cursor);
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    });
  }, [cursor, loadingMore, objectId, setCursor, setHasMore, setItems]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: loadingMore,
    onLoadMore,
  });

  const handleSend = useCallback(
    async (body: string, originalCreatedAtUnix: number | null): Promise<boolean> => {
      if (composeIntent?.mode === 'edit') {
        const ok = await updateMessage({
          channelId: channel.channel_id,
          messageId: composeIntent.message.message_id,
          body,
        });
        if (ok) {
          setComposeIntent(null);
          setComposeEditorKey((key) => key + 1);
        }
        return ok;
      }

      const reply =
        composeIntent?.mode === 'reply'
          ? {
              replyTo: composeIntent.message.message_id,
              quoteJson: buildReplyQuoteJson(composeIntent.message),
            }
          : undefined;

      const ok = await sendMessage(body, originalCreatedAtUnix, reply);
      if (ok) {
        setComposeIntent(null);
        setComposeEditorKey((key) => key + 1);
      }
      return ok;
    },
    [channel.channel_id, composeIntent, sendMessage, updateMessage],
  );

  const handleReply = useCallback((message: MessageItem) => {
    setComposeIntent({ mode: 'reply', message });
    setComposeEditorKey((key) => key + 1);
  }, []);

  const handleEdit = useCallback((message: MessageItem) => {
    setComposeIntent({ mode: 'edit', message });
    setComposeEditorKey((key) => key + 1);
  }, []);

  const handleDelete = useCallback(
    async (message: MessageItem) => {
      await deleteMessage({
        channelId: channel.channel_id,
        messageId: message.message_id,
      });
    },
    [channel.channel_id, deleteMessage],
  );

  return (
    <section aria-label={objectName}>
      <ObjectActivityComposeBar
        objectName={objectName}
        viewerUsername={viewerUsername}
        pending={pending || updatePending}
        editorKey={composeEditorKey}
        composeIntent={composeIntent}
        onDismissComposeIntent={() => {
          setComposeIntent(null);
          setComposeEditorKey((key) => key + 1);
        }}
        initialBody={
          composeIntent?.mode === 'edit'
            ? composeIntent.message.body ?? undefined
            : undefined
        }
        sendAriaLabel={
          composeIntent?.mode === 'edit' ? t('messaging_edit_save') : undefined
        }
        onSend={handleSend}
        onRequireLogin={openLogin}
      />
      <ObjectActivityFeedList
        messages={items}
        viewerUsername={viewerUsername}
        loadingMore={loadingMore}
        sentinelRef={sentinelRef}
        onReply={handleReply}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </section>
  );
}
