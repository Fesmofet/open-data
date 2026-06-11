import { buildRedisKey } from '@opden-data-layer/core';

const APP = 'knowledge-api';

export const knowledgeApiRedisKey = {
  reindexLock: () => buildRedisKey(APP, 'lock', 'reindex'),
  reindexLastAt: () => buildRedisKey(APP, 'cache', 'reindex', 'last-at'),
} as const;
