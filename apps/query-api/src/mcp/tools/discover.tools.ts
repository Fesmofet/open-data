import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  discoverObjectsQuerySchema,
  discoverTagCategoriesQuerySchema,
  discoverUsersQuerySchema,
} from '../../domain/discover';
import type { McpToolDeps } from '../mcp-tool.deps';
import {
  jsonToolResult,
  pickMcpContext,
  withMcpLocaleContext,
} from '../mcp-tool.helpers';

export function registerDiscoverTools(server: McpServer, deps: McpToolDeps): void {
  server.registerTool(
    'discover_objects',
    {
      description: 'Discover objects by type, tags, sort order, and optional text query',
      inputSchema: withMcpLocaleContext(discoverObjectsQuerySchema),
    },
    async (args) => {
      const ctx = pickMcpContext(args);
      const result = await deps.discoverObjects.execute({
        query: {
          object_type: args.object_type,
          q: args.q,
          tags: args.tags,
          sort: args.sort,
          cursor: args.cursor,
          limit: args.limit,
        },
        locale: ctx.locale,
        viewerAccount: ctx.viewerAccount,
        governanceObjectIdFromHeader: ctx.governanceObjectIdFromHeader,
      });
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'discover_users',
    {
      description: 'Discover users by optional text query with cursor pagination',
      inputSchema: discoverUsersQuerySchema.extend({
        viewer: z.string().optional().describe('Hive account name of the viewer'),
      }),
    },
    async (args) => {
      const { viewer, ...query } = args;
      const result = await deps.discoverUsers.execute({
        query,
        viewerAccount: viewer?.trim() || undefined,
      });
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'discover_tag_categories',
    {
      description: 'List tag category facets for an object type and optional tag filters',
      inputSchema: discoverTagCategoriesQuerySchema,
    },
    async (args) => {
      const result = await deps.discoverTagCategories.execute({ query: args });
      return jsonToolResult(result);
    },
  );
}
