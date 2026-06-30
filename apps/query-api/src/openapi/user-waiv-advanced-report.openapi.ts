import { z } from 'zod';

import { waivAdvancedReportBodySchema } from '../domain/wallet/schemas/waiv-advanced-report.schema';
import { registry } from './registry';
import { queryApiOpenApiTags } from './tags';

const badRequestSchema = z.object({
  statusCode: z.literal(400),
  message: z.string(),
  error: z.string(),
});

const unauthorizedSchema = z.object({
  statusCode: z.literal(401),
  message: z.string(),
  error: z.string(),
});

const forbiddenSchema = z.object({
  statusCode: z.literal(403),
  message: z.string(),
  error: z.string(),
});

const bearerSecurity = [{ bearerAuth: [] }];

const waivAdvancedReportRowSchema = z.object({
  userName: z.string(),
  operationIndex: z.number().int(),
  timestamp: z.number().int(),
  type: z.string(),
  from: z.string(),
  to: z.string(),
  amount: z.string(),
  memo: z.string(),
  waivAmount: z.string(),
  wpAmount: z.string(),
  withdrawDeposit: z.enum(['', 'd', 'w']),
  checked: z.boolean(),
  waivUsd: z.number(),
  waivRateFiat: z.number(),
  waivFiat: z.number(),
  wpFiat: z.number(),
  totalFiat: z.number(),
  payload: z.record(z.string(), z.unknown()),
});

const waivAdvancedReportResponseSchema = z.object({
  wallet: z.array(waivAdvancedReportRowSchema),
  accounts: z.array(
    z.object({
      name: z.string(),
      cursor: z.string().nullable(),
      hasMore: z.boolean(),
    }),
  ),
  hasMore: z.boolean(),
  deposits: z.number(),
  withdrawals: z.number(),
});

const waivAdvancedReportBodyOpenApi = registry.register(
  'WaivAdvancedReportBody',
  waivAdvancedReportBodySchema,
);

const waivAdvancedReportResponseOpenApi = registry.register(
  'WaivAdvancedReportResponse',
  waivAdvancedReportResponseSchema,
);

registry.registerPath({
  method: 'post',
  path: '/query/v1/wallet/waiv/advanced-report',
  tags: [queryApiOpenApiTags.waivWalletAdvanced],
  summary: 'WAIV advanced wallet report',
  description:
    'Multi-account WAIV wallet table (Hive Engine RPC + PG swaps/airdrops merge). `includeSwapsAndTrades` defaults to false (exclude swaps/trades). Optional date range for filtered report. Requires Bearer access JWT; optional `viewer` must match token `sub`.',
  security: bearerSecurity,
  request: {
    body: {
      content: {
        'application/json': {
          schema: waivAdvancedReportBodyOpenApi,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'WAIV advanced report page.',
      content: {
        'application/json': {
          schema: waivAdvancedReportResponseOpenApi,
        },
      },
    },
    400: {
      description: 'Invalid date range or body.',
      content: {
        'application/json': {
          schema: badRequestSchema,
        },
      },
    },
    401: {
      description: 'Missing or invalid Bearer token.',
      content: {
        'application/json': {
          schema: unauthorizedSchema,
        },
      },
    },
    403: {
      description: 'Viewer does not match JWT subject.',
      content: {
        'application/json': {
          schema: forbiddenSchema,
        },
      },
    },
  },
});
