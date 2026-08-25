'use client';

import { useCallback, useTransition } from 'react';

import { useLoginModal } from '@/modules/auth';
import { useInfiniteScroll, useSyncedPaginatedList } from '@/shared/presentation';

import { useSendObjectChannelMessage } from '../application/use-send-object-channel-message';
import type { ChannelDetail, MessageHistoryPage } from '../domain/messaging.types';
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
  const { openLogin } = useLoginModal();
  const { items, setItems, cursor, setCursor, hasMore, setHasMore } =
    useSyncedPaginatedList(initialMessages);
  const [loadingMore, startLoadMore] = useTransition();

  const { sendMessage, pending } = useSendObjectChannelMessage({
    viewerUsername,
    objectId,
    objectName,
    channelId: channel.channel_id,
    channelExists: initialChannelExists,
    onRequireLogin: openLogin,
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

  return (
    <section aria-label={objectName}>
      <ObjectActivityComposeBar
        objectName={objectName}
        viewerUsername={viewerUsername}
        pending={pending}
        onSend={async (body) => {
          await sendMessage(body);
        }}
        onRequireLogin={openLogin}
      />
      <ObjectActivityFeedList
        messages={items}
        viewerUsername={viewerUsername}
        loadingMore={loadingMore}
        sentinelRef={sentinelRef}
      />
    </section>
  );
}
