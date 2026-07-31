import { buildRedisKey } from '@opden-data-layer/core';

const APP = 'notifications';

export const TELEGRAM_STREAM_KEY = buildRedisKey(APP, 'queue', 'telegram');

export const TELEGRAM_SENDER_GROUP = 'telegram-sender';

/** Default Redis stream consumer name — must stay stable across restarts. */
export const TELEGRAM_SENDER_CONSUMER_DEFAULT = 'telegram-sender-1';

export const TELEGRAM_STREAM_BATCH_SIZE = 5;

export const TELEGRAM_STREAM_DATA_FIELD = 'payload';

export const telegramPollerLockKey = (): string =>
  buildRedisKey(APP, 'lock', 'telegram-poller');

export const telegramSentDedupKey = (
  itemId: string,
  chatId: string,
): string =>
  buildRedisKey(APP, 'cache', 'telegram', 'sent', 'v2', itemId, chatId);

/** Refreshed while the poller holds the lock */
export const TELEGRAM_POLLER_LOCK_TTL_SEC = 60;

/** When another instance holds the poller lock, retry after this delay. */
export const TELEGRAM_POLLER_LOCK_RETRY_MS = 1_000;

/** Long-polling timeout for getUpdates (legacy notifications-api used 10). */
export const TELEGRAM_POLL_DEFAULT_TIMEOUT_SEC = 10;

/** Pause between getUpdates calls after a poll cycle (legacy interval: 300ms). */
export const TELEGRAM_POLL_DEFAULT_INTERVAL_MS = 300;

/** Skip duplicate delivery of the same feed item to the same chat */
export const TELEGRAM_SENT_DEDUP_TTL_SEC = 3600;

/** Minimum gap between sends to the same Telegram chat */
export const TELEGRAM_PER_CHAT_MIN_INTERVAL_MS = 1100;

export const TELEGRAM_POLLER_LOCK_VALUE_PREFIX = 'poller:';

/** Max Hive accounts a single Telegram chat can follow */
export const TELEGRAM_MAX_ACCOUNTS_PER_CHAT = 10;

export const TELEGRAM_BUTTON_GO_TO_WEBSITE = 'Go to website';

export const TELEGRAM_SUBSCRIPTION_LIST_HEADER = 'You are subscribed to:';

export const TELEGRAM_SUBSCRIPTION_LIST_EMPTY =
  'No Hive accounts subscribed. Send your Hive username to subscribe.';

export const TELEGRAM_UNSUBSCRIBE_CALLBACK_PREFIX = 'unsubscribe:';

export const telegramUnsubscribeButtonLabel = (account: string): string =>
  `Unsubscribe ${account}`;

/** Placeholder for the subscribed Hive account (injected at Telegram render time). */
export const TELEGRAM_RECIPIENT_PARAM = 'recipient';
