import { buildRedisKey } from '@opden-data-layer/core';

const APP = 'notifications';

export const telegramOpsPollerLockKey = (): string =>
  buildRedisKey(APP, 'lock', 'telegram-ops-poller');

export const TELEGRAM_OPS_POLLER_LOCK_TTL_SEC = 60;

export const TELEGRAM_OPS_POLLER_LOCK_VALUE_PREFIX = 'ops-poller:';

export const TELEGRAM_OPS_PER_CHAT_MIN_INTERVAL_MS = 1100;

export const telegramOpsSentDedupKey = (
  streamId: string,
  chatId: string,
): string =>
  buildRedisKey(APP, 'cache', 'telegram-ops', 'sent', streamId, chatId);

export const TELEGRAM_OPS_SENT_DEDUP_TTL_SEC = 3600;
