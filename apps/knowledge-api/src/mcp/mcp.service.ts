import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  KnowledgeRepository,
  KnowledgeSearchService,
  registerKnowledgeTools,
  type KnowledgeDatabase,
} from '@opden-data-layer/knowledge';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Kysely } from 'kysely';
import type { Request, Response } from 'express';
import { KYSELY } from '../database/database.module';

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);

  constructor(
    @Inject(KYSELY) private readonly db: Kysely<KnowledgeDatabase>,
    private readonly config: ConfigService,
  ) {}

  private createServer(): McpServer {
    const server = new McpServer(
      { name: 'knowledge-api', version: '1.0.0' },
      {
        capabilities: { tools: {} },
        instructions:
          'Project knowledge base: search docs, skills, lessons, and ODL object/update registries. Use get_context before implementing features; use get_object_type / get_update_schema for chain payloads.',
      },
    );

    const repo = new KnowledgeRepository(this.db);
    const search = new KnowledgeSearchService(this.db);

    registerKnowledgeTools(server, {
      db: this.db,
      repo,
      search,
      workspaceRoot: this.config.getOrThrow<string>('knowledge.workspaceRoot'),
      allowReindex: this.config.get<boolean>('knowledge.allowReindex') ?? false,
    });

    return server;
  }

  async handle(req: Request, res: Response): Promise<void> {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    const server = this.createServer();

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      this.logger.error((error as Error).message);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal error' },
          id: null,
        });
      }
    } finally {
      await transport.close().catch(() => undefined);
      await server.close().catch(() => undefined);
    }
  }
}
