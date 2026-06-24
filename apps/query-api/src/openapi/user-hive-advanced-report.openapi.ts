import { z } from 'zod';

import {
  hiveAdvancedReportBodySchema,
  hiveWalletExemptionBodySchema,
} from '../domain/wallet/schemas/hive-advanced-report.schema';
import {
  hiveAccountCreatedDatesBodySchema,
  hiveAccountCreatedDatesResponseSchema,
} from '../domain/wallet/schemas/hive-account-created-dates.schema';
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
    'Multi-account Hive wallet table with date range, mutual-transaction filtering, historical fiat pricing, and exemption preload. Requires Bearer access JWT; optional `viewer` must match token `sub`.',
  security: bearerSecurity,
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
    401: {
      description: 'Missing or invalid Bearer token.',
      content: { 'application/json': { schema: unauthorizedSchema } },
    },
    403: {
      description: '`viewer` does not match token subject.',
      content: { 'application/json': { schema: forbiddenSchema } },
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

const accountCreatedDatesBodyOpenApi = registry.register(
  'HiveAccountCreatedDatesBody',
  hiveAccountCreatedDatesBodySchema,
);

const accountCreatedDatesResponseOpenApi = registry.register(
  'HiveAccountCreatedDatesResponse',
  hiveAccountCreatedDatesResponseSchema,
);

registry.registerPath({
  method: 'post',
  path: '/query/v1/wallet/hive/account-created-dates',
  summary: 'Hive account creation dates',
  description:
    'Resolves UTC creation dates for one or more Hive accounts (DB → get_accounts → account_created history). Returns per-account YMD and earliest `startDateYmd` for advanced report From preset. Public read; no auth.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: accountCreatedDatesBodyOpenApi,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Creation dates (nullable per account when unresolved).',
      content: {
        'application/json': {
          schema: accountCreatedDatesResponseOpenApi,
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
    'Persist or remove a viewer exemption for a wallet operation row (excluded from deposit/withdraw totals). Requires Bearer access JWT; `viewer` must match token `sub`.',
  security: bearerSecurity,
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
    401: {
      description: 'Missing or invalid Bearer token.',
      content: { 'application/json': { schema: unauthorizedSchema } },
    },
    403: {
      description: '`viewer` does not match token subject.',
      content: { 'application/json': { schema: forbiddenSchema } },
    },
  },
});
