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
        'Start HAS login for a Hive account. Send the returned webLink to the user verbatim, in its own message, within 10 seconds — do not parse it, do not pipe it through a terminal, do not wrap it in a code fence. The login window is about 60 seconds. If alreadyActive is true no login is needed. Poll has_login_status until active. Calling this again for the same account reuses the pending request instead of invalidating the link already sent.',
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
      description:
        'Poll login status for a requestId from has_login_start. Poll every 3 seconds until active, rejected or expired.',
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
    'has_login_qr',
    {
      description:
        'Fallback artefacts for a pending login: terminal QR, PNG QR path and the raw has:// deep link. Use only for a terminal or a second device. Never send qrAscii or deepLink into a chat — the deep link is base64 of JSON, so it starts with eyJ and chat clients redact it as a leaked JWT.',
      inputSchema: z.object({
        requestId: z.string().min(1),
      }),
    },
    async (args) => {
      const artifacts = deps.hasSession.loginArtifacts(args.requestId);
      if (!artifacts) {
        return toolError('No pending login for this requestId');
      }
      return jsonToolResult(artifacts);
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
