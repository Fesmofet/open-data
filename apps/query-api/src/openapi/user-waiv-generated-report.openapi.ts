import { z } from 'zod';

import {
  waivGeneratedReportCreateBodySchema,
  waivGeneratedReportListQuerySchema,
  waivGeneratedReportRowsQuerySchema,
  waivGeneratedReportToggleRowBodySchema,
} from '../domain/wallet/schemas/waiv-generated-report.schema';
import { registry } from './registry';
import { queryApiOpenApiTags } from './tags';

const badRequestSchema = z.object({
  statusCode: z.literal(400),
  message: z.string(),
  error: z.string(),
});

const notFoundSchema = z.object({
  statusCode: z.literal(404),
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

const summarySchema = registry.register(
  'WaivGeneratedReportSummary',
  z.object({
    id: z.string().uuid(),
    owner: z.string(),
    profileAccount: z.string(),
    status: z.string(),
    currency: z.string(),
    startDateTs: z.number().int(),
    endDateTs: z.number().int(),
    filterAccounts: z.array(z.string()),
    includeSwapsAndTrades: z.boolean(),
    mergeRewards: z.boolean(),
    deposits: z.number(),
    withdrawals: z.number(),
    rowCount: z.number().int(),
    errorMessage: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    completedAt: z.string().nullable(),
  }),
);

const rowsResponseSchema = registry.register(
  'WaivGeneratedReportRowsResponse',
  z.object({
    wallet: z.array(waivAdvancedReportRowSchema),
    hasMore: z.boolean(),
  }),
);

registry.registerPath({
  method: 'post',
  path: '/query/v1/wallet/waiv/generated-reports',
  tags: [queryApiOpenApiTags.waivWalletAdvanced],
  summary: 'Create WAIV generated advanced report job',
  security: bearerSecurity,
  request: {
    body: {
      content: {
        'application/json': {
          schema: waivGeneratedReportCreateBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Created report job.',
      content: { 'application/json': { schema: summarySchema } },
    },
    400: {
      description: 'Invalid body or concurrent limit exceeded.',
      content: { 'application/json': { schema: badRequestSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/query/v1/wallet/waiv/generated-reports',
  tags: [queryApiOpenApiTags.waivWalletAdvanced],
  summary: 'List WAIV generated reports for the authenticated owner',
  description:
    'Returns all generated reports owned by the JWT subject (`owner === sub`), regardless of profile context.',
  security: bearerSecurity,
  request: {
    query: waivGeneratedReportListQuerySchema,
  },
  responses: {
    200: {
      description: 'Report list.',
      content: {
        'application/json': {
          schema: z.object({ reports: z.array(summarySchema) }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/query/v1/wallet/waiv/generated-reports/{reportId}',
  tags: [queryApiOpenApiTags.waivWalletAdvanced],
  summary: 'Get WAIV generated report status and totals',
  security: bearerSecurity,
  request: {
    params: z.object({ reportId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'Report summary.',
      content: { 'application/json': { schema: summarySchema } },
    },
    404: {
      description: 'Report not found.',
      content: { 'application/json': { schema: notFoundSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/query/v1/wallet/waiv/generated-reports/{reportId}/rows',
  tags: [queryApiOpenApiTags.waivWalletAdvanced],
  summary: 'List persisted rows for a WAIV generated report',
  security: bearerSecurity,
  request: {
    params: z.object({ reportId: z.string().uuid() }),
    query: waivGeneratedReportRowsQuerySchema,
  },
  responses: {
    200: {
      description: 'Paginated report rows (default page size 500).',
      content: { 'application/json': { schema: rowsResponseSchema } },
    },
    404: {
      description: 'Report not found.',
      content: { 'application/json': { schema: notFoundSchema } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/query/v1/wallet/waiv/generated-reports/{reportId}/rows/{operationIndex}',
  tags: [queryApiOpenApiTags.waivWalletAdvanced],
  summary: 'Toggle per-report row exemption (checked)',
  security: bearerSecurity,
  request: {
    params: z.object({
      reportId: z.string().uuid(),
      operationIndex: z.coerce.number().int(),
    }),
    body: {
      content: {
        'application/json': {
          schema: waivGeneratedReportToggleRowBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated report summary with recalculated totals.',
      content: { 'application/json': { schema: summarySchema } },
    },
    404: {
      description: 'Report or row not found.',
      content: { 'application/json': { schema: notFoundSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/query/v1/wallet/waiv/generated-reports/{reportId}/stop',
  tags: [queryApiOpenApiTags.waivWalletAdvanced],
  summary: 'Stop a running WAIV generated report job',
  description:
    'Sets status to `stopped`, flushes any pending `merge_reward_fold` rows, and recalculates totals.',
  security: bearerSecurity,
  request: {
    params: z.object({ reportId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'Stopped report summary.',
      content: { 'application/json': { schema: summarySchema } },
    },
    400: {
      description: 'Report is not running.',
      content: { 'application/json': { schema: badRequestSchema } },
    },
    404: {
      description: 'Report not found.',
      content: { 'application/json': { schema: notFoundSchema } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/query/v1/wallet/waiv/generated-reports/{reportId}',
  tags: [queryApiOpenApiTags.waivWalletAdvanced],
  summary: 'Delete a WAIV generated report for the authenticated owner',
  security: bearerSecurity,
  request: {
    params: z.object({ reportId: z.string().uuid() }),
  },
  responses: {
    204: {
      description: 'Report deleted.',
    },
    404: {
      description: 'Report not found.',
      content: { 'application/json': { schema: notFoundSchema } },
    },
  },
});
