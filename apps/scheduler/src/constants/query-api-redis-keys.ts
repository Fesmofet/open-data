import { buildRedisKey } from '@opden-data-layer/core';

const APP = 'query-api';

/**
 * Redis keys owned by query-api that scheduler proactively warms.
 * Keep in sync with `apps/query-api/src/constants/redis-keys.ts`.
 */
export const queryApiRedisKey = {
  hiveGlobalProperties: () =>
    buildRedisKey(APP, 'cache', 'hive', 'dynamic-global-properties'),
} as const;
