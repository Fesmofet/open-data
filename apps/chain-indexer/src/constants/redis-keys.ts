import { buildRedisKey } from '@opden-data-layer/core';

const APP = 'chain-indexer';

export const redisKey = {
  hiveBlockNumber: () => buildRedisKey(APP, 'cache', 'hive', 'block-number'),
  governanceSnapshot: (objectId: string) =>
    buildRedisKey(APP, 'cache', 'governance', 'snapshot', objectId),
  objectName: (objectId: string) =>
    buildRedisKey(APP, 'cache', 'object-name', objectId),
  accountPostingJson: (accountName: string) =>
    buildRedisKey(APP, 'cache', 'posting_json_metadata', accountName),
  waivRewardPool: () => buildRedisKey(APP, 'cache', 'waiv-reward-pool'),
  waivRewardEventDedup: (txId: string, event: string, authorperm: string) =>
    buildRedisKey(APP, 'cache', 'waiv-reward-event', `${txId}:${event}:${authorperm}`),
  postWaivReconcile: () => buildRedisKey(APP, 'queue', 'post-waiv-reconcile'),
  postRewardsFinalize: () => buildRedisKey(APP, 'queue', 'post-rewards-finalize'),
} as const;
