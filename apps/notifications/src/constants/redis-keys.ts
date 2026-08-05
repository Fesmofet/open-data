import { buildRedisKey } from '@opden-data-layer/core';

const APP = 'notifications';

export const redisKey = {
  hiveGlobalProperties: () =>
    buildRedisKey(APP, 'cache', 'hive', 'dynamic-global-properties'),
} as const;
