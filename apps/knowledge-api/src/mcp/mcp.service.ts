import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  KNOWLEDGE_MCP_INSTRUCTIONS,
  KnowledgeRepository,
  KnowledgeRouteResolver,
  KnowledgeSearchService,
  registerKnowledgeResources,
  registerKnowledgeTools,
  type KnowledgeDatabase,
} from '@opden-data-layer/knowledge';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Kysely } from 'kysely';
import type { Request, Response } from 'express';
import { KYSELY } from '../database/database.module';
import { extractRpcId, summarizeMcpRequest } from './mcp-request-log';

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
        capabilities: { tools: {}, resources: {}, prompts: {} },
        instructions: KNOWLEDGE_MCP_INSTRUCTIONS,
      },
    );

    const repo = new KnowledgeRepository(this.db);
    const search = new KnowledgeSearchService(this.db);
    const router = new KnowledgeRouteResolver(this.db, search);

    const deps = {
      db: this.db,
      repo,
      search,
      router,
      workspaceRoot: this.config.getOrThrow<string>('knowledge.workspaceRoot'),
      allowReindex: this.config.get<boolean>('knowledge.allowReindex') ?? false,
    };

    registerKnowledgeTools(server, deps);
    registerKnowledgeResources(server, deps);

    return server;
  }

  async handle(req: Request, res: Response): Promise<void> {
    const startedAt = Date.now();
    const summary = summarizeMcpRequest(req.body);
    const rpcId = extractRpcId(req.body);

    this.logger.log(`MCP → id=${rpcId} ${summary}`);

    let loggedResponse = false;
    const logResponse = (status: number, note?: string): void => {
      if (loggedResponse) return;
      loggedResponse = true;
      const ms = Date.now() - startedAt;
      const suffix = note ? ` ${note}` : '';
      this.logger.log(`MCP ← id=${rpcId} ${status} ${ms}ms ${summary}${suffix}`);
    };

    res.once('finish', () => logResponse(res.statusCode));
    res.once('close', () => {
      if (!res.writableFinished) {
        logResponse(res.statusCode || 0, 'connection closed');
      }
    });

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    const server = this.createServer();

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      const message = (error as Error).message;
      this.logger.error(`MCP ✗ id=${rpcId} ${summary}: ${message}`);
      logResponse(res.statusCode || 500, 'error');
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
