import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { catalogDescription } from '../mcp-tool-catalog';
import type { McpToolDeps } from '../mcp-tool.deps';
import { jsonToolResult } from '../mcp-tool.helpers';

export function registerOblTools(server: McpServer, deps: McpToolDeps): void {
  server.registerTool(
    'search_obl_offers',
    {
      description: catalogDescription('search_obl_offers'),
      inputSchema: z.object({
        q: z.string().optional().describe('Text search on name/description'),
        kind: z.enum(['offer', 'request']).optional(),
        tags: z.string().optional().describe('Comma-separated tags (AND)'),
        author: z.string().optional(),
        limit: z.number().int().min(1).max(50).optional(),
        offset: z.number().int().min(0).optional(),
      }),
    },
    async (args) => {
      const tags = args.tags
        ? args.tags
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t !== '')
        : undefined;
      const result = await deps.oblOffers.search({
        q: args.q,
        kind: args.kind,
        tags,
        author: args.author,
        limit: args.limit ?? 20,
        offset: args.offset ?? 0,
      });
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_obl_offer',
    {
      description: catalogDescription('get_obl_offer'),
      inputSchema: z.object({
        offer_id: z.string().min(1),
        version: z.number().int().positive().optional(),
      }),
    },
    async (args) => {
      const offer = await deps.oblOffers.getOffer(args.offer_id, args.version);
      return jsonToolResult(offer);
    },
  );

  server.registerTool(
    'get_obl_ledger',
    {
      description: catalogDescription('get_obl_ledger'),
      inputSchema: z.object({
        account_a: z.string().min(1),
        account_b: z.string().min(1),
      }),
    },
    async (args) => {
      const result = await deps.oblLedger.getLedger(args.account_a, args.account_b);
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_obl_balance',
    {
      description: catalogDescription('get_obl_balance'),
      inputSchema: z.object({
        account_a: z.string().min(1),
        account_b: z.string().min(1),
      }),
    },
    async (args) => {
      const result = await deps.oblLedger.getLedger(args.account_a, args.account_b);
      return jsonToolResult(result.balance);
    },
  );

  server.registerTool(
    'convert_usd_to_waiv',
    {
      description: catalogDescription('convert_usd_to_waiv'),
      inputSchema: z.object({
        amount_usd: z.number().positive(),
      }),
    },
    async (args) => {
      const result = await deps.oblConversion.usdToWaiv({ amountUsd: args.amount_usd });
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_obl_relationships',
    {
      description: catalogDescription('get_obl_relationships'),
      inputSchema: z.object({
        account: z.string().min(1),
        limit: z.number().int().min(1).max(50).optional(),
        offset: z.number().int().min(0).optional(),
      }),
    },
    async (args) => {
      const result = await deps.oblRelationships.listForAccount(args.account, {
        account: args.account,
        limit: args.limit ?? 20,
        offset: args.offset ?? 0,
      });
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_obl_arbitration',
    {
      description: catalogDescription('get_obl_arbitration'),
      inputSchema: z.object({
        account: z.string().min(1),
        status: z.enum(['open', 'resolved']).optional(),
        limit: z.number().int().min(1).max(50).optional(),
        cursor: z.string().optional(),
      }),
    },
    async (args) => {
      const result = await deps.oblArbitration.listForAccount(args.account, {
        account: args.account,
        status: args.status ?? 'open',
        limit: args.limit ?? 20,
        cursor: args.cursor,
      });
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_obl_contract',
    {
      description: catalogDescription('get_obl_contract'),
      inputSchema: z.object({
        contract_id: z.string().min(1),
      }),
    },
    async (args) => {
      const result = await deps.oblRelationships.getContract(args.contract_id);
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_obl_service_order',
    {
      description: catalogDescription('get_obl_service_order'),
      inputSchema: z.object({
        service_order_id: z.string().min(1),
      }),
    },
    async (args) => {
      const result = await deps.oblRelationships.getServiceOrder(args.service_order_id);
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_obl_report',
    {
      description: catalogDescription('get_obl_report'),
      inputSchema: z.object({
        report_id: z.string().min(1),
      }),
    },
    async (args) => {
      const result = await deps.oblRelationships.getReport(args.report_id);
      return jsonToolResult(result);
    },
  );
}
