/** Next.js Data Cache tags for query-api GET responses (see `revalidate-after-broadcast.server.ts`). */

export const queryApiCacheTags = {
  objectAuthority: (objectId: string) =>
    `query-api:object:${objectId.trim()}:authority`,
  objectFollowers: (objectId: string) =>
    `query-api:object:${objectId.trim()}:followers`,
  objectExperts: (objectId: string) =>
    `query-api:object:${objectId.trim()}:experts`,
  objectUpdates: (objectId: string) => `query-api:object:${objectId.trim()}:updates`,
  objectPostsFeed: (objectId: string) => `query-api:object:${objectId.trim()}:posts-feed`,
  objectThreadsFeed: (objectId: string) => `query-api:object:${objectId.trim()}:threads-feed`,
  userProfile: (accountName: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:profile`,
  userAccountSidebar: (accountName: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:account-sidebar`,
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
  userExpertiseCounters: (accountName: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:expertise-counters`,
  userExpertise: (accountName: string, scope: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:expertise:${scope}`,
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
  userEngineWallet: (accountName: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:engine-wallet`,
  userHiveWallet: (accountName: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:hive-wallet`,
  userHiveHpDelegations: (accountName: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:hive-hp-delegations`,
  userHiveRcDelegations: (accountName: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:hive-rc-delegations`,
  userEngineTokenDelegations: (accountName: string, symbol: string) =>
    `query-api:user:${accountName.trim().toLowerCase()}:engine-delegations:${symbol.trim().toUpperCase()}`,
  oblOffers: (accountName: string) =>
    `query-api:obl:${accountName.trim().toLowerCase()}:offers`,
  oblDrafts: (accountName: string) =>
    `query-api:obl:${accountName.trim().toLowerCase()}:drafts`,
  oblDiscover: (filtersKey: string) => `query-api:obl:discover:${filtersKey}`,
  oblContract: (contractId: string) =>
    `query-api:obl:contract:${contractId.trim()}`,
  oblInvoice: (invoiceId: string) =>
    `query-api:obl:invoice:${invoiceId.trim()}`,
  oblDispute: (disputeId: string) =>
    `query-api:obl:dispute:${disputeId.trim()}`,
  oblLedger: (accountA: string, accountB: string) => {
    const a = accountA.trim().toLowerCase();
    const b = accountB.trim().toLowerCase();
    const low = a <= b ? a : b;
    const high = a <= b ? b : a;
    return `query-api:obl:ledger:${low}:${high}`;
  },
  oblRelationships: (accountName: string) =>
    `query-api:obl:${accountName.trim().toLowerCase()}:relationships`,
  oblArbitration: (accountName: string, status: 'open' | 'resolved') =>
    `query-api:obl:${accountName.trim().toLowerCase()}:arbitration:${status}`,
} as const;
