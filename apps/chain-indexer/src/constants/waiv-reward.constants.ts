/** Redis TTL for WAIV reward pool rate cache (seconds). */
export const WAIV_REWARD_POOL_CACHE_TTL_SEC = 60;

/** Redis TTL for processed WAIV reward event dedup keys (seconds). */
export const WAIV_REWARD_EVENT_DEDUP_TTL_SEC = 7 * 24 * 3600;

export const WAIV_HE_CONTRACT = 'comments';

export const WAIV_HE_VOTE_EVENTS = {
  NEW_VOTE: 'newVote',
  UPDATE_VOTE: 'updateVote',
} as const;

export const WAIV_HE_REWARD_EVENTS = {
  AUTHOR_REWARD: 'authorReward',
  CURATION_REWARD: 'curationReward',
  BENEFICIARY_REWARD: 'beneficiaryReward',
} as const;

export const WAIV_HISTORY_AUTHOR_BEN_OPS =
  'comments_authorReward,comments_beneficiaryReward';

/** Default delay after cashout_time before finalize job runs (seconds). */
export const POST_REWARDS_FINALIZE_DELAY_SEC_DEFAULT = 900;
