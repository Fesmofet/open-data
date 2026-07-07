import { z } from 'zod';

export const engineSwapListPairSchema = z.object({
  symbol: z.string(),
  tokenPair: z.string(),
  precision: z.coerce.number(),
});

export const engineSwapListTokenSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  balance: z.string(),
  precision: z.coerce.number(),
  iconUrl: z.string().nullable(),
  pairs: z.array(engineSwapListPairSchema),
});

export const engineSwapListApiResponseSchema = z.object({
  account: z.string(),
  tokens: z.array(engineSwapListTokenSchema),
});

export type EngineSwapListApiResponse = z.infer<
  typeof engineSwapListApiResponseSchema
>;

export const engineSwapQuoteBodySchema = z.object({
  fromSymbol: z.string().min(1),
  toSymbol: z.string().min(1),
  amountIn: z.string().min(1),
  direction: z.enum(['exactInput', 'exactOutput']).default('exactInput'),
  slippage: z.number().min(0).max(1).optional(),
});

export const engineSwapQuoteApiResponseSchema = z.object({
  amountOut: z.string(),
  minAmountOut: z.string(),
  priceImpact: z.string(),
  feePercentOptions: z.array(z.number()),
  customJson: z.array(z.record(z.string(), z.unknown())),
});

export type EngineSwapQuoteApiResponse = z.infer<
  typeof engineSwapQuoteApiResponseSchema
>;

export const engineDepositListTokenSchema = z.object({
  symbol: z.string(),
  displayName: z.string(),
  swapSymbol: z.string(),
  pairLabel: z.string(),
});

export const engineDepositListApiResponseSchema = z.object({
  account: z.string(),
  tokens: z.array(engineDepositListTokenSchema),
});

export type EngineDepositListApiResponse = z.infer<
  typeof engineDepositListApiResponseSchema
>;

export const engineDepositAddressApiResponseSchema = z.object({
  symbol: z.string(),
  account: z.string().nullable(),
  memo: z.string().nullable(),
  address: z.string().nullable(),
  pair: z.string().nullable(),
  exRate: z.number().nullable(),
});

export type EngineDepositAddressApiResponse = z.infer<
  typeof engineDepositAddressApiResponseSchema
>;

export const engineWithdrawListTokenSchema = z.object({
  inputSymbol: z.string(),
  outputSymbol: z.string(),
  balanceSymbol: z.string(),
  displayName: z.string(),
  label: z.string(),
  balance: z.string(),
  precision: z.coerce.number(),
  requiresExternalAddress: z.boolean(),
  minimumSwapAmount: z.number().nullable(),
  minimumReceiveAmount: z.number().nullable(),
});

export const engineWithdrawListApiResponseSchema = z.object({
  account: z.string(),
  tokens: z.array(engineWithdrawListTokenSchema),
});

export type EngineWithdrawListApiResponse = z.infer<
  typeof engineWithdrawListApiResponseSchema
>;

export const engineWithdrawQuoteBodySchema = z.object({
  inputSymbol: z.string().min(1),
  outputSymbol: z.string().min(1),
  quantity: z.string().min(1),
  address: z.string().optional(),
  previewOnly: z.boolean().optional(),
});

export const engineWithdrawQuoteApiResponseSchema = z.object({
  predictiveAmount: z.number().nullable(),
  customJsonPayload: z.array(z.record(z.string(), z.unknown())),
  error: z.string().optional(),
  errorCode: z.string().optional(),
  errorParams: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

export type EngineWithdrawQuoteApiResponse = z.infer<
  typeof engineWithdrawQuoteApiResponseSchema
>;
