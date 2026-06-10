import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { searchCountsQuerySchema } from '../../domain/search/search-counts-query.schema';
import { searchQuerySchema } from '../../domain/search/search-query.schema';
import type { McpToolDeps } from '../mcp-tool.deps';
import {
  jsonToolResult,
  pickMcpContext,
  withMcpLocaleContext,
} from '../mcp-tool.helpers';

export function registerSearchTools(server: McpServer, deps: McpToolDeps): void {
  server.registerTool(
    'search',
    {
      description: 'Search for objects and users on the platform',
      inputSchema: withMcpLocaleContext(searchQuerySchema),
    },
    async (args) => {
      const ctx = pickMcpContext(args);
      const result = await deps.search.execute({
        q: args.q,
        limit: args.limit,
        type: args.type,
        locale: ctx.locale,
        viewerAccount: ctx.viewerAccount,
        governanceObjectIdFromHeader: ctx.governanceObjectIdFromHeader,
      });
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'search_counts',
    {
      description: 'Get search result counts by object type and total users',
      inputSchema: searchCountsQuerySchema,
    },
    async (args) => {
      const result = await deps.searchCounts.execute({ q: args.q });
      return jsonToolResult(result);
    },
  );
}
