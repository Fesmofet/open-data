import { SUPPORTED_CURRENCIES } from '@opden-data-layer/core/constants';
import {
  ADVANCED_REPORT_DEFAULT_PAGE_SIZE,
  ADVANCED_REPORT_MAX_PAGE_SIZE,
} from '@opden-data-layer/core/hive-advanced-report';
import { z } from 'zod';

export { ADVANCED_REPORT_DEFAULT_PAGE_SIZE as ADVANCED_REPORT_PAGE_SIZE };

export const advancedReportAccountSchema = z.object({
  name: z.string(),
  cursor: z.number().int().nullable(),
  hasMore: z.boolean(),
});

export const advancedReportRowSchema = z.object({
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

export const hiveAdvancedReportResponseSchema = z.object({
  wallet: z.array(advancedReportRowSchema),
  accounts: z.array(advancedReportAccountSchema),
  hasMore: z.boolean(),
  deposits: z.number(),
  withdrawals: z.number(),
  truncated: z.boolean().optional(),
});

export type AdvancedReportRowApi = z.infer<typeof advancedReportRowSchema>;
export type HiveAdvancedReportResponseApi = z.infer<
  typeof hiveAdvancedReportResponseSchema
>;

export const hiveAdvancedReportRequestSchema = z
  .object({
    accounts: z.array(
      z.object({
        name: z.string().min(1),
        cursor: z.number().int().optional(),
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

export type HiveAdvancedReportRequest = z.infer<
  typeof hiveAdvancedReportRequestSchema
>;

export const hiveAdvancedReportQueryResultSchema = z.object({
  report: hiveAdvancedReportResponseSchema.nullable(),
  error: z.enum(['unavailable', 'invalid_response', 'unauthorized']).nullable(),
});

export type HiveAdvancedReportQueryResult = z.infer<
  typeof hiveAdvancedReportQueryResultSchema
>;

export const hiveWalletExemptionRequestSchema = z.object({
  viewer: z.string().min(1),
  account: z.string().min(1),
  operationIndex: z.number().int().min(0),
  checked: z.boolean(),
});
