import { SUPPORTED_CURRENCIES } from '@opden-data-layer/core/constants';
import {
  ADVANCED_REPORT_DEFAULT_PAGE_SIZE,
  ADVANCED_REPORT_MAX_PAGE_SIZE,
} from '@opden-data-layer/core/waiv-advanced-report';
import { z } from 'zod';

export { ADVANCED_REPORT_DEFAULT_PAGE_SIZE as WAIV_ADVANCED_REPORT_PAGE_SIZE };

export const waivAdvancedReportAccountSchema = z.object({
  name: z.string(),
  cursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export const waivAdvancedReportRowSchema = z.object({
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

export const waivAdvancedReportResponseSchema = z.object({
  wallet: z.array(waivAdvancedReportRowSchema),
  accounts: z.array(waivAdvancedReportAccountSchema),
  hasMore: z.boolean(),
  deposits: z.number(),
  withdrawals: z.number(),
  truncated: z.boolean().optional(),
});

export type WaivAdvancedReportRowApi = z.infer<typeof waivAdvancedReportRowSchema>;
export type WaivAdvancedReportResponseApi = z.infer<
  typeof waivAdvancedReportResponseSchema
>;

export const waivAdvancedReportRequestSchema = z
  .object({
    accounts: z.array(
      z.object({
        name: z.string().min(1),
        cursor: z.string().min(1).optional(),
      }),
    ),
    filterAccounts: z.array(z.string().min(1)).min(1),
    startDate: z.number().int().optional(),
    endDate: z.number().int().optional(),
    limit: z
      .number()
      .int()
      .min(1)
      .max(ADVANCED_REPORT_MAX_PAGE_SIZE)
      .default(ADVANCED_REPORT_DEFAULT_PAGE_SIZE),
    currency: z.enum(SUPPORTED_CURRENCIES).default('USD'),
    viewer: z.string().min(1).optional(),
    includeSwapsAndTrades: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    const hasStart = data.startDate !== undefined;
    const hasEnd = data.endDate !== undefined;
    if (hasStart !== hasEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'startDate and endDate must both be set or both omitted',
        path: hasStart ? ['endDate'] : ['startDate'],
      });
      return;
    }
    if (!hasStart || !hasEnd) {
      return;
    }
    const { startDate, endDate } = data;
    if (startDate === undefined || endDate === undefined) {
      return;
    }
    if (startDate > endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'startDate must be <= endDate',
        path: ['endDate'],
      });
    }
    const now = Math.floor(Date.now() / 1000);
    if (endDate >= now) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endDate must be in the past',
        path: ['endDate'],
      });
    }
  });

export type WaivAdvancedReportRequest = z.infer<
  typeof waivAdvancedReportRequestSchema
>;

export const waivAdvancedReportQueryResultSchema = z.object({
  report: waivAdvancedReportResponseSchema.nullable(),
  error: z.enum(['unavailable', 'invalid_response', 'unauthorized']).nullable(),
});

export type WaivAdvancedReportQueryResult = z.infer<
  typeof waivAdvancedReportQueryResultSchema
>;
