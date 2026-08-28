import { z } from 'zod';

import { HIVE_CHANGELLY_OUTPUT_COINS } from '../../domain/hive-changelly-withdraw.constants';

export const hiveChangellyWithdrawRangeApiSchema = z.object({
  min: z.string(),
  max: z.string(),
  rate: z.string(),
});

export type HiveChangellyWithdrawRangeApiResponse = z.infer<
  typeof hiveChangellyWithdrawRangeApiSchema
>;

export const hiveChangellyWithdrawEstimateApiSchema = z.object({
  result: z.string(),
});

export type HiveChangellyWithdrawEstimateApiResponse = z.infer<
  typeof hiveChangellyWithdrawEstimateApiSchema
>;

export const hiveChangellyWithdrawCreateApiSchema = z.object({
  receiver: z.string(),
  memo: z.string(),
  exchangeId: z.string(),
  amount: z.number(),
  outputAmount: z.string(),
  trackUrl: z.string(),
});

export type HiveChangellyWithdrawCreateApiResponse = z.infer<
  typeof hiveChangellyWithdrawCreateApiSchema
>;

export const hiveChangellyOutputCoinSchema = z.enum(HIVE_CHANGELLY_OUTPUT_COINS);
