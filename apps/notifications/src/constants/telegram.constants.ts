import { buildRedisKey } from '@opden-data-layer/core';

const APP = 'notifications';

export const TELEGRAM_STREAM_KEY = buildRedisKey(APP, 'queue', 'telegram');

export const TELEGRAM_SENDER_GROUP = 'telegram-sender';

export const TELEGRAM_STREAM_DATA_FIELD = 'payload';

export const telegramPollerLockKey = (): string =>
  buildRedisKey(APP, 'lock', 'telegram-poller');

export const telegramSentDedupKey = (
  itemId: string,
  chatId: string,
): string =>
  buildRedisKey(APP, 'cache', 'telegram', 'sent', itemId, chatId);

/** Refreshed while the poller holds the lock */
export const TELEGRAM_POLLER_LOCK_TTL_SEC = 60;

/** Skip duplicate delivery of the same feed item to the same chat */
export const TELEGRAM_SENT_DEDUP_TTL_SEC = 3600;

/** Minimum gap between sends to the same Telegram chat */
export const TELEGRAM_PER_CHAT_MIN_INTERVAL_MS = 1100;

export const TELEGRAM_POLLER_LOCK_VALUE_PREFIX = 'poller:';
