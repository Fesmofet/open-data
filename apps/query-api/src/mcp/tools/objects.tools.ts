import { UPDATE_TYPES } from '@opden-data-layer/core';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { objectUpdatesFeedQuerySchema } from '../../domain/object-updates/schemas/object-updates-feed.schema';
import {
  objectRefListQuerySchema,
  resolveNestedObjectsBodySchema,
  resolveObjectBodySchema,
} from '../../domain/objects';
import {
  objectAuthorityQuerySchema,
  userSocialListQuerySchema,
} from '../../domain/social/user-social-list.schema';
import { catalogDescription } from '../mcp-tool-catalog';
import type { McpToolDeps } from '../mcp-tool.deps';
import {
  jsonToolResult,
  pickMcpContext,
  toolError,
  withMcpLocaleContext,
} from '../mcp-tool.helpers';

export function registerObjectTools(server: McpServer, deps: McpToolDeps): void {
  server.registerTool(
    'resolve_object',
    {
      description: catalogDescription('resolve_object'),
      inputSchema: withMcpLocaleContext(resolveObjectBodySchema),
    },
    async (args) => {
      const ctx = pickMcpContext(args);
      const result = await deps.getObjectById.execute({
        objectId: args.object_id,
        updateTypes: args.update_types,
        locale: ctx.locale,
        includeRejected: args.include_rejected,
        governanceObjectIdFromHeader: ctx.governanceObjectIdFromHeader,
        viewerAccount: ctx.viewerAccount,
      });
      if (!result) {
        return toolError(`Object not found: ${args.object_id}`);
      }
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'resolve_nested_objects',
    {
      description: catalogDescription('resolve_nested_objects'),
      inputSchema: withMcpLocaleContext(resolveNestedObjectsBodySchema),
    },
    async (args) => {
      const ctx = pickMcpContext(args);
      const result = await deps.getNestedObjects.execute({
        ids: args.ids,
        locale: ctx.locale,
        governanceObjectIdFromHeader: ctx.governanceObjectIdFromHeader,
        viewerAccount: ctx.viewerAccount,
      });
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'check_object_exists',
    {
      description: catalogDescription('check_object_exists'),
      inputSchema: z.object({
        object_id: z.string().min(1).describe('Object id to check'),
      }),
    },
    async (args) => {
      const exists = await deps.checkObjectExists.execute(args.object_id);
      return jsonToolResult({ exists });
    },
  );

  const refListSchema = withMcpLocaleContext(
    objectRefListQuerySchema.extend({
      object_id: z.string().min(1).describe('Source object id'),
    }),
  );

  const registerRefListTool = (
    name: string,
    description: string,
    updateType:
      | typeof UPDATE_TYPES.IS_RELATED_TO
      | typeof UPDATE_TYPES.IS_SIMILAR_TO
      | typeof UPDATE_TYPES.ADD_ON,
  ): void => {
    server.registerTool(
      name,
      { description, inputSchema: refListSchema },
      async (args) => {
        const ctx = pickMcpContext(args);
        const { object_id, limit, cursor } = args;
        const result = await deps.getObjectRefList.execute(
          object_id,
          updateType,
          { limit, cursor },
          ctx.locale,
          ctx.governanceObjectIdFromHeader,
          ctx.viewerAccount,
        );
        if (!result) {
          return toolError(`Object not found: ${object_id}`);
        }
        return jsonToolResult(result);
      },
    );
  };

  registerRefListTool(
    'get_object_related',
    catalogDescription('get_object_related'),
    UPDATE_TYPES.IS_RELATED_TO,
  );
  registerRefListTool(
    'get_object_similar',
    catalogDescription('get_object_similar'),
    UPDATE_TYPES.IS_SIMILAR_TO,
  );
  registerRefListTool(
    'get_object_add_on',
    catalogDescription('get_object_add_on'),
    UPDATE_TYPES.ADD_ON,
  );

  server.registerTool(
    'get_object_followers',
    {
      description: catalogDescription('get_object_followers'),
      inputSchema: withMcpLocaleContext(
        userSocialListQuerySchema.extend({
          object_id: z.string().min(1).describe('Object id'),
        }),
      ),
    },
    async (args) => {
      const ctx = pickMcpContext(args);
      const { object_id, sort, skip, limit } = args;
      const result = await deps.getObjectFollowers.execute(
        object_id,
        { sort, skip, limit },
        ctx.viewerAccount,
      );
      if (!result) {
        return toolError(`Object not found: ${object_id}`);
      }
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_object_authority',
    {
      description: catalogDescription('get_object_authority'),
      inputSchema: withMcpLocaleContext(
        objectAuthorityQuerySchema.extend({
          object_id: z.string().min(1).describe('Object id'),
        }),
      ),
    },
    async (args) => {
      const ctx = pickMcpContext(args);
      const { object_id, sort, skip, limit, authority_type } = args;
      const result = await deps.getObjectAuthority.execute(
        object_id,
        { sort, skip, limit, authority_type },
        ctx.viewerAccount,
      );
      if (!result) {
        return toolError(`Object not found: ${object_id}`);
      }
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_object_updates',
    {
      description: catalogDescription('get_object_updates'),
      inputSchema: withMcpLocaleContext(
        objectUpdatesFeedQuerySchema.extend({
          object_id: z.string().min(1).describe('Object id'),
        }),
      ),
    },
    async (args) => {
      const ctx = pickMcpContext(args);
      const { object_id, cursor, limit, update_type, locale: queryLocale, sort } = args;
      const result = await deps.getObjectUpdatesFeed.execute({
        objectId: object_id,
        query: {
          cursor,
          limit,
          update_type,
          locale: queryLocale,
          sort,
        },
        governanceObjectIdFromHeader: ctx.governanceObjectIdFromHeader,
        viewerAccount: ctx.viewerAccount,
      });
      if (!result) {
        return toolError(`Object not found: ${object_id}`);
      }
      return jsonToolResult(result);
    },
  );
}
