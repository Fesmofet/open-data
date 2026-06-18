export const ACTIVITY_FILTER_KEYS = [
  'upvoted',
  'downvoted',
  'unvoted',
  'followed',
  'unfollowed',
  'replied',
  'reblogged',
  'powered_up',
  'received',
  'transfer',
  'savings',
  'author_reward',
  'curation_reward',
  'claim_rewards',
] as const;

export type ActivityFilterKey = (typeof ACTIVITY_FILTER_KEYS)[number];

export const ACTIVITY_FILTER_GROUPS = {
  general: [
    'upvoted',
    'downvoted',
    'unvoted',
    'followed',
    'unfollowed',
    'replied',
    'reblogged',
  ],
  finance: ['powered_up', 'received', 'transfer', 'savings'],
  rewards: ['author_reward', 'curation_reward', 'claim_rewards'],
} as const satisfies Record<string, readonly ActivityFilterKey[]>;
