import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { McpToolDeps } from '../mcp-tool.deps';
import {
  jsonToolResult,
  pickMcpContext,
  toolError,
  withMcpLocaleContext,
} from '../mcp-tool.helpers';

export function registerPostTools(server: McpServer, deps: McpToolDeps): void {
  server.registerTool(
    'get_post',
    {
      description: 'Get a single post by author and permlink',
      inputSchema: withMcpLocaleContext(
        z.object({
          author: z.string().min(1).describe('Post author account name'),
          permlink: z.string().min(1).describe('Post permlink'),
        }),
      ),
    },
    async (args) => {
      const ctx = pickMcpContext(args);
      const result = await deps.getPostByKey.execute(
        args.author,
        args.permlink,
        ctx.locale,
        ctx.governanceObjectIdFromHeader,
        ctx.viewerAccount,
      );
      if (!result) {
        return toolError(`Post not found: ${args.author}/${args.permlink}`);
      }
      return jsonToolResult(result);
    },
  );
}
