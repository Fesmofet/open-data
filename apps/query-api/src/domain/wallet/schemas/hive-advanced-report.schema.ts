import { z } from 'zod';
import { SUPPORTED_CURRENCIES } from '@opden-data-layer/core';

export const hiveAdvancedReportAccountSchema = z.object({
  name: z.string().min(1),
  cursor: z.coerce.number().int().optional(),
});

export const hiveAdvancedReportBodySchema = z.object({
  accounts: z.array(hiveAdvancedReportAccountSchema).min(1),
  filterAccounts: z.array(z.string().min(1)).min(1),
  startDate: z.coerce.number().int(),
  endDate: z.coerce.number().int(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  currency: z.enum(SUPPORTED_CURRENCIES).default('USD'),
  viewer: z.string().min(1).optional(),
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
