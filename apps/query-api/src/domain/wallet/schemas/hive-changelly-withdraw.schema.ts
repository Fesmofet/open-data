import { z } from 'zod';

import { HIVE_CHANGELLY_OUTPUT_COINS } from '../hive-changelly-withdraw.constants';

export const hiveChangellyOutputCoinSchema = z.enum(HIVE_CHANGELLY_OUTPUT_COINS);

export const hiveChangellyWithdrawRangeQuerySchema = z.object({
  outputCoinType: hiveChangellyOutputCoinSchema,
});

export type HiveChangellyWithdrawRangeQuery = z.infer<
  typeof hiveChangellyWithdrawRangeQuerySchema
>;

export const hiveChangellyWithdrawRangeResponseSchema = z.object({
  min: z.string(),
  max: z.string(),
  rate: z.string(),
});

export type HiveChangellyWithdrawRangeResponse = z.infer<
  typeof hiveChangellyWithdrawRangeResponseSchema
>;

export const hiveChangellyWithdrawEstimateBodySchema = z.object({
  amount: z.coerce.number().positive(),
  outputCoinType: hiveChangellyOutputCoinSchema,
});

export type HiveChangellyWithdrawEstimateBody = z.infer<
  typeof hiveChangellyWithdrawEstimateBodySchema
>;

export const hiveChangellyWithdrawEstimateResponseSchema = z.object({
  result: z.string(),
});

export type HiveChangellyWithdrawEstimateResponse = z.infer<
  typeof hiveChangellyWithdrawEstimateResponseSchema
>;

export const hiveChangellyWithdrawCreateBodySchema = z.object({
  amount: z.coerce.number().positive(),
  outputCoinType: hiveChangellyOutputCoinSchema,
  address: z.string().trim().min(1),
});

export type HiveChangellyWithdrawCreateBody = z.infer<
  typeof hiveChangellyWithdrawCreateBodySchema
>;

export const hiveChangellyWithdrawCreateResponseSchema = z.object({
  receiver: z.string(),
  memo: z.string(),
  exchangeId: z.string(),
  amount: z.number(),
  outputAmount: z.string(),
  trackUrl: z.string(),
});

export type HiveChangellyWithdrawCreateResponse = z.infer<
  typeof hiveChangellyWithdrawCreateResponseSchema
>;
