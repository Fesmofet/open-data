/** 14 days — refreshed on each new notification */
export const NOTIFICATION_EXPIRY_SEC = 14 * 24 * 3600;

export const NOTIFICATION_LIST_MAX = 50;

const LEGACY_FEED_PREFIX = 'notifications:list:';
const FEED_PREFIX = 'notifications:cache:feed:';

/** Canonical per-user feed list key. */
export const notificationListKey = (username: string): string =>
  `${FEED_PREFIX}${username}`;

export const legacyNotificationListKey = (username: string): string =>
  `${LEGACY_FEED_PREFIX}${username}`;
