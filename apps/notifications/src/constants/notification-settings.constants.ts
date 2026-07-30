import { buildRedisKey } from '@opden-data-layer/core';

const APP = 'notifications';

export const NOTIFICATION_SETTINGS_CACHE_TTL_SEC = 300;

/** Cached when the account has no settings row (negative cache). */
export const NOTIFICATION_SETTINGS_NULL_SENTINEL = '__null__';

export const notificationSettingsCacheKey = (account: string): string =>
  buildRedisKey(APP, 'cache', 'settings', account);
