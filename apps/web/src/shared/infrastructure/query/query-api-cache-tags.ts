/** Next.js Data Cache tags for query-api GET responses (see `revalidate-after-broadcast.server.ts`). */

export const queryApiCacheTags = {
  objectAuthority: (objectId: string) =>
    `query-api:object:${objectId.trim()}:authority`,
  objectFollowers: (objectId: string) =>
    `query-api:object:${objectId.trim()}:followers`,
  objectUpdates: (objectId: string) => `query-api:object:${objectId.trim()}:updates`,
  userProfile: (accountName: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:profile`,
  userFollowers: (accountName: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:followers`,
  userFollowing: (accountName: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:following`,
  userFollowingObjects: (accountName: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:following-objects`,
  userFavoritesTypes: (accountName: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:favorites-types`,
  userFavorites: (accountName: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:favorites`,
  userFavoritesMap: (accountName: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:favorites-map`,
  userBlogFeed: (accountName: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:blog-feed`,
  userThreadsFeed: (accountName: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:threads-feed`,
  userCommentsFeed: (accountName: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:comments-feed`,
  userMentionsFeed: (accountName: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:mentions-feed`,
  userActivityFeed: (accountName: string, filtersKey = '') => {
    const name = accountName.trim().toLowerCase();
    const base = `query-api:user:${name}:activity-feed`;
    const key = filtersKey.trim();
    return key.length > 0 ? `${base}:${key}` : base;
  },
  userWaivWallet: (accountName: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:waiv-wallet`,
  userHiveWallet: (accountName: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:hive-wallet`,
  userHiveHpDelegations: (accountName: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:hive-hp-delegations`,
  userHiveRcDelegations: (accountName: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:hive-rc-delegations`,
  userEngineTokenDelegations: (accountName: string, symbol: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:engine-delegations:${symbol.trim().toUpperCase()}`,
} as const;
