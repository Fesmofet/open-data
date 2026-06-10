import { SUPPORTED_CURRENCIES } from '@opden-data-layer/core';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { userCategoriesQuerySchema } from '../../domain/categories/categories-query.schema';
import { shopObjectsQuerySchema, shopSectionsQuerySchema } from '../../domain/shop/shop.schema';
import {
  userFollowingObjectsQuerySchema,
  userSocialListQuerySchema,
} from '../../domain/social/user-social-list.schema';
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

export function registerUserTools(server: McpServer, deps: McpToolDeps): void {
  server.registerTool(
    'get_user_profile',
    {
      description: 'Get a user profile by account name',
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
      description: 'Get paginated blog feed posts for a user',
      inputSchema: userBlogFeedMcpSchema,
    },
    async (args) => {
      const ctx = pickMcpContext(args);
      const { account, limit, cursor, currency } = args;
      const result = await deps.getUserBlogFeed.execute(
        account,
        { limit, cursor, currency },
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
      description: 'Get paginated mention feed for a user',
      inputSchema: userBlogFeedMcpSchema,
    },
    async (args) => {
      const ctx = pickMcpContext(args);
      const { account, limit, cursor, currency } = args;
      const result = await deps.getUserMentionsFeed.execute(
        account,
        { limit, cursor, currency },
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
      description: 'Get paginated threads feed for a user',
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
      description: 'Get paginated comments feed for a user',
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
    'get_user_followers',
    {
      description: 'List followers of a user account',
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
      description: 'List accounts a user is following',
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
      description: 'List objects a user is following',
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
    'get_user_categories',
    {
      description: 'List shop navigation categories for a user',
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
    'get_user_shop_objects',
    {
      description: 'List shop objects for a user with category filtering',
      inputSchema: withMcpLocaleContext(
        shopObjectsQuerySchema.extend(accountField),
      ),
    },
    async (args) => {
      const ctx = pickMcpContext(args);
      const { account, types, categoryPath, uncategorizedOnly, limit, cursor } = args;
      const result = await deps.getUserShopObjects.execute(
        account,
        { types, categoryPath, uncategorizedOnly, limit, cursor },
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
      description: 'List shop sections with preview objects for a user',
      inputSchema: withMcpLocaleContext(
        shopSectionsQuerySchema.extend(accountField),
      ),
    },
    async (args) => {
      const ctx = pickMcpContext(args);
      const { account, types, path, cursor, sectionLimit, name } = args;
      const result = await deps.getUserShopSections.execute(
        account,
        { types, path, cursor, sectionLimit, name },
        ctx.locale,
        ctx.governanceObjectIdFromHeader,
        ctx.viewerAccount,
      );
      return jsonToolResult(result);
    },
  );
}
