/** Single source of truth for query-api MCP tool metadata (catalog resource + tests). */
export interface QueryMcpToolCatalogEntry {
  name: string;
  description: string;
  httpEquivalent?: string;
  specPath?: string;
}

export const QUERY_MCP_ROUTING_SKILL_PATH = 'docs/skills/query-api-mcp-routing.md';

export const QUERY_MCP_TOOL_CATALOG: readonly QueryMcpToolCatalogEntry[] = [
  {
    name: 'search',
    description:
      'Predictive search for objects and users (live data). Use for header-style lookup; see search.md for counts vs results.',
    httpEquivalent: 'GET /query/v1/search',
    specPath: 'docs/apps/query-api/spec/search.md',
  },
  {
    name: 'search_counts',
    description:
      'Tab counts for search (objects by type + users). Pair with search when UI needs totals.',
    httpEquivalent: 'GET /query/v1/search/counts',
    specPath: 'docs/apps/query-api/spec/search.md',
  },
  {
    name: 'discover_objects',
    description:
      'Browse objects by type, tags (AND), sort, and optional text query. Use for catalog/discover pages, not quick search.',
    httpEquivalent: 'GET /query/v1/discover/objects',
    specPath: 'docs/apps/query-api/spec/search.md',
  },
  {
    name: 'discover_users',
    description: 'Browse users with optional text query and cursor pagination.',
    httpEquivalent: 'GET /query/v1/discover/users',
  },
  {
    name: 'discover_tag_categories',
    description: 'Tag category facets for an object type (discover filters).',
    httpEquivalent: 'GET /query/v1/discover/tag-categories',
  },
  {
    name: 'resolve_object',
    description:
      'Resolve one object with governance masking and optional update_types filter (empty = all present updates).',
    httpEquivalent: 'POST /query/v1/objects/resolve',
    specPath: 'docs/apps/query-api/spec/objects-resolve.md',
  },
  {
    name: 'resolve_nested_objects',
    description: 'Batch lightweight object projections by id list.',
    httpEquivalent: 'POST /query/v1/objects/resolve-nested',
    specPath: 'docs/apps/query-api/spec/objects-resolve.md',
  },
  {
    name: 'check_object_exists',
    description: 'Boolean existence check for an object id.',
    httpEquivalent: 'GET /query/v1/objects/:id/exists',
  },
  {
    name: 'get_object_related',
    description: 'Paginated related objects (IS_RELATED_TO).',
    httpEquivalent: 'GET /query/v1/objects/:id/related',
    specPath: 'docs/apps/query-api/spec/object-ref-list-endpoints.md',
  },
  {
    name: 'get_object_similar',
    description: 'Paginated similar objects (IS_SIMILAR_TO).',
    httpEquivalent: 'GET /query/v1/objects/:id/similar',
    specPath: 'docs/apps/query-api/spec/object-ref-list-endpoints.md',
  },
  {
    name: 'get_object_add_on',
    description: 'Paginated add-on objects (ADD_ON).',
    httpEquivalent: 'GET /query/v1/objects/:id/add-on',
    specPath: 'docs/apps/query-api/spec/object-ref-list-endpoints.md',
  },
  {
    name: 'get_object_followers',
    description: 'Users following an object.',
    httpEquivalent: 'GET /query/v1/objects/:id/followers',
    specPath: 'docs/apps/query-api/spec/user-social-lists.md',
  },
  {
    name: 'get_object_authority',
    description: 'Authority holders for an object (administrative roles).',
    httpEquivalent: 'GET /query/v1/objects/:id/authority',
    specPath: 'docs/apps/query-api/spec/user-social-lists.md',
  },
  {
    name: 'get_object_updates',
    description: 'Paginated update feed for an object (history tab).',
    httpEquivalent: 'GET /query/v1/objects/:id/updates',
  },
  {
    name: 'get_update_voters',
    description: 'Approve/reject voter lists for a single object update.',
    httpEquivalent: 'GET /query/v1/objects/:id/updates/:updateId/voters',
    specPath: 'docs/apps/query-api/spec/update-voters-endpoint.md',
  },
  {
    name: 'get_user_profile',
    description: 'User profile shell data by Hive account name.',
    httpEquivalent: 'GET /query/v1/users/:name/profile',
    specPath: 'docs/apps/query-api/spec/users-profile-endpoint.md',
  },
  {
    name: 'get_user_blog',
    description: 'User blog feed posts with reward projection.',
    httpEquivalent: 'POST /query/v1/users/:name/blog',
    specPath: 'docs/apps/query-api/spec/user-blog-feed-endpoint.md',
  },
  {
    name: 'get_user_mentions',
    description: 'Posts mentioning the user.',
    httpEquivalent: 'POST /query/v1/users/:name/mentions',
    specPath: 'docs/apps/query-api/spec/user-mentions-feed-endpoint.md',
  },
  {
    name: 'get_user_threads',
    description: 'User threads feed (root posts in thread context).',
    httpEquivalent: 'POST /query/v1/users/:name/threads',
    specPath: 'docs/apps/query-api/spec/user-threads-feed-endpoint.md',
  },
  {
    name: 'get_user_comments',
    description:
      'Paginated comments authored by the user (feed tab). See user-comments-feed-endpoint.md.',
    httpEquivalent: 'POST /query/v1/users/:name/comments',
    specPath: 'docs/apps/query-api/spec/user-comments-feed-endpoint.md',
  },
  {
    name: 'get_user_followers',
    description: 'Accounts following the user.',
    httpEquivalent: 'GET /query/v1/users/:name/followers',
    specPath: 'docs/apps/query-api/spec/user-social-lists.md',
  },
  {
    name: 'get_user_following',
    description: 'Accounts the user follows.',
    httpEquivalent: 'GET /query/v1/users/:name/following',
    specPath: 'docs/apps/query-api/spec/user-social-lists.md',
  },
  {
    name: 'get_user_following_objects',
    description: 'Objects the user follows.',
    httpEquivalent: 'GET /query/v1/users/:name/following-objects',
    specPath: 'docs/apps/query-api/spec/user-social-lists.md',
  },
  {
    name: 'get_user_categories',
    description: 'Shop department tree for a user catalog.',
    httpEquivalent: 'GET /query/v1/users/:name/categories',
    specPath: 'docs/apps/query-api/spec/categories.md',
  },
  {
    name: 'get_user_shop_objects',
    description: 'Flat shop object list with categoryPath filter.',
    httpEquivalent: 'GET /query/v1/users/:name/shop-objects',
    specPath: 'docs/apps/query-api/spec/shop-feed-endpoints.md',
  },
  {
    name: 'get_user_shop_sections',
    description: 'Grouped shop sections (categories with object previews).',
    httpEquivalent: 'GET /query/v1/users/:name/shop-sections',
    specPath: 'docs/apps/query-api/spec/shop-feed-endpoints.md',
  },
  {
    name: 'get_post',
    description:
      'Single post by author/permlink with rewards (currency affects reward label). See single-post-endpoint.md.',
    httpEquivalent: 'GET /query/v1/posts/:author/:permlink',
    specPath: 'docs/apps/query-api/spec/single-post-endpoint.md',
  },
  {
    name: 'get_post_discussion',
    description:
      'Comment tree for a root post via Hive bridge. Optional viewer for vote/reblog state.',
    httpEquivalent: 'GET /query/v1/posts/:author/:permlink/discussion',
    specPath: 'docs/apps/query-api/spec/post-discussion-endpoint.md',
  },
  {
    name: 'get_post_voters',
    description:
      'Paginated upvote/downvote list for a post or thread with per-voter USD value and profile.',
    httpEquivalent: 'GET /query/v1/posts/:author/:permlink/voters',
    specPath: 'docs/apps/query-api/spec/post-voters-endpoint.md',
  },
  {
    name: 'get_currency_market',
    description: 'Crypto market info (current + weekly).',
    httpEquivalent: 'GET /query/v1/currency/market',
  },
  {
    name: 'get_currency_fiat_rates',
    description: 'Latest fiat exchange rates for a base currency.',
    httpEquivalent: 'GET /query/v1/currency/rates/:base/latest',
  },
  {
    name: 'get_engine_rates',
    description: 'Hive Engine token rates (current + weekly window).',
    httpEquivalent: 'GET /query/v1/currency/engine/rates',
  },
  {
    name: 'get_engine_current',
    description: 'Current Hive Engine token aggregates.',
    httpEquivalent: 'GET /query/v1/currency/engine/current',
  },
  {
    name: 'get_engine_chart',
    description: 'Hive Engine price chart for a period.',
    httpEquivalent: 'GET /query/v1/currency/engine/chart',
  },
  {
    name: 'get_engine_pools_usd',
    description: 'USD scaling for Hive Engine swap pool symbols.',
    httpEquivalent: 'GET /query/v1/currency/engine/pools-usd',
  },
] as const;

export const REGISTERED_MCP_TOOL_NAMES: readonly string[] = QUERY_MCP_TOOL_CATALOG.map(
  (t) => t.name,
);

export function catalogDescription(toolName: string): string {
  const entry = QUERY_MCP_TOOL_CATALOG.find((t) => t.name === toolName);
  if (!entry) {
    throw new Error(`Missing QUERY_MCP_TOOL_CATALOG entry for tool: ${toolName}`);
  }
  return entry.description;
}
