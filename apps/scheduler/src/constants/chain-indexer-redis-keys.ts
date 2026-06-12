import { buildRedisKey } from '@opden-data-layer/core';

const APP = 'chain-indexer';

/** Redis keys written by chain-indexer, drained by scheduler jobs. */
export const chainIndexerRedisKey = {
  postWaivReconcile: () => buildRedisKey(APP, 'queue', 'post-waiv-reconcile'),
  postRewardsFinalize: () => buildRedisKey(APP, 'queue', 'post-rewards-finalize'),
  waivRewardPool: () => buildRedisKey(APP, 'cache', 'waiv-reward-pool'),
} as const;
