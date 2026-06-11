import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { catalogDescription } from '../mcp-tool-catalog';
import type { McpToolDeps } from '../mcp-tool.deps';
import { jsonToolResult } from '../mcp-tool.helpers';

export function registerCurrencyTools(server: McpServer, deps: McpToolDeps): void {
  server.registerTool(
    'get_currency_market',
    {
      description: catalogDescription('get_currency_market'),
      inputSchema: z.object({
        ids: z.string().optional().describe('Comma-separated coin ids'),
        vs_currencies: z
          .string()
          .optional()
          .describe('Comma-separated quote currencies'),
      }),
    },
    async (args) => {
      const result = await deps.currencyQueries.marketInfo({
        idsComma: args.ids,
        currenciesComma: args.vs_currencies,
      });
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_currency_fiat_rates',
    {
      description: catalogDescription('get_currency_fiat_rates'),
      inputSchema: z.object({
        base: z.string().min(1).describe('Base currency code'),
        symbols: z
          .string()
          .optional()
          .describe('Comma-separated target currency symbols'),
      }),
    },
    async (args) => {
      const result = await deps.currencyQueries.legacyRateLatest(
        args.base,
        args.symbols ?? '',
      );
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_engine_rates',
    {
      description: catalogDescription('get_engine_rates'),
      inputSchema: z.object({
        base: z.string().optional().describe('Base token symbol (e.g. WAIV)'),
      }),
    },
    async (args) => {
      const result = await deps.currencyQueries.engineRates(args.base);
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_engine_current',
    {
      description: catalogDescription('get_engine_current'),
      inputSchema: z.object({
        base: z.string().optional().describe('Base token symbol (e.g. WAIV)'),
      }),
    },
    async (args) => {
      const result = await deps.currencyQueries.engineCurrent(args.base);
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_engine_chart',
    {
      description: catalogDescription('get_engine_chart'),
      inputSchema: z.object({
        period: z.string().min(1).describe('Chart period (e.g. 7d, 30d)'),
        base: z.string().optional().describe('Base token symbol (e.g. WAIV)'),
      }),
    },
    async (args) => {
      const result = await deps.currencyQueries.engineChart(args.period, args.base);
      return jsonToolResult(result);
    },
  );

  server.registerTool(
    'get_engine_pools_usd',
    {
      description: catalogDescription('get_engine_pools_usd'),
      inputSchema: z.object({
        symbols: z.string().min(1).describe('Comma-separated token symbols'),
      }),
    },
    async (args) => {
      const result = await deps.currencyQueries.enginePoolsUsdCsv(args.symbols);
      return jsonToolResult(result);
    },
  );
}
