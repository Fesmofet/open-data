'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  countUnread,
  clearLastSeen,
  getLastSeen,
  prependNotificationItem,
  setLastSeen,
} from './notification-feed-utils';
import {
  getNotificationsWsClient,
  type UserNotificationItem,
} from '../infrastructure/notifications-ws-client';

export type UseNotificationFeedResult = {
  items: UserNotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  markRead: () => void;
};

export function useNotificationFeed(username: string): UseNotificationFeedResult {
  const [items, setItems] = useState<UserNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const syncUnread = useCallback(
    (nextItems: UserNotificationItem[], lastReadTimestampMs?: number | null) => {
      if (
        lastReadTimestampMs !== undefined &&
        lastReadTimestampMs !== null &&
        Number.isFinite(lastReadTimestampMs)
      ) {
        if (lastReadTimestampMs === 0) {
          clearLastSeen(username);
        } else {
          setLastSeen(username, new Date(lastReadTimestampMs).toISOString());
        }
      }
      setUnreadCount(
        countUnread(nextItems, getLastSeen(username), lastReadTimestampMs),
      );
    },
    [username],
  );

  const markRead = useCallback(() => {
    const client = getNotificationsWsClient();
    void client?.markRead().then((serverTs) => {
      const iso =
        serverTs !== null && Number.isFinite(serverTs)
          ? new Date(serverTs).toISOString()
          : new Date().toISOString();
      setLastSeen(username, iso);
      setUnreadCount(0);
    });
  }, [username]);

  useEffect(() => {
    let cancelled = false;
    const client = getNotificationsWsClient();

    async function loadInitial(): Promise<void> {
      if (!client) {
        if (!cancelled) {
          setItems([]);
          setUnreadCount(0);
          setIsLoading(false);
        }
        return;
      }
      const snapshot = await client.getNotifications();
      if (cancelled) {
        return;
      }
      setItems(snapshot.items);
      syncUnread(snapshot.items, snapshot.lastReadTimestamp);
      setIsLoading(false);
    }

    void loadInitial();

    const unsubscribeNotify = client?.addNotificationListener((item) => {
      setItems((prev) => {
        const next = prependNotificationItem(prev, item);
        if (next === prev) {
          return prev;
        }
        const unreadDelta = countUnread([item], getLastSeen(username));
        if (unreadDelta > 0) {
          setUnreadCount((c) => c + 1);
        }
        return next;
      });
    });

    const unsubscribeReconnect = client?.addReconnectListener(() => {
      void (async () => {
        if (cancelled || !client) {
          return;
        }
        const snapshot = await client.getNotifications();
        if (cancelled) {
          return;
        }
        setItems((prev) => {
          let merged = prev;
          for (const item of snapshot.items) {
            merged = prependNotificationItem(merged, item);
          }
          return merged;
        });
        syncUnread(snapshot.items, snapshot.lastReadTimestamp);
      })();
    });

    return () => {
      cancelled = true;
      unsubscribeNotify?.();
      unsubscribeReconnect?.();
    };
  }, [username, syncUnread]);

  return { items, unreadCount, isLoading, markRead };
}
