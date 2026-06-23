import { SUPPORTED_CURRENCIES } from '@opden-data-layer/core/constants';
import { z } from 'zod';

export const ADVANCED_REPORT_PAGE_SIZE = 10;

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
});

export type AdvancedReportRowApi = z.infer<typeof advancedReportRowSchema>;
export type HiveAdvancedReportResponseApi = z.infer<
  typeof hiveAdvancedReportResponseSchema
>;

export const hiveAdvancedReportRequestSchema = z.object({
  accounts: z.array(
    z.object({
      name: z.string().min(1),
      cursor: z.number().int().optional(),
    }),
  ),
  filterAccounts: z.array(z.string().min(1)).min(1),
  startDate: z.number().int(),
  endDate: z.number().int(),
  limit: z.number().int().min(1).max(50).default(ADVANCED_REPORT_PAGE_SIZE),
  currency: z.enum(SUPPORTED_CURRENCIES).default('USD'),
  viewer: z.string().min(1).optional(),
});

export type HiveAdvancedReportRequest = z.infer<
  typeof hiveAdvancedReportRequestSchema
>;

export const hiveAdvancedReportQueryResultSchema = z.object({
  report: hiveAdvancedReportResponseSchema.nullable(),
  error: z.enum(['unavailable', 'invalid_response']).nullable(),
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
