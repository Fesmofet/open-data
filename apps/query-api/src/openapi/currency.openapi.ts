import { z } from 'zod';

import { registry } from './registry';
import { queryApiOpenApiTags } from './tags';

const currencyTokenPricesSchema = registry.register(
  'CurrencyTokenPrices',
  z.object({
    usd: z.number(),
    btc: z.number(),
    usd_24h_change: z.number(),
    btc_24h_change: z.number(),
  }),
);

const currencyMarketRowSchema = registry.register(
  'CurrencyMarketRow',
  z.object({
    hive: currencyTokenPricesSchema,
    hive_dollar: currencyTokenPricesSchema,
    type: z.string(),
    createdAt: z.unknown().optional(),
    updatedAt: z.unknown().optional(),
  }),
);

const currencyMarketResponseSchema = registry.register(
  'CurrencyMarketResponse',
  z.object({
    current: currencyMarketRowSchema,
    weekly: z.array(currencyMarketRowSchema),
  }),
);

const currencyFiatLatestResponseSchema = registry.register(
  'CurrencyFiatLatestResponse',
  z.record(z.string(), z.number()),
);

const currencyEngineRatesResponseSchema = registry.register(
  'CurrencyEngineRatesResponse',
  z.object({
    current: z.unknown().nullable(),
    weekly: z.array(z.unknown()),
    error: z.string().optional(),
  }),
);

const currencyEngineCurrentResponseSchema = registry.register(
  'CurrencyEngineCurrentResponse',
  z.record(z.string(), z.number()),
);

const currencyChartPeriodSchema = z.enum([
  '1d',
  '7d',
  '1m',
  '3m',
  '6m',
  '1y',
  '2y',
  'all',
]);

const currencyEngineChartPointSchema = z.object({
  dateString: z.string(),
  rates: z.object({
    HIVE: z.number(),
    USD: z.number(),
  }),
});

const currencyEngineChartResponseSchema = registry.register(
  'CurrencyEngineChartResponse',
  z.object({
    result: z.array(currencyEngineChartPointSchema),
    change: z.object({
      HIVE: z.number(),
      USD: z.number(),
    }),
    lowUSD: z.number(),
    highUSD: z.number(),
  }),
);

const currencyPoolUsdRowSchema = registry.register(
  'CurrencyPoolUsdRow',
  z.object({
    symbol: z.string(),
    USD: z.number(),
  }),
);

const currencyPoolUsdListSchema = registry.register(
  'CurrencyPoolUsdListResponse',
  z.array(currencyPoolUsdRowSchema),
);

registry.registerPath({
  method: 'get',
  path: '/query/v1/currency/market',
  tags: [queryApiOpenApiTags.currency],
  summary: 'HIVE / HBD market snapshot and trailing daily rows',
  description:
    'Spot and weekly history from Postgres `currency_statistics` (ordinary + daily aggregates). Optional `ids` / `vs_currencies` are accepted for legacy compatibility but do not change the stored HIVE/HBD shape. Scheduler `currency-coingecko-ordinary` refreshes every ~5 min.',
  request: {
    query: z.object({
      ids: z
        .string()
        .optional()
        .openapi({
          param: { name: 'ids', in: 'query', required: false },
          example: 'hive,hive_dollar',
        }),
      vs_currencies: z
        .string()
        .optional()
        .openapi({
          param: { name: 'vs_currencies', in: 'query', required: false },
          example: 'usd,btc',
        }),
    }),
  },
  responses: {
    200: {
      description: 'Current ordinary row plus daily rows (oldest→newest after unshift).',
      content: {
        'application/json': {
          schema: currencyMarketResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/query/v1/currency/rates/{base}/latest',
  tags: [queryApiOpenApiTags.currency],
  summary: 'Latest persisted fiat crosses for a base (e.g. USD)',
  description:
    'Reads the newest `currency_rates` row for `base` and returns requested ISO symbols (from `symbols` comma-list) plus base=1.',
  request: {
    params: z.object({
      base: z
        .string()
        .min(1)
        .openapi({ param: { name: 'base', in: 'path', required: true } }),
    }),
    query: z.object({
      symbols: z
        .string()
        .optional()
        .openapi({ param: { name: 'symbols', in: 'query', required: false } }),
    }),
  },
  responses: {
    200: {
      description: 'Map of upper-case ISO code → rate vs base.',
      content: {
        'application/json': {
          schema: currencyFiatLatestResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/query/v1/currency/engine/rates',
  tags: [queryApiOpenApiTags.currency],
  summary: 'WAIV (or base) Hive Engine: current head + weekly daily window',
  description:
    'Reads `hive_engine_rates` in Postgres (ordinary head + trailing daily rows). Scheduler `currency-hive-engine-ordinary` refreshes spot every ~5 min. For live pool RPC use `GET /currency/engine/current`.',
  request: {
    query: z.object({
      base: z
        .string()
        .optional()
        .openapi({ param: { name: 'base', in: 'query', required: false } }),
    }),
  },
  responses: {
    200: {
      description: 'Stored ordinary head from `hive_engine_rates`; `error` when no data.',
      content: {
        'application/json': {
          schema: currencyEngineRatesResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/query/v1/currency/engine/current',
  tags: [queryApiOpenApiTags.currency],
  summary: 'WAIV (or base) current HIVE / USD rates from stored ordinary row',
  description:
    'Reads latest ordinary `hive_engine_rates` row (scheduler refresh ~5 min). For live pool RPC use a dedicated ingest path only — not exposed on query-api hot reads.',
  request: {
    query: z.object({
      base: z
        .string()
        .optional()
        .openapi({ param: { name: 'base', in: 'query', required: false } }),
    }),
  },
  responses: {
    200: {
      description: 'Numeric map with HIVE and USD keys when available.',
      content: {
        'application/json': {
          schema: currencyEngineCurrentResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/query/v1/currency/engine/chart',
  tags: [queryApiOpenApiTags.currency],
  summary: 'WAIV (or base) chart series and range metadata',
  request: {
    query: z.object({
      period: currencyChartPeriodSchema.openapi({
        param: { name: 'period', in: 'query', required: true },
      }),
      base: z
        .string()
        .optional()
        .openapi({ param: { name: 'base', in: 'query', required: false } }),
    }),
  },
  responses: {
    200: {
      description: 'Descending points, period change, low/high USD.',
      content: {
        'application/json': {
          schema: currencyEngineChartResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/query/v1/currency/engine/pools/usd',
  tags: [queryApiOpenApiTags.currency],
  summary: 'Map swap pool symbols to USD (stored scheduler snapshots)',
  description:
    'Reads `hive_engine_swap_pool_usd` populated by scheduler `currency-hive-engine-ordinary` (~5 min).',
  request: {
    query: z.object({
      symbols: z
        .string()
        .optional()
        .openapi({
          param: { name: 'symbols', in: 'query', required: false },
          description:
            'Comma-separated Hive Engine symbols (e.g. SWAP.HIVE, WAIV). Omit yields [].',
          example: 'SWAP.HIVE,WAIV',
        }),
    }),
  },
  responses: {
    200: {
      description: 'Resolved rows with symbol and scaled USD.',
      content: {
        'application/json': {
          schema: currencyPoolUsdListSchema,
        },
      },
    },
  },
});
