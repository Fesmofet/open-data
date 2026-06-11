import { SUPPORTED_CURRENCIES } from '@opden-data-layer/core';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { catalogDescription } from '../mcp-tool-catalog';
import type { McpToolDeps } from '../mcp-tool.deps';
import {
  jsonToolResult,
  pickMcpContext,
  toolError,
  withMcpLocaleContext,
} from '../mcp-tool.helpers';

const postKeyFields = {
  author: z.string().min(1).describe('Post author Hive account name'),
  permlink: z.string().min(1).describe('Post permlink'),
} as const;

const postDiscussionSchema = z.object({
  ...postKeyFields,
  viewer: z.string().optional().describe('Hive account name of the viewer'),
  currency: z
    .enum(SUPPORTED_CURRENCIES)
    .default('USD')
    .describe('Reward display currency (see post-reward.md)'),
});

export function registerPostTools(server: McpServer, deps: McpToolDeps): void {
  server.registerTool(
    'get_post',
    {
      description: catalogDescription('get_post'),
      inputSchema: withMcpLocaleContext(
        z.object({
          ...postKeyFields,
          currency: z
            .enum(SUPPORTED_CURRENCIES)
            .default('USD')
            .describe('Reward display currency (see post-reward.md)'),
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
        args.currency,
      );
      if (!result) {
        return toolError(`Post not found: ${args.author}/${args.permlink}`);
      }
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_post_discussion',
    {
      description: catalogDescription('get_post_discussion'),
      inputSchema: postDiscussionSchema,
    },
    async (args) => {
      const result = await deps.getPostDiscussion.execute(
        args.author,
        args.permlink,
        args.viewer?.trim() || undefined,
        args.currency,
      );
      if (!result) {
        return toolError(`Discussion not found: ${args.author}/${args.permlink}`);
      }
      return jsonToolResult(result);
    },
  );
}
