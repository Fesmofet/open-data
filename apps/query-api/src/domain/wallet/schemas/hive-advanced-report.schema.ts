import { z } from 'zod';
import {
  ADVANCED_REPORT_DEFAULT_PAGE_SIZE,
  ADVANCED_REPORT_MAX_PAGE_SIZE,
  SUPPORTED_CURRENCIES,
} from '@opden-data-layer/core';

export const hiveAdvancedReportAccountSchema = z.object({
  name: z.string().min(1),
  cursor: z.coerce.number().int().optional(),
});

export const hiveAdvancedReportBodySchema = z
  .object({
    accounts: z.array(hiveAdvancedReportAccountSchema).min(1),
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

export type HiveAdvancedReportBody = z.output<typeof hiveAdvancedReportBodySchema>;

export const hiveWalletExemptionBodySchema = z.object({
  viewer: z.string().min(1),
  account: z.string().min(1),
  operationIndex: z.coerce.number().int().min(0),
  checked: z.boolean(),
});

export type HiveWalletExemptionBody = z.output<typeof hiveWalletExemptionBodySchema>;

export type AdvancedReportRowDto = {
  userName: string;
  operationIndex: number;
  timestamp: number;
  type: string;
  from: string;
  to: string;
  amount: string;
  memo: string;
  hiveAmount: string;
  hbdAmount: string;
  hpAmount: string;
  withdrawDeposit: '' | 'd' | 'w';
  checked: boolean;
  hiveUsd: number;
  hbdUsd: number;
  /** HIVE unit rate in selected fiat (legacy `hive${currency}` column). */
  hiveRateFiat: number;
  /** HBD unit rate in selected fiat (legacy `hbd${currency}` column). */
  hbdRateFiat: number;
  hiveFiat: number;
  hbdFiat: number;
  hpFiat: number;
  totalFiat: number;
  payload: Record<string, unknown>;
};

export type HiveAdvancedReportResponse = {
  wallet: AdvancedReportRowDto[];
  accounts: Array<{ name: string; cursor: number | null; hasMore: boolean }>;
  hasMore: boolean;
  deposits: number;
  withdrawals: number;
};

export type HiveWalletExemptionResponse = {
  result: boolean;
};
