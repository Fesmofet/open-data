import { buildRedisKey } from '@opden-data-layer/core';

const APP = 'notifications';

export const NOTIFICATION_SETTINGS_CACHE_TTL_SEC = 300;

export const notificationSettingsCacheKey = (account: string): string =>
  buildRedisKey(APP, 'cache', 'settings', account);
