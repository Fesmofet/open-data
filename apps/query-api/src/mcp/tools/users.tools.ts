import { SUPPORTED_CURRENCIES } from '@opden-data-layer/core';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { userCategoriesQuerySchema } from '../../domain/categories/categories-query.schema';
import { shopFiltersQuerySchema, shopObjectsQuerySchema, shopSectionsQuerySchema } from '../../domain/shop/shop.schema';
import {
  userFollowingObjectsQuerySchema,
  userSocialListQuerySchema,
} from '../../domain/social/user-social-list.schema';
import { userFavoritesMapBodySchema, toUserFavoritesMapBody } from '../../domain/favorites/post-user-favorites-map.schema';
import { userFavoritesQuerySchema } from '../../domain/favorites/favorites.schema';
import { userActivityBodyFieldsSchema } from '../../domain/feed/schemas/user-activity.schema';
import { catalogDescription } from '../mcp-tool-catalog';
import type { McpToolDeps } from '../mcp-tool.deps';
import {
  jsonToolResult,
  pickMcpContext,
  toolError,
  withMcpLocaleContext,
} from '../mcp-tool.helpers';

const accountField = {
  account: z.string().min(1).describe('Hive account name'),
} as const;

const userBlogFeedMcpSchema = withMcpLocaleContext(
  z.object({
    ...accountField,
    limit: z.coerce.number().int().min(1).max(50).default(20),
    cursor: z.string().optional(),
    currency: z.enum(SUPPORTED_CURRENCIES).default('USD'),
    object_ids: z
      .array(z.string().min(1))
      .max(20)
      .optional()
      .default([])
      .describe('AND filter: posts must link to every object_id'),
  }),
);

const userMentionsFeedMcpSchema = withMcpLocaleContext(
  z.object({
    ...accountField,
    limit: z.coerce.number().int().min(1).max(50).default(20),
    cursor: z.string().optional(),
    currency: z.enum(SUPPORTED_CURRENCIES).default('USD'),
  }),
);

const userBlogObjectFiltersMcpSchema = withMcpLocaleContext(
  z.object({
    ...accountField,
    objects: z
      .array(z.string().min(1))
      .optional()
      .default([])
      .describe('Active object_id filters (AND) for facet narrowing'),
  }),
);

const userThreadsFeedMcpSchema = z.object({
  ...accountField,
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
  sort: z.enum(['latest', 'oldest']).default('latest'),
  currency: z.enum(SUPPORTED_CURRENCIES).default('USD'),
  viewer: z.string().optional().describe('Hive account name of the viewer'),
});

const userActivityMcpSchema = userActivityBodyFieldsSchema.extend({
  ...accountField,
});

