import { z } from 'zod';

import {
  hiveAdvancedReportBodySchema,
  hiveWalletExemptionBodySchema,
} from '../domain/wallet/schemas/hive-advanced-report.schema';
import { registry } from './registry';

const badRequestSchema = z.object({
  statusCode: z.literal(400),
  message: z.string(),
  error: z.string(),
});

const serviceUnavailableSchema = z.object({
  statusCode: z.literal(503),
  message: z.string(),
  error: z.string(),
});

const advancedReportRowSchema = z.object({
  userName: z.string(),
  operationIndex: z.number().int(),
  timestamp: z.number().int(),
  type: z.string(),
  from: z.string(),
  to: z.string(),
  amount: z.string(),
  memo: z.string(),
  hiveAmount: z.string(),
  hbdAmount: z.string(),
  hpAmount: z.string(),
  withdrawDeposit: z.enum(['', 'd', 'w']),
  checked: z.boolean(),
  hiveUsd: z.number(),
  hbdUsd: z.number(),
  hiveRateFiat: z.number(),
  hbdRateFiat: z.number(),
  hiveFiat: z.number(),
  hbdFiat: z.number(),
  hpFiat: z.number(),
  totalFiat: z.number(),
  payload: z.record(z.string(), z.unknown()),
});

const advancedReportResponseSchema = z.object({
  wallet: z.array(advancedReportRowSchema),
  accounts: z.array(
    z.object({
      name: z.string(),
      cursor: z.number().int().nullable(),
      hasMore: z.boolean(),
    }),
  ),
  hasMore: z.boolean(),
  deposits: z.number(),
  withdrawals: z.number(),
});

const exemptionResponseSchema = z.object({
  result: z.boolean(),
});

const advancedReportBodyOpenApi = registry.register(
  'HiveAdvancedReportBody',
  hiveAdvancedReportBodySchema,
);

const advancedReportResponseOpenApi = registry.register(
  'HiveAdvancedReportResponse',
  advancedReportResponseSchema,
);

registry.registerPath({
  method: 'post',
  path: '/query/v1/wallet/hive/advanced-report',
  summary: 'Hive L1 advanced wallet report',
  description:
    'Multi-account Hive wallet table with date range, mutual-transaction filtering, historical fiat pricing, and exemption preload.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: advancedReportBodyOpenApi,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Advanced report page.',
      content: {
        'application/json': {
          schema: advancedReportResponseOpenApi,
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
    503: {
      description: 'Hive node unavailable.',
      content: {
        'application/json': {
          schema: serviceUnavailableSchema,
        },
      },
    },
  },
});

const exemptionBodyOpenApi = registry.register(
  'HiveWalletExemptionBody',
  hiveWalletExemptionBodySchema,
);

const exemptionResponseOpenApi = registry.register(
  'HiveWalletExemptionResponse',
  exemptionResponseSchema,
);

registry.registerPath({
  method: 'post',
  path: '/query/v1/wallet/hive/exemptions',
  summary: 'Toggle Hive advanced report exemption',
  description:
    'Persist or remove a viewer exemption for a wallet operation row (excluded from deposit/withdraw totals).',
  request: {
    body: {
      content: {
        'application/json': {
          schema: exemptionBodyOpenApi,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Exemption upsert/delete result.',
      content: {
        'application/json': {
          schema: exemptionResponseOpenApi,
        },
      },
    },
    400: {
      description: 'Invalid body.',
      content: {
        'application/json': {
          schema: badRequestSchema,
        },
      },
    },
  },
});
