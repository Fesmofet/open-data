import { NOTIFICATIONS_LAST_SEEN_KEY_PREFIX } from '../constants';
import type { UserNotificationItem } from '../infrastructure/notifications-ws-client';

export function lastSeenStorageKey(username: string): string {
  return `${NOTIFICATIONS_LAST_SEEN_KEY_PREFIX}${username.trim()}`;
}

function notificationStorage(): Storage | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage;
}

export function getLastSeen(username: string): string | null {
  const storage = notificationStorage();
  if (!storage) {
    return null;
  }
  const raw = storage.getItem(lastSeenStorageKey(username));
  return raw?.trim() ? raw.trim() : null;
}

export function setLastSeen(username: string, iso: string): void {
  const storage = notificationStorage();
  if (!storage) {
    return;
  }
  storage.setItem(lastSeenStorageKey(username), iso);
}

/** Clears client read cursor (e.g. after re-seeding preview feed). */
export function clearLastSeen(username: string): void {
  const storage = notificationStorage();
  if (!storage) {
    return;
  }
  storage.removeItem(lastSeenStorageKey(username));
}

export function countUnread(
  items: UserNotificationItem[],
  lastSeen: string | null,
  lastReadTimestampMs?: number | null,
): number {
  let localMs: number | null = null;
  if (lastSeen) {
    const parsed = new Date(lastSeen).getTime();
    if (!Number.isNaN(parsed)) {
      localMs = parsed;
    }
  }

  let seenMs: number | null = null;
  const hasServerCursor =
    lastReadTimestampMs !== undefined &&
    lastReadTimestampMs !== null &&
    Number.isFinite(lastReadTimestampMs);

  if (hasServerCursor) {
    if (lastReadTimestampMs === 0) {
      seenMs = 0;
    } else {
      seenMs = Math.max(lastReadTimestampMs!, localMs ?? 0);
    }
  } else if (localMs !== null) {
    seenMs = localMs;
  }

  if (seenMs === null) {
    return items.length;
  }
  return items.filter((item) => {
    const ms = new Date(item.occurredAt).getTime();
    return !Number.isNaN(ms) && ms > seenMs;
  }).length;
}

export function prependNotificationItem(
  items: UserNotificationItem[],
  item: UserNotificationItem,
): UserNotificationItem[] {
  if (items.some((existing) => existing.id === item.id)) {
    return items;
  }
  return [item, ...items];
}
