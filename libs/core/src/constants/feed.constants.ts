/** Hive post tags that qualify for WAIV engine rewards (legacy Waivio). */
export const WAIV_REWARD_ELIGIBLE_TAGS = [
  'waivio',
  'neoxian',
  'palnet',
  'waiv',
  'food',
] as const;

export type WaivRewardEligibleTag = (typeof WAIV_REWARD_ELIGIBLE_TAGS)[number];
