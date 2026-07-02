/** Parsed news-feed filter from object `newsFeed` update (legacy newsFilter body). */
export interface ObjectNewsFeedFilter {
  allowList: string[][];
  ignoreList: string[];
  typeList: string[];
  authors: string[];
}

export interface ObjectPostFeedScope {
  objectId: string;
  objectType: string;
  /** When true, use {@link newsFilter} instead of regular object-link scope. */
  newsFeedMode: boolean;
  newsFilter: ObjectNewsFeedFilter | null;
  /** Object ids whose linked posts are in scope (self + group siblings + relisted sources). */
  linkedObjectIds: string[];
  /** Prefixes for `post_links.url` (LINK url field, website links, social link URLs). */
  linkUrlPrefixes: string[];
  /** Hive accounts mentioned in post body (`post_mentions.account`). */
  mentionAccounts: string[];
  /** Primary language subtags for hashtag objects (`post_languages.language`). */
  languages: string[];
  /** Post refs excluded from the main feed (`remove` + `pin`). */
  excludedPostRefs: PostAuthorPermlinkRef[];
  /** Pinned post keys (`author/permlink`) for prepend + flagging. */
  pinnedPostRefs: string[];
  /** Post refs pinned by the viewer (`creator` on pin update). */
  viewerPinnedPostRefs: string[];
  /** Post refs listed in `remove` updates (for `hasRemoveUpdate` flag). */
  removePostRefs: string[];
  /** Authors muted by the viewer. */
  mutedAuthors: string[];
  /** When news filter lists authors, skip root-post-only predicate (legacy reblog_to drop). */
  newsFeedAuthorsOnly: boolean;
}

export interface PostAuthorPermlinkRef {
  author: string;
  permlink: string;
}
