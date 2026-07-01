import { z } from 'zod';
import { SUPPORTED_CURRENCIES } from '@opden-data-layer/core/constants';

import { waivAdvancedReportRowSchema } from './waiv-advanced-report-api.schema';

export const waivGeneratedReportCreateRequestSchema = z.object({
  profileAccount: z.string().min(1),
  filterAccounts: z.array(z.string().min(1)).min(1),
  startDate: z.number().int(),
  endDate: z.number().int(),
  currency: z.enum(SUPPORTED_CURRENCIES).default('USD'),
  includeSwapsAndTrades: z.boolean().default(false),
  mergeRewards: z.boolean().default(true),
});

export type WaivGeneratedReportCreateRequest = z.infer<
  typeof waivGeneratedReportCreateRequestSchema
>;

export const waivGeneratedReportSummarySchema = z.object({
  id: z.string().uuid(),
  owner: z.string(),
  profileAccount: z.string(),
  status: z.string(),
  currency: z.enum(SUPPORTED_CURRENCIES),
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
});

export type WaivGeneratedReportSummaryApi = z.infer<
  typeof waivGeneratedReportSummarySchema
>;

export const waivGeneratedReportListResponseSchema = z.object({
  reports: z.array(waivGeneratedReportSummarySchema),
});

export type WaivGeneratedReportListResponse = z.infer<
  typeof waivGeneratedReportListResponseSchema
>;

export const waivGeneratedReportRowsResponseSchema = z.object({
  wallet: z.array(waivAdvancedReportRowSchema),
  hasMore: z.boolean(),
});

export type WaivGeneratedReportRowsResponseApi = z.infer<
  typeof waivGeneratedReportRowsResponseSchema
>;

export const waivGeneratedReportToggleRowRequestSchema = z.object({
  checked: z.boolean(),
});
