import { z } from 'zod';
import {
  ADVANCED_REPORT_DEFAULT_PAGE_SIZE,
  ADVANCED_REPORT_MAX_PAGE_SIZE,
  SUPPORTED_CURRENCIES,
} from '@opden-data-layer/core';

export const waivAdvancedReportAccountSchema = z.object({
  name: z.string().min(1),
  cursor: z.string().min(1).optional(),
});

export const waivAdvancedReportBodySchema = z
  .object({
    accounts: z.array(waivAdvancedReportAccountSchema).min(1),
    filterAccounts: z.array(z.string().min(1)).min(1),
    startDate: z.coerce.number().int().optional(),
    endDate: z.coerce.number().int().optional(),
    limit: z.coerce
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
    const startDate = data.startDate;
    const endDate = data.endDate;
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

export type WaivAdvancedReportBody = z.output<typeof waivAdvancedReportBodySchema>;

export type WaivAdvancedReportRowDto = {
  userName: string;
  operationIndex: number;
  timestamp: number;
  type: string;
  from: string;
  to: string;
  amount: string;
  memo: string;
  waivAmount: string;
  wpAmount: string;
  withdrawDeposit: '' | 'd' | 'w';
  checked: boolean;
  waivUsd: number;
  waivRateFiat: number;
  waivFiat: number;
  wpFiat: number;
  totalFiat: number;
  payload: Record<string, unknown>;
};

export type WaivAdvancedReportResponse = {
  wallet: WaivAdvancedReportRowDto[];
  accounts: Array<{ name: string; cursor: string | null; hasMore: boolean }>;
  hasMore: boolean;
  deposits: number;
  withdrawals: number;
};
