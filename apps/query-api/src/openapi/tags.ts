/** Swagger tag names — one group per NestJS controller (or controller family). */
export const queryApiOpenApiTags = {
  objects: 'Objects',
  users: 'Users',
  userThreads: 'User threads',
  userActivity: 'User activity',
  userWallet: 'User wallet',
  hiveWalletAdvanced: 'Wallet / Hive advanced',
  waivWalletAdvanced: 'Wallet / WAIV advanced',
  userPostDrafts: 'User post drafts',
  posts: 'Posts',
  search: 'Search',
  discover: 'Discover',
  currency: 'Currency',
} as const;

export const queryApiOpenApiTagDefinitions = [
  {
    name: queryApiOpenApiTags.objects,
    description: 'Object resolve, refs, gallery, followers, authority, updates.',
  },
  {
    name: queryApiOpenApiTags.users,
    description: 'Profiles, social lists, favorites, shop, blog and mentions feeds.',
  },
  {
    name: queryApiOpenApiTags.userThreads,
    description: 'Profile threads and comments feeds.',
  },
  {
    name: queryApiOpenApiTags.userActivity,
    description: 'Account activity history.',
  },
  {
    name: queryApiOpenApiTags.userWallet,
    description: 'Hive, WAIV, and Engine wallet reads for a profile.',
  },
  {
    name: queryApiOpenApiTags.hiveWalletAdvanced,
    description: 'Hive L1 advanced wallet report and exemptions.',
  },
  {
    name: queryApiOpenApiTags.waivWalletAdvanced,
    description: 'WAIV advanced wallet report.',
  },
  {
    name: queryApiOpenApiTags.userPostDrafts,
    description: 'JWT-authenticated post draft CRUD.',
  },
  {
    name: queryApiOpenApiTags.posts,
    description: 'Single post, voters, and discussion reads.',
  },
  {
    name: queryApiOpenApiTags.search,
    description: 'Predictive search and object-by-id resolution.',
  },
  {
    name: queryApiOpenApiTags.discover,
    description: 'Discover browse facets.',
  },
  {
    name: queryApiOpenApiTags.currency,
    description: 'Market, fiat, and Hive Engine rate reads.',
  },
] as const;
