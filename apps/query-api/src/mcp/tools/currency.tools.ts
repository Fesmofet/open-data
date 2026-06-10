import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { McpToolDeps } from '../mcp-tool.deps';
import { jsonToolResult } from '../mcp-tool.helpers';

export function registerCurrencyTools(server: McpServer, deps: McpToolDeps): void {
  server.registerTool(
    'get_currency_market',
    {
      description: 'Get cryptocurrency market info (current and weekly)',
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
      description: 'Get latest fiat exchange rates for a base currency',
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
      description: 'Get Hive Engine token rates (current and weekly)',
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
      description: 'Get current Hive Engine token aggregates',
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
      description: 'Get Hive Engine token price chart for a period',
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
      description: 'Get USD scaling for Hive Engine swap pool symbols',
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