export function registerUserTools(server: McpServer, deps: McpToolDeps): void {
  server.registerTool(
    'get_user_profile',
    {
      description: catalogDescription('get_user_profile'),
      inputSchema: z.object({
        ...accountField,
        viewer: z.string().optional().describe('Hive account name of the viewer'),
      }),
    },
    async (args) => {
      const result = await deps.getUserProfile.execute(args.account, args.viewer);
      if (!result) {
        return toolError(`User not found: ${args.account}`);
      }
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_user_blog',
    {
      description: catalogDescription('get_user_blog'),
      inputSchema: userBlogFeedMcpSchema,
    },
    async (args) => {
      const ctx = pickMcpContext(args);
      const { account, limit, cursor, currency, object_ids } = args;
      const result = await deps.getUserBlogFeed.execute(
        account,
        { limit, cursor, currency, object_ids },
        ctx.locale,
        ctx.governanceObjectIdFromHeader,
        ctx.viewerAccount,
      );
      if (!result) {
        return toolError(`User not found: ${account}`);
      }
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_user_blog_object_filters',
    {
      description: catalogDescription('get_user_blog_object_filters'),
      inputSchema: userBlogObjectFiltersMcpSchema,
    },
    async (args) => {
      const ctx = pickMcpContext(args);
      const { account, objects } = args;
      const result = await deps.getUserBlogObjectFilters.execute(
        account,
        { objects },
        ctx.locale,
        ctx.governanceObjectIdFromHeader,
        ctx.viewerAccount,
      );
      if (!result) {
        return toolError(`User not found: ${account}`);
      }
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_user_mentions',
    {
      description: catalogDescription('get_user_mentions'),
      inputSchema: userMentionsFeedMcpSchema,
    },
    async (args) => {
      const ctx = pickMcpContext(args);
      const { account, limit, cursor, currency } = args;
      const result = await deps.getUserMentionsFeed.execute(
        account,
        { limit, cursor, currency, object_ids: [] },
        ctx.locale,
        ctx.governanceObjectIdFromHeader,
        ctx.viewerAccount,
      );
      if (!result) {
        return toolError(`User not found: ${account}`);
      }
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_user_threads',
    {
      description: catalogDescription('get_user_threads'),
      inputSchema: userThreadsFeedMcpSchema,
    },
    async (args) => {
      const { account, limit, cursor, sort, currency, viewer } = args;
      const result = await deps.getUserThreadsFeed.execute(
        account,
        { limit, cursor, sort, currency },
        viewer,
      );
      if (!result) {
        return toolError(`User not found: ${account}`);
      }
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_user_comments',
    {
      description: catalogDescription('get_user_comments'),
      inputSchema: userThreadsFeedMcpSchema,
    },
    async (args) => {
      const { account, limit, cursor, sort, currency, viewer } = args;
      const result = await deps.getUserCommentsFeed.execute(
        account,
        { limit, cursor, sort, currency },
        viewer,
      );
      if (!result) {
        return toolError(`User not found: ${account}`);
      }
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_user_activity',
    {
      description: catalogDescription('get_user_activity'),
      inputSchema: userActivityMcpSchema,
    },
    async (args) => {
      const { account, limit, cursor, filters } = args;
      const result = await deps.getUserActivity.execute(account, {
        limit,
        cursor,
        filters,
      });
      if (!result) {
        return toolError(`User not found: ${account}`);
      }
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_user_waiv_wallet',
    {
      description: catalogDescription('get_user_waiv_wallet'),
      inputSchema: z.object({ ...accountField }),
    },
    async (args) => {
      const result = await deps.getUserWaivWallet.execute(args.account);
      if (!result) {
        return toolError(`User not found: ${args.account}`);
      }
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_user_engine_token_delegations',
    {
      description: catalogDescription('get_user_engine_token_delegations'),
      inputSchema: z.object({
        ...accountField,
        symbol: z.string().min(1).describe('Hive Engine token symbol (e.g. WAIV)'),
      }),
    },
    async (args) => {
      const result = await deps.getUserEngineTokenDelegations.execute(
        args.account,
        args.symbol,
      );
      if (!result) {
        return toolError(`User not found: ${args.account}`);
      }
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_user_followers',
    {
      description: catalogDescription('get_user_followers'),
      inputSchema: userSocialListQuerySchema.extend({
        ...accountField,
        viewer: z.string().optional().describe('Hive account name of the viewer'),
      }),
    },
    async (args) => {
      const { account, sort, skip, limit, viewer } = args;
      const result = await deps.getUserFollowers.execute(
        account,
        { sort, skip, limit },
        viewer,
      );
      if (!result) {
        return toolError(`User not found: ${account}`);
      }
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_user_following',
    {
      description: catalogDescription('get_user_following'),
      inputSchema: userSocialListQuerySchema.extend({
        ...accountField,
        viewer: z.string().optional().describe('Hive account name of the viewer'),
      }),
    },
    async (args) => {
      const { account, sort, skip, limit, viewer } = args;
      const result = await deps.getUserFollowing.execute(
        account,
        { sort, skip, limit },
        viewer,
      );
      if (!result) {
        return toolError(`User not found: ${account}`);
      }
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_user_following_objects',
    {
      description: catalogDescription('get_user_following_objects'),
      inputSchema: withMcpLocaleContext(
        userFollowingObjectsQuerySchema.extend(accountField),
      ),
    },
    async (args) => {
      const ctx = pickMcpContext(args);
      const { account, sort, skip, limit } = args;
      const result = await deps.getUserFollowingObjects.execute(
        account,
        { sort, skip, limit },
        ctx.locale,
        ctx.governanceObjectIdFromHeader,
        ctx.viewerAccount,
      );
      if (!result) {
        return toolError(`User not found: ${account}`);
      }
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_user_favorites_types',
    {
      description: catalogDescription('get_user_favorites_types'),
      inputSchema: z.object(accountField),
    },
    async (args) => {
      const result = await deps.getUserFavoritesTypes.execute(args.account);
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_user_favorites',
    {
      description: catalogDescription('get_user_favorites'),
      inputSchema: withMcpLocaleContext(
        userFavoritesQuerySchema.extend(accountField),
      ),
    },
    async (args) => {
      const ctx = pickMcpContext(args);
      const { account, objectType, skip, limit } = args;
      const result = await deps.getUserFavorites.execute(
        account,
        { objectType, skip, limit },
        ctx.locale,
        ctx.governanceObjectIdFromHeader,
        ctx.viewerAccount,
      );
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'post_user_favorites_map',
    {
      description: catalogDescription('post_user_favorites_map'),
      inputSchema: withMcpLocaleContext(
        userFavoritesMapBodySchema.extend(accountField),
      ),
    },
    async (args) => {
      const ctx = pickMcpContext(args);
      const { account, box, objectTypes, skip, limit } = args;
      const result = await deps.postUserFavoritesMap.execute(
        account,
        toUserFavoritesMapBody({ box, objectTypes, skip, limit }),
        ctx.locale,
        ctx.governanceObjectIdFromHeader,
        ctx.viewerAccount,
      );
      return jsonToolResult(result ?? { items: [], hasMore: false });
    },
  );

  server.registerTool(
    'get_user_categories',
    {
      description: catalogDescription('get_user_categories'),
      inputSchema: userCategoriesQuerySchema.extend(accountField),
    },
    async (args) => {
      const { account, types, path, excluded, name } = args;
      const result = await deps.getUserCategories.execute(account, {
        types,
        path,
        excluded,
        name,
      });
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_user_shop_filters',
    {
      description: catalogDescription('get_user_shop_filters'),
      inputSchema: shopFiltersQuerySchema.extend(accountField),
    },
    async (args) => {
      const { account, types, categoryPath, uncategorizedOnly, tags, rating } = args;
      const result = await deps.getUserShopFilters.execute(account, {
        types,
        categoryPath,
        uncategorizedOnly,
        tags,
        rating,
      });
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_user_shop_objects',
    {
      description: catalogDescription('get_user_shop_objects'),
      inputSchema: withMcpLocaleContext(
        shopObjectsQuerySchema.extend(accountField),
      ),
    },
    async (args) => {
      const ctx = pickMcpContext(args);
      const { account, types, categoryPath, uncategorizedOnly, limit, cursor, tags, rating } = args;
      const result = await deps.getUserShopObjects.execute(
        account,
        { types, categoryPath, uncategorizedOnly, limit, cursor, tags, rating },
        ctx.locale,
        ctx.governanceObjectIdFromHeader,
        ctx.viewerAccount,
      );
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_user_shop_sections',
    {
      description: catalogDescription('get_user_shop_sections'),
      inputSchema: withMcpLocaleContext(
        shopSectionsQuerySchema.extend(accountField),
      ),
    },
    async (args) => {
      const ctx = pickMcpContext(args);
      const { account, types, path, cursor, sectionLimit, name, tags, rating } = args;
      const result = await deps.getUserShopSections.execute(
        account,
        { types, path, cursor, sectionLimit, name, tags, rating },
        ctx.locale,
        ctx.governanceObjectIdFromHeader,
        ctx.viewerAccount,
      );
      return jsonToolResult(result);
    },
  );
}
