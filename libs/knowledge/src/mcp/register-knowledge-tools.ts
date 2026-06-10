import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { z } from 'zod';
import { runKnowledgeReindex } from '../indexer/knowledge-indexer';
import {
  getObjectType,
  getUpdateSchema,
  listObjectTypes,
  listUpdateTypes,
} from '../registry/registry-query';
import type { KnowledgeDatabase } from '../repository/types';
import type { KnowledgeMcpDeps } from './mcp-tool.deps';
import { jsonToolResult, toolError } from './mcp-tool.helpers';

export function registerKnowledgeTools(server: McpServer, deps: KnowledgeMcpDeps): void {
  server.registerTool(
    'search_knowledge',
    {
      description: 'Search project knowledge by text query',
      inputSchema: z.object({
        query: z.string().min(1),
        limit: z.coerce.number().int().min(1).max(50).default(10),
        types: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        scope: z.string().optional(),
      }),
    },
    async (args) => {
      const results = await deps.search.searchKnowledge(args);
      return jsonToolResult({ results });
    },
  );

  server.registerTool(
    'get_file',
    {
      description: 'Return full markdown file by path',
      inputSchema: z.object({
        path: z.string().min(1),
      }),
    },
    async (args) => {
      const file = await deps.repo.findFileByPath(args.path);
      if (!file) {
        return toolError(`File not found: ${args.path}`);
      }
      return jsonToolResult({
        path: file.path,
        title: file.title,
        type: file.type,
        status: file.status,
        tags: file.tags,
        body: file.body,
      });
    },
  );

  server.registerTool(
    'get_context',
    {
      description: 'Return compact context bundle for agent work on a topic',
      inputSchema: z.object({
        topic: z.string().min(1),
        max_chunks: z.coerce.number().int().min(1).max(20).default(8),
        scope: z.string().optional(),
      }),
    },
    async (args) => {
      const results = await deps.search.buildContext({
        topic: args.topic,
        maxChunks: args.max_chunks,
        scope: args.scope,
      });
      return jsonToolResult({ results });
    },
  );

  server.registerTool(
    'list_files',
    {
      description: 'List indexed knowledge files with filters',
      inputSchema: z.object({
        type: z.string().optional(),
        status: z.string().optional(),
        scope: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }),
    },
    async (args) => {
      const files = await deps.repo.listFiles({
        type: args.type,
        status: args.status,
        scope: args.scope,
        tags: args.tags,
      });
      return jsonToolResult({
        files: files.map((f) => ({
          path: f.path,
          title: f.title,
          type: f.type,
          status: f.status,
          scope: f.scope,
          tags: f.tags,
        })),
      });
    },
  );

  server.registerTool(
    'list_tags',
    {
      description: 'List all known tags with document counts',
      inputSchema: z.object({}),
    },
    async () => {
      const tags = await deps.repo.listTags();
      return jsonToolResult({ tags });
    },
  );

  server.registerTool(
    'reindex',
    {
      description: 'Manually trigger knowledge reindex (dev/admin only)',
      inputSchema: z.object({
        path: z.string().optional().describe('Optional path filter; empty reindexes all'),
      }),
    },
    async (args) => {
      if (!deps.allowReindex) {
        return toolError('Reindex is disabled. Set KNOWLEDGE_ALLOW_REINDEX=true.');
      }
      const stats = await runKnowledgeReindex(deps.db, {
        workspaceRoot: deps.workspaceRoot,
        pathFilter: args.path?.trim() || undefined,
      });
      return jsonToolResult(stats);
    },
  );

  server.registerTool(
    'list_object_types',
    {
      description: 'List all ODL object types from the registry',
      inputSchema: z.object({}),
    },
    async () => jsonToolResult({ object_types: listObjectTypes() }),
  );

  server.registerTool(
    'get_object_type',
    {
      description: 'Get object type definition, supported updates, and create example',
      inputSchema: z.object({
        object_type: z.string().min(1),
      }),
    },
    async (args) => {
      const result = getObjectType(args.object_type);
      if (!result) {
        return toolError(`Unknown object type: ${args.object_type}`);
      }
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'list_update_types',
    {
      description: 'List all ODL update types from the registry',
      inputSchema: z.object({}),
    },
    async () => jsonToolResult({ update_types: listUpdateTypes() }),
  );

  server.registerTool(
    'get_update_schema',
    {
      description: 'Get update type JSON Schema and broadcast example',
      inputSchema: z.object({
        update_type: z.string().min(1),
      }),
    },
    async (args) => {
      const result = getUpdateSchema(args.update_type);
      if (!result) {
        return toolError(`Unknown update type: ${args.update_type}`);
      }
      return jsonToolResult(result);
    },
  );
}

export function createKnowledgeDb(connectionString: string): Kysely<KnowledgeDatabase> {
  return new Kysely<KnowledgeDatabase>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString }),
    }),
  });
}
