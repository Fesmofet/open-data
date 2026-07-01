import { z } from 'zod';
import { SUPPORTED_CURRENCIES } from '@opden-data-layer/core';
import {
  WAIV_GENERATED_REPORT_ROWS_MAX_LIMIT,
  WAIV_GENERATED_REPORT_ROWS_PAGE_SIZE,
} from '@opden-data-layer/core/waiv-advanced-report';

export const waivGeneratedReportCreateBodySchema = z
  .object({
    profileAccount: z.string().min(1),
    filterAccounts: z.array(z.string().min(1)).min(1),
    startDate: z.coerce.number().int(),
    endDate: z.coerce.number().int(),
    currency: z.enum(SUPPORTED_CURRENCIES).default('USD'),
    includeSwapsAndTrades: z.boolean().default(false),
    mergeRewards: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.startDate > data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'startDate must be <= endDate',
        path: ['endDate'],
      });
    }
    const now = Math.floor(Date.now() / 1000);
    if (data.endDate >= now) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endDate must be in the past',
        path: ['endDate'],
      });
    }
  });

export type WaivGeneratedReportCreateBody = z.output<
  typeof waivGeneratedReportCreateBodySchema
>;

export const waivGeneratedReportListQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type WaivGeneratedReportListQuery = z.output<
  typeof waivGeneratedReportListQuerySchema
>;

export const waivGeneratedReportRowsQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(WAIV_GENERATED_REPORT_ROWS_MAX_LIMIT)
    .default(WAIV_GENERATED_REPORT_ROWS_PAGE_SIZE),
});

export type WaivGeneratedReportRowsQuery = z.output<
  typeof waivGeneratedReportRowsQuerySchema
>;

export const waivGeneratedReportToggleRowBodySchema = z.object({
  checked: z.boolean(),
});

export type WaivGeneratedReportToggleRowBody = z.output<
  typeof waivGeneratedReportToggleRowBodySchema
>;

export type WaivGeneratedReportSummaryDto = {
  id: string;
  owner: string;
  profileAccount: string;
  status: string;
  currency: string;
  startDateTs: number;
  endDateTs: number;
  filterAccounts: string[];
  includeSwapsAndTrades: boolean;
  mergeRewards: boolean;
  deposits: number;
  withdrawals: number;
  rowCount: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type WaivGeneratedReportListResponse = {
  reports: WaivGeneratedReportSummaryDto[];
};

export type WaivGeneratedReportRowsResponse = {
  wallet: import('./waiv-advanced-report.schema').WaivAdvancedReportRowDto[];
  hasMore: boolean;
};
