import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { HasSessionService } from '../domain/has-session.service';
import { jsonToolResult, toolError } from './mcp-tool.helpers';

export function registerAgentWalletTools(
  server: McpServer,
  deps: { hasSession: HasSessionService },
): void {
  server.registerTool(
    'has_login_start',
    {
      description:
        'Start HAS login for a Hive account. Returns immediately with deep link and terminal QR; poll has_login_status until active.',
      inputSchema: z.object({
        account: z.string().min(1).describe('Hive account name (with or without @)'),
      }),
    },
    async (args) => {
      try {
        const result = await deps.hasSession.loginStart(args.account);
        return jsonToolResult(result);
      } catch (error) {
        return toolError((error as Error).message);
      }
    },
  );

  server.registerTool(
    'has_login_status',
    {
      description: 'Poll login status for a requestId from has_login_start.',
      inputSchema: z.object({
        requestId: z.string().min(1),
      }),
    },
    async (args) => {
      const status = deps.hasSession.loginStatus(args.requestId);
      return jsonToolResult(status);
    },
  );

  server.registerTool(
    'has_session',
    {
      description:
        'Return current HAS session metadata (account, expiresAt). No secrets.',
      inputSchema: z.object({}),
    },
    async () => {
      const session = deps.hasSession.getSessionInfo();
      return jsonToolResult({ active: session != null, session });
    },
  );

  server.registerTool(
    'has_logout',
    {
      description: 'Clear local HAS session and persisted session file.',
      inputSchema: z.object({}),
    },
    async () => {
      await deps.hasSession.logout();
      return jsonToolResult({ ok: true });
    },
  );

  server.registerTool(
    'odl_build_object_create',
    {
      description:
        'Build ODL object_create custom_json ops from object type and update fields.',
      inputSchema: z.object({
        objectType: z.string().min(1),
        objectId: z.string().optional(),
        creator: z.string().min(1),
        fields: z.array(
          z.object({
            updateType: z.string().min(1),
            value: z.unknown(),
            locale: z.string().optional(),
          }),
        ),
        language: z.string().optional(),
      }),
    },
    async (args) => {
      try {
        const result = deps.hasSession.buildObjectCreate(args);
        return jsonToolResult(result);
      } catch (error) {
        return toolError((error as Error).message);
      }
    },
  );

  server.registerTool(
    'has_broadcast',
    {
      description:
        'Request HAS signature for ops. Requires active session. Poll has_broadcast_status.',
      inputSchema: z.object({
        ops: z.array(z.unknown()).min(1),
        keyType: z.enum(['posting', 'active']).default('posting'),
      }),
    },
    async (args) => {
      try {
        const result = await deps.hasSession.broadcastStart({
          ops: args.ops,
          keyType: args.keyType,
        });
        return jsonToolResult(result);
      } catch (error) {
        return toolError((error as Error).message);
      }
    },
  );

  server.registerTool(
    'has_broadcast_status',
    {
      description: 'Poll broadcast status for a requestId from has_broadcast.',
      inputSchema: z.object({
        requestId: z.string().min(1),
      }),
    },
    async (args) => {
      const status = deps.hasSession.broadcastStatus(args.requestId);
      return jsonToolResult(status);
    },
  );
}
